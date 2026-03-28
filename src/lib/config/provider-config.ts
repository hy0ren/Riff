export interface ProviderConfig {
  googleApiKey?: string
  geminiModel: string
  lyriaModel: string
  nanoBananaModel: string
  spotifyClientId?: string
  spotifyRedirectUri?: string
  firebaseApiKey?: string
  firebaseAuthDomain?: string
  firebaseProjectId?: string
  firebaseStorageBucket?: string
  firebaseMessagingSenderId?: string
  firebaseAppId?: string
  firebaseMeasurementId?: string
}

const providerConfig: ProviderConfig = {
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  geminiModel: import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-3-flash-preview',
  lyriaModel: import.meta.env.VITE_LYRIA_MODEL ?? 'lyria-3-pro-preview',
  nanoBananaModel: import.meta.env.VITE_NANO_BANANA_MODEL ?? 'gemini-2.5-flash-image',
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  spotifyRedirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID,
  firebaseMeasurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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

export function isFirebaseConfigured(): boolean {
  return Boolean(
    providerConfig.firebaseApiKey &&
      providerConfig.firebaseAuthDomain &&
      providerConfig.firebaseProjectId &&
      providerConfig.firebaseAppId,
  )
}

export function assertFirebaseConfigured(): ProviderConfig {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Missing Firebase config. Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID to your local env.',
    )
  }

  return providerConfig
}
