import { create } from 'zustand'
import type {
  SpotifyAuthState,
  SpotifyPlaylistImport,
  SpotifyProfile,
  SpotifyReferenceImport,
} from '@/domain/providers'
import { readStorageJson, writeStorageJson } from '@/lib/persistence/local-storage'

const INTEGRATIONS_STORAGE_KEY = 'riff.integrations'

interface IntegrationsSnapshot {
  spotify: {
    auth: SpotifyAuthState
    profile?: SpotifyProfile
    topTracks: SpotifyReferenceImport[]
    playlists: SpotifyPlaylistImport[]
    useForCreationReferences: boolean
    useForRadioSeeding: boolean
    autoSyncPlaylists: boolean
    lastSyncedAt?: string
  }
}

interface IntegrationStoreState extends IntegrationsSnapshot {
  setSpotifyAuth: (auth: SpotifyAuthState) => void
  clearSpotify: () => void
  setSpotifyProfile: (profile?: SpotifyProfile) => void
  setSpotifyImports: (payload: {
    topTracks?: SpotifyReferenceImport[]
    playlists?: SpotifyPlaylistImport[]
    lastSyncedAt?: string
  }) => void
  setSpotifyPreference: (
    key: 'useForCreationReferences' | 'useForRadioSeeding' | 'autoSyncPlaylists',
    value: boolean,
  ) => void
}

const defaultSnapshot: IntegrationsSnapshot = {
  spotify: {
    auth: {},
    topTracks: [],
    playlists: [],
    useForCreationReferences: true,
    useForRadioSeeding: true,
    autoSyncPlaylists: false,
  },
}

const initialSnapshot = readStorageJson<IntegrationsSnapshot>(
  INTEGRATIONS_STORAGE_KEY,
  defaultSnapshot,
)

function persist(snapshot: IntegrationsSnapshot) {
  writeStorageJson(INTEGRATIONS_STORAGE_KEY, snapshot)
}

export const useIntegrationStore = create<IntegrationStoreState>((set) => ({
  ...initialSnapshot,
  setSpotifyAuth: (auth) =>
    set((state) => {
      const snapshot = {
        ...state,
        spotify: {
          ...state.spotify,
          auth,
        },
      }
      persist(snapshot)
      return snapshot
    }),
  clearSpotify: () =>
    set((state) => {
      const snapshot = {
        ...state,
        spotify: {
          ...defaultSnapshot.spotify,
          useForCreationReferences: state.spotify.useForCreationReferences,
          useForRadioSeeding: state.spotify.useForRadioSeeding,
          autoSyncPlaylists: state.spotify.autoSyncPlaylists,
        },
      }
      persist(snapshot)
      return snapshot
    }),
  setSpotifyProfile: (profile) =>
    set((state) => {
      const snapshot = {
        ...state,
        spotify: {
          ...state.spotify,
          profile,
        },
      }
      persist(snapshot)
      return snapshot
    }),
  setSpotifyImports: ({ topTracks, playlists, lastSyncedAt }) =>
    set((state) => {
      const snapshot = {
        ...state,
        spotify: {
          ...state.spotify,
          topTracks: topTracks ?? state.spotify.topTracks,
          playlists: playlists ?? state.spotify.playlists,
          lastSyncedAt: lastSyncedAt ?? state.spotify.lastSyncedAt,
        },
      }
      persist(snapshot)
      return snapshot
    }),
  setSpotifyPreference: (key, value) =>
    set((state) => {
      const snapshot = {
        ...state,
        spotify: {
          ...state.spotify,
          [key]: value,
        },
      }
      persist(snapshot)
      return snapshot
    }),
}))
