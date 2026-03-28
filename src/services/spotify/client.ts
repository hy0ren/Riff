import { assertSpotifyConfigured } from '@/lib/config/provider-config'
import type {
  SpotifyAuthState,
  SpotifyPlaylistImport,
  SpotifyProfile,
  SpotifyReferenceImport,
} from '@/domain/providers'

const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const SPOTIFY_AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize'
const DEFAULT_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-email',
  'user-read-private',
  'user-top-read',
]

function randomString(length = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  return crypto.subtle.digest('SHA-256', encoder.encode(plain))
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function createSpotifyPkceChallenge(): Promise<{
  codeVerifier: string
  codeChallenge: string
  state: string
}> {
  const codeVerifier = randomString(96)
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier))
  const state = randomString(24)
  return { codeVerifier, codeChallenge, state }
}

export function createSpotifyAuthorizeUrl({
  codeChallenge,
  state,
}: {
  codeChallenge: string
  state: string
}): string {
  const { spotifyClientId, spotifyRedirectUri } = assertSpotifyConfigured()
  const params = new URLSearchParams({
    client_id: spotifyClientId!,
    response_type: 'code',
    redirect_uri: spotifyRedirectUri!,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
    scope: DEFAULT_SCOPES.join(' '),
  })

  return `${SPOTIFY_AUTHORIZE_ENDPOINT}?${params.toString()}`
}

export async function exchangeSpotifyCode(params: {
  code: string
  codeVerifier: string
}): Promise<SpotifyAuthState> {
  const { spotifyClientId, spotifyRedirectUri } = assertSpotifyConfigured()
  const body = new URLSearchParams({
    client_id: spotifyClientId!,
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: spotifyRedirectUri!,
    code_verifier: params.codeVerifier,
  })

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `Spotify token exchange failed: ${response.status} ${response.statusText}${errorText ? ` — ${errorText}` : ''}`,
    )
  }

  const data = (await response.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }
}

export async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyAuthState> {
  const { spotifyClientId } = assertSpotifyConfigured()
  const body = new URLSearchParams({
    client_id: spotifyClientId!,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `Spotify token refresh failed: ${response.status} ${response.statusText}${errorText ? ` — ${errorText}` : ''}`,
    )
  }

  const data = (await response.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }
}

async function spotifyGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `Spotify request failed for ${path}: ${response.status} ${response.statusText}${errorText ? ` — ${errorText}` : ''}`,
    )
  }

  return (await response.json()) as T
}

export async function fetchSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
  const profile = await spotifyGet<{
    id: string
    display_name: string
    email?: string
    images?: Array<{ url: string }>
    followers?: { total: number }
  }>('/me', accessToken)

  return {
    id: profile.id,
    displayName: profile.display_name,
    email: profile.email,
    imageUrl: profile.images?.[0]?.url,
    followers: profile.followers?.total,
  }
}

export async function fetchSpotifyPlaylists(accessToken: string): Promise<SpotifyPlaylistImport[]> {
  const playlists = await spotifyGet<{
    items: Array<{
      id: string
      uri: string
      name: string
      description?: string
      images?: Array<{ url: string }>
      tracks?: { total: number }
    }>
  }>('/me/playlists?limit=20', accessToken)

  return playlists.items.map((playlist) => ({
    id: playlist.id,
    uri: playlist.uri,
    name: playlist.name,
    description: playlist.description,
    imageUrl: playlist.images?.[0]?.url,
    trackCount: playlist.tracks?.total ?? 0,
  }))
}

export async function fetchSpotifyTopTracks(accessToken: string): Promise<SpotifyReferenceImport[]> {
  const tracks = await spotifyGet<{
    items: Array<{
      id: string
      uri: string
      name: string
      album?: { images?: Array<{ url: string }> }
      artists?: Array<{ name: string }>
    }>
  }>('/me/top/tracks?limit=10&time_range=medium_term', accessToken)

  return tracks.items.map((track) => ({
    id: track.id,
    uri: track.uri,
    title: track.name,
    artistName: track.artists?.map((artist) => artist.name).join(', ') ?? 'Spotify Artist',
    imageUrl: track.album?.images?.[0]?.url,
  }))
}

export async function fetchSpotifyPlaylistTracks(
  playlistId: string,
  accessToken: string,
): Promise<SpotifyReferenceImport[]> {
  const fields = 'items(track(id,uri,name,artists,album(images)))'
  const data = await spotifyGet<{
    items: Array<{
      track: {
        id: string
        uri: string
        name: string
        album?: { images?: Array<{ url: string }> }
        artists?: Array<{ name: string }>
      } | null
    }>
  }>(`/playlists/${playlistId}/tracks?fields=${encodeURIComponent(fields)}&limit=50`, accessToken)

  return data.items
    .filter((item) => Boolean(item.track?.id))
    .map((item) => ({
      id: item.track!.id,
      uri: item.track!.uri,
      title: item.track!.name,
      artistName:
        item.track!.artists?.map((artist) => artist.name).join(', ') ?? 'Spotify Artist',
      imageUrl: item.track!.album?.images?.[0]?.url,
    }))
}
