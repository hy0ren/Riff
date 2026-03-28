import type {
  LiveFeedbackEvent,
  LiveSessionConfig,
  LiveTurnSummary,
} from '@/domain/providers'
import { connectRawLiveSession, RawLiveSession } from '@/services/google/live'
import { hashJsonPayload } from './hash'

function extractLiveText(payload: any): string | undefined {
  if (payload?.serverContent?.modelTurn?.parts?.length) {
    const text = payload.serverContent.modelTurn.parts
      .map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join('\n')
    if (text) {
      return text
    }
  }

  if (payload?.text) {
    return payload.text as string
  }

  return undefined
}

export class LiveGatewaySession {
  private rawSession: RawLiveSession | null = null
  private metadata: LiveSessionConfig | null = null

  connect(
    config: LiveSessionConfig,
    handlers: {
      onFeedback: (event: LiveFeedbackEvent) => void
      onReady?: () => void
      onError?: (error: Error) => void
    },
  ) {
    this.metadata = config
    this.rawSession = connectRawLiveSession({
      onOpen: () => {
        this.rawSession?.sendSetup({
          systemInstruction: {
            parts: [
              {
                text:
                  'You are Riff Coach. Give concise, musical, actionable coaching feedback. Keep feedback short and specific.',
              },
            ],
          },
        })
        handlers.onReady?.()
      },
      onMessage: async (payload) => {
        const text = extractLiveText(payload)
        if (!text || !this.metadata) {
          return
        }

        handlers.onFeedback({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          text,
          provider: 'google-live',
          model: this.metadata.model,
          schemaVersion: 'spartan4.v1',
          requestHash: await hashJsonPayload(payload),
        })
      },
      onError: () => handlers.onError?.(new Error('Live API session error.')),
    })
  }

  sendPrompt(prompt: string) {
    this.rawSession?.sendText(prompt)
  }

  close() {
    this.rawSession?.close()
    this.rawSession = null
  }
}

export function buildLiveTurnSummary(event: LiveFeedbackEvent): LiveTurnSummary {
  return {
    id: event.id,
    timestamp: event.timestamp,
    text: event.text,
    provider: event.provider,
    model: event.model,
    schemaVersion: event.schemaVersion,
    requestHash: event.requestHash,
  }
}
