import type { LyricsSection, TrackStructureNode } from './blueprint'

export type VersionExportAssetType =
  | 'audio'
  | 'instrumental'
  | 'vocal'
  | 'midi'
  | 'chord_sheet'
  | 'lyrics'

export interface VersionExportStatus {
  type: VersionExportAssetType
  status: 'ready' | 'generating' | 'unavailable'
  size?: string
  lastGenerated?: string
}

export type TrackVersionKind =
  | 'base'
  | 'refinement'
  | 'alternate-mix'
  | 'instrumental'
  | 'acoustic'
  | 'remix'

export interface TrackVersion {
  id: string
  projectId?: string
  name: string
  timestamp: string
  duration: number
  isActive: boolean
  tags: string[]
  kind?: TrackVersionKind
  sourceBlueprintId?: string
  parentVersionId?: string
  audioUrl?: string
  structure?: TrackStructureNode[]
  lyrics?: LyricsSection[]
  exports?: VersionExportStatus[]
  notes?: string
}
