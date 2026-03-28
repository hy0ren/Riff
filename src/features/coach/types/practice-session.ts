export type PracticeMode = 'vocal' | 'humming' | 'guitar' | 'piano'

/**
 * Session lifecycle states per coach_architecture.md §2.
 * - idle: mounted, no hardware active
 * - connecting: initializing WebSocket + audio devices
 * - listening: mic hot, audio streaming, awaiting coach response
 * - analyzing: model received audio, processing
 * - coaching: coach is speaking / sending text
 * - paused: user halted; hardware released/muted
 * - finalizing: session wrapping up, Gemini summarizing transcript
 * - error: unrecoverable failure
 */
export type SessionState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'analyzing'
  | 'coaching'
  | 'paused'
  | 'finalizing'
  | 'error'
