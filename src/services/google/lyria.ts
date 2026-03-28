import { extractGoogleInlineData, extractGoogleText, getGoogleModel, googleGenerateContent } from './client'

export async function callLyriaGeneration(prompt: string): Promise<{
  text: string
  mimeType?: string
  data?: string
}> {
  const response = await googleGenerateContent({
    model: getGoogleModel('lyria'),
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO', 'TEXT'],
      temperature: 0.8,
    },
  })

  const inlineData = extractGoogleInlineData(response)
  return {
    text: extractGoogleText(response),
    mimeType: inlineData?.mimeType,
    data: inlineData?.data,
  }
}
