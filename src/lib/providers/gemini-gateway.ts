import type { Blueprint, LyricsSection, TrackStructureNode } from '@/domain/blueprint'
import type {
  GeminiAudioAnalysisRequest,
  GeminiAudioAnalysisResult,
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

function buildFallbackAudioAnalysisResult(
  request: GeminiAudioAnalysisRequest,
  requestHash: string,
): GeminiAudioAnalysisResult {
  return {
    provider: 'google-gemini',
    model: 'gemini',
    schemaVersion: 'spartan4.v1',
    requestHash,
    summary:
      request.sourceType === 'hum'
        ? 'Audio attached. Gemini fallback will preserve melodic contour and estimate defaults later in Studio.'
        : 'Audio attached. Gemini fallback will preserve the riff feel and estimate defaults later in Studio.',
  }
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

function buildInterpretationDocumentParts(sourceInputs: SourceInput[]): Array<Record<string, unknown>> {
  return sourceInputs
    .filter((sourceInput): sourceInput is SourceInput & { rawAssetUrl?: string } => sourceInput.type === 'sheet_music')
    .slice(0, 1)
    .flatMap((sourceInput) => {
      const inlineData = dataUrlToInlineData(sourceInput.rawAssetUrl ?? '')
      if (!inlineData) {
        return []
      }

      return [
        {
          text: `Sheet music source: ${sourceInput.label}. Inspect the notation directly when possible to infer key, BPM, harmonic movement, and section structure.`,
        },
        {
          inlineData,
        },
      ]
    })
}

function parseLyricThemeIntoSections(versionId: string, lyricTheme: string, vocalStyle?: string): LyricsSection[] {
  const sectionRegex = /^(Verse|Chorus|Bridge|Pre-Chorus|Outro|Intro|Hook)\s*\d?\s*:/im
  const blocks = lyricTheme.split(/\n\n+/)
  const sections: LyricsSection[] = []
  let fallbackIndex = 0

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    const headerMatch = trimmed.match(sectionRegex)
    let label: string
    let body: string

    if (headerMatch) {
      label = headerMatch[0].replace(/:$/, '').trim()
      body = trimmed.slice(headerMatch[0].length).trim()
    } else {
      fallbackIndex++
      label = fallbackIndex === 1 ? 'Verse' : `Section ${fallbackIndex}`
      body = trimmed
    }

    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length) {
      sections.push({
        id: `lyrics-${versionId}-${label.toLowerCase().replace(/\s+/g, '-')}-${sections.length}`,
        label,
        lines,
        deliveryNotes: vocalStyle,
      })
    }
  }

  return sections
}

