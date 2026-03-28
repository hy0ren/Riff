import type { Blueprint, LyricsSection, TrackStructureNode } from '@/domain/blueprint'
import type { LearnSectionGuide } from '@/domain/providers'
import type { PersistedProject, ProjectVersion } from '@/domain/project'
import { parseLyricsTextIntoSections } from '@/lib/lyrics'
import { buildChordSectionSuggestion, parseChordTokens } from '@/lib/music-analysis'

function extractStructuredLyricSection(
  text: string | undefined,
  section: 'Verse' | 'Chorus' | 'Bridge',
): string[] | undefined {
  if (!text) {
    return undefined
  }

  const regex = new RegExp(
    `${section}:\\s*([\\s\\S]*?)(?=\\n\\n(?:Verse|Chorus|Bridge|Notes):|$)`,
    'i',
  )
  const match = text.match(regex)
  if (!match?.[1]) {
    return undefined
  }

  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseTargetDuration(targetDuration: string | undefined): number | undefined {
  if (!targetDuration) {
    return undefined
  }

  const minutesSeconds = targetDuration.match(/^(\d+):(\d{2})$/)
  if (minutesSeconds) {
    return Number(minutesSeconds[1]) * 60 + Number(minutesSeconds[2])
  }

  const compactMinutes = targetDuration.match(/^(\d+(?:\.\d+)?)\s*min/i)
  if (compactMinutes) {
    return Math.round(Number(compactMinutes[1]) * 60)
  }

  const compactSeconds = targetDuration.match(/^(\d+)\s*s/i)
  if (compactSeconds) {
    return Number(compactSeconds[1])
  }

  return undefined
}

function slugifyLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeSectionLabel(label: string): 'Verse' | 'Chorus' | 'Bridge' | 'Final Chorus' | string {
  const lower = label.toLowerCase()
  if (lower.includes('final')) {
    return 'Final Chorus'
  }
  if (lower.includes('chorus') || lower.includes('hook')) {
    return 'Chorus'
  }
  if (lower.includes('bridge')) {
    return 'Bridge'
  }
  if (lower.includes('verse')) {
    return 'Verse'
  }
  return label
}

function findLyricsSource(project: PersistedProject) {
  return project.sourceInputs.find(
    (sourceInput): sourceInput is typeof sourceInput & { type: 'lyrics'; text: string } =>
      sourceInput.type === 'lyrics' && 'text' in sourceInput,
  )
}

function getChordSuggestion(project: PersistedProject) {
  const chordSource = project.sourceInputs.find(
    (sourceInput): sourceInput is typeof sourceInput & { type: 'chord_progression'; text: string } =>
      sourceInput.type === 'chord_progression' && 'text' in sourceInput,
  )

  if (!chordSource?.text) {
    return undefined
  }

  return buildChordSectionSuggestion(chordSource.text, {
    keyChangeAfterBridge: chordSource.normalized?.keyChangeAfterBridge,
  })
}

function buildDerivedStructure(
  project: PersistedProject,
  version: ProjectVersion,
  blueprint?: Blueprint,
): TrackStructureNode[] | undefined {
  const chordSuggestion = getChordSuggestion(project)
  const chordSource = project.sourceInputs.find(
    (sourceInput): sourceInput is typeof sourceInput & { type: 'chord_progression'; text: string } =>
      sourceInput.type === 'chord_progression' && 'text' in sourceInput,
  )
  const lyricSections = getVersionLyrics(project, version)
  const totalDuration =
    version.duration ||
    parseTargetDuration(blueprint?.targetDuration) ||
    180

  if (chordSuggestion) {
    const entries = [
      { label: 'Verse', chords: chordSuggestion.verse },
      { label: 'Chorus', chords: chordSuggestion.chorus },
      { label: 'Bridge', chords: chordSuggestion.bridge },
      {
        label:
          chordSuggestion.keyChangeAfterBridge && chordSuggestion.finalChorus.length
            ? 'Final Chorus'
            : chordSuggestion.chorus.length
              ? 'Chorus'
              : undefined,
        chords:
          chordSuggestion.keyChangeAfterBridge && chordSuggestion.finalChorus.length
            ? chordSuggestion.finalChorus
            : [],
      },
    ].filter((entry): entry is { label: string; chords: string[] } => Boolean(entry.label))

    const weights = entries.map((entry) => {
      if (entry.label === 'Bridge') return 0.18
      if (entry.label === 'Chorus' || entry.label === 'Final Chorus') return 0.28
      return 0.26
    })
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1
    let elapsed = 0

    return entries.map((entry, index) => {
      const remaining = Math.max(8, totalDuration - elapsed)
      const sectionDuration =
        index === entries.length - 1
          ? remaining
          : Math.max(12, Math.round((totalDuration * weights[index]) / totalWeight))
      const node: TrackStructureNode = {
        id: `${version.id}-${slugifyLabel(entry.label)}-${index}`,
        label: entry.label,
        startTime: elapsed,
        duration: sectionDuration,
        chords: entry.chords.length
          ? entry.chords
          : parseChordTokens(chordSource?.text ?? ''),
      }
      elapsed += sectionDuration
      return node
    })
  }

  if (lyricSections?.length) {
    const weights = lyricSections.map((section) =>
      normalizeSectionLabel(section.label) === 'Bridge' ? 0.22 : 0.39,
    )
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1
    let elapsed = 0

    return lyricSections.map((section, index) => {
      const duration =
        index === lyricSections.length - 1
          ? Math.max(8, totalDuration - elapsed)
          : Math.max(12, Math.round((totalDuration * weights[index]) / totalWeight))
      const node: TrackStructureNode = {
        id: `${version.id}-${slugifyLabel(section.label)}-${index}`,
        label: normalizeSectionLabel(section.label),
        startTime: elapsed,
        duration,
        chords: [],
      }
      elapsed += duration
      return node
    })
  }

  return undefined
}

export function getVersionBlueprint(
  project: PersistedProject,
  version: ProjectVersion,
): Blueprint | undefined {
  return (
    project.blueprints.find((blueprint) => blueprint.id === version.sourceBlueprintId) ??
    project.blueprints.find((blueprint) => blueprint.id === project.activeBlueprintId) ??
    project.blueprints[project.blueprints.length - 1]
  )
}

export function getVersionStructure(
  project: PersistedProject,
  version: ProjectVersion,
): TrackStructureNode[] | undefined {
  const blueprint = getVersionBlueprint(project, version)
  return (
    version.structure ??
    version.insight?.chordSections ??
    blueprint?.structure ??
    buildDerivedStructure(project, version, blueprint)
  )
}

export function getVersionLyrics(
  project: PersistedProject,
  version: ProjectVersion,
): LyricsSection[] | undefined {
  if (version.lyrics?.length) {
    return version.lyrics
  }

  if (version.insight?.lyricSections?.length) {
    return version.insight.lyricSections
  }

  const noteLyrics = parseLyricsTextIntoSections(
    version.id,
    version.notes,
    getVersionBlueprint(project, version)?.vocalStyle,
  )
  if (noteLyrics?.length) {
    return noteLyrics
  }

  const themeLyrics = parseLyricsTextIntoSections(
    version.id,
    getVersionBlueprint(project, version)?.lyricTheme,
    getVersionBlueprint(project, version)?.vocalStyle,
  )
  if (themeLyrics?.length) {
    return themeLyrics
  }

  const lyricSource = findLyricsSource(project)

  if (!lyricSource?.text) {
    return undefined
  }

  const sections: LyricsSection[] = [
    {
      id: `${version.id}-lyrics-verse`,
      label: 'Verse',
      lines: extractStructuredLyricSection(lyricSource.text, 'Verse') ?? [],
    },
    {
      id: `${version.id}-lyrics-chorus`,
      label: 'Chorus',
      lines: extractStructuredLyricSection(lyricSource.text, 'Chorus') ?? [],
      deliveryNotes: getVersionBlueprint(project, version)?.vocalStyle,
      theme: getVersionBlueprint(project, version)?.lyricTheme,
    },
    {
      id: `${version.id}-lyrics-bridge`,
      label: 'Bridge',
      lines: extractStructuredLyricSection(lyricSource.text, 'Bridge') ?? [],
    },
  ].filter((section) => section.lines.length)

  if (sections.length) {
    return sections
  }

  const plainLines = lyricSource.text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return plainLines.length
    ? [
        {
          id: `${version.id}-lyrics-main`,
          label: 'Lyrics',
          lines: plainLines,
          deliveryNotes: getVersionBlueprint(project, version)?.vocalStyle,
          theme: getVersionBlueprint(project, version)?.lyricTheme,
        },
      ]
    : undefined
}

export function getDisplayLyrics(
  project: PersistedProject,
  version: ProjectVersion,
): LyricsSection[] | undefined {
  const persistedLearnLyrics =
    version.insight?.lyricSections?.length
      ? version.insight.lyricSections
      : version.lyrics?.length
        ? version.lyrics
        : undefined

  return persistedLearnLyrics ?? getVersionLyrics(project, version)
}

export function getVersionSectionGuides(
  project: PersistedProject,
  version: ProjectVersion,
): LearnSectionGuide[] | undefined {
  if (version.insight?.sectionGuides?.length) {
    return version.insight.sectionGuides
  }

  const structure = getVersionStructure(project, version)
  const lyrics = getVersionLyrics(project, version)
  if (!structure?.length) {
    return undefined
  }

  return structure.map((section, index) => {
    const matchingLyrics = lyrics?.find(
      (candidate) =>
        normalizeSectionLabel(candidate.label).toLowerCase() ===
        normalizeSectionLabel(section.label).toLowerCase(),
    )
    const firstChord = section.chords[0]
    const lastChord = section.chords[section.chords.length - 1]
    const harmonicCue = firstChord
      ? lastChord && lastChord !== firstChord
        ? `${firstChord} to ${lastChord}`
        : `${firstChord} center`
      : 'melodic phrasing'

    return {
      id: `${version.id}-guide-${index}`,
      label: section.label,
      startTime: section.startTime,
      duration: section.duration,
      chords: section.chords,
      lyricCue: matchingLyrics?.lines.slice(0, 2),
      focus: `Lock in the ${section.label.toLowerCase()} pocket and shape the ${harmonicCue}.`,
      memoryCue: matchingLyrics?.lines[0],
    }
  })
}

export function buildLyricsPlainText(lyrics: LyricsSection[] | undefined): string {
  if (!lyrics?.length) {
    return 'No lyric sheet available for this version.'
  }

  return lyrics
    .map((section) => `${section.label}\n${section.lines.join('\n')}`)
    .join('\n\n')
}

export function buildChordSheetPlainText(structure: TrackStructureNode[] | undefined): string {
  if (!structure?.length) {
    return 'No chord sheet available for this version.'
  }

  return structure
    .map((section) => {
      const startMinutes = Math.floor(section.startTime / 60)
      const startSeconds = String(section.startTime % 60).padStart(2, '0')
      return `${section.label} (${startMinutes}:${startSeconds})\n${section.chords.join('  ') || 'No chord map available'}`
    })
    .join('\n\n')
}

export function buildMelodyGuidePlainText(
  blueprint: Blueprint | undefined,
  sectionGuides: LearnSectionGuide[] | undefined,
): string {
  if (!sectionGuides?.length && !blueprint?.melodyDirection) {
    return 'No melody guide available for this version.'
  }

  const header = blueprint?.melodyDirection
    ? `Melody Direction\n${blueprint.melodyDirection}`
    : 'Melody Direction\nNo explicit melody direction available.'

  const sections = sectionGuides?.length
    ? sectionGuides
        .map((section) => {
          const startMinutes = Math.floor(section.startTime / 60)
          const startSeconds = String(section.startTime % 60).padStart(2, '0')
          return [
            `${section.label} (${startMinutes}:${startSeconds})`,
            `Focus: ${section.focus}`,
            section.memoryCue ? `Memory cue: ${section.memoryCue}` : undefined,
            section.chords.length ? `Chords: ${section.chords.join('  ')}` : undefined,
          ]
            .filter(Boolean)
            .join('\n')
        })
        .join('\n\n')
    : 'No section-by-section melody guide available.'

  return `${header}\n\n${sections}`
}
