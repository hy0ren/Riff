/**
 * LiveConnectionClient — Transport Layer
 *
 * Manages the WebSocket connection to the Gemini Live API.
 * This class does NOT know about React, Zustand, or audio devices.
 * It only handles transport: connect, send, receive, reconnect, close.
 *
 * Per coach_architecture.md §3D and §4.
 */

import { connectRawLiveSession, RawLiveSession } from './live'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SongContext {
  projectTitle: string
  bpm?: number
  key?: string
  mode?: string
  timeSignature?: string
  genre?: string
  sections?: { label: string; startTime: number; duration?: number; chords?: string[] }[]
  lyrics?: { label: string; lines: string[] }[]
  practiceBrief: { title: string; summary: string; cues: string[] }
  practiceMode: string
  focusArea: string
  selectedSection: string
}

export interface LiveConnectionHandlers {
  onReady: () => void
  onTextOut: (text: string, isPartial: boolean) => void
  onAudioOut: (base64: string) => void
  onInterrupted: () => void
  onError: (err: Error) => void
  onClose: () => void
  onReconnecting?: (attempt: number, maxAttempts: number) => void
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'closing'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSystemInstruction(ctx: SongContext): string {
  const sections = ctx.sections?.map((s) => `  - ${s.label} @ ${s.startTime}s`).join('\n') ?? 'No sections provided'
  const lyrics = ctx.lyrics?.map((l) => `  [${l.label}]\n${l.lines.join('\n')}`).join('\n\n') ?? 'No lyrics provided'
  const cues = ctx.practiceBrief.cues.map((c) => `  • ${c}`).join('\n')

  return [
    'You are Riff Coach, an expert music practice coach embedded in the Riff music creation app.',
    'Your role is to listen to the user perform and give concise, specific, actionable feedback.',
    'Keep coaching notes short (1-2 sentences). Be encouraging but precise.',
    'Do not suggest changes to the song structure — if the user asks, redirect them to the Studio.',
    '',
    `## Song Context`,
    `Title: ${ctx.projectTitle}`,
    ctx.bpm ? `BPM: ${ctx.bpm}` : '',
    ctx.key ? `Key: ${ctx.key} ${ctx.mode ?? ''}` : '',
    ctx.timeSignature ? `Time Signature: ${ctx.timeSignature}` : '',
    ctx.genre ? `Genre: ${ctx.genre}` : '',
    '',
    `## Song Structure`,
    sections,
    '',
    `## Lyrics`,
    lyrics,
    '',
    `## Current Practice Brief`,
    `Title: ${ctx.practiceBrief.title}`,
    `Goal: ${ctx.practiceBrief.summary}`,
    `Cues:`,
    cues,
    '',
    `## Session Settings`,
    `Mode: ${ctx.practiceMode}`,
    `Focus: ${ctx.focusArea}`,
    `Current Section: ${ctx.selectedSection}`,
  ]
    .filter((l) => l !== undefined)
    .join('\n')
}

function extractText(payload: unknown): { text: string; isPartial: boolean } | null {
  const p = payload as Record<string, unknown>

  // Mid-turn partial tokens
  if (p?.serverContent) {
    const sc = p.serverContent as Record<string, unknown>
    const parts = (sc?.modelTurn as Record<string, unknown>)?.parts as Array<Record<string, unknown>> | undefined
    if (parts?.length) {
      const text = parts
        .map((part) => part.text as string | undefined)
        .filter(Boolean)
        .join('')
      if (text) {
        return { text, isPartial: !(sc.turnComplete as boolean) }
      }
    }
  }

  // Plain text payload (fallback)
  if (typeof p?.text === 'string') {
    return { text: p.text, isPartial: false }
  }

  return null
}

function extractAudio(payload: unknown): string | null {
  const p = payload as Record<string, unknown>
  const sc = p?.serverContent as Record<string, unknown> | undefined
  const parts = (sc?.modelTurn as Record<string, unknown>)?.parts as Array<Record<string, unknown>> | undefined
  if (parts?.length) {
    for (const part of parts) {
      const inlineData = part.inlineData as Record<string, string> | undefined
      if (inlineData?.data) {
        return inlineData.data
      }
    }
  }
  return null
}

function isInterrupted(payload: unknown): boolean {
  const p = payload as Record<string, unknown>
  // The Live API sends this when it detects the user is speaking over the model
  return !!(p?.serverContent as Record<string, unknown>)?.interrupted
}

// ---------------------------------------------------------------------------
// LiveConnectionClient
// ---------------------------------------------------------------------------

const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAY_MS = 1500

export class LiveConnectionClient {
  private state: ConnectionState = 'disconnected'
  private rawSession: RawLiveSession | null = null
  private songContext: SongContext | null = null
  private handlers: LiveConnectionHandlers | null = null
  private reconnectAttempts = 0

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  connect(context: SongContext, handlers: LiveConnectionHandlers): void {
    if (this.state !== 'disconnected') {
      return
    }

    this.songContext = context
    this.handlers = handlers
    this.state = 'connecting'
    this.reconnectAttempts = 0
    this._openSocket()
  }

  sendAudioChunk(base64Pcm: string): void {
    if (this.state !== 'connected' || !this.rawSession) return
    this.rawSession.sendAudioChunk(base64Pcm)
  }

  sendText(text: string): void {
    if (this.state !== 'connected' || !this.rawSession) return
    this.rawSession.sendText(text)
  }

  close(): void {
    if (this.state === 'disconnected' || this.state === 'closing') return
    this.state = 'closing'
    this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS // Prevent reconnect
    this.rawSession?.close()
    this.rawSession = null
    this.state = 'disconnected'
  }

  get connectionState(): ConnectionState {
    return this.state
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private _openSocket(): void {
    if (!this.songContext || !this.handlers) return

    const handlers = this.handlers

    this.rawSession = connectRawLiveSession({
      onOpen: () => {
        this.state = 'connected'
        this.reconnectAttempts = 0

        // Send the full song-aware setup frame per §4 of the architecture
        this.rawSession!.sendSetup({
          systemInstruction: {
            parts: [{ text: buildSystemInstruction(this.songContext!) }],
          },
          generationConfig: {
            responseModalities: ['TEXT', 'AUDIO'],
          },
        })

        handlers.onReady()
      },

      onMessage: (payload) => {
        // Check for barge-in first
        if (isInterrupted(payload)) {
          handlers.onInterrupted()
          return
        }

        // Audio output from coach TTS
        const audioData = extractAudio(payload)
        if (audioData) {
          handlers.onAudioOut(audioData)
        }

        // Text output from coach
        const textResult = extractText(payload)
        if (textResult) {
          handlers.onTextOut(textResult.text, textResult.isPartial)
        }
      },

      onError: (_event) => {
        handlers.onError(new Error('Live API WebSocket error'))
      },

      onClose: () => {
        if (this.state === 'closing') {
          this.state = 'disconnected'
          handlers.onClose()
          return
        }

        // Unexpected close — attempt reconnect
        this.state = 'connecting'
        this._scheduleReconnect()
      },
    })
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.state = 'disconnected'
      this.handlers?.onError(new Error('Live API connection lost. Max reconnect attempts reached.'))
      return
    }

    this.reconnectAttempts++
    this.handlers?.onReconnecting?.(this.reconnectAttempts, MAX_RECONNECT_ATTEMPTS)
    const delay = RECONNECT_DELAY_MS * this.reconnectAttempts

    setTimeout(() => {
      if (this.state !== 'connecting') return
      this.rawSession = null
      this._openSocket()
    }, delay)
  }
}
