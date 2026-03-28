import type { PersistedProject, Project } from '@/domain/project'
import type { SourceInput, SourceSelectionType } from '@/domain/source-input'
import { createSourceSetFromInputs } from '@/lib/studio-pipeline/source-assembly'
import { createStudioId, nowIso } from '@/lib/studio-pipeline/ids'
import { normalizeProject } from '@/features/projects/lib/project-normalizers'
import { buildChordSectionSuggestion, inferKeyFromChordText } from '@/lib/music-analysis'
import type { MusicalMode } from '@/domain/blueprint'

export interface CreateSourceSelectionDraft {
  type: SourceSelectionType
  label?: string
  description?: string
  text?: string
  lyricSections?: {
    verse?: string
    chorus?: string
    bridge?: string
  }
  audioDataUrl?: string
  assetDataUrl?: string
  durationSeconds?: number
  fileName?: string
  fileFormat?: 'wav' | 'mp3' | 'webm' | 'ogg' | 'pdf' | 'midi' | 'musicxml' | 'txt'
  spotifyUri?: string
  artistName?: string
  providerTrackName?: string
  playlistName?: string
  spotifyReferenceType?: 'track' | 'playlist'
  sourceProjectId?: string
  sourceVersionId?: string
  detectedKey?: string
  detectedMode?: MusicalMode
  detectedBpm?: number
  detectedChordProgression?: string[]
  analysisSummary?: string
  keyChangeAfterBridge?: boolean
  postBridgeKey?: string
}

function buildStructuredLyricsText(selection: CreateSourceSelectionDraft): string {
  const sections = [
    selection.lyricSections?.verse
      ? `Verse:\n${selection.lyricSections.verse.trim()}`
      : undefined,
    selection.lyricSections?.chorus
      ? `Chorus:\n${selection.lyricSections.chorus.trim()}`
      : undefined,
    selection.lyricSections?.bridge
      ? `Bridge:\n${selection.lyricSections.bridge.trim()}`
      : undefined,
    selection.text?.trim()
      ? `Notes:\n${selection.text.trim()}`
      : undefined,
  ].filter((value): value is string => Boolean(value))

  return sections.join('\n\n')
}

