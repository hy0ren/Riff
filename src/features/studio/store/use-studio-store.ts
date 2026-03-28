import { create } from 'zustand'
import type { BlueprintDraftField } from '@/domain/blueprint-draft'
import type { InterpretationSnapshot } from '@/domain/interpretation'
import type { PersistedProject } from '@/domain/project'
import type { SourceInput } from '@/domain/source-input'
import type { SourceInfluence, SourceSet } from '@/domain/source-set'
import type { TrackVersionKind } from '@/domain/track-version'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import {
  createBlueprintDraft,
  commitBlueprintDraft,
  updateBlueprintDraftField,
} from '@/lib/studio-pipeline/blueprint-draft'
import {
  createGenerationRun,
  createMockTrackVersion,
  updateGenerationRunStatus,
} from '@/lib/studio-pipeline/generation'
import { nowIso } from '@/lib/studio-pipeline/ids'
import { createInterpretationSnapshot } from '@/lib/studio-pipeline/interpretation'
import {
  interpretSourceSet,
  summarizeTrackVersion,
} from '@/lib/providers/gemini-gateway'
import { generateProjectCoverArt } from '@/lib/providers/cover-art-gateway'
import { generateTrack } from '@/lib/providers/lyria-gateway'
import { parseLyricsTextIntoSections } from '@/lib/lyrics'
import type { Blueprint } from '@/domain/blueprint'

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
  generationError: string | null
  compareMode: boolean
  selectedVersionIds: string[]
  hydrateProject: (projectId: string) => void
  renameProject: (projectId: string, title: string) => void
  updateSourceInputField: (
    projectId: string,
    sourceInputId: string,
    field: 'label' | 'description' | 'text',
    value: string,
  ) => void
  clearGenerationError: () => void
  setQuickRefinementText: (value: string) => void
  refreshInterpretation: (projectId: string) => Promise<void>
  setSelectedSourceSet: (projectId: string, sourceSetId: string) => Promise<void>
  toggleSourceEnabled: (projectId: string, sourceInputId: string) => Promise<void>
  setSourceWeight: (projectId: string, sourceInputId: string, weight: number) => Promise<void>
  setSourceInfluence: (
    projectId: string,
    sourceInputId: string,
    influence: SourceInfluence,
  ) => Promise<void>
  updateDraftField: (projectId: string, field: BlueprintDraftField, value: unknown) => void
  commitDraft: (projectId: string) => void
  loadVersion: (projectId: string, versionId: string) => void
  startGeneration: (projectId: string, options?: StartGenerationOptions) => Promise<void>
}

function clampWeight(weight: number): number {
  return Math.max(0, Math.min(100, Math.round(weight)))
}

