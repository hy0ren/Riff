import type { Blueprint, EnergyLevel, InstrumentPlan, MusicalMode, TrackStructureNode } from '@/domain/blueprint'
import type { InterpretationConflict, InterpretationSignal, InterpretationSnapshot } from '@/domain/interpretation'
import type { Project } from '@/domain/project'
import type { SourceInput } from '@/domain/source-input'
import type { SourceSet, SourceSetItem } from '@/domain/source-set'
import { createStudioId, nowIso } from './ids'

const BPM_HINTS: Record<SourceInput['type'], number> = {
  hum: 118,
  sung_melody: 114,
  riff_audio: 128,
  typed_notes: 102,
  chord_progression: 96,
  sheet_music: 84,
  lyrics: 110,
  remix_source: 122,
  spotify_track_reference: 120,
  spotify_playlist_reference: 126,
}

const KEY_HINTS: Record<SourceInput['type'], string> = {
  hum: 'F',
  sung_melody: 'A',
  riff_audio: 'D',
  typed_notes: 'C',
  chord_progression: 'C',
  sheet_music: 'Bb',
  lyrics: 'A',
  remix_source: 'E',
  spotify_track_reference: 'G',
  spotify_playlist_reference: 'G',
}

const MODE_HINTS: Record<SourceInput['type'], MusicalMode> = {
  hum: 'Minor',
  sung_melody: 'Major',
  riff_audio: 'Minor',
  typed_notes: 'Minor',
  chord_progression: 'Minor',
  sheet_music: 'Minor',
  lyrics: 'Minor',
  remix_source: 'Minor',
  spotify_track_reference: 'Minor',
  spotify_playlist_reference: 'Major',
}

const GENRE_HINTS: Record<SourceInput['type'], string> = {
  hum: 'Synthwave',
  sung_melody: 'Dream Pop',
  riff_audio: 'Alt Rock',
  typed_notes: 'Indie Electronic',
  chord_progression: 'Downtempo',
  sheet_music: 'Classical Crossover',
  lyrics: 'Alt Pop',
  remix_source: 'Remix',
  spotify_track_reference: 'Reference Guided',
  spotify_playlist_reference: 'Playlist Guided',
}

const MOOD_HINTS: Record<SourceInput['type'], string> = {
  hum: 'Driving',
  sung_melody: 'Hopeful',
  riff_audio: 'Restless',
  typed_notes: 'Reflective',
  chord_progression: 'Melancholic',
  sheet_music: 'Contemplative',
  lyrics: 'Cinematic',
  remix_source: 'Reimagined',
  spotify_track_reference: 'Polished',
  spotify_playlist_reference: 'Euphoric',
}

const ENERGY_HINTS: Record<SourceInput['type'], EnergyLevel> = {
  hum: 'High',
  sung_melody: 'Medium',
  riff_audio: 'High',
  typed_notes: 'Medium',
  chord_progression: 'Low',
  sheet_music: 'Low',
  lyrics: 'Medium',
  remix_source: 'High',
  spotify_track_reference: 'High',
  spotify_playlist_reference: 'Extreme',
}

const TEXTURE_HINTS: Record<SourceInput['type'], string> = {
  hum: 'Hook-forward and neon-lit',
  sung_melody: 'Open and lyrical',
  riff_audio: 'Amp-driven and punchy',
  typed_notes: 'Sketchbook and precise',
  chord_progression: 'Harmonic and spacious',
  sheet_music: 'Arranged and dynamic',
  lyrics: 'Narrative and vocal-led',
  remix_source: 'Inherited and transformed',
  spotify_track_reference: 'Taste-led and polished',
  spotify_playlist_reference: 'Curated and contemporary',
}

const DURATION_HINTS: Record<SourceInput['type'], string> = {
  hum: '3:45',
  sung_melody: '3:30',
  riff_audio: '3:25',
  typed_notes: '3:35',
  chord_progression: '3:50',
  sheet_music: '4:20',
  lyrics: '3:40',
  remix_source: '3:55',
  spotify_track_reference: '3:40',
  spotify_playlist_reference: '3:10',
}

function orderSourceItems(sourceSet: SourceSet): SourceSetItem[] {
  return [...sourceSet.items].sort((left, right) => left.order - right.order)
}

function getActiveSources(sourceSet: SourceSet, sourceInputs: SourceInput[]): SourceInput[] {
  const sourceById = new Map(sourceInputs.map((sourceInput) => [sourceInput.id, sourceInput]))
  return orderSourceItems(sourceSet)
    .filter((item) => item.enabled)
    .map((item) => sourceById.get(item.sourceInputId))
    .filter((sourceInput): sourceInput is SourceInput => Boolean(sourceInput))
}

