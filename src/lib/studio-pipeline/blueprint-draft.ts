import type { Blueprint, InstrumentPlan } from '@/domain/blueprint'
import type { BlueprintDraft, BlueprintDraftField, BlueprintFieldOrigin, BlueprintFieldOriginMap } from '@/domain/blueprint-draft'
import type { InterpretationSnapshot } from '@/domain/interpretation'
import { createStudioId, nowIso } from './ids'

export const INSTRUMENT_FIELDS: (keyof InstrumentPlan)[] = [
  'drums',
  'bass',
  'guitar',
  'synths',
  'strings',
  'pads',
]

const DEFAULT_INSTRUMENTS: InstrumentPlan = {
  drums: true,
  bass: true,
  guitar: false,
  synths: true,
  strings: false,
  pads: true,
}

const DEFAULT_BLUEPRINT_FIELDS: Omit<
  Blueprint,
  'id' | 'projectId' | 'revision' | 'createdAt' | 'updatedAt'
> = {
  basedOnBlueprintId: undefined,
  sourceInputIds: [],
  bpm: 118,
  key: 'C',
  mode: 'Minor',
  timeSignature: '4/4',
  targetDuration: '3:45',
  genre: 'Alt Pop',
  subgenre: undefined,
  mood: 'Reflective',
  energy: 'Medium',
  texture: 'Layered and modern',
  vocalsEnabled: true,
  vocalStyle: 'Airy lead with doubles',
  lyricTheme: 'Late-night motion and memory',
  instruments: DEFAULT_INSTRUMENTS,
  structure: undefined,
  melodyDirection: 'Build from the strongest melodic source',
  generationNotes: [],
  refinementDirectives: [],
}

function getFieldOriginKey(field: keyof Blueprint): BlueprintDraftField | null {
  switch (field) {
    case 'bpm':
    case 'key':
    case 'mode':
    case 'timeSignature':
    case 'targetDuration':
    case 'genre':
    case 'subgenre':
    case 'mood':
    case 'energy':
    case 'texture':
    case 'vocalsEnabled':
    case 'vocalStyle':
    case 'lyricTheme':
    case 'melodyDirection':
    case 'generationNotes':
    case 'refinementDirectives':
      return field
    default:
      return null
  }
}

export function getInstrumentFieldKey(field: keyof InstrumentPlan): BlueprintDraftField {
  return `instruments.${field}`
}

function setOrigin(
  origins: BlueprintFieldOriginMap,
  field: BlueprintDraftField,
  origin: BlueprintFieldOrigin,
) {
  origins[field] = origin
}

function mergeInferredValue<T>(
  currentValue: T,
  inferredValue: T | undefined,
  field: BlueprintDraftField,
  draft: BlueprintDraft,
  fallbackOrigin: BlueprintFieldOrigin,
): T {
  if (draft.lockedFields.includes(field)) {
    return currentValue
  }

  if (inferredValue !== undefined) {
    draft.origins[field] = 'inferred'
    return inferredValue
  }

  draft.origins[field] ??= fallbackOrigin
  return currentValue
}

function cloneBlueprint(
  blueprint: Blueprint | BlueprintDraft | Partial<Blueprint> | undefined,
): Partial<Blueprint> {
  if (!blueprint) {
    return {}
  }

  return JSON.parse(JSON.stringify(blueprint)) as Partial<Blueprint>
}

function toDraftConflictField(field: InterpretationSnapshot['conflicts'][number]['field']): BlueprintDraftField | null {
  if (field === 'instruments' || field === 'structure') {
    return null
  }

  return field
}

