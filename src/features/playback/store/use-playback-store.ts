import { create } from 'zustand'
import type { PlayableTrack } from '@/domain/playback'

const audioElement =
  typeof Audio !== 'undefined'
    ? new Audio()
    : null

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
  setTrack: (track) => {
    if (audioElement && track.audioUrl) {
      audioElement.src = track.audioUrl
      void audioElement.play().catch(() => {})
    }
    set({ currentTrack: track, isPlaying: true, currentTime: 0 })
  },
  clearTrack: () => {
    if (audioElement) {
      audioElement.pause()
      audioElement.removeAttribute('src')
      audioElement.load()
    }
    set({ currentTrack: null, isPlaying: false, currentTime: 0 })
  },
  play: () => {
    if (audioElement?.src) {
      void audioElement.play().catch(() => {})
    }
    set({ isPlaying: true })
  },
  pause: () => {
    audioElement?.pause()
    set({ isPlaying: false })
  },
  togglePlayback: () =>
    set((state) => {
      const nextIsPlaying = !state.isPlaying
      if (audioElement?.src) {
        if (nextIsPlaying) {
          void audioElement.play().catch(() => {})
        } else {
          audioElement.pause()
        }
      }
      return { isPlaying: nextIsPlaying }
    }),
  setCurrentTime: (time) => {
    if (audioElement?.src) {
      audioElement.currentTime = time
    }
    set({ currentTime: time })
  },
  setVolume: (volume) => {
    const nextVolume = Math.max(0, Math.min(1, volume))
    if (audioElement) {
      audioElement.volume = nextVolume
    }
    set({ volume: nextVolume })
  },
}))

if (audioElement) {
  audioElement.preload = 'auto'
  audioElement.addEventListener('timeupdate', () => {
    usePlaybackStore.setState({ currentTime: audioElement.currentTime })
  })
  audioElement.addEventListener('ended', () => {
    usePlaybackStore.setState({ isPlaying: false, currentTime: 0 })
  })
}
