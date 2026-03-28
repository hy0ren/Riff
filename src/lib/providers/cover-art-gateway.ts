import type { Blueprint } from '@/domain/blueprint'
import { callGeminiJson } from '@/services/google/gemini'
import { callNanoBananaCoverArt } from '@/services/google/nano-banana'

interface CoverArtDirection {
  concept: string
  visualMotifs: string[]
  setting: string
  medium: string
  palette: string[]
  lighting: string
  cameraLanguage: string
  moodLine: string
  avoid: string[]
}

function buildFallbackDirection({
  projectTitle,
  blueprint,
  summary,
}: {
  projectTitle: string
  blueprint: Blueprint
  summary?: string
}): CoverArtDirection {
  return {
    concept: `A premium album cover for "${projectTitle}" that feels deeply tied to the song's emotional world.`,
    visualMotifs: [
      blueprint.texture ?? 'cinematic atmosphere',
      `${blueprint.genre.toLowerCase()} energy`,
      `${blueprint.mood.toLowerCase()} mood`,
    ],
    setting: 'A single striking scene that could plausibly belong on a real streaming-era album release.',
    medium: 'editorial photography mixed with subtle graphic-design polish',
    palette: [blueprint.mood, blueprint.energy, blueprint.key].map((entry) => entry.toLowerCase()),
    lighting: blueprint.energy === 'Low' ? 'soft low-key lighting' : 'moody dramatic lighting',
    cameraLanguage: 'confident composition, clean framing, one central visual idea',
    moodLine:
      summary ??
      `A ${blueprint.mood.toLowerCase()}, ${blueprint.energy.toLowerCase()} ${blueprint.genre.toLowerCase()} song in ${blueprint.key} ${blueprint.mode}.`,
    avoid: [
      'cheap AI gloss',
      'plastic skin',
      'overcrowded collage',
      'floating abstract nonsense',
      'text',
      'logos',
      'watermarks',
    ],
  }
}

async function generateCoverArtDirection({
  projectTitle,
  blueprint,
  summary,
}: {
  projectTitle: string
  blueprint: Blueprint
  summary?: string
}): Promise<CoverArtDirection> {
  const fallback = buildFallbackDirection({ projectTitle, blueprint, summary })

  try {
    const result = await callGeminiJson<CoverArtDirection>({
      systemInstruction:
        'You are the album art director for a premium music product. Return JSON only. Create a concrete, tasteful, non-generic visual direction for a believable album cover that feels human-made and release-ready.',
      prompt: JSON.stringify({
        task: 'Create a cover-art direction brief for Nano Banana.',
        constraints: [
          'Square album cover only.',
          'The result must feel like a real album cover, not generic AI art.',
          'No text, no typography, no logos, no watermarks.',
          'Favor one strong visual idea over clutter.',
          'Use visual specificity, medium cues, and camera/composition language.',
          'Avoid saying "AI-generated" or describing obvious AI artifacts.',
        ],
        song: {
          title: projectTitle,
          genre: blueprint.genre,
          subgenre: blueprint.subgenre,
          mood: blueprint.mood,
          energy: blueprint.energy,
          key: blueprint.key,
          mode: blueprint.mode,
          texture: blueprint.texture,
          lyricTheme: blueprint.lyricTheme,
          melodyDirection: blueprint.melodyDirection,
          summary,
        },
        outputSchema: {
          concept: 'string',
          visualMotifs: ['string'],
          setting: 'string',
          medium: 'string',
          palette: ['string'],
          lighting: 'string',
          cameraLanguage: 'string',
          moodLine: 'string',
          avoid: ['string'],
        },
      }, null, 2),
    })

    return {
      ...fallback,
      ...result,
      visualMotifs: result.visualMotifs?.length ? result.visualMotifs : fallback.visualMotifs,
      palette: result.palette?.length ? result.palette : fallback.palette,
      avoid: result.avoid?.length ? result.avoid : fallback.avoid,
    }
  } catch {
    return fallback
  }
}

function buildCoverPrompt(direction: CoverArtDirection) {
  return [
    'Create premium square album cover art for a real music release.',
    'This must look like a believable human art-directed album cover, not obvious AI art.',
    'No text, no letters, no logos, no watermarks, no typographic layout.',
    `Core concept: ${direction.concept}`,
    `Mood: ${direction.moodLine}`,
    `Setting: ${direction.setting}`,
    `Visual motifs: ${direction.visualMotifs.join(', ')}`,
    `Medium: ${direction.medium}`,
    `Palette: ${direction.palette.join(', ')}`,
    `Lighting: ${direction.lighting}`,
    `Camera / composition: ${direction.cameraLanguage}`,
    `Avoid: ${direction.avoid.join(', ')}`,
    'Album-cover quality, polished, tasteful, iconic, release-ready.',
    'Aspect ratio: 1:1.',
  ].join('\n')
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
  const direction = await generateCoverArtDirection({
    projectTitle,
    blueprint,
    summary,
  })
  const result = await callNanoBananaCoverArt(buildCoverPrompt(direction))

  if (!result.data || !result.mimeType) {
    return undefined
  }

  return `data:${result.mimeType};base64,${result.data}`
}