function titleFromSelection(selectedSources: CreateSourceSelectionDraft[]): string {
  const primary = selectedSources[0]?.type ?? 'track'

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

function buildSourceInput(
  projectId: string,
  selection: CreateSourceSelectionDraft,
  order: number,
): SourceInput {
  const createdAt = nowIso()
  const type = selection.type

  switch (type) {
    case 'hum':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'hum',
        label: selection.label ?? 'Hum Recording',
        description: selection.description ?? 'Lead with a hummed melodic idea.',
        iconName: 'Mic',
        createdAt,
        role: 'melodic',
        provenance: selection.audioDataUrl ? 'recorded' : 'recorded',
        isReference: false,
        interpretationStatus: 'pending',
        durationSeconds: selection.durationSeconds ?? 12 + order * 2,
        audioUrl: selection.audioDataUrl,
        rawAssetUrl: selection.audioDataUrl,
        normalized: selection.audioDataUrl
          ? {
              durationSeconds: selection.durationSeconds,
              fileName: selection.fileName,
              fileFormat: selection.fileFormat,
              detectedKey: selection.detectedKey,
              detectedMode: selection.detectedMode,
              detectedBpm: selection.detectedBpm,
              detectedChordProgression: selection.detectedChordProgression,
            }
          : undefined,
      }
    case 'riff':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'riff_audio',
        label: selection.label ?? 'Riff Upload',
        description: selection.description ?? 'Uploaded loop or instrumental riff.',
        iconName: 'Music',
        createdAt,
        role: 'melodic',
        provenance: selection.audioDataUrl ? 'uploaded' : 'uploaded',
        isReference: false,
        interpretationStatus: 'pending',
        durationSeconds: selection.durationSeconds ?? 18 + order * 3,
        audioUrl: selection.audioDataUrl,
        rawAssetUrl: selection.audioDataUrl,
        normalized: selection.audioDataUrl
          ? {
              durationSeconds: selection.durationSeconds,
              fileName: selection.fileName,
              fileFormat: selection.fileFormat,
              detectedKey: selection.detectedKey,
              detectedMode: selection.detectedMode,
              detectedBpm: selection.detectedBpm,
              detectedChordProgression: selection.detectedChordProgression,
            }
          : undefined,
      }
    case 'lyrics': {
      const structuredLyrics = buildStructuredLyricsText(selection)
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
        text:
          structuredLyrics ||
          'Verse:\nMidnight hallway, city glow\nHold the note and let it go\n\nChorus:\nStay with me through neon light\nCarry the sound into the night',
        normalized: {
          textLength: structuredLyrics.length || selection.text?.length,
        },
      }
    }
    case 'chords': {
      const chordInference = inferKeyFromChordText(selection.text ?? '')
      const chordSections = buildChordSectionSuggestion(selection.text ?? '', {
        keyChangeAfterBridge: selection.keyChangeAfterBridge,
      })
      return {
        id: createStudioId('src'),
        projectId,
        type: 'chord_progression',
        label: 'Chord Progression',
        description: selection.description ?? 'Harmonic spine for the arrangement.',
        iconName: 'Type',
        createdAt,
        role: 'harmonic',
        provenance: 'typed',
        isReference: false,
        interpretationStatus: 'attached',
        text: selection.text ?? 'Fm - Db - Ab - Eb',
        normalized: {
          textLength: selection.text?.length,
          detectedKey: selection.detectedKey ?? chordInference?.key,
          detectedMode: selection.detectedMode ?? chordInference?.mode,
          keyChangeAfterBridge: selection.keyChangeAfterBridge,
          postBridgeKey: chordSections?.postBridgeKey ?? selection.postBridgeKey,
        },
      }
    }
    case 'sheet':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'sheet_music',
        label: selection.label ?? 'Sheet Music Upload',
        description: selection.description ?? 'Notation or lead sheet reference.',
        iconName: 'FileMusic',
        createdAt,
        role: 'structural',
        provenance: 'uploaded',
        isReference: false,
        interpretationStatus: 'pending',
        rawAssetUrl: selection.assetDataUrl,
        fileName: selection.fileName ?? 'lead-sheet.pdf',
        fileFormat: selection.fileFormat === 'midi' || selection.fileFormat === 'musicxml' || selection.fileFormat === 'pdf'
          ? selection.fileFormat
          : 'pdf',
        normalized: {
          fileName: selection.fileName ?? 'lead-sheet.pdf',
          fileFormat:
            selection.fileFormat === 'midi' || selection.fileFormat === 'musicxml' || selection.fileFormat === 'pdf'
              ? selection.fileFormat
              : 'pdf',
          detectedKey: selection.detectedKey,
          detectedMode: selection.detectedMode,
          detectedBpm: selection.detectedBpm,
        },
      }
    case 'spotify':
      return selection.spotifyReferenceType === 'playlist'
        ? {
            id: createStudioId('src'),
            projectId,
            type: 'spotify_playlist_reference',
            label: selection.label ?? selection.playlistName ?? 'Spotify Playlist',
            description: selection.description ?? 'Playlist-based mood and taste reference.',
            iconName: 'Compass',
            createdAt,
            role: 'reference',
            provenance: 'spotify',
            isReference: true,
            interpretationStatus: 'attached',
            spotifyUri: selection.spotifyUri ?? `spotify:playlist:${createStudioId('ref')}`,
            playlistName: selection.playlistName ?? 'Reference Playlist',
            normalized: {
              providerName: 'Spotify',
              providerTitle: selection.playlistName ?? 'Reference Playlist',
            },
          }
        : {
            id: createStudioId('src'),
            projectId,
            type: 'spotify_track_reference',
            label: selection.label ?? selection.providerTrackName ?? 'Spotify Reference',
            description: selection.description ?? 'Taste and vibe reference from Spotify.',
            iconName: 'Compass',
            createdAt,
            role: 'reference',
            provenance: 'spotify',
            isReference: true,
            interpretationStatus: 'attached',
            spotifyUri: selection.spotifyUri ?? `spotify:track:${createStudioId('ref')}`,
            artistName: selection.artistName ?? 'Reference Artist',
            providerTrackName: selection.providerTrackName ?? 'Reference Mood',
            normalized: {
              providerName: 'Spotify',
              providerTitle: selection.providerTrackName ?? 'Reference Mood',
              providerArtist: selection.artistName ?? 'Reference Artist',
            },
          }
    case 'remix':
      return {
        id: createStudioId('src'),
        projectId,
        type: 'remix_source',
        label: selection.label ?? 'Remix Source',
        description: selection.description ?? 'Rework an existing project into a new version.',
        iconName: 'Share',
        createdAt,
        role: 'remix',
        provenance: 'project',
        isReference: false,
        interpretationStatus: 'attached',
        durationSeconds: selection.durationSeconds,
        audioUrl: selection.audioDataUrl,
        rawAssetUrl: selection.audioDataUrl,
        sourceProjectId: selection.sourceProjectId,
        sourceVersionId: selection.sourceVersionId,
        inheritsEditableAudio: true,
        normalized: selection.audioDataUrl
          ? {
              durationSeconds: selection.durationSeconds,
              fileName: selection.fileName,
              fileFormat: selection.fileFormat,
            }
          : undefined,
      }
  }
}

export function createProjectFromSelection(
  selectedSources: CreateSourceSelectionDraft[],
): PersistedProject {
  const projectId = createStudioId('proj')
  const sourceInputs = selectedSources.map((selection, order) =>
    buildSourceInput(projectId, selection, order),
  )
  const sourceSet = createSourceSetFromInputs(projectId, sourceInputs)
  const createdAt = nowIso()

  const project: Project = {
    id: projectId,
    title: titleFromSelection(selectedSources),
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
