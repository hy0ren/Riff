import type { Blueprint } from '@/domain/blueprint'
import type { BlueprintDraft } from '@/domain/blueprint-draft'
import type { GenerationRun } from '@/domain/generation-run'
import type { InterpretationSnapshot } from '@/domain/interpretation'
import type { PersistedProject, ProjectVersion } from '@/domain/project'
import type { SourceSet } from '@/domain/source-set'
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

export function getActiveBlueprint(project: PersistedProject): Blueprint | undefined {
  return (
    project.blueprints.find((blueprint) => blueprint.id === project.activeBlueprintId) ??
    project.blueprints[project.blueprints.length - 1]
  )
}

export function getActiveSourceSet(project: PersistedProject): SourceSet | undefined {
  return (
    project.sourceSets.find((sourceSet) => sourceSet.id === project.activeSourceSetId) ??
    project.sourceSets[0]
  )
}

export function getActiveInterpretation(project: PersistedProject): InterpretationSnapshot | undefined {
  return (
    project.interpretations.find(
      (interpretation) => interpretation.id === project.activeInterpretationId,
    ) ?? project.interpretations[0]
  )
}

export function getWorkingBlueprintDraft(project: PersistedProject): BlueprintDraft {
  return project.workingBlueprintDraft
}

export function getLatestGenerationRun(project: PersistedProject): GenerationRun | undefined {
  return [...project.generationRuns]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )[0]
}

export function useMatchedProject(projectId?: string | null): PersistedProject | undefined {
  return useProjectStore((state) =>
    projectId ? state.projects.find((project) => project.id === projectId) : undefined,
  )
}

export function useResolvedProject(projectId?: string | null): PersistedProject {
  return useProjectStore((state) => {
    const matchingProject = projectId
      ? state.projects.find((project) => project.id === projectId)
      : undefined
    return (
      matchingProject ??
      state.projects.find((project) => project.id === PRIMARY_PROJECT_ID) ??
      state.projects[0]
    )
  })
}
