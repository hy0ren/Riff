import { create } from 'zustand'

export interface TrackInfo {
  id: string
  title: string
  artist: string
  artUrl?: string
  duration: number // seconds
}

interface ShellState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Global player
  currentTrack: TrackInfo | null
  isPlaying: boolean
  currentTime: number
  volume: number
  setTrack: (track: TrackInfo) => void
  clearTrack: () => void
  play: () => void
  pause: () => void
  togglePlayback: () => void
  setCurrentTime: (time: number) => void
  setVolume: (volume: number) => void

  // Project context
  activeProjectId: string | null
  activeProjectName: string | null
  setActiveProject: (id: string | null, name?: string | null) => void
}

export const useShellStore = create<ShellState>((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Player
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  volume: 0.8,
  setTrack: (track) => set({ currentTrack: track, isPlaying: true, currentTime: 0 }),
  clearTrack: () => set({ currentTrack: null, isPlaying: false, currentTime: 0 }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  // Project context
  activeProjectId: null,
  activeProjectName: null,
  setActiveProject: (id, name = null) => set({ activeProjectId: id, activeProjectName: name }),
}))