function getWeightedAverage(activeItems: SourceSetItem[], sourceInputs: SourceInput[], fallback: number): number {
  const itemById = new Map(activeItems.map((item) => [item.sourceInputId, item]))
  let totalWeight = 0
  let weightedBpm = 0

  for (const sourceInput of sourceInputs) {
    const item = itemById.get(sourceInput.id)
    if (!item) {
      continue
    }

    totalWeight += item.weight
    weightedBpm += BPM_HINTS[sourceInput.type] * item.weight
  }

  if (!totalWeight) {
    return fallback
  }

  return Math.round(weightedBpm / totalWeight)
}

function getMostInfluentialSource(activeItems: SourceSetItem[], sourceInputs: SourceInput[]): SourceInput | undefined {
  const itemById = new Map(activeItems.map((item) => [item.sourceInputId, item]))
  return [...sourceInputs].sort((left, right) => {
    const rightWeight = itemById.get(right.id)?.weight ?? 0
    const leftWeight = itemById.get(left.id)?.weight ?? 0
    return rightWeight - leftWeight
  })[0]
}

function getMostCommonHint<T extends string>(
  activeItems: SourceSetItem[],
  sourceInputs: SourceInput[],
  hintMap: Record<SourceInput['type'], T>,
  fallback: T,
): T {
  const weightedCounts = new Map<T, number>()
  const itemById = new Map(activeItems.map((item) => [item.sourceInputId, item]))

  for (const sourceInput of sourceInputs) {
    const hint = hintMap[sourceInput.type]
    const weight = itemById.get(sourceInput.id)?.weight ?? 0
    weightedCounts.set(hint, (weightedCounts.get(hint) ?? 0) + weight)
  }

  let resolved = fallback
  let bestWeight = 0

  for (const [value, weight] of weightedCounts.entries()) {
    if (weight > bestWeight) {
      resolved = value
      bestWeight = weight
    }
  }

  return resolved
}

function getDefaultStructure(duration: number): TrackStructureNode[] {
  const intro = Math.max(12, Math.round(duration * 0.08))
  const verse = Math.max(24, Math.round(duration * 0.18))
  const pre = Math.max(12, Math.round(duration * 0.08))
  const chorus = Math.max(24, Math.round(duration * 0.16))
  const bridge = Math.max(18, Math.round(duration * 0.12))
  const outro = Math.max(10, duration - intro - verse * 2 - pre - chorus * 3 - bridge)

  return [
    { id: 'sec-intro', label: 'Intro', startTime: 0, duration: intro, chords: ['i', 'VI'] },
    { id: 'sec-verse-1', label: 'Verse 1', startTime: intro, duration: verse, chords: ['i', 'iv', 'VI', 'VII'] },
    { id: 'sec-pre', label: 'Pre-Chorus', startTime: intro + verse, duration: pre, chords: ['iv', 'VI', 'VII', 'VII'] },
    { id: 'sec-chorus-1', label: 'Chorus', startTime: intro + verse + pre, duration: chorus, chords: ['i', 'VI', 'III', 'VII'] },
    { id: 'sec-verse-2', label: 'Verse 2', startTime: intro + verse + pre + chorus, duration: verse, chords: ['i', 'iv', 'VI', 'VII'] },
    { id: 'sec-chorus-2', label: 'Chorus', startTime: intro + verse * 2 + pre + chorus, duration: chorus, chords: ['i', 'VI', 'III', 'VII'] },
    { id: 'sec-bridge', label: 'Bridge', startTime: intro + verse * 2 + pre + chorus * 2, duration: bridge, chords: ['VI', 'VII', 'i', 'v'] },
    { id: 'sec-chorus-3', label: 'Final Chorus', startTime: intro + verse * 2 + pre + chorus * 2 + bridge, duration: chorus, chords: ['i', 'VI', 'III', 'VII'] },
    { id: 'sec-outro', label: 'Outro', startTime: intro + verse * 2 + pre + chorus * 3 + bridge, duration: outro, chords: ['i'] },
  ]
}

function parseDurationToSeconds(targetDuration?: string): number {
  if (!targetDuration?.includes(':')) {
    return 225
  }

  const [minutes, seconds] = targetDuration.split(':').map(Number)
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return 225
  }

  return minutes * 60 + seconds
}

