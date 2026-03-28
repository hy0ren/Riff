import type { PlayableTrack } from '@/domain/playback'
import type { Project, ProjectVersion } from '@/domain/project'

export function toProjectVersionTrack(
  project: Project,
  version: ProjectVersion,
): PlayableTrack {
  return {
    id: version.id,
    title: project.title,
    artist: 'Riff',
    artUrl: project.coverUrl ?? project.artUrl,
    audioUrl: version.audioUrl,
    duration: version.duration,
    source: 'project-version',
    projectId: project.id,
    versionId: version.id,
  }
}
