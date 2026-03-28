export interface PlayableTrack {
  id: string
  title: string
  artist: string
  artUrl?: string
  duration: number
  source: 'project-version' | 'radio'
  projectId?: string
  versionId?: string
}
