import type { Blueprint, LyricsSection, TrackStructureNode } from './blueprint'
import type { InterpretationConflict, InterpretationSignal } from './interpretation'
import type { SourceInput } from './source-input'
import type { SourceSet } from './source-set'
import type { TrackVersionKind } from './track-version'

export interface ProviderModelMetadata {
  provider: 'google-gemini' | 'google-lyria' | 'spotify'
  model?: string
  schemaVersion?: string
  requestHash?: string
}

export interface GeminiInterpretationRequest {
  projectId: string
  projectTitle: string
  sourceSet: SourceSet
  sourceInputs: SourceInput[]
  activeBlueprint?: Partial<Blueprint>
}

export interface GeminiInterpretationResult extends ProviderModelMetadata {
  summary: string
  signals: InterpretationSignal[]
  conflicts: InterpretationConflict[]
  derivedBlueprint: Partial<Blueprint>
}

export interface GeminiBlueprintRefinementRequest {
  projectId: string
  blueprint: Blueprint
  refinementPrompt: string
}

export interface GeminiBlueprintRefinementResult extends ProviderModelMetadata {
  summary: string
  proposedBlueprintChanges: Partial<Blueprint>
  rationale: string[]
}

export interface GeminiTrackSummaryRequest {
  projectId: string
  projectTitle?: string
  versionId: string
  blueprint: Blueprint
  versionName: string
  notes?: string
  audioDataUrl?: string
  structure?: TrackStructureNode[]
  lyrics?: LyricsSection[]
}

export interface LearnSectionGuide {
  id: string
  label: string
  startTime: number
  duration: number
  chords: string[]
  lyricCue?: string[]
  focus: string
  memoryCue?: string
}

export interface GeminiTrackSummaryResult extends ProviderModelMetadata {
  summary: string
  arrangementSummary: string
  lyricalThemeSummary?: string
  learningNotes: string[]
  practiceNotes?: string[] // legacy persisted field
  lyricSections?: LyricsSection[]
  chordSections?: TrackStructureNode[]
  sectionGuides?: LearnSectionGuide[]
  practiceChecklist?: string[]
}

export interface LyriaGenerationRequest {
  projectId: string
  blueprint: Blueprint
  sourceSet: SourceSet
  sourceSummary: string
  kind: TrackVersionKind
  refinementPrompt?: string
  parentVersionId?: string
}

export interface LyriaGenerationResult extends ProviderModelMetadata {
  providerRunId: string
  summary: string
  durationSeconds: number
  artifactMimeType?: string
  artifactBase64?: string
}

export interface SpotifyAuthState {
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  codeVerifier?: string
  state?: string
}

export interface SpotifyProfile {
  id: string
  displayName: string
  email?: string
  imageUrl?: string
  followers?: number
}

export interface SpotifyReferenceImport {
  id: string
  uri: string
  title: string
  artistName: string
  imageUrl?: string
}

export interface SpotifyPlaylistImport {
  id: string
  uri: string
  name: string
  description?: string
  imageUrl?: string
  trackCount: number
}
