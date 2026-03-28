import type { Blueprint } from './blueprint'
import type { SourceInputKind, SourceInputRole } from './source-input'
import type { SourceInfluence, SourceSetItem } from './source-set'
import type { TrackVersionKind } from './track-version'

export type GenerationRunStatus = 'draft' | 'queued' | 'running' | 'succeeded' | 'failed'

export interface GenerationContextSourceSummary {
  sourceInputId: string
  label: string
  type: SourceInputKind
  role: SourceInputRole
  influence: SourceInfluence
  weight: number
  enabled: boolean
  isReference: boolean
}

export interface GenerationRunModifiers {
  refinementPrompt?: string
  loadOnSuccess?: boolean
}

export interface GenerationContextSnapshot {
  createdAt: string
  projectId: string
  sourceSetId: string
  interpretationId: string
  blueprintId: string
  blueprintRevision: number
  blueprintSnapshot: Blueprint
  sources: GenerationContextSourceSummary[]
  sourceItems: SourceSetItem[]
  interpretationSummary: string
  parentVersionId?: string
  kind: TrackVersionKind
  modifiers?: GenerationRunModifiers
}

export interface GenerationRun {
  id: string
  projectId?: string
  sourceSetId: string
  interpretationId: string
  blueprintId: string
  blueprintRevision: number
  kind: TrackVersionKind
  status: GenerationRunStatus
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  parentVersionId?: string
  outputVersionId?: string
  modifiers?: GenerationRunModifiers
  errorMessage?: string
  generationContextSnapshot: GenerationContextSnapshot
}
