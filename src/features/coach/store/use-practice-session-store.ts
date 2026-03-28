import { create } from 'zustand'
import type { PracticeMode, SessionState } from '../types/practice-session'

interface PracticeSessionStore {
  targetProjectId: string | null
  targetVersionId: string | null
  sessionState: SessionState
  practiceMode: PracticeMode
  focusArea: string
  selectedSection: string
  setTarget: (projectId: string, versionId?: string | null) => void
  setSessionState: (sessionState: SessionState) => void
  setPracticeMode: (practiceMode: PracticeMode) => void
  setFocusArea: (focusArea: string) => void
  setSelectedSection: (selectedSection: string) => void
}

export const usePracticeSessionStore = create<PracticeSessionStore>((set) => ({
  targetProjectId: null,
  targetVersionId: null,
  sessionState: 'idle',
  practiceMode: 'vocal',
  focusArea: 'rhythm',
  selectedSection: 'Chorus',
  setTarget: (projectId, versionId = null) =>
    set({ targetProjectId: projectId, targetVersionId: versionId }),
  setSessionState: (sessionState) => set({ sessionState }),
  setPracticeMode: (practiceMode) => set({ practiceMode }),
  setFocusArea: (focusArea) => set({ focusArea }),
  setSelectedSection: (selectedSection) => set({ selectedSection }),
}))
