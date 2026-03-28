import { create } from 'zustand'
import type { BlueprintDraftField } from '@/domain/blueprint-draft'
import type { PersistedProject } from '@/domain/project'
import type { SourceInput } from '@/domain/source-input'
import type { SourceSet } from '@/domain/source-set'
import type { TrackVersionKind } from '@/domain/track-version'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import { createBlueprintDraft, commitBlueprintDraft, updateBlueprintDraftField } from '@/lib/studio-pipeline/blueprint-draft'
import {
  createGenerationRun,
  createMockTrackVersion,
  updateGenerationRunStatus,
} from '@/lib/studio-pipeline/generation'
import { nowIso } from '@/lib/studio-pipeline/ids'
import { createInterpretationSnapshot } from '@/lib/studio-pipeline/interpretation'

interface StartGenerationOptions {
  kind?: TrackVersionKind
  parentVersionId?: string
  loadOnSuccess?: boolean
}

interface StudioState {
  activeProjectId: string | null
  selectedSourceSetId: string | null
  interpretationStatus: 'idle' | 'refreshing'
  quickRefinementText: string
  activeGenerationRunId: string | null
  compareMode: boolean
  selectedVersionIds: string[]
  hydrateProject: (projectId: string) => void
  setQuickRefinementText: (value: string) => void
  refreshInterpretation: (projectId: string) => void
  setSelectedSourceSet: (projectId: string, sourceSetId: string) => void
  toggleSourceEnabled: (projectId: string, sourceInputId: string) => void
  setSourceWeight: (projectId: string, sourceInputId: string, weight: number) => void
  updateDraftField: (projectId: string, field: BlueprintDraftField, value: unknown) => void
  commitDraft: (projectId: string) => void
  loadVersion: (projectId: string, versionId: string) => void
  startGeneration: (projectId: string, options?: StartGenerationOptions) => void
}

function clampWeight(weight: number): number {
  return Math.max(0, Math.min(100, Math.round(weight)))
}

function getProject(projectId: string): PersistedProject | undefined {
  return useProjectStore.getState().projects.find((project) => project.id === projectId)
}

function getActiveSourceSet(project: PersistedProject): SourceSet | undefined {
  return (
    project.sourceSets.find((sourceSet) => sourceSet.id === project.activeSourceSetId) ??
    project.sourceSets[0]
  )
}

function getSourceInputsForSet(project: PersistedProject, sourceSet: SourceSet): SourceInput[] {
  const sourceInputIds = new Set(sourceSet.items.map((item) => item.sourceInputId))
  return project.sourceInputs.filter((sourceInput) => sourceInputIds.has(sourceInput.id))
}

function rebuildInterpretation(project: PersistedProject, sourceSet: SourceSet): PersistedProject {
  const activeBlueprint =
    project.blueprints.find((blueprint) => blueprint.id === project.activeBlueprintId) ??
    project.blueprints[project.blueprints.length - 1]
  const interpretation = createInterpretationSnapshot({
    project,
    sourceSet,
    sourceInputs: getSourceInputsForSet(project, sourceSet),
    activeBlueprint,
    existingInterpretation: project.interpretations.find(
      (candidate) => candidate.id === project.activeInterpretationId,
    ),
  })

  const nextInterpretations = [
    interpretation,
    ...project.interpretations.filter((candidate) => candidate.id !== interpretation.id),
  ]
  const workingBlueprintDraft = createBlueprintDraft({
    projectId: project.id,
    sourceSetId: sourceSet.id,
    interpretation,
    activeBlueprint,
    existingDraft: project.workingBlueprintDraft,
  })

  const sourceInputIds = new Set(interpretation.sourceInputIds)
  const sourceInputs = project.sourceInputs.map((sourceInput) => {
    if (!sourceInputIds.has(sourceInput.id)) {
      return sourceInput
    }

    const interpretationIds = Array.from(
      new Set([...(sourceInput.interpretationIds ?? []), interpretation.id]),
    )
    return {
      ...sourceInput,
      interpretationIds,
      interpretationStatus: 'interpreted' as const,
    }
  })

  return {
    ...project,
    sourceInputs,
    interpretations: nextInterpretations,
    activeInterpretationId: interpretation.id,
    workingBlueprintDraft,
    updatedAt: nowIso(),
  }
}

