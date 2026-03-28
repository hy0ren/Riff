import type { PlayableTrack } from '@/domain/playback'
import type { Project, ProjectVersion } from '@/domain/project'
import type { RadioTrack } from '@/domain/radio'

export function toProjectVersionTrack(
  project: Project,
  version: ProjectVersion,
): PlayableTrack {
  return {
    id: version.id,
    title: project.title,
    artist: 'Riff',
    artUrl: project.coverUrl ?? project.artUrl,
    duration: version.duration,
    source: 'project-version',
    projectId: project.id,
    versionId: version.id,
  }
}

export function toRadioPlayableTrack(track: RadioTrack): PlayableTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.creator,
    artUrl: track.coverUrl,
    duration: track.duration,
    source: 'radio',
  }
}
