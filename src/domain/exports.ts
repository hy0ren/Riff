export type ExportAssetType =
  | 'audio'
  | 'instrumental'
  | 'vocal'
  | 'chord_sheet'
  | 'melody_guide'
  | 'lyrics'
  | 'metadata'
  | 'cover_art'
  | 'teaser'
  | 'manifest'

export type ExportStatus = 'ready' | 'generating' | 'pending' | 'failed' | 'outdated'

export interface ExportAsset {
  id: string
  type: ExportAssetType
  name: string
  description: string
  format: string
  status: ExportStatus
  size: string
  lastGenerated: string
}

export interface ExportBundle {
  id: string
  projectId: string
  projectTitle: string
  projectCoverUrl?: string
  status: ExportStatus
  assets: ExportAsset[]
  totalSize: string
  createdAt: string
  lastRegenerated: string
}

export interface ExportHistoryEntry {
  id: string
  projectTitle: string
  projectCoverUrl?: string
  exportType: string
  status: ExportStatus
  date: string
  size: string
  version: string
}
