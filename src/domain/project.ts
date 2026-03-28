import type { Blueprint } from './blueprint'
import type { BlueprintDraft } from './blueprint-draft'
import type { ExportBundle } from './exports'
import type { GenerationRun } from './generation-run'
import type { InterpretationSnapshot } from './interpretation'
import type { SourceInput } from './source-input'
import type { SourceSet } from './source-set'
import type { TrackVersion } from './track-version'

export type ProjectStatus = 'draft' | 'generating' | 'finished' | 'archived'

export type SourceType =
  | 'hum'
  | 'riff'
  | 'chords'
  | 'sheet_music'
  | 'lyrics'
  | 'remix'
  | 'spotify_track'
  | 'spotify_playlist'
  | 'mixed'

export interface ProjectPublicationState {
  isPublished: boolean
  remixable?: boolean
  discoveryEligible?: boolean
  publishedAt?: string
}

export interface ProjectLibraryState {
  sourceType: SourceType
  isFavorite: boolean
  isExported: boolean
  collection?: string
}

export type ProjectBlueprint = Omit<
  Blueprint,
  'id' | 'projectId' | 'revision' | 'createdAt' | 'updatedAt'
> &
  Partial<
    Pick<
      Blueprint,
      'id' | 'projectId' | 'revision' | 'createdAt' | 'updatedAt' | 'basedOnBlueprintId' | 'sourceInputIds'
    >
  >

export interface Project {
  id: string
  title: string
  updatedAt: string
  createdAt?: string
  status: ProjectStatus
  versionCount: number
  coverUrl?: string
  sourceInputs?: SourceInput[]
  sourceSets?: SourceSet[]
  interpretations?: InterpretationSnapshot[]
  blueprints?: Blueprint[]
  activeBlueprintId?: string
  activeSourceSetId?: string
  activeInterpretationId?: string
  workingBlueprintDraft?: BlueprintDraft
  generationRuns?: GenerationRun[]
  versions?: TrackVersion[]
  activeVersionId?: string
  exportBundles?: ExportBundle[]
  library?: ProjectLibraryState
  publication?: ProjectPublicationState
  blueprint?: ProjectBlueprint
  bpm?: number // legacy
  key?: string // legacy
  genre?: string // legacy
  artUrl?: string // legacy
  // Library-specific fields
  sourceType?: SourceType
  isFavorite?: boolean
  isPublished?: boolean
  isExported?: boolean
  collection?: string
  description?: string
  mood?: string
  vocalsEnabled?: boolean
  lastLearnedAt?: string
  learnReady?: boolean
  lastPracticed?: string // legacy
  practiceReady?: boolean // legacy
}
export type ProjectVersion = TrackVersion
export type PersistedProject = Project & {
  sourceInputs: SourceInput[]
  sourceSets: SourceSet[]
  interpretations: InterpretationSnapshot[]
  blueprints: Blueprint[]
  generationRuns: GenerationRun[]
  workingBlueprintDraft: BlueprintDraft
  versions: TrackVersion[]
  exportBundles: ExportBundle[]
  library: ProjectLibraryState
  activeBlueprintId?: string
  activeSourceSetId?: string
  activeInterpretationId?: string
  activeVersionId?: string
}
