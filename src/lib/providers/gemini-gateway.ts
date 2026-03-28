import type { Blueprint, LyricsSection, TrackStructureNode } from '@/domain/blueprint'
import type {
  GeminiBlueprintRefinementRequest,
  GeminiBlueprintRefinementResult,
  GeminiInterpretationRequest,
  GeminiInterpretationResult,
  LearnSectionGuide,
  GeminiTrackSummaryRequest,
  GeminiTrackSummaryResult,
} from '@/domain/providers'
import { callGeminiJson } from '@/services/google/gemini'
import { createInterpretationSnapshot } from '@/lib/studio-pipeline/interpretation'
import { hashJsonPayload } from './hash'
import type { SourceInput } from '@/domain/source-input'
import type { SourceSet } from '@/domain/source-set'

function toJsonPrompt(payload: unknown): string {
  return JSON.stringify(payload, null, 2)
}

function dataUrlToInlineData(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    return null
  }

  const [, mimeType, data] = match
  return { mimeType, data }
}

function toPromptSafeSourceInput(sourceInput: SourceInput) {
  const base = {
    id: sourceInput.id,
    type: sourceInput.type,
    label: sourceInput.label,
    description: sourceInput.description,
    role: sourceInput.role,
    provenance: sourceInput.provenance,
    isReference: sourceInput.isReference,
    interpretationStatus: sourceInput.interpretationStatus,
    normalized: sourceInput.normalized,
  }

  if ('text' in sourceInput) {
    return {
      ...base,
      text: sourceInput.text,
    }
  }

  if ('durationSeconds' in sourceInput || 'audioUrl' in sourceInput) {
    return {
      ...base,
      durationSeconds: sourceInput.durationSeconds,
      hasAudio: Boolean(sourceInput.audioUrl || sourceInput.rawAssetUrl),
    }
  }

  if ('fileName' in sourceInput || 'fileFormat' in sourceInput) {
    return {
      ...base,
      fileName: sourceInput.fileName,
      fileFormat: sourceInput.fileFormat,
    }
  }

  if ('artistName' in sourceInput || 'providerTrackName' in sourceInput) {
    return {
      ...base,
      artistName: sourceInput.artistName,
      providerTrackName: sourceInput.providerTrackName,
      spotifyUri: sourceInput.spotifyUri,
    }
  }

  if ('playlistName' in sourceInput) {
    return {
      ...base,
      playlistName: sourceInput.playlistName,
      spotifyUri: sourceInput.spotifyUri,
    }
  }

  if ('sourceProjectId' in sourceInput || 'sourceVersionId' in sourceInput) {
    return {
      ...base,
      sourceProjectId: sourceInput.sourceProjectId,
      sourceVersionId: sourceInput.sourceVersionId,
      inheritsEditableAudio: sourceInput.inheritsEditableAudio,
    }
  }

  return base
}

function buildWeightedSourceSummary(sourceSet: SourceSet, sourceInputs: SourceInput[]): string[] {
  const sourceById = new Map(sourceInputs.map((sourceInput) => [sourceInput.id, sourceInput]))

  return [...sourceSet.items]
    .sort((left, right) => left.order - right.order)
    .map((item) => {
      const sourceInput = sourceById.get(item.sourceInputId)
      if (!sourceInput) {
        return `${item.order + 1}. Missing source ${item.sourceInputId}`
      }

      return `${item.order + 1}. ${sourceInput.label} [${sourceInput.type}] enabled=${item.enabled} influence=${item.influence} weight=${item.weight} role=${sourceInput.role}`
    })
}

function buildInterpretationAudioParts(sourceInputs: SourceInput[]): Array<Record<string, unknown>> {
  return sourceInputs
    .filter(
      (sourceInput): sourceInput is SourceInput & { rawAssetUrl?: string; audioUrl?: string } =>
        ['hum', 'sung_melody', 'riff_audio', 'remix_source'].includes(sourceInput.type),
    )
    .slice(0, 2)
    .flatMap((sourceInput) => {
      const inlineData = dataUrlToInlineData(sourceInput.rawAssetUrl ?? sourceInput.audioUrl ?? '')
      if (!inlineData) {
        return []
      }

      return [
        {
          text: `Audio source: ${sourceInput.label}. Use this audio to infer pitch, rhythmic feel, energy, instrumentation lean, and musical direction.`,
        },
        {
          inlineData,
        },
      ]
    })
}