function commitCurrentDraft(project: PersistedProject): PersistedProject {
  const activeBlueprint =
    project.blueprints.find((blueprint) => blueprint.id === project.activeBlueprintId) ??
    project.blueprints[project.blueprints.length - 1]
  const draftWasDirty = project.workingBlueprintDraft.isDirty
  const { blueprint, draft } = commitBlueprintDraft({
    projectId: project.id,
    draft: project.workingBlueprintDraft,
    currentBlueprint: activeBlueprint,
    currentRevision: activeBlueprint?.revision ?? project.blueprints.length,
  })

  const nextBlueprints = activeBlueprint && !draftWasDirty
    ? project.blueprints
    : [...project.blueprints.filter((candidate) => candidate.id !== blueprint.id), blueprint]

  return {
    ...project,
    blueprints: nextBlueprints,
    activeBlueprintId: blueprint.id,
    workingBlueprintDraft: draft,
    blueprint,
    bpm: blueprint.bpm,
    key: blueprint.key,
    genre: blueprint.genre,
    mood: blueprint.mood,
    vocalsEnabled: blueprint.vocalsEnabled,
    updatedAt: nowIso(),
  }
}

function markVersionActive(project: PersistedProject, versionId: string): PersistedProject {
  return {
    ...project,
    versions: project.versions.map((version) => ({
      ...version,
      isActive: version.id === versionId,
    })),
    activeVersionId: versionId,
    updatedAt: nowIso(),
  }
}

function runLater(callback: () => void, delayMs: number) {
  if (typeof window === 'undefined') {
    callback()
    return
  }

  window.setTimeout(callback, delayMs)
}

