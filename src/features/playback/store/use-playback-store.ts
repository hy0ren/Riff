import { create } from 'zustand'
import type { PlayableTrack } from '@/domain/playback'

interface PlaybackState {
  currentTrack: PlayableTrack | null
  isPlaying: boolean
  currentTime: number
  volume: number
  setTrack: (track: PlayableTrack) => void
  clearTrack: () => void
  play: () => void
  pause: () => void
  togglePlayback: () => void
  setCurrentTime: (time: number) => void
  setVolume: (volume: number) => void
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  volume: 0.8,
  setTrack: (track) => set({ currentTrack: track, isPlaying: true, currentTime: 0 }),
  clearTrack: () => set({ currentTrack: null, isPlaying: false, currentTime: 0 }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
}))
