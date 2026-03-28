import type { Blueprint } from '@/domain/blueprint'
import type { GenerationContextSnapshot, GenerationRun, GenerationRunModifiers } from '@/domain/generation-run'
import type { InterpretationSnapshot } from '@/domain/interpretation'
import type { Project } from '@/domain/project'
import type { SourceInput } from '@/domain/source-input'
import type { SourceSet } from '@/domain/source-set'
import type { TrackVersion, TrackVersionKind } from '@/domain/track-version'
import { createStudioId, nowIso } from './ids'

function parseDurationToSeconds(targetDuration: string): number {
  const [minutes, seconds] = targetDuration.split(':').map(Number)
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return 225
  }

  return minutes * 60 + seconds
}

function buildVersionName(kind: TrackVersionKind, versionCount: number): string {
  switch (kind) {
    case 'alternate-mix':
      return `Alt Mix ${versionCount}`
    case 'instrumental':
      return `Instrumental ${versionCount}`
    case 'acoustic':
      return `Acoustic ${versionCount}`
    case 'remix':
      return `Remix ${versionCount}`
    case 'refinement':
      return `Refinement ${versionCount}`
    default:
      return `Generation ${versionCount}`
  }
}

function buildVersionTags(kind: TrackVersionKind, modifiers?: GenerationRunModifiers): string[] {
  const tags: string[] = [kind]
  if (modifiers?.refinementPrompt) {
    tags.push(modifiers.refinementPrompt.split(' ').slice(0, 3).join(' '))
  }

  return tags
}

export function createGenerationContextSnapshot({
  project,
  sourceSet,
  sourceInputs,
  interpretation,
  blueprint,
  kind,
  parentVersionId,
  modifiers,
}: {
  project: Project
  sourceSet: SourceSet
  sourceInputs: SourceInput[]
  interpretation: InterpretationSnapshot
  blueprint: Blueprint
  kind: TrackVersionKind
  parentVersionId?: string
  modifiers?: GenerationRunModifiers
}): GenerationContextSnapshot {
  const sourceById = new Map(sourceInputs.map((sourceInput) => [sourceInput.id, sourceInput]))
  const sourceItems = [...sourceSet.items].sort((left, right) => left.order - right.order)

  return {
    createdAt: nowIso(),
    projectId: project.id,
    sourceSetId: sourceSet.id,
    interpretationId: interpretation.id,
    blueprintId: blueprint.id,
    blueprintRevision: blueprint.revision,
    blueprintSnapshot: blueprint,
    sources: sourceItems
      .map((item) => {
        const sourceInput = sourceById.get(item.sourceInputId)
        if (!sourceInput) {
          return null
        }

        return {
          sourceInputId: sourceInput.id,
          label: sourceInput.label,
          type: sourceInput.type,
          role: sourceInput.role,
          influence: item.influence,
          weight: item.weight,
          enabled: item.enabled,
          isReference: sourceInput.isReference,
        }
      })
      .filter((source): source is NonNullable<typeof source> => Boolean(source)),
    sourceItems,
    interpretationSummary: interpretation.summary,
    parentVersionId,
    kind,
    modifiers,
  }
}

export function createGenerationRun({
  project,
  sourceSet,
  sourceInputs,
  interpretation,
  blueprint,
  kind,
  parentVersionId,
  modifiers,
}: {
  project: Project
  sourceSet: SourceSet
  sourceInputs: SourceInput[]
  interpretation: InterpretationSnapshot
  blueprint: Blueprint
  kind: TrackVersionKind
  parentVersionId?: string
  modifiers?: GenerationRunModifiers
}): GenerationRun {
  const createdAt = nowIso()
  return {
    id: createStudioId('run'),
    projectId: project.id,
    sourceSetId: sourceSet.id,
    interpretationId: interpretation.id,
    blueprintId: blueprint.id,
    blueprintRevision: blueprint.revision,
    kind,
    status: 'queued',
    createdAt,
    updatedAt: createdAt,
    parentVersionId,
    modifiers,
    generationContextSnapshot: createGenerationContextSnapshot({
      project,
      sourceSet,
      sourceInputs,
      interpretation,
      blueprint,
      kind,
      parentVersionId,
      modifiers,
    }),
  }
}

export function updateGenerationRunStatus(
  generationRun: GenerationRun,
  status: GenerationRun['status'],
  updates: Partial<GenerationRun> = {},
): GenerationRun {
  const timestamp = nowIso()
  return {
    ...generationRun,
    status,
    updatedAt: timestamp,
    startedAt: status === 'running' ? generationRun.startedAt ?? timestamp : generationRun.startedAt,
    completedAt:
      status === 'succeeded' || status === 'failed'
        ? updates.completedAt ?? timestamp
        : generationRun.completedAt,
    ...updates,
  }
}

export function createMockTrackVersion({
  project,
  generationRun,
}: {
  project: Project
  generationRun: GenerationRun
}): TrackVersion {
  const blueprint = generationRun.generationContextSnapshot.blueprintSnapshot
  const versionIndex = (project.versions?.length ?? 0) + 1
  const timestamp = nowIso()

  return {
    id: createStudioId('version'),
    projectId: project.id,
    name: buildVersionName(generationRun.kind, versionIndex),
    timestamp,
    duration: parseDurationToSeconds(blueprint.targetDuration),
    isActive: generationRun.modifiers?.loadOnSuccess ?? true,
    tags: buildVersionTags(generationRun.kind, generationRun.modifiers),
    kind: generationRun.kind,
    sourceBlueprintId: blueprint.id,
    sourceSetId: generationRun.sourceSetId,
    interpretationId: generationRun.interpretationId,
    generationRunId: generationRun.id,
    parentVersionId: generationRun.parentVersionId,
    structure: blueprint.structure,
    notes: generationRun.modifiers?.refinementPrompt,
  }
}
