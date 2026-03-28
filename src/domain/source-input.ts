export type SourceSelectionType =
  | 'hum'
  | 'riff'
  | 'lyrics'
  | 'chords'
  | 'sheet'
  | 'spotify'
  | 'remix'

export type SourceInputKind =
  | 'hum'
  | 'sung_melody'
  | 'riff_audio'
  | 'typed_notes'
  | 'chord_progression'
  | 'sheet_music'
  | 'lyrics'
  | 'remix_source'
  | 'spotify_track_reference'
  | 'spotify_playlist_reference'

export type SourceInputRole =
  | 'melodic'
  | 'harmonic'
  | 'lyrical'
  | 'structural'
  | 'reference'
  | 'remix'

export type SourceInputProvenance = 'recorded' | 'uploaded' | 'typed' | 'spotify' | 'project'

export interface SourceInputNormalizedMetadata {
  durationSeconds?: number
  fileName?: string
  fileFormat?: 'wav' | 'mp3' | 'pdf' | 'midi' | 'musicxml' | 'txt'
  textLength?: number
  providerName?: string
  providerTitle?: string
  providerArtist?: string
}

interface SourceInputBase {
  id: string
  projectId?: string
  type: SourceInputKind
  label: string
  description: string
  iconName: string
  createdAt: string
  role: SourceInputRole
  provenance: SourceInputProvenance
  isReference: boolean
  interpretationStatus?: 'pending' | 'interpreted' | 'attached'
  rawAssetUrl?: string
  normalized?: SourceInputNormalizedMetadata
  interpretationIds?: string[]
}

export interface AudioSourceInput extends SourceInputBase {
  type: 'hum' | 'sung_melody' | 'riff_audio'
  durationSeconds?: number
  audioUrl?: string
}

export interface TextSourceInput extends SourceInputBase {
  type: 'typed_notes' | 'chord_progression' | 'lyrics'
  text: string
}

export interface SheetSourceInput extends SourceInputBase {
  type: 'sheet_music'
  fileName?: string
  fileFormat?: 'pdf' | 'midi' | 'musicxml'
}

export interface RemixSourceInput extends SourceInputBase {
  type: 'remix_source'
  durationSeconds?: number
  audioUrl?: string
  sourceProjectId?: string
  sourceVersionId?: string
  inheritsEditableAudio?: boolean
}

export interface SpotifyTrackReferenceInput extends SourceInputBase {
  type: 'spotify_track_reference'
  spotifyUri: string
  artistName?: string
  providerTrackName?: string
}

export interface SpotifyPlaylistReferenceInput extends SourceInputBase {
  type: 'spotify_playlist_reference'
  spotifyUri: string
  playlistName: string
}

export type SourceInput =
  | AudioSourceInput
  | TextSourceInput
  | SheetSourceInput
  | RemixSourceInput
  | SpotifyTrackReferenceInput
  | SpotifyPlaylistReferenceInput

export interface SelectionCanvas {
  selectedTypes: SourceSelectionType[]
  projectName?: string
}

export const selectionTypeToSourceKinds: Record<SourceSelectionType, SourceInputKind[]> = {
  hum: ['hum', 'sung_melody'],
  riff: ['riff_audio'],
  lyrics: ['lyrics', 'typed_notes'],
  chords: ['chord_progression'],
  sheet: ['sheet_music'],
  spotify: ['spotify_track_reference', 'spotify_playlist_reference'],
  remix: ['remix_source'],
}
