import type { PersistedProject, Project } from '@/domain/project'
import type { SourceInput, SourceSelectionType } from '@/domain/source-input'
import { createSourceSetFromInputs } from '@/lib/studio-pipeline/source-assembly'
import { createStudioId, nowIso } from '@/lib/studio-pipeline/ids'
import { normalizeProject } from '@/features/projects/lib/project-normalizers'

function titleFromSelection(selectedTypes: SourceSelectionType[]): string {
  const primary = selectedTypes[0] ?? 'track'

  switch (primary) {
    case 'hum':
      return 'Untitled Hum Sketch'
    case 'riff':
      return 'Untitled Riff Draft'
    case 'lyrics':
      return 'Untitled Lyric Draft'
    case 'chords':
      return 'Untitled Chord Study'
    case 'sheet':
      return 'Untitled Sheet Session'
    case 'spotify':
      return 'Untitled Reference Build'
    case 'remix':
      return 'Untitled Remix Pass'
    default:
      return 'Untitled Project'
  }
}

function buildSourceInput(projectId: string, type: SourceSelectionType, order: number): SourceInput {
  const createdAt = nowIso()

  switch (type) {
    case 'hum':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'hum',
        label: 'Hum Recording',
        description: 'Lead with a hummed melodic idea.',
        iconName: 'Mic',
        createdAt,
        role: 'melodic',
        provenance: 'recorded',
        isReference: false,
        interpretationStatus: 'pending',
        durationSeconds: 12 + order * 2,
      }
    case 'riff':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'riff_audio',
        label: 'Riff Upload',
        description: 'Uploaded loop or instrumental riff.',
        iconName: 'Music',
        createdAt,
        role: 'melodic',
        provenance: 'uploaded',
        isReference: false,
        interpretationStatus: 'pending',
        durationSeconds: 18 + order * 3,
      }
    case 'lyrics':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'lyrics',
        label: 'Lyric Draft',
        description: 'Words and lyrical direction for the song.',
        iconName: 'FileText',
        createdAt,
        role: 'lyrical',
        provenance: 'typed',
        isReference: false,
        interpretationStatus: 'attached',
        text: 'Midnight hallway / city glow / hold the note and let it go',
      }
    case 'chords':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'chord_progression',
        label: 'Chord Progression',
        description: 'Harmonic spine for the arrangement.',
        iconName: 'Type',
        createdAt,
        role: 'harmonic',
        provenance: 'typed',
        isReference: false,
        interpretationStatus: 'attached',
        text: 'Fm - Db - Ab - Eb',
      }
    case 'sheet':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'sheet_music',
        label: 'Sheet Music Upload',
        description: 'Notation or lead sheet reference.',
        iconName: 'FileMusic',
        createdAt,
        role: 'structural',
        provenance: 'uploaded',
        isReference: false,
        interpretationStatus: 'pending',
        fileName: 'lead-sheet.pdf',
        fileFormat: 'pdf',
      }
    case 'spotify':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'spotify_track_reference',
        label: 'Spotify Reference',
        description: 'Taste and vibe reference from Spotify.',
        iconName: 'Compass',
        createdAt,
        role: 'reference',
        provenance: 'spotify',
        isReference: true,
        interpretationStatus: 'attached',
        spotifyUri: `spotify:track:${createStudioId('ref')}`,
        artistName: 'Reference Artist',
        providerTrackName: 'Reference Mood',
      }
    case 'remix':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'remix_source',
        label: 'Remix Source',
        description: 'Rework an existing project into a new version.',
        iconName: 'Share',
        createdAt,
        role: 'remix',
        provenance: 'project',
        isReference: false,
        interpretationStatus: 'attached',
        inheritsEditableAudio: true,
      }
  }
}

export function createProjectFromSelection(selectedTypes: SourceSelectionType[]): PersistedProject {
  const projectId = createStudioId('proj')
  const sourceInputs = selectedTypes.map((type, order) => buildSourceInput(projectId, type, order))
  const sourceSet = createSourceSetFromInputs(projectId, sourceInputs)
  const createdAt = nowIso()

  const project: Project = {
    id: projectId,
    title: titleFromSelection(selectedTypes),
    createdAt,
    updatedAt: createdAt,
    status: 'draft',
    versionCount: 0,
    description: 'New project created from the multi-input intake canvas.',
    sourceInputs,
    sourceSets: [sourceSet],
    activeSourceSetId: sourceSet.id,
    sourceType: sourceInputs.length > 1 ? 'mixed' : undefined,
    isFavorite: false,
    isExported: false,
    learnReady: false,
  }

  return normalizeProject(project)
}
