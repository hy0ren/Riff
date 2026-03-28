import { create } from 'zustand'
import type {
  SpotifyAuthState,
  SpotifyPlaylistImport,
  SpotifyProfile,
  SpotifyReferenceImport,
} from '@/domain/providers'
import { ensureSpotifyAccessToken } from '@/lib/providers/spotify-gateway'
import { readStorageJson, writeStorageJson } from '@/lib/persistence/local-storage'

/** Matches the 30s skew used in `ensureSpotifyAccessToken`. */
const SPOTIFY_TOKEN_SKEW_MS = 30_000

export type SpotifyConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'auth_required'
  | 'connecting'

export function getSpotifyConnectionStatus(auth: SpotifyAuthState): SpotifyConnectionStatus {
  const accessValid = Boolean(
    auth.accessToken &&
      (!auth.expiresAt ||
        new Date(auth.expiresAt).getTime() > Date.now() + SPOTIFY_TOKEN_SKEW_MS),
  )
  if (accessValid) {
    return 'connected'
  }
  if (auth.refreshToken) {
    return 'auth_required'
  }
  if (auth.codeVerifier) {
    return 'connecting'
  }
  return 'disconnected'
}

const INTEGRATIONS_STORAGE_KEY = 'riff.integrations'

interface IntegrationsSnapshot {
  spotify: {
    auth: SpotifyAuthState
    profile?: SpotifyProfile
    topTracks: SpotifyReferenceImport[]
    playlists: SpotifyPlaylistImport[]
    useForCreationReferences: boolean
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
    key: 'useForCreationReferences' | 'autoSyncPlaylists',
    value: boolean,
  ) => void
  silentRefreshSpotify: () => Promise<void>
}

export function isSpotifyConnected(state: IntegrationStoreState): boolean {
  return getSpotifyConnectionStatus(state.spotify.auth) === 'connected'
}

const defaultSnapshot: IntegrationsSnapshot = {
  spotify: {
    auth: {},
    topTracks: [],
    playlists: [],
    useForCreationReferences: true,
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

export const useIntegrationStore = create<IntegrationStoreState>((set, get) => ({
  ...initialSnapshot,
  silentRefreshSpotify: async () => {
    const { auth } = get().spotify
    if (getSpotifyConnectionStatus(auth) === 'connected') {
      return
    }
    if (!auth.refreshToken) {
      return
    }
    try {
      const nextAuth = await ensureSpotifyAccessToken(auth)
      set((state) => {
        const snapshot = {
          ...state,
          spotify: {
            ...state.spotify,
            auth: nextAuth,
          },
        }
        persist(snapshot)
        return snapshot
      })
    } catch {
      // Silent on failure; UI uses `getSpotifyConnectionStatus` / `auth_required`.
    }
  },
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