export function createBlueprintDraft({
  projectId,
  sourceSetId,
  interpretation,
  activeBlueprint,
  existingDraft,
}: {
  projectId: string
  sourceSetId: string
  interpretation: InterpretationSnapshot
  activeBlueprint?: Blueprint
  existingDraft?: BlueprintDraft
}): BlueprintDraft {
  const createdAt = existingDraft?.createdAt ?? nowIso()
  const committedBlueprint = cloneBlueprint(activeBlueprint)
  const draft: BlueprintDraft = {
    ...DEFAULT_BLUEPRINT_FIELDS,
    ...committedBlueprint,
    ...existingDraft,
    id: existingDraft?.id ?? createStudioId('draft'),
    projectId,
    revision: existingDraft?.revision ?? activeBlueprint?.revision ?? 1,
    createdAt,
    updatedAt: nowIso(),
    sourceSetId,
    interpretationId: interpretation.id,
    committedBlueprintId: activeBlueprint?.id ?? existingDraft?.committedBlueprintId,
    basedOnBlueprintId: activeBlueprint?.id ?? existingDraft?.basedOnBlueprintId,
    sourceInputIds: interpretation.sourceInputIds,
    isDirty: existingDraft?.isDirty ?? false,
    lastCommittedAt: existingDraft?.lastCommittedAt,
    origins: {
      ...existingDraft?.origins,
    },
    lockedFields: existingDraft?.lockedFields ?? [],
    conflictFields: interpretation.conflicts
      .map((conflict) => toDraftConflictField(conflict.field))
      .filter((field): field is BlueprintDraftField => Boolean(field)),
    structure:
      existingDraft?.structure ??
      interpretation.derivedBlueprint.structure ??
      activeBlueprint?.structure,
  }

  const fieldKeys: (keyof Blueprint)[] = [
    'bpm',
    'key',
    'mode',
    'timeSignature',
    'targetDuration',
    'genre',
    'subgenre',
    'mood',
    'energy',
    'texture',
    'vocalsEnabled',
    'vocalStyle',
    'lyricTheme',
    'melodyDirection',
    'generationNotes',
    'refinementDirectives',
  ]

  for (const field of fieldKeys) {
    const originField = getFieldOriginKey(field)
    if (!originField) {
      continue
    }

    const interpretedValue = interpretation.derivedBlueprint[field]
    ;(draft as unknown as Record<string, unknown>)[field] = mergeInferredValue(
      draft[field],
      interpretedValue as Blueprint[typeof field] | undefined,
      originField,
      draft,
      activeBlueprint?.[field] !== undefined ? 'inferred' : 'default',
    )
  }

  draft.instruments = {
    ...DEFAULT_INSTRUMENTS,
    ...draft.instruments,
  }

  for (const instrumentField of INSTRUMENT_FIELDS) {
    const originField = getInstrumentFieldKey(instrumentField)
    const inferredValue = interpretation.derivedBlueprint.instruments?.[instrumentField]

    if (draft.lockedFields.includes(originField)) {
      continue
    }

    if (inferredValue !== undefined) {
      draft.instruments[instrumentField] = inferredValue
      setOrigin(draft.origins, originField, 'inferred')
    } else {
      draft.origins[originField] ??= activeBlueprint?.instruments?.[instrumentField] !== undefined ? 'inferred' : 'default'
    }
  }

  return draft
}

export function updateBlueprintDraftField<T>({
  draft,
  field,
  value,
}: {
  draft: BlueprintDraft
  field: BlueprintDraftField
  value: T
}): BlueprintDraft {
  const nextDraft = JSON.parse(JSON.stringify(draft)) as BlueprintDraft

  if (field.startsWith('instruments.')) {
    const instrumentField = field.replace('instruments.', '') as keyof InstrumentPlan
    nextDraft.instruments = {
      ...nextDraft.instruments,
      [instrumentField]: Boolean(value),
    }
  } else {
    ;(nextDraft as unknown as Record<string, unknown>)[field] = value
  }

  nextDraft.updatedAt = nowIso()
  nextDraft.isDirty = true
  nextDraft.origins[field] = 'user'
  if (!nextDraft.lockedFields.includes(field)) {
    nextDraft.lockedFields = [...nextDraft.lockedFields, field]
  }

  return nextDraft
}

export function commitBlueprintDraft({
  projectId,
  draft,
  currentBlueprint,
  currentRevision,
}: {
  projectId: string
  draft: BlueprintDraft
  currentBlueprint?: Blueprint
  currentRevision?: number
}): { blueprint: Blueprint; draft: BlueprintDraft } {
  if (!draft.isDirty && currentBlueprint) {
    return {
      blueprint: currentBlueprint,
      draft: {
        ...draft,
        committedBlueprintId: currentBlueprint.id,
        revision: currentBlueprint.revision,
        isDirty: false,
        lastCommittedAt: draft.lastCommittedAt ?? currentBlueprint.updatedAt,
      },
    }
  }

  const committedAt = nowIso()
  const revision = (currentRevision ?? currentBlueprint?.revision ?? 0) + 1
  const blueprint: Blueprint = {
    id: createStudioId('bp'),
    projectId,
    revision,
    createdAt: currentBlueprint?.createdAt ?? committedAt,
    updatedAt: committedAt,
    basedOnBlueprintId: currentBlueprint?.id ?? draft.basedOnBlueprintId,
    sourceInputIds: draft.sourceInputIds,
    bpm: draft.bpm,
    key: draft.key,
    mode: draft.mode,
    timeSignature: draft.timeSignature,
    targetDuration: draft.targetDuration,
    genre: draft.genre,
    subgenre: draft.subgenre,
    mood: draft.mood,
    energy: draft.energy,
    texture: draft.texture,
    vocalsEnabled: draft.vocalsEnabled,
    vocalStyle: draft.vocalStyle,
    lyricTheme: draft.lyricTheme,
    instruments: draft.instruments,
    structure: draft.structure,
    melodyDirection: draft.melodyDirection,
    generationNotes: draft.generationNotes,
    refinementDirectives: draft.refinementDirectives,
  }

  return {
    blueprint,
    draft: {
      ...draft,
      basedOnBlueprintId: blueprint.id,
      committedBlueprintId: blueprint.id,
      revision,
      updatedAt: committedAt,
      isDirty: false,
      lastCommittedAt: committedAt,
    },
  }
}
