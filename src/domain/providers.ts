import type { Blueprint } from './blueprint'
import type { InterpretationConflict, InterpretationSignal } from './interpretation'
import type { SourceInput } from './source-input'
import type { SourceSet } from './source-set'
import type { TrackVersionKind } from './track-version'

export interface ProviderModelMetadata {
  provider: 'google-gemini' | 'google-lyria' | 'google-live' | 'spotify'
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
  versionId: string
  blueprint: Blueprint
  versionName: string
  notes?: string
}

export interface GeminiTrackSummaryResult extends ProviderModelMetadata {
  summary: string
  arrangementSummary: string
  lyricalThemeSummary?: string
  practiceNotes: string[]
}

export interface GeminiPracticeBriefRequest {
  projectId: string
  versionId: string
  projectTitle: string
  blueprint: Partial<Blueprint>
  focusArea: string
  selectedSection: string
  practiceMode: string
}

export interface GeminiPracticeBriefResult extends ProviderModelMetadata {
  title: string
  summary: string
  cues: string[]
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

export interface LiveSessionConfig extends ProviderModelMetadata {
  projectId: string
  versionId?: string | null
  focusArea: string
  selectedSection: string
  practiceMode: string
  practiceBrief?: GeminiPracticeBriefResult
}

export interface LiveFeedbackEvent extends ProviderModelMetadata {
  id: string
  timestamp: string
  text: string
  isPartial?: boolean
}

export interface LiveTurnSummary extends ProviderModelMetadata {
  id: string
  timestamp: string
  text: string
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
