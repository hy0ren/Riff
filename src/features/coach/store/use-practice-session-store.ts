/**
 * usePracticeSessionStore — Orchestrator Layer
 *
 * Central state machine for the Coach / Practice subsystem.
 * Coordinates the Audio Infrastructure and Transport layers.
 * React components observe this store but NEVER call audio/WebSocket APIs directly.
 *
 * Per coach_architecture.md §3B.
 */

import { create } from 'zustand'
import type { GeminiPracticeBriefResult, LiveFeedbackEvent } from '@/domain/providers'
import type { PracticeFocusArea } from '@/domain/practice-session'
import type { PersistedProject } from '@/domain/project'
import type { TrackVersion } from '@/domain/track-version'
import { preparePracticeBrief } from '@/lib/providers/gemini-gateway'
import { buildLiveTurnSummary } from '@/lib/providers/live-gateway'
import { savePracticeSession, getPracticeSessionCount } from '@/lib/persistence/practice-session-store'
import { AudioCaptureService } from '@/services/audio/audio-capture-service'
import { AudioPlaybackService } from '@/services/audio/audio-playback-service'
import { LiveConnectionClient } from '@/services/google/live-connection-client'
import type { SongContext } from '@/services/google/live-connection-client'
import type { PracticeMode, SessionState } from '../types/practice-session'

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

type ErrorKind = 'mic_permission' | 'mic_unavailable' | 'brief_failed' | 'connection_failed' | 'connection_lost' | 'unknown'

interface PracticeSessionStore {
  targetProjectId: string | null
  targetVersionId: string | null

  sessionState: SessionState
  practiceMode: PracticeMode
  focusArea: PracticeFocusArea
  selectedSection: string
  practiceBrief: GeminiPracticeBriefResult | null

  feedbackEvents: LiveFeedbackEvent[]
  rawTranscript: string
  sessionStartedAt: string | null
  sessionDuration: number

  analyserNode: AnalyserNode | null
  pastSessionCount: number

  errorKind: ErrorKind | null
  errorMessage: string | null
  isReconnecting: boolean

  setTarget: (projectId: string, versionId?: string | null) => void
  setSessionState: (state: SessionState) => void
  setPracticeMode: (mode: PracticeMode) => void
  setFocusArea: (area: PracticeFocusArea) => void
  setSelectedSection: (section: string) => void

  connectSession: (project: PersistedProject, version?: TrackVersion) => Promise<void>
  pauseSession: () => void
  resumeSession: () => void
  disconnectSession: () => void
  requestFeedback: (project: PersistedProject, version?: TrackVersion) => Promise<void>
}

// ---------------------------------------------------------------------------
// Module-level infrastructure singletons (not in React state tree)
// ---------------------------------------------------------------------------

let captureService: AudioCaptureService | null = null
let playbackService: AudioPlaybackService | null = null
let liveClient: LiveConnectionClient | null = null
let timerHandle: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  if (timerHandle) {
    clearInterval(timerHandle)
    timerHandle = null
  }
}

function startTimer(tickFn: () => void) {
  stopTimer()
  timerHandle = setInterval(tickFn, 1000)
}

// ---------------------------------------------------------------------------
// Context builders
// ---------------------------------------------------------------------------

