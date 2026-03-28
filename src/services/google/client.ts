import { assertGoogleConfigured, getProviderConfig } from '@/lib/config/provider-config'

interface GoogleGenerateContentRequest {
  model: string
  systemInstruction?: string
  contents: Array<{ role: 'user' | 'model'; parts: Array<Record<string, unknown>> }>
  generationConfig?: Record<string, unknown>
}

interface GoogleGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        inlineData?: {
          mimeType?: string
          data?: string
        }
      }>
    }
  }>
}

function normalizeModelPath(model: string): string {
  return model.startsWith('models/') ? model : `models/${model}`
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function describeFetchFailure(error: unknown, model: string): Error {
  const base =
    error instanceof Error && error.message.trim().length
      ? error.message
      : 'Unknown network failure'

  const runningInBrowser = typeof window !== 'undefined'
  const maybeOffline =
    runningInBrowser &&
    typeof navigator !== 'undefined' &&
    'onLine' in navigator &&
    navigator.onLine === false

  const detail = maybeOffline
    ? 'Your browser appears to be offline.'
    : 'The request never reached Google or no response could be read back.'

  return new Error(
    `Google generateContent network failure for ${model}: ${base}. ${detail} If you are testing the web app, check your internet connection, VPN/ad blocker, and browser console/network tab.`,
  )
}

export async function googleGenerateContent(
  request: GoogleGenerateContentRequest,
): Promise<GoogleGenerateContentResponse> {
  const { googleApiKey } = assertGoogleConfigured()
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${normalizeModelPath(
    request.model,
  )}:generateContent?key=${googleApiKey}`
  const body = JSON.stringify({
    ...(request.systemInstruction
      ? {
          systemInstruction: {
            parts: [{ text: request.systemInstruction }],
          },
        }
      : {}),
    contents: request.contents,
    generationConfig: request.generationConfig,
  })

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })
  } catch (error) {
    await delay(700)
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })
    } catch (retryError) {
      throw describeFetchFailure(retryError ?? error, request.model)
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `Google generateContent failed: ${response.status} ${response.statusText}${errorText ? ` — ${errorText}` : ''}`,
    )
  }

  return (await response.json()) as GoogleGenerateContentResponse
}

export function extractGoogleText(response: GoogleGenerateContentResponse): string {
  const candidates = response.candidates ?? []
  const textParts: string[] = []

  for (const candidate of candidates) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.text) {
        textParts.push(part.text)
      }
    }
  }

  return textParts.join('\n')
}

export function extractGoogleInlineData(
  response: GoogleGenerateContentResponse,
): { mimeType?: string; data?: string } | undefined {
  const candidates = response.candidates ?? []

  for (const candidate of candidates) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return part.inlineData
      }
    }
  }

  return undefined
}

export function getGoogleModel(name: 'gemini' | 'lyria' | 'nano-banana'): string {
  const config = getProviderConfig()

  switch (name) {
    case 'lyria':
      return config.lyriaModel
    case 'nano-banana':
      return config.nanoBananaModel
    default:
      return config.geminiModel
  }
}
