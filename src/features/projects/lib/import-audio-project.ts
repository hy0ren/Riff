import type { Project } from '@/domain/project'
import type { TrackVersion } from '@/domain/track-version'
import type { SourceInput } from '@/domain/source-input'
import type { Blueprint } from '@/domain/blueprint'
import { createStudioId, nowIso } from '@/lib/studio-pipeline/ids'
import { createSourceSetFromInputs } from '@/lib/studio-pipeline/source-assembly'
import { normalizeProject } from './project-normalizers'
import { fileToDataUrl, inferAudioFileFormat, measureAudioDuration } from '@/features/create/lib/audio-assets'
import { analyzeAudioSource } from '@/lib/providers/gemini-gateway'

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '')
}

function getDefaultStructure(duration: number) {
  const intro = Math.max(8, Math.round(duration * 0.08))
  const verse = Math.max(20, Math.round(duration * 0.22))
  const chorus = Math.max(20, Math.round(duration * 0.18))
  const bridge = Math.max(16, Math.round(duration * 0.14))
  const outro = Math.max(8, Math.max(0, duration - intro - verse * 2 - chorus * 2 - bridge))

  return [
    { id: 'imp-intro', label: 'Intro', startTime: 0, duration: intro, chords: ['i', 'VI'] },
    { id: 'imp-verse-1', label: 'Verse 1', startTime: intro, duration: verse, chords: ['i', 'iv', 'VI', 'VII'] },
    { id: 'imp-chorus-1', label: 'Chorus', startTime: intro + verse, duration: chorus, chords: ['i', 'VI', 'III', 'VII'] },
    { id: 'imp-verse-2', label: 'Verse 2', startTime: intro + verse + chorus, duration: verse, chords: ['i', 'iv', 'VI', 'VII'] },
    { id: 'imp-bridge', label: 'Bridge', startTime: intro + verse * 2 + chorus, duration: bridge, chords: ['VI', 'VII', 'i', 'v'] },
    { id: 'imp-chorus-2', label: 'Final Chorus', startTime: intro + verse * 2 + chorus + bridge, duration: chorus, chords: ['i', 'VI', 'III', 'VII'] },
    { id: 'imp-outro', label: 'Outro', startTime: intro + verse * 2 + chorus * 2 + bridge, duration: outro, chords: ['i'] },
  ]
}

export async function createImportedAudioProject(file: File) {
  const projectId = createStudioId('proj')
  const createdAt = nowIso()
  const audioDataUrl = await fileToDataUrl(file)
  const durationSeconds = await measureAudioDuration(audioDataUrl)
  const fileFormat = inferAudioFileFormat(file.name, file.type)
  const analysis = await analyzeAudioSource({
    sourceType: 'riff',
    label: file.name,
    notes: 'Imported song from local library.',
    audioDataUrl,
    durationSeconds,
  }).catch(() => undefined)

  const sourceInput: SourceInput = {
    id: createStudioId('src'),
    projectId,
    type: 'riff_audio',
    label: stripExtension(file.name),
    description: 'Imported audio from local library.',
    iconName: 'Music',
    createdAt,
    role: 'melodic',
    provenance: 'uploaded',
    isReference: false,
    interpretationStatus: 'attached',
    durationSeconds,
    audioUrl: audioDataUrl,
    rawAssetUrl: audioDataUrl,
    normalized: {
      durationSeconds,
      fileName: file.name,
      fileFormat,
      detectedBpm: analysis?.bpm,
      detectedKey: analysis?.key,
      detectedMode: analysis?.mode,
      detectedChordProgression: analysis?.likelyChords,
    },
  }

  const sourceSet = createSourceSetFromInputs(projectId, [sourceInput])

  const blueprint: Blueprint = {
    id: createStudioId('bp'),
    projectId,
    revision: 1,
    createdAt,
    updatedAt: createdAt,
    sourceInputIds: [sourceInput.id],
    bpm: analysis?.bpm ?? 120,
    key: analysis?.key ?? 'C',
    mode: analysis?.mode ?? 'Minor',
    timeSignature: '4/4',
    targetDuration: `${Math.floor(durationSeconds / 60)}:${String(Math.round(durationSeconds % 60)).padStart(2, '0')}`,
    genre: 'Imported',
    subgenre: 'Local File',
    mood: 'Captured',
    energy: 'Medium',
    texture: analysis?.summary ?? 'Imported audio reference',
    vocalsEnabled: false,
    vocalStyle: undefined,
    lyricTheme: undefined,
    instruments: {
      drums: true,
      bass: true,
      guitar: true,
      synths: false,
      strings: false,
      pads: false,
    },
    structure: getDefaultStructure(Math.max(90, Math.round(durationSeconds || 210))),
    melodyDirection: 'Preserve imported phrasing.',
    generationNotes: ['Imported from local file.'],
    refinementDirectives: analysis?.likelyChords?.length
      ? [`Honor the detected harmonic motion: ${analysis.likelyChords.join(' - ')}.`]
      : [],
  }

  const version: TrackVersion = {
    id: createStudioId('ver'),
    projectId,
    name: 'Imported Mix',
    timestamp: createdAt,
    duration: Math.round(durationSeconds || 0),
    isActive: true,
    tags: ['imported'],
    kind: 'base',
    sourceBlueprintId: blueprint.id,
    sourceSetId: sourceSet.id,
    audioUrl: audioDataUrl,
    structure: blueprint.structure,
    notes: analysis?.summary,
    exports: [
      { type: 'audio', status: 'ready', size: file.size ? `${Math.max(1, Math.round(file.size / 1024 / 1024))} MB` : '--', lastGenerated: createdAt },
      { type: 'lyrics', status: 'unavailable', size: '--', lastGenerated: createdAt },
    ],
  }

  const project: Project = {
    id: projectId,
    title: stripExtension(file.name),
    createdAt,
    updatedAt: createdAt,
    status: 'finished',
    versionCount: 1,
    description: 'Imported from your local computer.',
    sourceInputs: [sourceInput],
    sourceSets: [sourceSet],
    activeSourceSetId: sourceSet.id,
    blueprints: [blueprint],
    activeBlueprintId: blueprint.id,
    versions: [version],
    activeVersionId: version.id,
    sourceType: 'riff',
    isFavorite: false,
    isExported: false,
    learnReady: false,
  }

  return normalizeProject(project)
}