function buildFallbackLyricSections(
  request: GeminiTrackSummaryRequest,
): LyricsSection[] | undefined {
  if (request.lyrics?.length) {
    return request.lyrics
  }

  if (!request.blueprint.vocalsEnabled) {
    return undefined
  }

  if (request.blueprint.lyricTheme && request.blueprint.lyricTheme.includes('\n')) {
    const parsed = parseLyricThemeIntoSections(
      request.versionId,
      request.blueprint.lyricTheme,
      request.blueprint.vocalStyle,
    )
    if (parsed.length) return parsed
  }

  if (request.blueprint.lyricTheme) {
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

  return undefined
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

  return chordSections.map((section, index) => {
    const matchingLyrics = lyricSections?.find(
      (candidate) => candidate.label.toLowerCase() === section.label.toLowerCase(),
    )
    const chordDesc =
      section.chords.length > 1
        ? `${section.chords[0]} → ${section.chords[section.chords.length - 1]} progression`
        : `${section.chords[0] ?? 'root chord'} foundation`

    const focusTemplates = [
      `Nail the ${section.label.toLowerCase()} entrance and lock the ${chordDesc}.`,
      `Focus on phrase timing through the ${section.label.toLowerCase()} — feel the ${chordDesc}.`,
      `Get the ${section.label.toLowerCase()} groove solid, especially the ${chordDesc}.`,
      `Internalize the rhythm of the ${section.label.toLowerCase()} and the ${chordDesc}.`,
    ]
    const memoryCueTemplates = [
      `Count yourself into the ${section.label.toLowerCase()} at the ${section.chords[0] ?? 'downbeat'}.`,
      `Feel the energy shift as the ${section.label.toLowerCase()} drops in.`,
      `Anchor on the ${section.chords[0] ?? 'root'} voicing to find your place in the ${section.label.toLowerCase()}.`,
      `Picture the transition into ${section.label.toLowerCase()} — the ${chordDesc} is your landmark.`,
    ]

    return {
      id: `guide-${section.id}`,
      label: section.label,
      startTime: section.startTime,
      duration: section.duration,
      chords: section.chords,
      lyricCue: matchingLyrics?.lines.slice(0, 2),
      focus: focusTemplates[index % focusTemplates.length],
      memoryCue: matchingLyrics?.lines[0] ?? memoryCueTemplates[index % memoryCueTemplates.length],
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
  const documentParts = buildInterpretationDocumentParts(request.sourceInputs)

  try {
    const result = await callGeminiJson<{
      summary: string
      derivedBlueprint: Partial<Blueprint>
      signals: GeminiInterpretationResult['signals']
      conflicts: GeminiInterpretationResult['conflicts']
    }>({
      systemInstruction:
        'You are the structured music interpretation layer for Riff. Return JSON only. Infer musical structure from the provided source set. Honor source influence and weight when resolving conflicts. If audio is attached, use it directly rather than guessing from labels alone. If sheet music is attached, inspect the notation to infer key, BPM, chord movement, and section structure. If a chord progression is provided, infer the likely key and organize it into verse, chorus, bridge, and final chorus sections. Honor any requested key change after the bridge. Be concise, musical, and deterministic.',
      prompt: `Interpret this source set into a structured blueprint draft.\n${toJsonPrompt(
        promptSafeRequest,
      )}`,
      userParts: [...audioParts, ...documentParts],
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

export async function analyzeAudioSource(
  request: GeminiAudioAnalysisRequest,
): Promise<GeminiAudioAnalysisResult> {
  const requestHash = await hashJsonPayload({
    ...request,
    audioDataUrl: '[inline-audio-attached]',
  })
  const audioInlineData = dataUrlToInlineData(request.audioDataUrl)

  if (!audioInlineData) {
    return buildFallbackAudioAnalysisResult(request, requestHash)
  }

  try {
    const result = await callGeminiJson<{
      summary: string
      bpm?: number
      key?: string
      mode?: 'Major' | 'Minor'
      likelyChords?: string[]
    }>({
      systemInstruction:
        'You are the audio intake analysis layer for Riff. Return JSON only. Listen to the attached musical idea and estimate the likely BPM, tonal center key, major/minor mode, and a concise repeating chord progression if one is inferable. Be conservative and musical. If the harmony is unclear, return an empty likelyChords array instead of inventing details.',
      prompt: `Analyze this ${request.sourceType === 'hum' ? 'hummed melody' : 'riff or uploaded sample'} and estimate default musical values for project setup.\n${toJsonPrompt({
        ...request,
        audioDataUrl: '[inline-audio-attached]',
      })}`,
      userParts: [
        {
          text:
            request.sourceType === 'hum'
              ? 'Listen for pitch center, tempo, and any implied chord movement in the hummed phrase.'
              : 'Listen for tempo, tonal center, and the most likely chord loop implied by this riff or sample.',
        },
        { inlineData: audioInlineData },
      ],
    })

    return {
      provider: 'google-gemini',
      model: 'gemini',
      schemaVersion: 'spartan4.v1',
      requestHash,
      ...result,
    }
  } catch {
    return buildFallbackAudioAnalysisResult(request, requestHash)
  }
}

function buildLearnPackSystemInstruction(hasAudio: boolean, hasVocals: boolean): string {
  const base = [
    'You are the audio analysis and learn-pack layer for Riff. Return JSON only.',
    'Your job is to deeply analyze a generated song and produce a comprehensive, accurate study guide.',
  ]

  if (hasAudio) {
    base.push(
      'CRITICAL: Audio is attached. You MUST listen to the full audio carefully before responding.',
      'Base ALL timing, chord, section, and lyric data on what you actually hear in the audio — do NOT guess from the blueprint alone.',
    )
  }

  if (hasVocals) {
    base.push(
      'LYRICS: Transcribe EVERY sung lyric word-for-word from the audio. Include every verse, chorus, pre-chorus, bridge, and outro vocal.',
      'Organize lyrics into lyricSections with one entry per song section. Each section.lines array must contain every line sung in that section — not a summary or cue, but the complete text.',
      'If a word is unclear, write your best phonetic guess in [brackets]. Never omit lines.',
    )
  } else {
    base.push(
      'This is an instrumental track. Do NOT invent lyrics. Leave lyricSections empty or omit it.',
    )
  }

  base.push(
    'CHORDS: Identify the chord progression for each section from the audio. Use standard chord names (e.g. Cm, F, Ab, Eb). Each chordSection must have accurate startTime (seconds), duration (seconds), and chords array.',
    'STRUCTURE: Detect every distinct section (intro, verse, pre-chorus, chorus, bridge, outro, etc.). Provide accurate startTime and duration for each by listening to the audio transitions.',
    'SECTION GUIDES: For each section, provide a unique "focus" tip and "memoryCue" tailored to that specific section. Never duplicate text between sections.',
    'TIMING: All startTime and duration values must be in seconds. Sections must be continuous — each section starts where the previous one ends. The last section must end at or near the total track duration.',
    'Return the result as a single JSON object matching the requested schema.',
  )

  return base.join('\n')
}

function buildLearnPackPrompt(request: GeminiTrackSummaryRequest, hasAudio: boolean): string {
  const lines: string[] = [
    'Analyze this generated song and build a complete learn pack.',
    '',
    `Project: ${request.projectTitle ?? request.projectId}`,
    `Version: ${request.versionName}`,
    `Key: ${request.blueprint.key} ${request.blueprint.mode}`,
    `Tempo: ${request.blueprint.bpm} BPM`,
    `Genre: ${request.blueprint.genre}`,
    `Vocals: ${request.blueprint.vocalsEnabled ? 'Yes' : 'Instrumental'}`,
  ]

  if (request.blueprint.vocalsEnabled && request.blueprint.vocalStyle) {
    lines.push(`Vocal style: ${request.blueprint.vocalStyle}`)
  }
  if (request.blueprint.lyricTheme) {
    lines.push(`Lyric theme hint: ${request.blueprint.lyricTheme}`)
  }
  if (request.blueprint.targetDuration) {
    lines.push(`Target duration: ${request.blueprint.targetDuration}`)
  }
  if (request.notes) {
    lines.push(`Generation notes: ${request.notes}`)
  }

  if (request.structure?.length) {
    lines.push('', 'Blueprint structure (use as a starting hint, but trust what you HEAR in the audio):')
    for (const s of request.structure) {
      lines.push(`  ${s.label}: ${s.startTime}s, ${s.duration}s, chords=[${s.chords.join(', ')}]`)
    }
  }

  if (request.lyrics?.length) {
    lines.push('', 'Known lyrics from generation (verify against audio, correct if different):')
    for (const section of request.lyrics) {
      lines.push(`  [${section.label}]`)
      for (const line of section.lines) {
        lines.push(`    ${line}`)
      }
    }
  }

  if (hasAudio) {
    lines.push(
      '',
      'Audio is attached below. Listen to the FULL track and:',
      '1. Transcribe ALL lyrics word-for-word into lyricSections (every line, every section)',
      '2. Detect the actual chord progression per section into chordSections',
      '3. Identify section boundaries with accurate timestamps into chordSections',
      '4. Create sectionGuides with unique focus/memoryCue for each section',
      '5. Write learningNotes with 3-5 practical tips for learning this specific song',
    )
  }

  return lines.join('\n')
}

export async function summarizeTrackVersion(
  request: GeminiTrackSummaryRequest,
): Promise<GeminiTrackSummaryResult> {
  const requestHash = await hashJsonPayload(request)
  const audioInlineData = request.audioDataUrl
    ? dataUrlToInlineData(request.audioDataUrl)
    : null
  const hasVocals = request.blueprint.vocalsEnabled

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
      systemInstruction: buildLearnPackSystemInstruction(Boolean(audioInlineData), hasVocals),
      prompt: buildLearnPackPrompt(request, Boolean(audioInlineData)),
      userParts: audioInlineData
        ? [
            {
              text: hasVocals
                ? 'Listen to the full song. Transcribe every lyric line word-for-word. Detect all chord changes and section boundaries with accurate timestamps.'
                : 'Listen to the full instrumental. Detect all chord changes, melodic themes, and section boundaries with accurate timestamps.',
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
