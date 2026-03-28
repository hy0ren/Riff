export interface AccountProfile {
  uid: string
  email?: string
  displayName: string
  username: string
  photoURL?: string
  createdAt: string
  updatedAt: string
  plan: 'free' | 'pro'
}

export interface AccountStatsSnapshot {
  totalProjects: number
  favoriteProjects: number
  exportedProjects: number
}
