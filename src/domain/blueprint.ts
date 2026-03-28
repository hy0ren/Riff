export type MusicalMode = 'Major' | 'Minor'
export type EnergyLevel = 'Low' | 'Medium' | 'High' | 'Extreme'

export interface InstrumentPlan {
  drums: boolean
  bass: boolean
  guitar: boolean
  synths: boolean
  strings: boolean
  pads: boolean
}

export interface TrackStructureNode {
  id: string
  label: string
  startTime: number
  duration: number
  chords: string[]
}

export interface LyricsSection {
  id: string
  label: string
  lines: string[]
  theme?: string
  deliveryNotes?: string
}

export interface Blueprint {
  id: string
  projectId?: string
  revision: number
  createdAt: string
  updatedAt: string
  basedOnBlueprintId?: string
  sourceInputIds?: string[]
  bpm: number
  key: string
  mode: MusicalMode
  timeSignature: string
  targetDuration: string
  genre: string
  subgenre?: string
  mood: string
  energy: EnergyLevel
  texture?: string
  vocalsEnabled: boolean
  vocalStyle?: string
  lyricTheme?: string
  instruments: InstrumentPlan
  structure?: TrackStructureNode[]
  melodyDirection?: string
  generationNotes?: string[]
  refinementDirectives?: string[]
}
