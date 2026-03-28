export type ProjectStatus = 'draft' | 'generating' | 'finished' | 'archived'

export interface ProjectBlueprint {
  bpm: number
  key: string
  mode: 'Major' | 'Minor'
  timeSignature: string
  targetDuration: string
  genre: string
  subgenre?: string
  mood: string
  energy: 'Low' | 'Medium' | 'High' | 'Extreme'
  texture?: string
  vocalsEnabled: boolean
  vocalStyle?: string
  lyricTheme?: string
  instruments: {
    drums: boolean
    bass: boolean
    guitar: boolean
    synths: boolean
    strings: boolean
    pads: boolean
  }
}

export interface TrackStructureNode {
  id: string
  label: string // 'Intro', 'Verse 1', 'Chorus'
  startTime: number // seconds
  duration: number // seconds
  chords: string[] // ['Fm', 'Eb', 'Cm', 'Db']
}

export interface LyricsSection {
  id: string
  label: string
  lines: string[]
  theme?: string
  deliveryNotes?: string // 'whispered, intimate', 'belted, full energy'
}

export interface ExportStatus {
  type: 'audio' | 'instrumental' | 'vocal' | 'midi' | 'chord_sheet' | 'lyrics'
  status: 'ready' | 'generating' | 'unavailable'
  size?: string
  lastGenerated?: string
}

export interface ProjectVersion {
  id: string
  name: string
  timestamp: string
  duration: number
  isActive: boolean
  tags: string[]
  audioUrl?: string
  structure?: TrackStructureNode[]
  lyrics?: LyricsSection[]
  exports?: ExportStatus[]
}

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

export interface Project {
  id: string
  title: string
  updatedAt: string
  createdAt?: string
  status: ProjectStatus
  versionCount: number
  coverUrl?: string
  blueprint?: ProjectBlueprint
  versions?: ProjectVersion[]
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
  lastPracticed?: string
  practiceReady?: boolean
}

export interface Track {
  id: string
  projectId: string
  title: string
  artist: string
  duration: number
  artUrl?: string
  type: 'original' | 'remix' | 'stem'
}
