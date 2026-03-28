export type TrackBadge = 'trending' | 'remixable' | 'rising' | 'staff-pick' | 'new'

export interface ExploreTrack {
  id: string
  title: string
  creator: string
  creatorAvatar: string
  coverUrl: string
  genre: string
  mood: string
  bpm: number
  hasVocals: boolean
  isRemixable: boolean
  badges: TrackBadge[]
  plays: number
  sourceType: string
  remixCount: number
  publishedAt: string
}

export interface Creator {
  id: string
  name: string
  avatar: string
  genres: string[]
  trackCount: number
  followerCount: number
  description: string
}

export interface RemixChainNode {
  id: string
  title: string
  creator: string
  coverUrl: string
  variationLabel: string
  parentId: string | null
}

export interface GenreRailItem {
  id: string
  label: string
  coverUrl?: string
  trackCount: number
  gradient: [string, string]
}
