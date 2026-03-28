import { extractGoogleInlineData, getGoogleModel, googleGenerateContent } from './client'

export async function callNanoBananaCoverArt(prompt: string): Promise<{
  mimeType?: string
  data?: string
}> {
  const response = await googleGenerateContent({
    model: getGoogleModel('nano-banana'),
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE'],
      temperature: 0.65,
    },
  })

  const inlineData = extractGoogleInlineData(response)
  return {
    mimeType: inlineData?.mimeType,
    data: inlineData?.data,
  }
}
