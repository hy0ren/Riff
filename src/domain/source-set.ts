export type SourceInfluence = 'primary' | 'supporting' | 'reference'

export interface SourceSetItem {
  sourceInputId: string
  order: number
  enabled: boolean
  weight: number
  priority?: number
  influence: SourceInfluence
}

export interface SourceSet {
  id: string
  projectId?: string
  name: string
  createdAt: string
  updatedAt: string
  note?: string
  items: SourceSetItem[]
}