function buildSongContext(
  project: PersistedProject,
  version: TrackVersion | undefined,
  focusArea: string,
  selectedSection: string,
  practiceMode: PracticeMode,
  brief: GeminiPracticeBriefResult,
): SongContext {
  const bp = project.blueprint
  return {
    projectTitle: project.title,
    bpm: bp?.bpm,
    key: bp?.key,
    mode: bp?.mode,
    timeSignature: bp?.timeSignature,
    genre: bp?.genre,
    sections: version?.structure?.map((s) => ({
      label: s.label,
      startTime: s.startTime,
      duration: s.duration,
      chords: s.chords,
    })),
    lyrics: version?.lyrics?.map((l) => ({
      label: l.label,
      lines: l.lines,
    })),
    practiceBrief: {
      title: brief.title,
      summary: brief.summary,
      cues: brief.cues,
    },
    practiceMode,
    focusArea,
    selectedSection,
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePracticeSessionStore = create<PracticeSessionStore>((set, get) => ({
  targetProjectId: null,
  targetVersionId: null,
  sessionState: 'idle',
  practiceMode: 'vocal',
  focusArea: 'rhythm' as PracticeFocusArea,
  selectedSection: 'Chorus',
  practiceBrief: null,
  feedbackEvents: [],
  rawTranscript: '',
  sessionStartedAt: null,
  sessionDuration: 0,
  analyserNode: null,
  pastSessionCount: 0,
  errorKind: null,
  errorMessage: null,
  isReconnecting: false,

  // ---------------------------------------------------------------------------
  // Config actions
  // ---------------------------------------------------------------------------

  setTarget: (projectId, versionId = null) => {
    const count = getPracticeSessionCount(projectId)
    set({ targetProjectId: projectId, targetVersionId: versionId, pastSessionCount: count })
  },

  setSessionState: (sessionState) => set({ sessionState }),
  setPracticeMode: (practiceMode) => set({ practiceMode }),
  setFocusArea: (focusArea) => set({ focusArea }),
  setSelectedSection: (selectedSection) => set({ selectedSection }),

  // ---------------------------------------------------------------------------
  // connectSession — the main session start flow
  // ---------------------------------------------------------------------------

  connectSession: async (project, version) => {
    const state = get()

    if (state.sessionState !== 'idle' && state.sessionState !== 'error') return

    set({
      sessionState: 'connecting',
      rawTranscript: '',
      feedbackEvents: [],
      sessionDuration: 0,
      errorKind: null,
      errorMessage: null,
      isReconnecting: false,
    })

    try {
      // 1. Prepare practice brief with fallback
      let brief: GeminiPracticeBriefResult
      try {
        brief = await preparePracticeBrief({
          projectId: project.id,
          versionId: version?.id ?? project.activeVersionId ?? '',
          projectTitle: project.title,
          blueprint: project.blueprint ?? {},
          focusArea: state.focusArea,
          selectedSection: state.selectedSection,
          practiceMode: state.practiceMode,
        })
      } catch {
        brief = {
          title: `Practice: ${project.title}`,
          summary: `Focus on ${state.focusArea} while performing the ${state.selectedSection} section.`,
          cues: [
            `Listen carefully to the ${state.selectedSection} section`,
            `Pay attention to your ${state.focusArea}`,
            'Start slow and build confidence',
          ],
          provider: 'google-gemini' as const,
          model: 'fallback',
          schemaVersion: 'spartan5.v1',
          requestHash: '',
        }
      }

      set({ practiceBrief: brief })

      // 2. Start audio capture
      captureService = new AudioCaptureService()
      try {
        await captureService.start((chunk) => {
          liveClient?.sendAudioChunk(chunk)
        })
      } catch (micErr) {
        captureService = null
        const isDenied =
          micErr instanceof DOMException &&
          (micErr.name === 'NotAllowedError' || micErr.name === 'SecurityError')
        const isNotFound = micErr instanceof DOMException && micErr.name === 'NotFoundError'

        if (isDenied) {
          set({
            sessionState: 'error',
            errorKind: 'mic_permission',
            errorMessage: 'Microphone permission was denied. Grant access in your system settings.',
          })
        } else if (isNotFound) {
          set({
            sessionState: 'error',
            errorKind: 'mic_unavailable',
            errorMessage: 'No microphone found. Connect a microphone and try again.',
          })
        } else {
          set({
            sessionState: 'error',
            errorKind: 'mic_unavailable',
            errorMessage: 'Could not access your microphone. Check your audio settings.',
          })
        }
        return
      }

      set({ analyserNode: captureService.getAnalyserNode() })

      // 3. Set up playback service
      playbackService = new AudioPlaybackService()

      // 4. Build song context and connect the Live API
      const songCtx = buildSongContext(
        project,
        version,
        state.focusArea,
        state.selectedSection,
        state.practiceMode,
        brief,
      )

      liveClient = new LiveConnectionClient()
      liveClient.connect(songCtx, {
        onReady: () => {
          const startedAt = new Date().toISOString()
          set({
            sessionState: 'listening',
            sessionStartedAt: startedAt,
            isReconnecting: false,
          })

          startTimer(() => {
            set((s) => ({ sessionDuration: s.sessionDuration + 1 }))
          })
        },

        onTextOut: (text, isPartial) => {
          playbackService?.duck()

          const newEvent: LiveFeedbackEvent = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            text,
            provider: 'google-live',
            model: 'live',
            schemaVersion: 'spartan5.v1',
          }

          set((s) => ({
            sessionState: 'coaching',
            rawTranscript: s.rawTranscript + (s.rawTranscript ? '\n' : '') + text,
            feedbackEvents: isPartial
              ? s.feedbackEvents
              : [newEvent, ...s.feedbackEvents].slice(0, 20),
          }))
        },

        onAudioOut: (base64) => {
          void playbackService?.enqueueCoachAudio(base64)
        },

        onInterrupted: () => {
          playbackService?.flushCoachQueue()
          playbackService?.unduck()
          set({ sessionState: 'listening' })
        },

        onReconnecting: () => {
          set({ isReconnecting: true })
        },

        onError: (err) => {
          console.error('[Coach] Live API error:', err)
          const msg = err?.message ?? 'Connection error'
          const isMaxReconnect = msg.includes('Max reconnect')
          set({
            sessionState: 'error',
            errorKind: isMaxReconnect ? 'connection_lost' : 'connection_failed',
            errorMessage: isMaxReconnect
              ? 'Session timed out. Start a new session to continue practicing.'
              : `Coach connection failed: ${msg}`,
            isReconnecting: false,
          })
          stopTimer()
        },

        onClose: () => {
          // Natural close — handled by disconnectSession
        },
      })
    } catch (err) {
      console.error('[Coach] connectSession failed:', err)
      set({
        sessionState: 'error',
        errorKind: 'unknown',
        errorMessage: err instanceof Error ? err.message : 'Session failed to start.',
      })
      captureService?.stop()
      captureService = null
      playbackService?.dispose()
      playbackService = null
      stopTimer()
    }
  },

  // ---------------------------------------------------------------------------
  // pauseSession / resumeSession
  // ---------------------------------------------------------------------------

  pauseSession: () => {
    const { sessionState } = get()
    if (sessionState !== 'listening' && sessionState !== 'coaching') return

    captureService?.stop()
    playbackService?.flushCoachQueue()
    playbackService?.unduck()
    stopTimer()
    set({ sessionState: 'paused', analyserNode: null })
  },

  resumeSession: () => {
    // Resuming requires reconnecting audio capture
    // The Live API connection may be maintained; we restart the mic
    const state = get()
    if (state.sessionState !== 'paused') return

    void (async () => {
      try {
        captureService = new AudioCaptureService()
        await captureService.start((chunk) => {
          liveClient?.sendAudioChunk(chunk)
        })

        set({ analyserNode: captureService.getAnalyserNode(), sessionState: 'listening' })

        startTimer(() => {
          set((s) => ({ sessionDuration: s.sessionDuration + 1 }))
        })
      } catch {
        set({ sessionState: 'error' })
      }
    })()
  },

  // ---------------------------------------------------------------------------
  // disconnectSession — triggers finalizeSession
  // ---------------------------------------------------------------------------

  disconnectSession: () => {
    const state = get()

    if (state.sessionState === 'idle') return

    stopTimer()
    captureService?.stop()
    playbackService?.flushCoachQueue()
    playbackService?.dispose()
    captureService = null
    playbackService = null

    const { rawTranscript, targetProjectId, practiceMode, focusArea, selectedSection, sessionStartedAt } = state

    // Finalize: if we have a transcript, persist a summary
    if (rawTranscript && targetProjectId) {
      set({ sessionState: 'finalizing' })

      void (async () => {
        try {
          const endedAt = new Date().toISOString()

          // Build a brief summary for persistence from the raw transcript
          const summaryText =
            rawTranscript.length > 800
              ? rawTranscript.slice(0, 800) + '…'
              : rawTranscript || '(No spoken feedback recorded)'

          const session = {
            id: crypto.randomUUID(),
            projectId: targetProjectId,
            versionId: get().targetVersionId ?? '',
            mode: practiceMode,
            focusArea: focusArea as import('@/domain/practice-session').PracticeFocusArea,
            selectedSection,
            startedAt: sessionStartedAt ?? new Date().toISOString(),
            endedAt,
            summary: summaryText,
            metrics: undefined,
          }

          savePracticeSession(targetProjectId, session)
          const newCount = getPracticeSessionCount(targetProjectId)

          liveClient?.close()
          liveClient = null

          set({
            sessionState: 'idle',
            analyserNode: null,
            rawTranscript: '',
            sessionStartedAt: null,
            sessionDuration: 0,
            pastSessionCount: newCount,
          })
        } catch {
          liveClient?.close()
          liveClient = null
          set({ sessionState: 'idle', analyserNode: null })
        }
      })()
    } else {
      liveClient?.close()
      liveClient = null
      set({
        sessionState: 'idle',
        analyserNode: null,
        rawTranscript: '',
        sessionStartedAt: null,
        sessionDuration: 0,
      })
    }
  },

  // ---------------------------------------------------------------------------
  // requestFeedback — legacy compat (used to be the "simulate" trigger)
  // Now just sends a text prompt to the active Live session.
  // ---------------------------------------------------------------------------

  requestFeedback: async (project, version) => {
    const state = get()

    if (state.sessionState === 'idle' || state.sessionState === 'error') {
      await get().connectSession(project, version)
      return
    }

    if (!liveClient) return

    const brief = state.practiceBrief
    if (!brief) return

    set({ sessionState: 'analyzing' })

    liveClient.sendText(
      [
        `Project: ${project.title}`,
        `Version: ${version?.name ?? 'Latest'}`,
        `Mode: ${state.practiceMode}`,
        `Focus: ${state.focusArea}`,
        `Section: ${state.selectedSection}`,
        `Brief: ${brief.summary}`,
        'Give one short, actionable coaching note for the next pass.',
      ].join('\n'),
    )

    // State will transition to 'coaching' when onTextOut fires
  },
}))

// Re-export for backward compat with existing imports
export { buildLiveTurnSummary }
