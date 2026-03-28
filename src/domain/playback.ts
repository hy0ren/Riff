export interface PlayableTrack {
  id: string
  title: string
  artist: string
  artUrl?: string
  audioUrl?: string
  duration: number
  source: 'project-version'
  projectId?: string
  versionId?: string
}
