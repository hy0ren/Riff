import type {
  SpotifyAuthState,
  SpotifyPlaylistImport,
  SpotifyProfile,
  SpotifyReferenceImport,
} from '@/domain/providers'
import type { SourceInput } from '@/domain/source-input'
import {
  createSpotifyAuthorizeUrl,
  createSpotifyPkceChallenge,
  exchangeSpotifyCode,
  fetchSpotifyPlaylists,
  fetchSpotifyProfile,
  fetchSpotifyTopTracks,
  refreshSpotifyToken,
} from '@/services/spotify/client'
import { readStorageJson, removeStorageValue, writeStorageJson } from '@/lib/persistence/local-storage'

const SPOTIFY_PENDING_AUTH_STORAGE_KEY = 'riff.spotify.pending-auth'
const SPOTIFY_STATE_PREFIX = 'riff.'

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function writeSessionPendingAuth(auth: SpotifyAuthState) {
  if (!canUseSessionStorage()) {
    return
  }

  try {
    window.sessionStorage.setItem(SPOTIFY_PENDING_AUTH_STORAGE_KEY, JSON.stringify(auth))
  } catch {
    // Ignore storage failures in prototype mode.
  }
}

function readSessionPendingAuth(): SpotifyAuthState | undefined {
  if (!canUseSessionStorage()) {
    return undefined
  }

  try {
    const value = window.sessionStorage.getItem(SPOTIFY_PENDING_AUTH_STORAGE_KEY)
    return value ? (JSON.parse(value) as SpotifyAuthState) : undefined
  } catch {
    return undefined
  }
}

function clearSessionPendingAuth() {
  if (!canUseSessionStorage()) {
    return
  }

  try {
    window.sessionStorage.removeItem(SPOTIFY_PENDING_AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage failures in prototype mode.
  }
}

export function persistPendingSpotifyAuth(auth: SpotifyAuthState) {
  writeStorageJson(SPOTIFY_PENDING_AUTH_STORAGE_KEY, auth)
  writeSessionPendingAuth(auth)
}

export function readPendingSpotifyAuth(): SpotifyAuthState | undefined {
  return readSessionPendingAuth() ?? readStorageJson<SpotifyAuthState | undefined>(
    SPOTIFY_PENDING_AUTH_STORAGE_KEY,
    undefined,
  )
}

export function clearPendingSpotifyAuth() {
  removeStorageValue(SPOTIFY_PENDING_AUTH_STORAGE_KEY)
  clearSessionPendingAuth()
}

function canUseWindowLocation() {
  return typeof window !== 'undefined' && typeof window.location !== 'undefined'
}

function encodeStatePayload(payload: {
  requestState: string
  codeVerifier: string
  origin?: string
  startedAt: string
}): string {
  const json = JSON.stringify(payload)
  return `${SPOTIFY_STATE_PREFIX}${btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')}`
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4)
    return atob(padded)
  } catch {
    return null
  }
}

export function decodeSpotifyStatePayload(state: string | null | undefined): SpotifyAuthState | undefined {
  if (!state || !state.startsWith(SPOTIFY_STATE_PREFIX)) {
    return undefined
  }

  const encodedPayload = state.slice(SPOTIFY_STATE_PREFIX.length)
  const decoded = decodeBase64Url(encodedPayload)
  if (!decoded) {
    return undefined
  }

  try {
    const payload = JSON.parse(decoded) as {
      codeVerifier?: string
      origin?: string
      startedAt?: string
    }

    if (!payload.codeVerifier) {
      return undefined
    }

    return {
      codeVerifier: payload.codeVerifier,
      state,
      origin: payload.origin,
      startedAt: payload.startedAt,
    }
  } catch {
    return undefined
  }
}

export async function beginSpotifyAuthorization(): Promise<{
  authorizeUrl: string
  pendingAuth: SpotifyAuthState
}> {
  const challenge = await createSpotifyPkceChallenge()
  const startedAt = new Date().toISOString()
  const origin = canUseWindowLocation() ? window.location.origin : undefined
  const callbackState = encodeStatePayload({
    requestState: challenge.state,
    codeVerifier: challenge.codeVerifier,
    origin,
    startedAt,
  })
  const pendingAuth: SpotifyAuthState = {
    codeVerifier: challenge.codeVerifier,
    state: callbackState,
    origin,
    startedAt,
  }
  persistPendingSpotifyAuth(pendingAuth)

  return {
    authorizeUrl: createSpotifyAuthorizeUrl({
      codeChallenge: challenge.codeChallenge,
      state: callbackState,
    }),
    pendingAuth,
  }
}

export async function completeSpotifyAuthorization(params: {
  code: string
  storedAuth: SpotifyAuthState
}): Promise<SpotifyAuthState> {
  if (!params.storedAuth.codeVerifier) {
    throw new Error('Missing Spotify PKCE verifier.')
  }

  return exchangeSpotifyCode({
    code: params.code,
    codeVerifier: params.storedAuth.codeVerifier,
  })
}

export async function ensureSpotifyAccessToken(auth: SpotifyAuthState): Promise<SpotifyAuthState> {
  if (auth.accessToken && auth.expiresAt && new Date(auth.expiresAt).getTime() > Date.now() + 30_000) {
    return auth
  }

  if (!auth.refreshToken) {
    throw new Error('Spotify session expired and no refresh token is available.')
  }

  return refreshSpotifyToken(auth.refreshToken)
}

export async function syncSpotifyLibrary(auth: SpotifyAuthState): Promise<{
  auth: SpotifyAuthState
  profile: SpotifyProfile
  playlists: SpotifyPlaylistImport[]
  topTracks: SpotifyReferenceImport[]
}> {
  const refreshedAuth = await ensureSpotifyAccessToken(auth)
  const accessToken = refreshedAuth.accessToken

  if (!accessToken) {
    throw new Error('Spotify access token is missing.')
  }

  const [profile, playlists, topTracks] = await Promise.all([
    fetchSpotifyProfile(accessToken),
    fetchSpotifyPlaylists(accessToken),
    fetchSpotifyTopTracks(accessToken),
  ])

  return {
    auth: refreshedAuth,
    profile,
    playlists,
    topTracks,
  }
}

export function spotifyTrackToSourceInput(
  projectId: string,
  track: SpotifyReferenceImport,
): SourceInput {
  return {
    id: `spotify-track-${track.id}`,
    projectId,
    type: 'spotify_track_reference',
    label: track.title,
    description: `Spotify reference by ${track.artistName}`,
    iconName: 'Compass',
    createdAt: new Date().toISOString(),
    role: 'reference',
    provenance: 'spotify',
    isReference: true,
    interpretationStatus: 'attached',
    spotifyUri: track.uri,
    artistName: track.artistName,
    providerTrackName: track.title,
    normalized: {
      providerName: 'Spotify',
      providerTitle: track.title,
      providerArtist: track.artistName,
    },
  }
}
