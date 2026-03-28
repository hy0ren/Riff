import type { Blueprint } from '@/domain/blueprint'
import type {
  GeminiBlueprintRefinementRequest,
  GeminiBlueprintRefinementResult,
  GeminiInterpretationRequest,
  GeminiInterpretationResult,
  GeminiTrackSummaryRequest,
  GeminiTrackSummaryResult,
} from '@/domain/providers'
import { callGeminiJson } from '@/services/google/gemini'
import { createInterpretationSnapshot } from '@/lib/studio-pipeline/interpretation'
import { hashJsonPayload } from './hash'

function toJsonPrompt(payload: unknown): string {
  return JSON.stringify(payload, null, 2)
}

export async function interpretSourceSet(
  request: GeminiInterpretationRequest,
): Promise<GeminiInterpretationResult> {
  const requestHash = await hashJsonPayload(request)

  try {
    const result = await callGeminiJson<{
      summary: string
      derivedBlueprint: Partial<Blueprint>
      signals: GeminiInterpretationResult['signals']
      conflicts: GeminiInterpretationResult['conflicts']
    }>({
      systemInstruction:
        'You are the structured music interpretation layer for Riff. Return JSON only. Infer musical structure from the provided source set. Be concise, musical, and deterministic.',
      prompt: `Interpret this source set into a structured blueprint draft.\n${toJsonPrompt(
        request,
      )}`,
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
  const result = await callGeminiJson<{
    summary: string
    arrangementSummary: string
    lyricalThemeSummary?: string
    learningNotes: string[]
  }>({
    systemInstruction:
      'You are the project explanation layer for Riff. Return JSON only. Summarize a generated track version for Track Details and Learn mode.',
    prompt: `Summarize this generated track version.\n${toJsonPrompt(request)}`,
  })

  return {
    provider: 'google-gemini',
    model: 'gemini',
    schemaVersion: 'spartan4.v1',
    requestHash,
    ...result,
  }
}
