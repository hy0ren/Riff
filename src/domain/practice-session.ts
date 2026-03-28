export type PracticeMode = 'vocal' | 'humming' | 'guitar' | 'piano'

export type PracticeFocusArea =
  | 'rhythm'
  | 'pitch'
  | 'chords'
  | 'note_accuracy'
  | 'lyric_delivery'
  | 'expression'

export interface PracticeMetricSummary {
  rhythm?: number
  pitch?: number
  chordAccuracy?: number
  noteAccuracy?: number
}

export interface PracticeSession {
  id: string
  projectId: string
  versionId: string
  mode: PracticeMode
  focusArea: PracticeFocusArea
  selectedSection?: string
  startedAt: string
  endedAt?: string
  summary?: string
  metrics?: PracticeMetricSummary
}
