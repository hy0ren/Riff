import type { LyriaGenerationRequest, LyriaGenerationResult } from '@/domain/providers'
import type { Blueprint } from '@/domain/blueprint'
import type { SourceInput } from '@/domain/source-input'
import type { SourceSet } from '@/domain/source-set'
import { callLyriaGeneration } from '@/services/google/lyria'
import { hashJsonPayload } from './hash'

function formatInstruments(blueprint: Blueprint): string {
  const entries = Object.entries(blueprint.instruments)
  const active = entries.filter(([, on]) => on).map(([name]) => name)
  const inactive = entries.filter(([, on]) => !on).map(([name]) => name)
  const parts: string[] = []
  if (active.length) parts.push(`Active: ${active.join(', ')}`)
  if (inactive.length) parts.push(`Excluded: ${inactive.join(', ')}`)
  return parts.join('. ') || 'Use default instrumentation.'
}

function formatStructure(blueprint: Blueprint): string | null {
  if (!blueprint.structure?.length) return null
  return blueprint.structure
    .map((s) => `  ${s.label} [${formatTimestamp(s.startTime)}–${formatTimestamp(s.startTime + s.duration)}]: ${s.chords.join(' → ')}`)
    .join('\n')
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSourceWeights(sourceSet: SourceSet, sourceInputs: SourceInput[]): string | null {
  if (!sourceInputs?.length) return null
  const byId = new Map(sourceInputs.map((si) => [si.id, si]))
  const lines = [...sourceSet.items]
    .filter((item) => item.enabled)
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const si = byId.get(item.sourceInputId)
      if (!si) return null
      return `  ${si.label} [${si.type}, ${si.role}] weight=${item.weight} influence=${item.influence}`
    })
    .filter(Boolean)
  return lines.length ? lines.join('\n') : null
}

function extractFullLyrics(sourceInputs?: SourceInput[]): string | null {
  if (!sourceInputs?.length) return null
  const lyricSources = sourceInputs.filter(
    (si): si is SourceInput & { text: string } =>
      si.type === 'lyrics' && 'text' in si && Boolean(si.text),
  )
  if (!lyricSources.length) return null
  return lyricSources.map((si) => si.text).join('\n\n')
}

function buildPrompt(request: LyriaGenerationRequest): string {
  const bp = request.blueprint
  const sections: string[] = []

  sections.push(
    'Generate an original full song.',
    `Title: ${request.projectTitle ?? request.projectId}`,
    `Generation kind: ${request.kind}`,
  )

  sections.push(
    '',
    '## Musical Foundation',
    `Key: ${bp.key} ${bp.mode}`,
    `Tempo: ${bp.bpm} BPM`,
    `Time signature: ${bp.timeSignature}`,
    `Target duration: ${bp.targetDuration}`,
    `Genre: ${bp.genre}${bp.subgenre ? ` / ${bp.subgenre}` : ''}`,
    `Mood: ${bp.mood}`,
    `Energy: ${bp.energy}`,
  )

  if (bp.texture) sections.push(`Texture: ${bp.texture}`)

  sections.push('', '## Instrumentation', formatInstruments(bp))

  sections.push(
    '',
    '## Vocal Direction',
    bp.vocalsEnabled
      ? `Vocals enabled. Style: ${bp.vocalStyle ?? 'Match the lyric theme and overall blueprint feel'}.`
      : 'Instrumental — do not include lead vocals.',
  )

  if (bp.vocalsEnabled && bp.lyricTheme) {
    sections.push(`Lyric theme: ${bp.lyricTheme}`)
  }

  const fullLyrics = extractFullLyrics(request.sourceInputs)
  if (bp.vocalsEnabled && fullLyrics) {
    sections.push('', '## Full Lyrics', fullLyrics)
  }

  if (bp.melodyDirection) {
    sections.push('', '## Melody Direction', bp.melodyDirection)
  }

  const structureBlock = formatStructure(bp)
  if (structureBlock) {
    sections.push('', '## Song Structure (section map with chords)', structureBlock)
  }

  if (bp.generationNotes?.length) {
    sections.push('', '## Generation Notes', ...bp.generationNotes.map((n) => `- ${n}`))
  }

  if (bp.refinementDirectives?.length) {
    sections.push('', '## Refinement Directives', ...bp.refinementDirectives.map((d) => `- ${d}`))
  }

  const weightBlock = formatSourceWeights(request.sourceSet, request.sourceInputs ?? [])
  if (weightBlock) {
    sections.push('', '## Source Assembly (weighted inputs)', weightBlock)
  }

  sections.push('', '## Interpretation Context', request.sourceSummary)

  if (request.refinementPrompt) {
    sections.push('', '## User Refinement Request', request.refinementPrompt)
  }

  if (request.parentVersionId) {
    sections.push('', `Parent version: ${request.parentVersionId}`)
  }

  sections.push(
    '',
    'Generate music that faithfully follows the blueprint above. The blueprint is the canonical instruction source. Honor instrument selections, structural layout, and all musical directions.',
  )

  return sections.join('\n')
}

export async function generateTrack(
  request: LyriaGenerationRequest,
): Promise<LyriaGenerationResult> {
  const requestHash = await hashJsonPayload(request)
  const result = await callLyriaGeneration(buildPrompt(request))

  return {
    provider: 'google-lyria',
    model: 'lyria',
    schemaVersion: 'spartan4.v1',
    requestHash,
    providerRunId: `lyria-${requestHash.slice(0, 12)}`,
    summary: result.text || 'Generated music with Lyria.',
    durationSeconds: 30,
    artifactMimeType: result.mimeType,
    artifactBase64: result.data,
  }
}
