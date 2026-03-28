import type { LyriaGenerationRequest, LyriaGenerationResult } from '@/domain/providers'
import { callLyriaGeneration } from '@/services/google/lyria'
import { hashJsonPayload } from './hash'

function buildPrompt(request: LyriaGenerationRequest): string {
  const vocalsDirective = request.blueprint.vocalsEnabled
    ? `Vocals enabled. Vocal style: ${request.blueprint.vocalStyle ?? 'use the lyric theme and blueprint direction'}.`
    : 'Instrumental version preferred unless the blueprint clearly calls for vocals.'

  return [
    'Generate an original full song for Riff.',
    `Kind: ${request.kind}`,
    `Project: ${request.projectId}`,
    `Blueprint: ${JSON.stringify(request.blueprint)}`,
    vocalsDirective,
    request.blueprint.lyricTheme ? `Lyric theme: ${request.blueprint.lyricTheme}` : null,
    `Source summary: ${request.sourceSummary}`,
    request.refinementPrompt ? `Refinement: ${request.refinementPrompt}` : null,
    request.parentVersionId ? `Parent version: ${request.parentVersionId}` : null,
    'Return music aligned to the blueprint and source intent. Use the blueprint as the canonical instruction source.',
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n')
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
