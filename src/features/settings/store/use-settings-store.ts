import { create } from 'zustand'
import { readStorageJson, writeStorageJson } from '@/lib/persistence/local-storage'

export const SETTINGS_STORAGE_KEY = 'riff.settings'

export type TypographyScale = 'compact' | 'default' | 'comfortable'
export type ExportAudioFormat = 'wav' | 'mp3'

export interface SettingsSnapshot {
  appearance: {
    compactSidebar: boolean
    reduceMotion: boolean
    typographyScale: TypographyScale
  }
  playback: {
    defaultVolume: number
    autoplayOnSelect: boolean
  }
  creation: {
    defaultGenre: string
    bpmRange: [number, number]
    vocalsEnabledByDefault: boolean
  }
  exports: {
    audioFormat: ExportAudioFormat
    includeMetadataJson: boolean
    includeChordSheet: boolean
    includeMelodyGuide: boolean
    includeLyrics: boolean
    includeAllVersions: boolean
  }
  advanced: {
    debugLogging: boolean
    experimentalFeatures: boolean
  }
}

interface SettingsStoreState extends SettingsSnapshot {
  setAppearance: (patch: Partial<SettingsSnapshot['appearance']>) => void
  setPlayback: (patch: Partial<SettingsSnapshot['playback']>) => void
  setCreation: (patch: Partial<SettingsSnapshot['creation']>) => void
  setExports: (patch: Partial<SettingsSnapshot['exports']>) => void
  setAdvanced: (patch: Partial<SettingsSnapshot['advanced']>) => void
  resetToDefaults: () => void
}

const DEFAULT_SETTINGS: SettingsSnapshot = {
  appearance: {
    compactSidebar: false,
    reduceMotion: false,
    typographyScale: 'default',
  },
  playback: {
    defaultVolume: 0.8,
    autoplayOnSelect: true,
  },
  creation: {
    defaultGenre: 'Alt Pop',
    bpmRange: [90, 132],
    vocalsEnabledByDefault: true,
  },
  exports: {
    audioFormat: 'wav',
    includeMetadataJson: true,
    includeChordSheet: true,
    includeMelodyGuide: true,
    includeLyrics: true,
    includeAllVersions: false,
  },
  advanced: {
    debugLogging: false,
    experimentalFeatures: false,
  },
}

function persist(snapshot: SettingsSnapshot) {
  writeStorageJson(SETTINGS_STORAGE_KEY, snapshot)
}

function toSnapshot(state: SettingsStoreState | SettingsSnapshot): SettingsSnapshot {
  return {
    appearance: state.appearance,
    playback: state.playback,
    creation: state.creation,
    exports: state.exports,
    advanced: state.advanced,
  }
}

const initialSnapshot = readStorageJson<SettingsSnapshot>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS)

export function getDefaultSettings(): SettingsSnapshot {
  return DEFAULT_SETTINGS
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  ...initialSnapshot,
  setAppearance: (patch) =>
    set((state) => {
      const snapshot = {
        ...toSnapshot(state),
        appearance: {
          ...state.appearance,
          ...patch,
        },
      }
      persist(snapshot)
      return snapshot
    }),
  setPlayback: (patch) =>
    set((state) => {
      const snapshot = {
        ...toSnapshot(state),
        playback: {
          ...state.playback,
          ...patch,
        },
      }
      persist(snapshot)
      return snapshot
    }),
  setCreation: (patch) =>
    set((state) => {
      const snapshot = {
        ...toSnapshot(state),
        creation: {
          ...state.creation,
          ...patch,
        },
      }
      persist(snapshot)
      return snapshot
    }),
  setExports: (patch) =>
    set((state) => {
      const snapshot = {
        ...toSnapshot(state),
        exports: {
          ...state.exports,
          ...patch,
        },
      }
      persist(snapshot)
      return snapshot
    }),
  setAdvanced: (patch) =>
    set((state) => {
      const snapshot = {
        ...toSnapshot(state),
        advanced: {
          ...state.advanced,
          ...patch,
        },
      }
      persist(snapshot)
      return snapshot
    }),
  resetToDefaults: () => {
    persist(DEFAULT_SETTINGS)
    set(DEFAULT_SETTINGS)
  },
}))
