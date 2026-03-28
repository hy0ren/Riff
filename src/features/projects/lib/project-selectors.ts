import type { PersistedProject, ProjectVersion } from '@/domain/project'
import { useProjectStore } from '../store/use-project-store'

export const PRIMARY_PROJECT_ID = 'proj-active-1'

export function getAllProjects(): PersistedProject[] {
  return useProjectStore.getState().projects
}

export function getPrimaryProject(): PersistedProject {
  const projects = getAllProjects()
  return (
    projects.find((project) => project.id === PRIMARY_PROJECT_ID) ??
    projects[0]
  )
}

export function getPrimaryProjectId(): string {
  return getPrimaryProject().id
}

export function findProjectById(projectId?: string | null): PersistedProject | undefined {
  if (!projectId) {
    return undefined
  }

  return getAllProjects().find((project) => project.id === projectId)
}

export function resolveProject(projectId?: string | null): PersistedProject {
  return findProjectById(projectId) ?? getPrimaryProject()
}

export function resolveProjectId(projectId?: string | null): string {
  return resolveProject(projectId).id
}

export function getProjectVersion(
  project: PersistedProject,
  versionId?: string | null,
): ProjectVersion | undefined {
  if (!project.versions?.length) {
    return undefined
  }

  if (versionId) {
    const matchingVersion = project.versions.find((version) => version.id === versionId)
    if (matchingVersion) {
      return matchingVersion
    }
  }

  return (
    project.versions.find((version) => version.isActive) ??
    project.versions[project.versions.length - 1]
  )
}
