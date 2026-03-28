import type { MusicalMode } from '@/domain/blueprint'

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

const FIFTHS_TO_MAJOR_KEY: Record<number, string> = {
  [-7]: 'Cb',
  [-6]: 'Gb',
  [-5]: 'Db',
  [-4]: 'Ab',
  [-3]: 'Eb',
  [-2]: 'Bb',
  [-1]: 'F',
  0: 'C',
  1: 'G',
  2: 'D',
  3: 'A',
  4: 'E',
  5: 'B',
  6: 'F#',
  7: 'C#',
}

const FIFTHS_TO_MINOR_KEY: Record<number, string> = {
  [-7]: 'Ab',
  [-6]: 'Eb',
  [-5]: 'Bb',
  [-4]: 'F',
  [-3]: 'C',
  [-2]: 'G',
  [-1]: 'D',
  0: 'A',
  1: 'E',
  2: 'B',
  3: 'F#',
  4: 'C#',
  5: 'G#',
  6: 'D#',
  7: 'A#',
}

export interface ChordSectionSuggestion {
  verse: string[]
  chorus: string[]
  bridge: string[]
  finalChorus: string[]
  keyChangeAfterBridge: boolean
  postBridgeKey?: string
}

export interface HarmonicInference {
  key?: string
  mode?: MusicalMode
}

export interface SheetMusicInference extends HarmonicInference {
  bpm?: number
  summary?: string
}

function normalizeNoteName(note: string): string {
  return note
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/^([a-g])/, (value) => value.toUpperCase())
}

function toScaleIndex(note: string): number {
  const normalized = normalizeNoteName(note)
  const enharmonicMap: Record<string, (typeof CHROMATIC_SCALE)[number]> = {
    'Cb': 'B',
    'Db': 'C#',
    'D#': 'Eb',
    'Fb': 'E',
    'E#': 'F',
    'Gb': 'F#',
    'G#': 'Ab',
    'A#': 'Bb',
    'B#': 'C',
  }

  const resolved = (enharmonicMap[normalized] ?? normalized) as (typeof CHROMATIC_SCALE)[number]
  return CHROMATIC_SCALE.indexOf(resolved)
}