function buildInstrumentPlan(sourceInputs: SourceInput[], fallback?: InstrumentPlan): InstrumentPlan {
  const plan: InstrumentPlan = fallback ?? {
    drums: true,
    bass: true,
    guitar: false,
    synths: true,
    strings: false,
    pads: true,
  }

  for (const sourceInput of sourceInputs) {
    switch (sourceInput.type) {
      case 'riff_audio':
      case 'remix_source':
        plan.guitar = true
        plan.drums = true
        break
      case 'sheet_music':
        plan.strings = true
        plan.pads = true
        break
      case 'spotify_playlist_reference':
        plan.synths = true
        plan.bass = true
        break
      case 'lyrics':
      case 'sung_melody':
      case 'hum':
        plan.pads = true
        break
    }
  }

  return plan
}

function createConflict(field: InterpretationConflict['field'], sourceInputs: SourceInput[], summary: string): InterpretationConflict {
  return {
    field,
    values: sourceInputs.map((sourceInput) => sourceInput.label),
    sourceInputIds: sourceInputs.map((sourceInput) => sourceInput.id),
    summary,
  }
}

function createSignal<T>(
  field: InterpretationSignal<T>['field'],
  value: T,
  sourceInputs: SourceInput[],
  confidence: number,
  summary?: string,
): InterpretationSignal<T> {
  return {
    field,
    value,
    confidence,
    sourceInputIds: sourceInputs.map((sourceInput) => sourceInput.id),
    summary,
  }
}

