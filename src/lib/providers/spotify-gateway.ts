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

export async function beginSpotifyAuthorization(): Promise<{
  authorizeUrl: string
  pendingAuth: SpotifyAuthState
}> {
  const challenge = await createSpotifyPkceChallenge()
  return {
    authorizeUrl: createSpotifyAuthorizeUrl({
      codeChallenge: challenge.codeChallenge,
      state: challenge.state,
    }),
    pendingAuth: {
      codeVerifier: challenge.codeVerifier,
      state: challenge.state,
    },
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