function buildFallbackLyricSections(
  request: GeminiTrackSummaryRequest,
): LyricsSection[] | undefined {
  if (request.lyrics?.length) {
    return request.lyrics
  }

  if (!request.blueprint.vocalsEnabled || !request.blueprint.lyricTheme) {
    return undefined
  }

  return [
    {
      id: `lyrics-${request.versionId}-chorus`,
      label: 'Chorus',
      lines: [request.blueprint.lyricTheme],
      deliveryNotes: request.blueprint.vocalStyle,
      theme: request.blueprint.lyricTheme,
    },
  ]
}

function buildFallbackChordSections(
  request: GeminiTrackSummaryRequest,
): TrackStructureNode[] | undefined {
  return request.structure ?? request.blueprint.structure
}

function buildFallbackSectionGuides(
  chordSections: TrackStructureNode[] | undefined,
  lyricSections: LyricsSection[] | undefined,
): LearnSectionGuide[] | undefined {
  if (!chordSections?.length) {
    return undefined
  }

  return chordSections.map((section) => {
    const matchingLyrics = lyricSections?.find(
      (candidate) => candidate.label.toLowerCase() === section.label.toLowerCase(),
    )

    return {
      id: `guide-${section.id}`,
      label: section.label,
      startTime: section.startTime,
      duration: section.duration,
      chords: section.chords,
      lyricCue: matchingLyrics?.lines.slice(0, 2),
      focus: `Learn the ${section.label.toLowerCase()} entrance, chord movement, and phrase timing.`,
      memoryCue: matchingLyrics?.lines[0],
    }
  })
}

function buildFallbackTrackSummaryResult(
  request: GeminiTrackSummaryRequest,
  requestHash: string,
): GeminiTrackSummaryResult {
  const chordSections = buildFallbackChordSections(request)
  const lyricSections = buildFallbackLyricSections(request)
  const sectionGuides = buildFallbackSectionGuides(chordSections, lyricSections)
  const learningNotes = [
    'Start by looping the chorus until the entry feels automatic.',
    'Count the bar transitions between sections before memorizing lyric details.',
    request.blueprint.vocalsEnabled
      ? 'Speak the lyric rhythm once before singing the full melody.'
      : 'Hum or tap the lead motif to internalize the phrasing before playing along.',
  ]

  return {
    provider: 'google-gemini',
    model: 'gemini',
    schemaVersion: 'spartan4.v1',
    requestHash,
    summary:
      request.notes ??
      `Learn ${request.versionName} by following the section map, lyric cues, and chord movement.`,
    arrangementSummary:
      chordSections?.map((section) => section.label).join(' → ') ??
      'Section structure not yet available.',
    lyricalThemeSummary: request.blueprint.lyricTheme,
    learningNotes,
    practiceNotes: learningNotes,
    lyricSections,
    chordSections,
    sectionGuides,
    practiceChecklist: [
      'Listen through once without stopping.',
      'Practice the verse-to-chorus transition.',
      'Play or sing along from memory with the chord map visible.',
    ],
  }
}