export function createInterpretationSnapshot({
  project,
  sourceSet,
  sourceInputs,
  activeBlueprint,
  existingInterpretation,
}: {
  project: Project
  sourceSet: SourceSet
  sourceInputs: SourceInput[]
  activeBlueprint?: Blueprint
  existingInterpretation?: InterpretationSnapshot
}): InterpretationSnapshot {
  const orderedItems = orderSourceItems(sourceSet)
  const activeItems = orderedItems.filter((item) => item.enabled)
  const activeSources = getActiveSources(sourceSet, sourceInputs)
  const baseSource = getMostInfluentialSource(activeItems, activeSources)

  const bpm = getWeightedAverage(activeItems, activeSources, activeBlueprint?.bpm ?? project.bpm ?? 118)
  const key = activeBlueprint?.key ?? (baseSource ? KEY_HINTS[baseSource.type] : 'C')
  const mode = activeBlueprint?.mode ?? (baseSource ? MODE_HINTS[baseSource.type] : 'Minor')
  const genre = activeBlueprint?.genre ?? getMostCommonHint(activeItems, activeSources, GENRE_HINTS, 'Alt Pop')
  const mood = activeBlueprint?.mood ?? project.mood ?? getMostCommonHint(activeItems, activeSources, MOOD_HINTS, 'Reflective')
  const energy = activeBlueprint?.energy ?? getMostCommonHint(activeItems, activeSources, ENERGY_HINTS, 'Medium')
  const texture = activeBlueprint?.texture ?? (baseSource ? TEXTURE_HINTS[baseSource.type] : 'Layered and modern')
  const targetDuration = activeBlueprint?.targetDuration ?? (baseSource ? DURATION_HINTS[baseSource.type] : '3:45')
  const vocalsEnabled =
    activeBlueprint?.vocalsEnabled ??
    activeSources.some((sourceInput) =>
      ['hum', 'sung_melody', 'lyrics'].includes(sourceInput.type),
    )
  const vocalStyle =
    activeBlueprint?.vocalStyle ??
    (vocalsEnabled
      ? activeSources.some((sourceInput) => sourceInput.type === 'lyrics')
        ? 'Expressive lead with layered doubles'
        : 'Airy lead with melodic phrasing'
      : undefined)
  const lyricSource = activeSources.find(
    (sourceInput): sourceInput is SourceInput & { type: 'lyrics'; text: string } =>
      sourceInput.type === 'lyrics' && 'text' in sourceInput,
  )
  const lyricTheme =
    activeBlueprint?.lyricTheme ??
    lyricSource?.text.slice(0, 80)
  const melodyDirection =
    activeBlueprint?.melodyDirection ??
    (activeSources.some((sourceInput) => ['hum', 'sung_melody'].includes(sourceInput.type))
      ? 'Preserve the captured melodic contour'
      : 'Build a singable top-line over the harmonic bed')
  const instruments = buildInstrumentPlan(activeSources, activeBlueprint?.instruments)
  const durationSeconds = parseDurationToSeconds(targetDuration)
  const structure = activeBlueprint?.structure ?? getDefaultStructure(durationSeconds)

  const generationNotes = [
    activeSources.some((sourceInput) => sourceInput.type === 'remix_source')
      ? 'Retain recognizable DNA from the remix ancestry.'
      : undefined,
    activeSources.some((sourceInput) => sourceInput.type.startsWith('spotify_'))
      ? 'Use Spotify references for taste and texture only.'
      : undefined,
    activeSources.some((sourceInput) => ['hum', 'sung_melody'].includes(sourceInput.type))
      ? 'Honor the user melodic phrase as a lead motif.'
      : undefined,
  ].filter((note): note is string => Boolean(note))

  const refinementDirectives = [
    activeSources.some((sourceInput) => sourceInput.type === 'chord_progression')
      ? 'Keep harmonic cadence close to the provided progression.'
      : undefined,
    activeSources.some((sourceInput) => sourceInput.type === 'lyrics')
      ? 'Leave space for intelligible lyrical delivery.'
      : undefined,
    activeSources.some((sourceInput) => sourceInput.type === 'riff_audio')
      ? 'Keep the riff prominent in intro and chorus sections.'
      : undefined,
  ].filter((directive): directive is string => Boolean(directive))

  const derivedBlueprint: Partial<Blueprint> = {
    bpm,
    key,
    mode,
    timeSignature: activeBlueprint?.timeSignature ?? '4/4',
    targetDuration,
    genre,
    subgenre: activeBlueprint?.subgenre,
    mood,
    energy,
    texture,
    vocalsEnabled,
    vocalStyle,
    lyricTheme,
    instruments,
    structure,
    melodyDirection,
    generationNotes,
    refinementDirectives,
  }

  const conflicts: InterpretationConflict[] = []
  const remixSources = activeSources.filter((sourceInput) => sourceInput.type === 'remix_source')
  const spotifySources = activeSources.filter((sourceInput) =>
    ['spotify_track_reference', 'spotify_playlist_reference'].includes(sourceInput.type),
  )
  const melodicSources = activeSources.filter((sourceInput) =>
    ['hum', 'sung_melody', 'riff_audio'].includes(sourceInput.type),
  )

  if (remixSources.length && spotifySources.length) {
    conflicts.push(
      createConflict(
        'genre',
        [...remixSources, ...spotifySources],
        'Remix lineage and Spotify taste references may pull genre decisions in different directions.',
      ),
    )
  }

  if (melodicSources.length > 1) {
    conflicts.push(
      createConflict(
        'melodyDirection',
        melodicSources,
        'Multiple melodic inputs are active. The lead motif should be clarified before final generation.',
      ),
    )
  }

  const vocalSignalSources = vocalsEnabled ? activeSources : []
  const signals: InterpretationSignal[] = [
    createSignal('bpm', bpm, activeSources, 0.82, `${bpm} BPM target from weighted source tempo cues`),
    createSignal('key', key, activeSources, 0.71, `${key} tonal center favored by the strongest sources`),
    createSignal('mode', mode, activeSources, 0.7),
    createSignal('genre', genre, activeSources, 0.74),
    createSignal('mood', mood, activeSources, 0.78),
    createSignal('energy', energy, activeSources, 0.81),
    createSignal('texture', texture, activeSources, 0.68),
    createSignal('vocalsEnabled', vocalsEnabled, activeSources, 0.8),
    createSignal('vocalStyle', vocalStyle, vocalSignalSources, vocalsEnabled ? 0.64 : 0.3),
    createSignal('lyricTheme', lyricTheme, activeSources.filter((sourceInput) => sourceInput.type === 'lyrics'), lyricTheme ? 0.83 : 0.22),
    createSignal('melodyDirection', melodyDirection, melodicSources.length ? melodicSources : activeSources, 0.77),
    createSignal('instruments', instruments, activeSources, 0.75),
    createSignal('structure', structure, activeSources, 0.62),
  ]

  const summary = activeSources.length
    ? `Interpreted ${activeSources.length} active inputs with ${conflicts.length} notable conflict${conflicts.length === 1 ? '' : 's'}.`
    : 'No active inputs were available for interpretation.'

  return {
    id: existingInterpretation?.id ?? createStudioId('interp'),
    projectId: project.id,
    sourceSetId: sourceSet.id,
    createdAt: existingInterpretation?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    summary,
    sourceInputIds: activeSources.map((sourceInput) => sourceInput.id),
    derivedBlueprint,
    signals,
    conflicts,
  }
}
