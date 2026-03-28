/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_API_KEY?: string
  readonly VITE_GEMINI_MODEL?: string
  readonly VITE_LYRIA_MODEL?: string
  readonly VITE_NANO_BANANA_MODEL?: string
  readonly VITE_SPOTIFY_CLIENT_ID?: string
  readonly VITE_SPOTIFY_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
