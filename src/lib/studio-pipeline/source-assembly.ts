import type { SourceInput, SourceInputKind } from '@/domain/source-input'
import type { SourceInfluence, SourceSet, SourceSetItem } from '@/domain/source-set'
import { createStudioId, nowIso } from './ids'

function clampWeight(weight: number): number {
  return Math.max(0, Math.min(100, Math.round(weight)))
}

function getDefaultInfluence(sourceInput: SourceInput, order: number): SourceInfluence {
  if (sourceInput.isReference || sourceInput.role === 'reference') {
    return 'reference'
  }

  if (sourceInput.type === 'remix_source') {
    return 'primary'
  }

  return order === 0 ? 'primary' : 'supporting'
}

function getDefaultWeight(influence: SourceInfluence): number {
  switch (influence) {
    case 'reference':
      return 35
    case 'supporting':
      return 68
    default:
      return 100
  }
}

type SourceFileFormat = NonNullable<SourceInput['normalized']>['fileFormat']

function getFileFormatForType(type: SourceInputKind): SourceFileFormat {
  switch (type) {
    case 'hum':
    case 'sung_melody':
    case 'riff_audio':
    case 'remix_source':
      return 'wav'
    case 'typed_notes':
    case 'chord_progression':
    case 'lyrics':
      return 'txt'
    case 'sheet_music':
      return 'pdf'
    default:
      return undefined
  }
}

export function normalizeStudioSourceInput(sourceInput: SourceInput): SourceInput {
  const normalized = {
    ...sourceInput.normalized,
  }

  if ('durationSeconds' in sourceInput && sourceInput.durationSeconds) {
    normalized.durationSeconds ??= sourceInput.durationSeconds
  }

  if ('text' in sourceInput) {
    normalized.textLength ??= sourceInput.text.length
  }

  if ('fileName' in sourceInput && sourceInput.fileName) {
    normalized.fileName ??= sourceInput.fileName
  }

  if ('fileFormat' in sourceInput && sourceInput.fileFormat) {
    normalized.fileFormat ??= sourceInput.fileFormat
  } else {
    normalized.fileFormat ??= getFileFormatForType(sourceInput.type)
  }

  if ('artistName' in sourceInput && sourceInput.artistName) {
    normalized.providerArtist ??= sourceInput.artistName
  }

  if ('playlistName' in sourceInput && sourceInput.playlistName) {
    normalized.providerTitle ??= sourceInput.playlistName
  }

  if ('providerTrackName' in sourceInput && sourceInput.providerTrackName) {
    normalized.providerTitle ??= sourceInput.providerTrackName
  }

  if (sourceInput.provenance === 'spotify') {
    normalized.providerName ??= 'Spotify'
  }

  return {
    ...sourceInput,
    rawAssetUrl: sourceInput.rawAssetUrl ?? ('audioUrl' in sourceInput ? sourceInput.audioUrl : undefined),
    normalized,
    interpretationIds: sourceInput.interpretationIds ?? [],
  }
}

export function createSourceSetFromInputs(
  projectId: string,
  sourceInputs: SourceInput[],
  existingSourceSet?: SourceSet,
): SourceSet {
  const itemsBySourceId = new Map(
    existingSourceSet?.items.map((item) => [item.sourceInputId, item]) ?? [],
  )
  const createdAt = existingSourceSet?.createdAt ?? nowIso()

  const items: SourceSetItem[] = sourceInputs.map((sourceInput, order) => {
    const existingItem = itemsBySourceId.get(sourceInput.id)
    const influence = existingItem?.influence ?? getDefaultInfluence(sourceInput, order)

    return {
      sourceInputId: sourceInput.id,
      order: existingItem?.order ?? order,
      enabled: existingItem?.enabled ?? true,
      weight: clampWeight(existingItem?.weight ?? getDefaultWeight(influence)),
      priority: existingItem?.priority ?? order + 1,
      influence,
    }
  })

  return {
    id: existingSourceSet?.id ?? createStudioId('sourceset'),
    projectId,
    name: existingSourceSet?.name ?? 'Primary Source Set',
    note: existingSourceSet?.note,
    createdAt,
    updatedAt: nowIso(),
    items,
  }
}