export const useStudioStore = create<StudioState>((set) => ({
  activeProjectId: null,
  selectedSourceSetId: null,
  interpretationStatus: 'idle',
  quickRefinementText: '',
  activeGenerationRunId: null,
  compareMode: false,
  selectedVersionIds: [],
  hydrateProject: (projectId) => {
    const project = getProject(projectId)
    if (!project) {
      return
    }

    set({
      activeProjectId: projectId,
      selectedSourceSetId: project.activeSourceSetId ?? project.sourceSets[0]?.id ?? null,
      activeGenerationRunId:
        project.generationRuns[project.generationRuns.length - 1]?.id ?? null,
      selectedVersionIds: project.activeVersionId ? [project.activeVersionId] : [],
    })
  },
  setQuickRefinementText: (value) => set({ quickRefinementText: value }),
  refreshInterpretation: (projectId) => {
    const sourceSetId = useStudioStore.getState().selectedSourceSetId
    set({ interpretationStatus: 'refreshing' })
    useProjectStore.getState().updateProject(projectId, (project) => {
      const sourceSet =
        project.sourceSets.find((candidate) => candidate.id === sourceSetId) ??
        getActiveSourceSet(project)

      if (!sourceSet) {
        return project
      }

      return rebuildInterpretation(
        {
          ...project,
          activeSourceSetId: sourceSet.id,
        },
        sourceSet,
      )
    })
    set({ interpretationStatus: 'idle' })
  },
  setSelectedSourceSet: (projectId, sourceSetId) => {
    useProjectStore.getState().updateProject(projectId, (project) => {
      const sourceSet =
        project.sourceSets.find((candidate) => candidate.id === sourceSetId) ??
        project.sourceSets[0]

      if (!sourceSet) {
        return project
      }

      return rebuildInterpretation(
        {
          ...project,
          activeSourceSetId: sourceSet.id,
        },
        sourceSet,
      )
    })
    set({ selectedSourceSetId: sourceSetId })
  },
  toggleSourceEnabled: (projectId, sourceInputId) => {
    useProjectStore.getState().updateProject(projectId, (project) => {
      const activeSourceSet = getActiveSourceSet(project)
      if (!activeSourceSet) {
        return project
      }

      const sourceSet = {
        ...activeSourceSet,
        updatedAt: nowIso(),
        items: activeSourceSet.items.map((item) =>
          item.sourceInputId === sourceInputId
            ? { ...item, enabled: !item.enabled }
            : item,
        ),
      }

      return rebuildInterpretation(
        {
          ...project,
          sourceSets: project.sourceSets.map((candidate) =>
            candidate.id === sourceSet.id ? sourceSet : candidate,
          ),
          activeSourceSetId: sourceSet.id,
        },
        sourceSet,
      )
    })
  },
  setSourceWeight: (projectId, sourceInputId, weight) => {
    useProjectStore.getState().updateProject(projectId, (project) => {
      const activeSourceSet = getActiveSourceSet(project)
      if (!activeSourceSet) {
        return project
      }

      const sourceSet = {
        ...activeSourceSet,
        updatedAt: nowIso(),
        items: activeSourceSet.items.map((item) =>
          item.sourceInputId === sourceInputId
            ? { ...item, weight: clampWeight(weight) }
            : item,
        ),
      }

      return rebuildInterpretation(
        {
          ...project,
          sourceSets: project.sourceSets.map((candidate) =>
            candidate.id === sourceSet.id ? sourceSet : candidate,
          ),
          activeSourceSetId: sourceSet.id,
        },
        sourceSet,
      )
    })
  },
  updateDraftField: (projectId, field, value) => {
    useProjectStore.getState().updateProject(projectId, (project) => ({
      ...project,
      workingBlueprintDraft: updateBlueprintDraftField({
        draft: project.workingBlueprintDraft,
        field,
        value,
      }),
      updatedAt: nowIso(),
    }))
  },
  commitDraft: (projectId) => {
    useProjectStore
      .getState()
      .updateProject(projectId, (project) => commitCurrentDraft(project))
  },
  loadVersion: (projectId, versionId) => {
    useProjectStore
      .getState()
      .updateProject(projectId, (project) => markVersionActive(project, versionId))

    set({ selectedVersionIds: [versionId] })
  },
  startGeneration: (projectId, options = {}) => {
    const { quickRefinementText } = useStudioStore.getState()
    const kind = options.kind ?? 'base'
    let queuedRunId: string | null = null

    useProjectStore.getState().updateProject(projectId, (project) => {
      const preparedProject = commitCurrentDraft(project)
      const sourceSet = getActiveSourceSet(preparedProject)
      const interpretation =
        preparedProject.interpretations.find(
          (candidate) => candidate.id === preparedProject.activeInterpretationId,
        ) ?? preparedProject.interpretations[0]
      const blueprint =
        preparedProject.blueprints.find(
          (candidate) => candidate.id === preparedProject.activeBlueprintId,
        ) ?? preparedProject.blueprints[preparedProject.blueprints.length - 1]

      if (!sourceSet || !interpretation || !blueprint) {
        return preparedProject
      }

      const parentVersionId =
        options.parentVersionId ??
        (kind === 'base' ? undefined : preparedProject.activeVersionId)
      const generationRun = createGenerationRun({
        project: preparedProject,
        sourceSet,
        sourceInputs: getSourceInputsForSet(preparedProject, sourceSet),
        interpretation,
        blueprint,
        kind,
        parentVersionId,
        modifiers: {
          refinementPrompt: quickRefinementText || undefined,
          loadOnSuccess: options.loadOnSuccess ?? true,
        },
      })

      queuedRunId = generationRun.id

      return {
        ...preparedProject,
        status: 'generating',
        generationRuns: [...preparedProject.generationRuns, generationRun],
        updatedAt: nowIso(),
      }
    })

    if (!queuedRunId) {
      return
    }

    set({
      activeGenerationRunId: queuedRunId,
      quickRefinementText: '',
    })

    runLater(() => {
      useProjectStore.getState().updateProject(projectId, (project) => ({
        ...project,
        generationRuns: project.generationRuns.map((generationRun) =>
          generationRun.id === queuedRunId
            ? updateGenerationRunStatus(generationRun, 'running')
            : generationRun,
        ),
      }))
    }, 350)

    runLater(() => {
      useProjectStore.getState().updateProject(projectId, (project) => {
        const generationRun = project.generationRuns.find((candidate) => candidate.id === queuedRunId)
        if (!generationRun) {
          return project
        }

        const completedRun = updateGenerationRunStatus(generationRun, 'succeeded')
        const nextVersion = createMockTrackVersion({
          project,
          generationRun: completedRun,
        })
        const finalizedVersion = {
          ...nextVersion,
          isActive: generationRun.modifiers?.loadOnSuccess ?? true,
        }

        const versions = (generationRun.modifiers?.loadOnSuccess ?? true)
          ? project.versions.map((version) => ({ ...version, isActive: false }))
          : project.versions

        return {
          ...project,
          status: project.status === 'archived' ? 'archived' : 'draft',
          versions: [...versions, finalizedVersion],
          activeVersionId:
            generationRun.modifiers?.loadOnSuccess ?? true
              ? finalizedVersion.id
              : project.activeVersionId,
          versionCount: versions.length + 1,
          generationRuns: project.generationRuns.map((candidate) =>
            candidate.id === queuedRunId
              ? updateGenerationRunStatus(completedRun, 'succeeded', {
                  outputVersionId: finalizedVersion.id,
                })
              : candidate,
          ),
          updatedAt: nowIso(),
        }
      })
    }, 1500)
  },
}))