export function transposeChord(chord: string, semitones: number): string {
  const match = chord.trim().match(/^([A-G](?:#|b)?)(.*)$/)
  if (!match) {
    return chord
  }

  const [, root, suffix] = match
  const index = toScaleIndex(root)
  if (index === -1) {
    return chord
  }

  const nextIndex = (index + semitones + CHROMATIC_SCALE.length) % CHROMATIC_SCALE.length
  return `${CHROMATIC_SCALE[nextIndex]}${suffix}`
}

export function parseChordTokens(text: string): string[] {
  return text
    .split(/[\n,|]+|(?:\s+-\s+)|(?:\s{2,})/g)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add|\d|\/|[A-G#b])*$/i.test(token))
}

export function inferKeyFromChordText(text: string): HarmonicInference | undefined {
  const chords = parseChordTokens(text)
  if (!chords.length) {
    return undefined
  }

  const firstChord = chords[0]
  const match = firstChord.match(/^([A-G](?:#|b)?)(.*)$/)
  if (!match) {
    return undefined
  }

  const [, root, suffix] = match
  const normalizedRoot = normalizeNoteName(root)
  const lowerSuffix = suffix.toLowerCase()
  const mode: MusicalMode =
    lowerSuffix.startsWith('m') && !lowerSuffix.startsWith('maj') ? 'Minor' : 'Major'

  return {
    key: normalizedRoot,
    mode,
  }
}

function parseLabeledSection(text: string, label: 'verse' | 'chorus' | 'bridge'): string[] | undefined {
  const regex = new RegExp(`${label}\\s*:?\\s*([^\\n]+)`, 'i')
  const match = text.match(regex)
  if (!match?.[1]) {
    return undefined
  }

  const parsed = parseChordTokens(match[1])
  return parsed.length ? parsed : undefined
}

export function buildChordSectionSuggestion(
  chordText: string,
  options?: {
    keyChangeAfterBridge?: boolean
    transposeSemitones?: number
  },
): ChordSectionSuggestion | undefined {
  const parsed = parseChordTokens(chordText)
  if (!parsed.length) {
    return undefined
  }

  const keyChangeAfterBridge = Boolean(options?.keyChangeAfterBridge)
  const transposeSemitones = options?.transposeSemitones ?? 2

  const verse = parseLabeledSection(chordText, 'verse') ?? parsed.slice(0, Math.min(4, parsed.length))
  const chorus =
    parseLabeledSection(chordText, 'chorus') ??
    (parsed.length > 4 ? parsed.slice(-Math.min(4, parsed.length)) : verse)
  const bridge =
    parseLabeledSection(chordText, 'bridge') ??
    [...(parsed.slice(1, 5).length ? parsed.slice(1, 5) : verse)].reverse()

  const finalChorus = keyChangeAfterBridge
    ? chorus.map((chord) => transposeChord(chord, transposeSemitones))
    : chorus

  const harmonicInference = inferKeyFromChordText(chordText)
  const postBridgeKey =
    keyChangeAfterBridge && harmonicInference?.key
      ? transposeChord(harmonicInference.key, transposeSemitones)
      : undefined

  return {
    verse,
    chorus,
    bridge,
    finalChorus,
    keyChangeAfterBridge,
    postBridgeKey,
  }
}

function inferKeyFromFilename(fileName: string): HarmonicInference | undefined {
  const match = fileName.match(/\b([A-G](?:#|b)?)(?:[_\-\s]?)(major|minor|maj|min)\b/i)
  if (!match) {
    return undefined
  }

  return {
    key: normalizeNoteName(match[1]),
    mode: /min/i.test(match[2]) ? 'Minor' : 'Major',
  }
}

function inferBpmFromFilename(fileName: string): number | undefined {
  const match = fileName.match(/\b(\d{2,3})\s?bpm\b/i)
  if (!match) {
    return undefined
  }

  const bpm = Number(match[1])
  return Number.isFinite(bpm) ? bpm : undefined
}

export async function analyzeSheetMusicFile(file: File): Promise<SheetMusicInference> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const fallbackKey = inferKeyFromFilename(file.name)
  const fallbackBpm = inferBpmFromFilename(file.name)

  if (extension !== 'xml' && extension !== 'musicxml') {
    return {
      ...fallbackKey,
      bpm: fallbackBpm,
      summary: fallbackKey || fallbackBpm
        ? 'Detected notation hints from file name. Gemini will inspect the uploaded sheet in Studio interpretation.'
        : 'Sheet uploaded. Gemini will inspect the notation for key, BPM, and structure during interpretation.',
    }
  }

  const text = await file.text()
  const tempoMatch = text.match(/(?:tempo="|<per-minute>)(\d{2,3})(?:"|<\/per-minute>)/i)
  const fifthsMatch = text.match(/<fifths>(-?\d+)<\/fifths>/i)
  const modeMatch = text.match(/<mode>(major|minor)<\/mode>/i)

  const bpm = tempoMatch ? Number(tempoMatch[1]) : fallbackBpm
  const mode = modeMatch?.[1]
    ? (modeMatch[1][0].toUpperCase() + modeMatch[1].slice(1).toLowerCase()) as MusicalMode
    : fallbackKey?.mode
  const key =
    fifthsMatch && mode
      ? mode === 'Minor'
        ? FIFTHS_TO_MINOR_KEY[Number(fifthsMatch[1])]
        : FIFTHS_TO_MAJOR_KEY[Number(fifthsMatch[1])]
      : fallbackKey?.key

  return {
    key,
    mode,
    bpm,
    summary:
      key || bpm
        ? `Detected ${[key ? `${key} ${mode ?? ''}`.trim() : undefined, bpm ? `${bpm} BPM` : undefined]
            .filter(Boolean)
            .join(' at ')} from uploaded notation.`
        : 'Notation uploaded. Gemini will inspect the sheet for musical structure during interpretation.',
  }
}
