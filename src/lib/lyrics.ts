import type { LyricsSection } from '@/domain/blueprint'

function normalizeLyricsText(text: string): string {
  return text
    .replace(/^```[\w-]*\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^lyrics\s*:\s*/i, '')
    .trim()
}

export function parseLyricsTextIntoSections(
  versionId: string,
  text: string | undefined,
  vocalStyle?: string,
): LyricsSection[] | undefined {
  if (!text?.trim()) {
    return undefined
  }

  const normalized = normalizeLyricsText(text)
  if (!normalized) {
    return undefined
  }

  const sectionHeaderRegex =
    /^(Verse|Chorus|Bridge|Pre-Chorus|Outro|Intro|Hook|Refrain|Final Chorus)\s*\d*\s*:/i
  const blocks = normalized.split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean)
  const sections: LyricsSection[] = []
  let fallbackSection = 0

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    if (!lines.length) {
      continue
    }

    const firstLine = lines[0]
    if (sectionHeaderRegex.test(firstLine)) {
      const label = firstLine.replace(/:$/, '').trim()
      const bodyLines = lines.slice(1)
      if (bodyLines.length) {
        sections.push({
          id: `${versionId}-lyrics-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sections.length}`,
          label,
          lines: bodyLines,
          deliveryNotes: vocalStyle,
        })
      }
      continue
    }

    if (blocks.length === 1) {
      return [
        {
          id: `${versionId}-lyrics-main`,
          label: 'Lyrics',
          lines,
          deliveryNotes: vocalStyle,
        },
      ]
    }

    fallbackSection += 1
    sections.push({
      id: `${versionId}-lyrics-section-${fallbackSection}`,
      label: fallbackSection === 1 ? 'Verse' : `Section ${fallbackSection}`,
      lines,
      deliveryNotes: vocalStyle,
    })
  }

  return sections.length ? sections : undefined
}
