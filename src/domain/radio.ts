export type StationType =
  | 'personal'
  | 'track-based'
  | 'blueprint'
  | 'community'
  | 'spotify-playlist'
  | 'imported-taste'

export type ReasonType = 'mood' | 'bpm' | 'creator' | 'genre' | 'taste' | 'blueprint'

export interface VibeTag {
  label: string
  type?: 'genre' | 'mood' | 'bpm' | 'vocal' | 'instrument' | 'energy'
}

export interface RadioStation {
  id: string
  title: string
  subtitle: string
  description: string
  type: StationType
  seedExplanation: string
  seedProjectId?: string
  seedTrackTitle?: string
  spotifyPlaylistName?: string
  vibeTags: VibeTag[]
  artworkUrl?: string
  artworkGradient?: [string, string]
  isActive: boolean
  isSaved: boolean
  trackCount: number
  freshnessLabel: string
  isPlaying: boolean
}

export interface TrackReason {
  text: string
  type: ReasonType
}

export interface RadioTrack {
  id: string
  title: string
  creator: string
  coverUrl: string
  duration: number
  progressSeconds: number
  genre: string
  bpm: number
  mood: string
  hasVocals: boolean
  reason: TrackReason
  tags: VibeTag[]
  createdFromRiff?: boolean
}

export interface QueueItem {
  id: string
  title: string
  creator: string
  coverUrl: string
  duration: number
  reason: TrackReason
  tags: VibeTag[]
  isPinned?: boolean
}

export interface HistoryItem {
  id: string
  itemType: 'track' | 'station'
  title: string
  subtitle: string
  coverUrl?: string
  artworkGradient?: [string, string]
  playedAt: string
  sourceContext: string
  stationId?: string
  stationType?: StationType
}

export interface TuningDimension {
  id: string
  label: string
  lowLabel: string
  highLabel: string
  value: number
}

export interface TuningState {
  vocals: number
  energy: number
  bpmBreadth: number
  texture: number
  cinematic: number
  discovery: number
  lyrical: number
  mainstream: number
  spotifyInfluence: number
  spotifyConnected: boolean
}
