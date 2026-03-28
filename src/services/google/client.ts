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

export async function googleGenerateContent(
  request: GoogleGenerateContentRequest,
): Promise<GoogleGenerateContentResponse> {
  const { googleApiKey } = assertGoogleConfigured()
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${normalizeModelPath(
    request.model,
  )}:generateContent?key=${googleApiKey}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...(request.systemInstruction
        ? {
            systemInstruction: {
              parts: [{ text: request.systemInstruction }],
            },
          }
        : {}),
      contents: request.contents,
      generationConfig: request.generationConfig,
    }),
  })

  if (!response.ok) {
    throw new Error(`Google generateContent failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as GoogleGenerateContentResponse
}

export function extractGoogleText(response: GoogleGenerateContentResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? []
  return parts
    .map((part) => part.text)
    .filter((text): text is string => Boolean(text))
    .join('\n')
}

export function extractGoogleInlineData(
  response: GoogleGenerateContentResponse,
): { mimeType?: string; data?: string } | undefined {
  const parts = response.candidates?.[0]?.content?.parts ?? []
  return parts.find((part) => part.inlineData?.data)?.inlineData
}

export function getGoogleModel(name: 'gemini' | 'lyria' | 'live'): string {
  const config = getProviderConfig()

  switch (name) {
    case 'lyria':
      return config.lyriaModel
    case 'live':
      return config.liveModel
    default:
      return config.geminiModel
  }
}
