import { assertGoogleConfigured, getProviderConfig } from '@/lib/config/provider-config'

type LiveMessageHandler = (payload: unknown) => void

function getLiveSocketUrl(): string {
  const { googleApiKey } = assertGoogleConfigured()
  return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${googleApiKey}`
}

export class RawLiveSession {
  private socket: WebSocket

  constructor(socket: WebSocket) {
    this.socket = socket
  }

  sendSetup(config: Record<string, unknown>) {
    this.socket.send(
      JSON.stringify({
        setup: {
          model: getProviderConfig().liveModel,
          generationConfig: {
            responseModalities: ['TEXT'],
          },
          ...config,
        },
      }),
    )
  }

  sendText(text: string) {
    this.socket.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        },
      }),
    )
  }

  /**
   * Streams a base64-encoded PCM audio chunk to the Live API.
   * Called continuously by AudioCaptureService during active practice.
   */
  sendAudioChunk(base64Pcm: string) {
    this.socket.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Pcm,
            },
          ],
        },
      }),
    )
  }

  close() {
    this.socket.close()
  }
}

export function connectRawLiveSession(handlers: {
  onOpen?: () => void
  onMessage?: LiveMessageHandler
  onError?: (error: Event) => void
  onClose?: () => void
}): RawLiveSession {
  const socket = new WebSocket(getLiveSocketUrl())

  socket.addEventListener('open', () => handlers.onOpen?.())
  socket.addEventListener('message', (event) => {
    try {
      handlers.onMessage?.(JSON.parse(event.data as string))
    } catch {
      handlers.onMessage?.(event.data)
    }
  })
  socket.addEventListener('error', (event) => handlers.onError?.(event))
  socket.addEventListener('close', () => handlers.onClose?.())

  return new RawLiveSession(socket)
}
