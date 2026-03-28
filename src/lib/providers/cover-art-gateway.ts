import type { Blueprint } from '@/domain/blueprint'
import { callNanoBananaCoverArt } from '@/services/google/nano-banana'

function buildCoverPrompt({
  projectTitle,
  blueprint,
  summary,
}: {
  projectTitle: string
  blueprint: Blueprint
  summary?: string
}) {
  return [
    'Create square album cover art for an original AI-generated song.',
    'No text, no logos, no watermarks, no letters, no typography.',
    `Title: ${projectTitle}`,
    `Genre: ${blueprint.genre}${blueprint.subgenre ? ` / ${blueprint.subgenre}` : ''}`,
    `Mood: ${blueprint.mood}`,
    `Energy: ${blueprint.energy}`,
    `Texture: ${blueprint.texture ?? 'cinematic, musical, premium'}`,
    `Key: ${blueprint.key} ${blueprint.mode}`,
    summary ? `Song summary: ${summary}` : null,
    'Visual direction: premium music cover, bold composition, polished lighting, immersive atmosphere, artist-grade artwork.',
    'Aspect ratio: 1:1.',
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n')
}

export async function generateProjectCoverArt({
  projectTitle,
  blueprint,
  summary,
}: {
  projectTitle: string
  blueprint: Blueprint
  summary?: string
}): Promise<string | undefined> {
  const result = await callNanoBananaCoverArt(
    buildCoverPrompt({ projectTitle, blueprint, summary }),
  )

  if (!result.data || !result.mimeType) {
    return undefined
  }

  return `data:${result.mimeType};base64,${result.data}`
}
