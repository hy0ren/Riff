import type { Blueprint } from './blueprint'
import type { ProviderModelMetadata } from './providers'

export type InterpretationField =
  | 'bpm'
  | 'key'
  | 'mode'
  | 'timeSignature'
  | 'targetDuration'
  | 'genre'
  | 'subgenre'
  | 'mood'
  | 'energy'
  | 'texture'
  | 'vocalsEnabled'
  | 'vocalStyle'
  | 'lyricTheme'
  | 'melodyDirection'
  | 'generationNotes'
  | 'refinementDirectives'
  | 'instruments'
  | 'structure'

export interface InterpretationSignal<T = unknown> {
  field: InterpretationField
  value: T
  confidence: number
  sourceInputIds: string[]
  summary?: string
}

export interface InterpretationConflict {
  field: InterpretationField
  values: string[]
  sourceInputIds: string[]
  summary: string
}

export interface InterpretationSnapshot {
  id: string
  projectId?: string
  sourceSetId: string
  createdAt: string
  updatedAt: string
  summary: string
  sourceInputIds: string[]
  derivedBlueprint: Partial<Blueprint>
  signals: InterpretationSignal[]
  conflicts: InterpretationConflict[]
  providerMetadata?: ProviderModelMetadata
}
