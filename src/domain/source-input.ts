export type SourceInputType = 
  | 'hum' 
  | 'riff' 
  | 'lyrics' 
  | 'chords' 
  | 'sheet' 
  | 'spotify' 
  | 'remix'

export interface SourceInput {
  id: string
  type: SourceInputType
  label: string
  description: string
  iconName: string // Lucide icon reference
}

export interface SelectionCanvas {
  selectedTypes: SourceInputType[]
  projectName?: string
}
