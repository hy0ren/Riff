export interface ProviderConfig {
  googleApiKey?: string
  geminiModel: string
  lyriaModel: string
  liveModel: string
  spotifyClientId?: string
  spotifyRedirectUri?: string
}

const providerConfig: ProviderConfig = {
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  geminiModel: import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash',
  lyriaModel: import.meta.env.VITE_LYRIA_MODEL ?? 'models/lyria-realtime-exp',
  liveModel: import.meta.env.VITE_LIVE_MODEL ?? 'gemini-live-2.5-flash-preview',
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  spotifyRedirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
}

export function getProviderConfig(): ProviderConfig {
  return providerConfig
}

export function assertGoogleConfigured(): ProviderConfig {
  if (!providerConfig.googleApiKey) {
    throw new Error('Missing VITE_GOOGLE_API_KEY. Add it to your local env before using Google AI features.')
  }

  return providerConfig
}

export function assertSpotifyConfigured(): ProviderConfig {
  if (!providerConfig.spotifyClientId || !providerConfig.spotifyRedirectUri) {
    throw new Error(
      'Missing Spotify config. Add VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_REDIRECT_URI to your local env.',
    )
  }

  return providerConfig
}
