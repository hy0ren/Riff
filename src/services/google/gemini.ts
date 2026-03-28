import { extractGoogleText, getGoogleModel, googleGenerateContent } from './client'

export async function callGeminiJson<T>({
  systemInstruction,
  prompt,
}: {
  systemInstruction: string
  prompt: string
}): Promise<T> {
  const response = await googleGenerateContent({
    model: getGoogleModel('gemini'),
    systemInstruction,
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  })

  const text = extractGoogleText(response)
  return JSON.parse(text) as T
}
