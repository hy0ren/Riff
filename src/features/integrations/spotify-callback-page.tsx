import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { PageFrame } from '@/components/layout/page-frame'
import { completeSpotifyAuthorization, syncSpotifyLibrary } from '@/lib/providers/spotify-gateway'
import { useIntegrationStore } from './store/use-integration-store'

export function SpotifyCallbackPage() {
  const location = useLocation()
  const [status, setStatus] = useState<'processing' | 'failed'>('processing')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const auth = useIntegrationStore((state) => state.spotify.auth)
  const setSpotifyAuth = useIntegrationStore((state) => state.setSpotifyAuth)
  const setSpotifyProfile = useIntegrationStore((state) => state.setSpotifyProfile)
  const setSpotifyImports = useIntegrationStore((state) => state.setSpotifyImports)

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const code = params.get('code')
  const state = params.get('state')
  const providerError = params.get('error')

  useEffect(() => {
    let cancelled = false

    async function finishAuthorization() {
      if (providerError) {
        setStatus('failed')
        setErrorMessage(providerError)
        return
      }

      if (!code || !state || !auth.state || state !== auth.state) {
        setStatus('failed')
        setErrorMessage('Spotify callback validation failed.')
        return
      }

      try {
        const nextAuth = await completeSpotifyAuthorization({
          code,
          storedAuth: auth,
        })

        if (cancelled) {
          return
        }

        setSpotifyAuth(nextAuth)
        const syncResult = await syncSpotifyLibrary(nextAuth)
        if (cancelled) {
          return
        }

        setSpotifyAuth(syncResult.auth)
        setSpotifyProfile(syncResult.profile)
        setSpotifyImports({
          topTracks: syncResult.topTracks,
          playlists: syncResult.playlists,
          lastSyncedAt: new Date().toISOString(),
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        setStatus('failed')
        setErrorMessage(
          error instanceof Error ? error.message : 'Spotify authorization failed.',
        )
      }
    }

    void finishAuthorization()

    return () => {
      cancelled = true
    }
  }, [
    auth,
    code,
    providerError,
    setSpotifyAuth,
    setSpotifyImports,
    setSpotifyProfile,
    state,
  ])

  if (!providerError && code && auth.accessToken) {
    return <Navigate to="/settings" replace />
  }

  return (
    <PageFrame title="Spotify" subtitle="Completing connection">
      <div className="mx-auto mt-16 max-w-xl rounded-2xl bg-[var(--riff-surface-low)] p-8 text-center">
        {status === 'processing' ? (
          <>
            <h2 className="font-display text-2xl font-bold text-[var(--riff-text-primary)]">
              Connecting Spotify
            </h2>
            <p className="mt-3 text-sm text-[var(--riff-text-muted)]">
              Exchanging your authorization code and importing your profile.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold text-[var(--riff-text-primary)]">
              Spotify connection failed
            </h2>
            <p className="mt-3 text-sm text-[var(--riff-text-muted)]">
              {errorMessage ?? 'The callback could not be completed.'}
            </p>
          </>
        )}
      </div>
    </PageFrame>
  )
}
