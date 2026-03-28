import { create } from 'zustand'
import type { GeminiPracticeBriefResult, LiveFeedbackEvent } from '@/domain/providers'
import type { PersistedProject } from '@/domain/project'
import type { TrackVersion } from '@/domain/track-version'
import { buildLiveTurnSummary, LiveGatewaySession } from '@/lib/providers/live-gateway'
import { preparePracticeBrief } from '@/lib/providers/gemini-gateway'
import type { PracticeMode, SessionState } from '../types/practice-session'

interface PracticeSessionStore {
  targetProjectId: string | null
  targetVersionId: string | null
  sessionState: SessionState
  practiceMode: PracticeMode
  focusArea: string
  selectedSection: string
  practiceBrief: GeminiPracticeBriefResult | null
  feedbackEvents: LiveFeedbackEvent[]
  setTarget: (projectId: string, versionId?: string | null) => void
  setSessionState: (sessionState: SessionState) => void
  setPracticeMode: (practiceMode: PracticeMode) => void
  setFocusArea: (focusArea: string) => void
  setSelectedSection: (selectedSection: string) => void
  connectSession: (project: PersistedProject, version?: TrackVersion) => Promise<void>
  requestFeedback: (project: PersistedProject, version?: TrackVersion) => Promise<void>
  disconnectSession: () => void
}

let liveSession: LiveGatewaySession | null = null

async function createPracticeBrief(
  project: PersistedProject,
  version: TrackVersion | undefined,
  focusArea: string,
  selectedSection: string,
  practiceMode: PracticeMode,
) {
  return preparePracticeBrief({
    projectId: project.id,
    versionId: version?.id ?? project.activeVersionId ?? '',
    projectTitle: project.title,
    blueprint: project.blueprint ?? {},
    focusArea,
    selectedSection,
    practiceMode,
  })
}

export const usePracticeSessionStore = create<PracticeSessionStore>((set, get) => ({
  targetProjectId: null,
  targetVersionId: null,
  sessionState: 'idle',
  practiceMode: 'vocal',
  focusArea: 'rhythm',
  selectedSection: 'Chorus',
  practiceBrief: null,
  feedbackEvents: [],
  setTarget: (projectId, versionId = null) =>
    set({ targetProjectId: projectId, targetVersionId: versionId }),
  setSessionState: (sessionState) => set({ sessionState }),
  setPracticeMode: (practiceMode) => set({ practiceMode }),
  setFocusArea: (focusArea) => set({ focusArea }),
  setSelectedSection: (selectedSection) => set({ selectedSection }),
  connectSession: async (project, version) => {
    const state = get()

    try {
      const brief = await createPracticeBrief(
        project,
        version,
        state.focusArea,
        state.selectedSection,
        state.practiceMode,
      )

      set({ practiceBrief: brief })

      if (!liveSession) {
        liveSession = new LiveGatewaySession()
        liveSession.connect(
          {
            projectId: project.id,
            versionId: version?.id ?? null,
            focusArea: state.focusArea,
            selectedSection: state.selectedSection,
            practiceMode: state.practiceMode,
            practiceBrief: brief,
            provider: 'google-live',
            model: 'live',
            schemaVersion: 'spartan4.v1',
          },
          {
            onReady: () => set({ sessionState: 'listening' }),
            onFeedback: (event) =>
              set((current) => ({
                sessionState: 'coaching',
                feedbackEvents: [event, ...current.feedbackEvents].slice(0, 12),
              })),
            onError: () => set({ sessionState: 'error' }),
          },
        )
      }
    } catch {
      set({ sessionState: 'error' })
    }
  },
  requestFeedback: async (project, version) => {
    const state = get()
    set({ sessionState: 'analyzing' })

    try {
      if (!liveSession) {
        await get().connectSession(project, version)
      }

      const brief =
        state.practiceBrief ??
        (await createPracticeBrief(
          project,
          version,
          state.focusArea,
          state.selectedSection,
          state.practiceMode,
        ))

      set({ practiceBrief: brief })

      liveSession?.sendPrompt(
        [
          `Project: ${project.title}`,
          `Version: ${version?.name ?? 'Latest version'}`,
          `Mode: ${state.practiceMode}`,
          `Focus: ${state.focusArea}`,
          `Section: ${state.selectedSection}`,
          `Practice brief: ${brief.summary}`,
          `Cues: ${brief.cues.join('; ')}`,
          'Give one short, actionable coaching note for the next pass.',
        ].join('\n'),
      )

      window.setTimeout(() => {
        const latest = get().feedbackEvents[0]
        if (latest) {
          set((current) => ({
            sessionState: 'listening',
            feedbackEvents: [
              {
                ...latest,
                text: buildLiveTurnSummary(latest).text,
              },
              ...current.feedbackEvents.slice(1),
            ],
          }))
        } else {
          set({ sessionState: 'listening' })
        }
      }, 1200)
    } catch {
      set({ sessionState: 'error' })
    }
  },
  disconnectSession: () => {
    liveSession?.close()
    liveSession = null
    set({ sessionState: 'idle' })
  },
}))
