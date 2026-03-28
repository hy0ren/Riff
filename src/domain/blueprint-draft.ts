import type { Blueprint, InstrumentPlan } from './blueprint'

export type BlueprintFieldOrigin = 'user' | 'inferred' | 'default'

export type BlueprintDraftField =
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
  | `instruments.${keyof InstrumentPlan}`

export type BlueprintFieldOriginMap = Partial<Record<BlueprintDraftField, BlueprintFieldOrigin>>

export interface BlueprintDraft extends Blueprint {
  sourceSetId?: string
  interpretationId?: string
  committedBlueprintId?: string
  isDirty: boolean
  lastCommittedAt?: string
  origins: BlueprintFieldOriginMap
  lockedFields: BlueprintDraftField[]
  conflictFields: BlueprintDraftField[]
}