function getDefaultWeightForInfluence(influence: SourceInfluence): number {
  switch (influence) {
    case 'reference':
      return 35
    case 'supporting':
      return 68
    default:
      return 100
  }
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

async function buildInterpretationSnapshot(
  project: PersistedProject,
  sourceSet: SourceSet,
): Promise<InterpretationSnapshot> {
  const activeBlueprint =
    project.blueprints.find((blueprint) => blueprint.id === project.activeBlueprintId) ??
    project.blueprints[project.blueprints.length - 1]
  const sourceInputs = getSourceInputsForSet(project, sourceSet)
  const existingInterpretation =
    project.interpretations.find(
      (candidate) => candidate.id === project.activeInterpretationId,
    ) ?? project.interpretations[0]

  const fallbackInterpretation = createInterpretationSnapshot({
    project,
    sourceSet,
    sourceInputs,
    activeBlueprint,
    existingInterpretation,
  })

  try {
    const providerResult = await interpretSourceSet({
      projectId: project.id,
      projectTitle: project.title,
      sourceSet,
      sourceInputs,
      activeBlueprint,
    })

    return {
      ...fallbackInterpretation,
      summary: providerResult.summary,
      derivedBlueprint: providerResult.derivedBlueprint,
      signals: providerResult.signals,
      conflicts: providerResult.conflicts,
      providerMetadata: {
        provider: providerResult.provider,
        model: providerResult.model,
        schemaVersion: providerResult.schemaVersion,
        requestHash: providerResult.requestHash,
      },
    }
  } catch {
    return fallbackInterpretation
  }
}

async function rebuildInterpretation(
  project: PersistedProject,
  sourceSet: SourceSet,
): Promise<PersistedProject> {
  const activeBlueprint =
    project.blueprints.find((blueprint) => blueprint.id === project.activeBlueprintId) ??
    project.blueprints[project.blueprints.length - 1]
  const interpretation = await buildInterpretationSnapshot(project, sourceSet)

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

  const nextBlueprints =
    activeBlueprint && !draftWasDirty
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

function applyGenerationKindBlueprintOverrides(
  blueprint: Blueprint,
  kind: TrackVersionKind,
): Blueprint {
  if (kind !== 'instrumental') {
    return blueprint
  }

  return {
    ...blueprint,
    vocalsEnabled: false,
    vocalStyle: undefined,
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

export const useStudioStore = create<StudioState>((set) => ({
  activeProjectId: null,
  selectedSourceSetId: null,
  interpretationStatus: 'idle',
  quickRefinementText: '',
  activeGenerationRunId: null,
  generationError: null,
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
      generationError: null,
    })
  },
  renameProject: (projectId, title) => {
    useProjectStore.getState().updateProject(projectId, (project) => ({
      ...project,
      title,
      updatedAt: nowIso(),
    }))
  },
  updateSourceInputField: (projectId, sourceInputId, field, value) => {
    useProjectStore.getState().updateProject(projectId, (project) => ({
      ...project,
      sourceInputs: project.sourceInputs.map((sourceInput) => {
        if (sourceInput.id !== sourceInputId) {
          return sourceInput
        }

        if (field === 'text' && 'text' in sourceInput) {
          return {
            ...sourceInput,
            text: value,
          }
        }

        return {
          ...sourceInput,
          [field]: value,
        }
      }),
      updatedAt: nowIso(),
    }))
  },
  clearGenerationError: () => set({ generationError: null }),
  setQuickRefinementText: (value) => set({ quickRefinementText: value }),
  refreshInterpretation: async (projectId) => {
    const sourceSetId = useStudioStore.getState().selectedSourceSetId
    const project = getProject(projectId)
    if (!project) {
      return
    }

    const sourceSet =
      project.sourceSets.find((candidate) => candidate.id === sourceSetId) ??
      getActiveSourceSet(project)

    if (!sourceSet) {
      return
    }

    set({ interpretationStatus: 'refreshing' })
    const rebuiltProject = await rebuildInterpretation(
      {
        ...project,
        activeSourceSetId: sourceSet.id,
      },
      sourceSet,
    )
    useProjectStore.getState().upsertProject(rebuiltProject)
    set({ interpretationStatus: 'idle' })
  },
  setSelectedSourceSet: async (projectId, sourceSetId) => {
    const project = getProject(projectId)
    if (!project) {
      return
    }

    const sourceSet =
      project.sourceSets.find((candidate) => candidate.id === sourceSetId) ??
      project.sourceSets[0]

    if (!sourceSet) {
      return
    }

    set({ selectedSourceSetId: sourceSetId, interpretationStatus: 'refreshing' })
    const rebuiltProject = await rebuildInterpretation(
      {
        ...project,
        activeSourceSetId: sourceSet.id,
      },
      sourceSet,
    )
    useProjectStore.getState().upsertProject(rebuiltProject)
    set({ interpretationStatus: 'idle' })
  },
  toggleSourceEnabled: async (projectId, sourceInputId) => {
    const project = getProject(projectId)
    if (!project) {
      return
    }

    const activeSourceSet = getActiveSourceSet(project)
    if (!activeSourceSet) {
      return
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

    set({ interpretationStatus: 'refreshing' })
    const rebuiltProject = await rebuildInterpretation(
      {
        ...project,
        sourceSets: project.sourceSets.map((candidate) =>
          candidate.id === sourceSet.id ? sourceSet : candidate,
        ),
        activeSourceSetId: sourceSet.id,
      },
      sourceSet,
    )
    useProjectStore.getState().upsertProject(rebuiltProject)
    set({ interpretationStatus: 'idle' })
  },
  setSourceWeight: async (projectId, sourceInputId, weight) => {
    const project = getProject(projectId)
    if (!project) {
      return
    }

    const activeSourceSet = getActiveSourceSet(project)
    if (!activeSourceSet) {
      return
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

    set({ interpretationStatus: 'refreshing' })
    const rebuiltProject = await rebuildInterpretation(
      {
        ...project,
        sourceSets: project.sourceSets.map((candidate) =>
          candidate.id === sourceSet.id ? sourceSet : candidate,
        ),
        activeSourceSetId: sourceSet.id,
      },
      sourceSet,
    )
    useProjectStore.getState().upsertProject(rebuiltProject)
    set({ interpretationStatus: 'idle' })
  },
  setSourceInfluence: async (projectId, sourceInputId, influence) => {
    const project = getProject(projectId)
    if (!project) {
      return
    }

    const activeSourceSet = getActiveSourceSet(project)
    if (!activeSourceSet) {
      return
    }

    const sourceSet = {
      ...activeSourceSet,
      updatedAt: nowIso(),
      items: activeSourceSet.items.map((item) =>
        item.sourceInputId === sourceInputId
          ? {
              ...item,
              influence,
              weight: clampWeight(getDefaultWeightForInfluence(influence)),
            }
          : item,
      ),
    }

    set({ interpretationStatus: 'refreshing' })
    const rebuiltProject = await rebuildInterpretation(
      {
        ...project,
        sourceSets: project.sourceSets.map((candidate) =>
          candidate.id === sourceSet.id ? sourceSet : candidate,
        ),
        activeSourceSetId: sourceSet.id,
      },
      sourceSet,
    )
    useProjectStore.getState().upsertProject(rebuiltProject)
    set({ interpretationStatus: 'idle' })
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
  startGeneration: async (projectId, options = {}) => {
    const { quickRefinementText } = useStudioStore.getState()
    const project = getProject(projectId)
    if (!project) {
      return
    }

    const preparedProject = commitCurrentDraft(project)
    useProjectStore.getState().upsertProject(preparedProject)
    const committedProject = getProject(projectId)
    if (!committedProject) {
      return
    }

    const sourceSet = getActiveSourceSet(committedProject)
    const interpretation =
      committedProject.interpretations.find(
        (candidate) => candidate.id === committedProject.activeInterpretationId,
      ) ?? committedProject.interpretations[0]
    const blueprint =
      committedProject.blueprints.find(
        (candidate) => candidate.id === committedProject.activeBlueprintId,
      ) ?? committedProject.blueprints[committedProject.blueprints.length - 1]

    if (!sourceSet || !interpretation || !blueprint) {
      return
    }

    const kind = options.kind ?? 'base'
    const parentVersionId =
      options.parentVersionId ?? (kind === 'base' ? undefined : committedProject.activeVersionId)
    const generationBlueprint = applyGenerationKindBlueprintOverrides(blueprint, kind)
    const generationRun = createGenerationRun({
      project: committedProject,
      sourceSet,
      sourceInputs: getSourceInputsForSet(committedProject, sourceSet),
      interpretation,
      blueprint: generationBlueprint,
      kind,
      parentVersionId,
      modifiers: {
        refinementPrompt: quickRefinementText || undefined,
        loadOnSuccess: options.loadOnSuccess ?? true,
      },
    })

    useProjectStore.getState().updateProject(projectId, (currentProject) => ({
      ...currentProject,
      status: 'generating',
      generationRuns: [...currentProject.generationRuns, generationRun],
      updatedAt: nowIso(),
    }))

    set({
      activeGenerationRunId: generationRun.id,
      quickRefinementText: '',
      generationError: null,
    })

    useProjectStore.getState().updateProject(projectId, (currentProject) => ({
      ...currentProject,
      generationRuns: currentProject.generationRuns.map((candidate) =>
        candidate.id === generationRun.id
          ? updateGenerationRunStatus(candidate, 'running')
          : candidate,
      ),
      updatedAt: nowIso(),
    }))

    try {
      const providerResult = await generateTrack({
        projectId,
        projectTitle: committedProject.title,
        blueprint: generationBlueprint,
        sourceSet,
        sourceInputs: getSourceInputsForSet(committedProject, sourceSet),
        sourceSummary: interpretation.summary,
        kind,
        refinementPrompt: quickRefinementText || undefined,
        parentVersionId,
      })

      const projectAfterRun = getProject(projectId)
      if (!projectAfterRun) {
        return
      }

      const runningRun = projectAfterRun.generationRuns.find(
        (candidate) => candidate.id === generationRun.id,
      )
      if (!runningRun) {
        return
      }

      const completedRun = updateGenerationRunStatus(runningRun, 'succeeded', {
        providerRunId: providerResult.providerRunId,
        resultSummary: providerResult.summary,
        providerMetadata: {
          provider: providerResult.provider,
          model: providerResult.model,
          schemaVersion: providerResult.schemaVersion,
          requestHash: providerResult.requestHash,
        },
      })

      const nextVersion = createMockTrackVersion({
        project: projectAfterRun,
        generationRun: completedRun,
      })

      let insight
      try {
        insight = await summarizeTrackVersion({
          projectId,
          projectTitle: projectAfterRun.title,
          versionId: nextVersion.id,
          blueprint: generationBlueprint,
          versionName: nextVersion.name,
          notes: providerResult.summary,
          audioDataUrl:
            providerResult.artifactBase64 && providerResult.artifactMimeType
              ? `data:${providerResult.artifactMimeType};base64,${providerResult.artifactBase64}`
              : undefined,
          structure: nextVersion.structure,
          lyrics: nextVersion.lyrics,
        })
      } catch {
        insight = undefined
      }

      let generatedCoverUrl: string | undefined
      try {
        generatedCoverUrl = await generateProjectCoverArt({
          projectTitle: projectAfterRun.title,
          blueprint: generationBlueprint,
          summary: providerResult.summary,
        })
      } catch {
        generatedCoverUrl = undefined
      }

      const finalizedVersion = {
        ...nextVersion,
        duration: providerResult.durationSeconds || nextVersion.duration,
        isActive: runningRun.modifiers?.loadOnSuccess ?? true,
        notes: providerResult.summary,
        structure: insight?.chordSections ?? nextVersion.structure,
        lyrics:
          insight?.lyricSections ??
          parseLyricsTextIntoSections(
            nextVersion.id,
            providerResult.lyricsText,
            generationBlueprint.vocalStyle,
          ) ??
          nextVersion.lyrics,
        audioUrl:
          providerResult.artifactBase64 && providerResult.artifactMimeType
            ? `data:${providerResult.artifactMimeType};base64,${providerResult.artifactBase64}`
            : nextVersion.audioUrl,
        exports:
          providerResult.artifactBase64 && providerResult.artifactMimeType
            ? [
                {
                  type: 'audio' as const,
                  status: 'ready' as const,
                  size: `${Math.max(1, Math.round(providerResult.artifactBase64.length / 1024))}KB`,
                  lastGenerated: new Date().toLocaleTimeString(),
                },
              ]
            : nextVersion.exports,
        insight,
      }

      useProjectStore.getState().updateProject(projectId, (currentProject) => {
        const versions =
          runningRun.modifiers?.loadOnSuccess ?? true
            ? currentProject.versions.map((version) => ({ ...version, isActive: false }))
            : currentProject.versions

        return {
          ...currentProject,
          status: currentProject.status === 'archived' ? 'archived' : 'draft',
          coverUrl: generatedCoverUrl ?? currentProject.coverUrl,
          artUrl: generatedCoverUrl ?? currentProject.artUrl,
          versions: [...versions, finalizedVersion],
          activeVersionId:
            runningRun.modifiers?.loadOnSuccess ?? true
              ? finalizedVersion.id
              : currentProject.activeVersionId,
          versionCount: versions.length + 1,
          generationRuns: currentProject.generationRuns.map((candidate) =>
            candidate.id === generationRun.id
              ? updateGenerationRunStatus(completedRun, 'succeeded', {
                  outputVersionId: finalizedVersion.id,
                })
              : candidate,
          ),
          updatedAt: nowIso(),
        }
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Lyria generation failed unexpectedly.'
      const generationError =
        error instanceof Error && error.message.trim().length > 0
          ? `Generation failed: ${error.message}`
          : 'Generation failed. Check your connection and Lyria settings, then try again.'

      useProjectStore.getState().updateProject(projectId, (currentProject) => ({
        ...currentProject,
        status: currentProject.status === 'archived' ? 'archived' : 'draft',
        generationRuns: currentProject.generationRuns.map((candidate) =>
          candidate.id === generationRun.id
            ? updateGenerationRunStatus(candidate, 'failed', {
                errorMessage,
                failureCode: 'generation_failed',
              })
            : candidate,
        ),
        updatedAt: nowIso(),
      }))

      set({ generationError })
    }
  },
}))