export async function interpretSourceSet(
  request: GeminiInterpretationRequest,
): Promise<GeminiInterpretationResult> {
  const requestHash = await hashJsonPayload(request)
  const promptSafeRequest = {
    ...request,
    sourceInputs: request.sourceInputs.map(toPromptSafeSourceInput),
    sourceWeightSummary: buildWeightedSourceSummary(request.sourceSet, request.sourceInputs),
  }
  const audioParts = buildInterpretationAudioParts(request.sourceInputs)

  try {
    const result = await callGeminiJson<{
      summary: string
      derivedBlueprint: Partial<Blueprint>
      signals: GeminiInterpretationResult['signals']
      conflicts: GeminiInterpretationResult['conflicts']
    }>({
      systemInstruction:
        'You are the structured music interpretation layer for Riff. Return JSON only. Infer musical structure from the provided source set. Honor source influence and weight when resolving conflicts. If audio is attached, use it directly rather than guessing from labels alone. Be concise, musical, and deterministic.',
      prompt: `Interpret this source set into a structured blueprint draft.\n${toJsonPrompt(
        promptSafeRequest,
      )}`,
      userParts: audioParts,
    })

    return {
      provider: 'google-gemini',
      model: 'gemini',
      schemaVersion: 'spartan4.v1',
      requestHash,
      summary: result.summary,
      derivedBlueprint: result.derivedBlueprint,
      signals: result.signals,
      conflicts: result.conflicts,
    }
  } catch {
    const fallback = createInterpretationSnapshot({
      project: {
        id: request.projectId,
        title: request.projectTitle,
        updatedAt: new Date().toISOString(),
        status: 'draft',
        versionCount: 0,
        sourceInputs: request.sourceInputs,
        sourceSets: [request.sourceSet],
        blueprints: [],
        interpretations: [],
        workingBlueprintDraft: undefined as never,
        versions: [],
        exportBundles: [],
        library: { sourceType: 'mixed', isFavorite: false, isExported: false },
      },
      sourceSet: request.sourceSet,
      sourceInputs: request.sourceInputs,
      activeBlueprint: request.activeBlueprint as Blueprint | undefined,
    })

    return {
      provider: 'google-gemini',
      model: 'gemini',
      schemaVersion: 'spartan4.v1',
      requestHash,
      summary: fallback.summary,
      derivedBlueprint: fallback.derivedBlueprint,
      signals: fallback.signals,
      conflicts: fallback.conflicts,
    }
  }
}

export async function refineBlueprint(
  request: GeminiBlueprintRefinementRequest,
): Promise<GeminiBlueprintRefinementResult> {
  const requestHash = await hashJsonPayload(request)
  const result = await callGeminiJson<{
    summary: string
    proposedBlueprintChanges: Partial<Blueprint>
    rationale: string[]
  }>({
    systemInstruction:
      'You are the blueprint copilot for Riff. Return JSON only. Suggest structured blueprint deltas without replacing the user as the final authority.',
    prompt: `Propose blueprint refinements for this request.\n${toJsonPrompt(request)}`,
  })

  return {
    provider: 'google-gemini',
    model: 'gemini',
    schemaVersion: 'spartan4.v1',
    requestHash,
    summary: result.summary,
    proposedBlueprintChanges: result.proposedBlueprintChanges,
    rationale: result.rationale,
  }
}

export async function summarizeTrackVersion(
  request: GeminiTrackSummaryRequest,
): Promise<GeminiTrackSummaryResult> {
  const requestHash = await hashJsonPayload(request)
  const audioInlineData = request.audioDataUrl
    ? dataUrlToInlineData(request.audioDataUrl)
    : null

  try {
    const result = await callGeminiJson<{
      summary: string
      arrangementSummary: string
      lyricalThemeSummary?: string
      learningNotes: string[]
      lyricSections?: LyricsSection[]
      chordSections?: TrackStructureNode[]
      sectionGuides?: LearnSectionGuide[]
      practiceChecklist?: string[]
    }>({
      systemInstruction:
        'You are the project explanation and learn-pack layer for Riff. Return JSON only. Given a generated song, create a learnable study guide with chord sections, lyric sections, section-by-section practice cues, and concise memory aids. If vocals are absent, do not invent lyrics. Preserve useful musical names when possible and make the result easy to practice.',
      prompt: `Build a learn pack for this generated track version.\n${toJsonPrompt({
        ...request,
        audioDataUrl: audioInlineData ? '[inline-audio-attached]' : undefined,
      })}`,
      userParts: audioInlineData
        ? [
            {
              text: 'Analyze this generated song audio and turn it into a practice-ready guide with lyrics when discernible and chord sections that align with the arrangement.',
            },
            { inlineData: audioInlineData },
          ]
        : undefined,
    })

    return {
      provider: 'google-gemini',
      model: 'gemini',
      schemaVersion: 'spartan4.v1',
      requestHash,
      ...result,
      practiceNotes: result.learningNotes,
    }
  } catch {
    return buildFallbackTrackSummaryResult(request, requestHash)
  }
}
