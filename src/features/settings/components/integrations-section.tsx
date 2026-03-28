import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { beginSpotifyAuthorization, syncSpotifyLibrary } from '@/lib/providers/spotify-gateway'
import {
  getSpotifyConnectionStatus,
  isSpotifyConnected,
  useIntegrationStore,
} from '@/features/integrations/store/use-integration-store'

const rowStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

function connectionStatusBadgeClass(status: ReturnType<typeof getSpotifyConnectionStatus>): string {
  switch (status) {
    case 'connected':
      return 'border border-[#1db954]/35 bg-[#1db954]/15 text-[11px] text-[#1db954]'
    case 'auth_required':
      return 'border border-amber-500/40 bg-amber-500/15 text-[11px] text-amber-200'
    case 'connecting':
      return 'border border-sky-500/35 bg-sky-500/10 text-[11px] text-sky-200'
    default:
      return 'border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-high)] text-[11px] text-[var(--riff-text-muted)]'
  }
}

function connectionStatusLabel(status: ReturnType<typeof getSpotifyConnectionStatus>): string {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'auth_required':
      return 'Reconnect required'
    case 'connecting':
      return 'Connecting…'
    default:
      return 'Not connected'
  }
}

export function IntegrationsSection() {
  const [isSyncing, setIsSyncing] = useState(false)
  const spotify = useIntegrationStore((state) => state.spotify)
  const setSpotifyAuth = useIntegrationStore((state) => state.setSpotifyAuth)
  const clearSpotify = useIntegrationStore((state) => state.clearSpotify)
  const setSpotifyProfile = useIntegrationStore((state) => state.setSpotifyProfile)
  const setSpotifyImports = useIntegrationStore((state) => state.setSpotifyImports)
  const setSpotifyPreference = useIntegrationStore((state) => state.setSpotifyPreference)

  const connectionStatus = useIntegrationStore((state) => getSpotifyConnectionStatus(state.spotify.auth))
  const linked = useIntegrationStore(isSpotifyConnected)

  const lastSyncedRelative = useMemo(() => {
    if (!spotify.lastSyncedAt) {
      return null
    }
    return formatDistanceToNow(new Date(spotify.lastSyncedAt), { addSuffix: true })
  }, [spotify.lastSyncedAt])

  const handleConnect = async () => {
    const authStart = await beginSpotifyAuthorization()
    setSpotifyAuth(authStart.pendingAuth)
    window.location.assign(authStart.authorizeUrl)
  }

  const handleSync = async () => {
    if (!spotify.auth.refreshToken && !spotify.auth.accessToken) {
      return
    }

    setIsSyncing(true)
    try {
      const syncResult = await syncSpotifyLibrary(spotify.auth)
      setSpotifyAuth(syncResult.auth)
      setSpotifyProfile(syncResult.profile)
      setSpotifyImports({
        playlists: syncResult.playlists,
        topTracks: syncResult.topTracks,
        lastSyncedAt: new Date().toISOString(),
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <section id="integrations" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Integrations
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Connect streaming services and sync your library
        </p>
      </div>

      <div
        className="space-y-4 rounded-2xl p-5"
        style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="space-y-3">
          <p className="font-display text-lg font-bold" style={{ color: '#1db954' }}>
            ♫ Spotify
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={connectionStatusBadgeClass(connectionStatus)} variant="outline">
              {connectionStatusLabel(connectionStatus)}
            </Badge>
          </div>
          {spotify.profile && (linked || connectionStatus === 'auth_required') ? (
            <div className="flex items-center gap-3">
              {spotify.profile.imageUrl ? (
                <img
                  src={spotify.profile.imageUrl}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#1db954] ring-1 ring-[#1db954]/30"
                  style={{ background: 'rgba(29, 185, 84, 0.12)' }}
                  aria-hidden
                >
                  {(spotify.profile.displayName || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--riff-text-primary)]">
                  {spotify.profile.displayName}
                </p>
                {spotify.profile.email ? (
                  <p className="truncate text-[12px] text-[var(--riff-text-muted)]">{spotify.profile.email}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--riff-text-secondary)]">
              {connectionStatus === 'connected'
                ? 'Run a sync to load your Spotify name and avatar.'
                : connectionStatus === 'connecting'
                  ? 'Finish signing in with Spotify in your browser.'
                  : connectionStatus === 'auth_required'
                    ? 'Your Spotify session expired. Reconnect to keep playlists and references in sync.'
                    : 'Connect your account to import playlists and personalize Riff.'}
            </p>
          )}
          <p className="text-[12px] text-[var(--riff-text-muted)]">
            {spotify.playlists.length} playlists imported
            {lastSyncedRelative ? ` · Last synced ${lastSyncedRelative}` : ''}
          </p>
        </div>

        <Separator className="bg-white/[0.06]" />

        <div className="space-y-2">
          <PreferenceRow
            title="Use for creation references"
            description="Pull tracks and moods from Spotify when you create"
            checked={spotify.useForCreationReferences}
            onCheckedChange={(value) => setSpotifyPreference('useForCreationReferences', value)}
          />
          <PreferenceRow
            title="Use for radio seeding"
            description="Seed stations from your Spotify taste profile"
            checked={spotify.useForRadioSeeding}
            onCheckedChange={(value) => setSpotifyPreference('useForRadioSeeding', value)}
          />
          <PreferenceRow
            title="Sync playlists automatically"
            description="Keep imported playlists up to date in the background"
            checked={spotify.autoSyncPlaylists}
            onCheckedChange={(value) => setSpotifyPreference('autoSyncPlaylists', value)}
          />
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {connectionStatus === 'auth_required' ? (
            <Button
              className="w-full bg-[#1db954] font-semibold text-black hover:bg-[#1ed760] sm:order-first sm:w-auto"
              onClick={() => void handleConnect()}
            >
              Reconnect Spotify
            </Button>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            {connectionStatus === 'connected' || connectionStatus === 'auth_required' ? (
              <>
                <Button variant="outline" size="sm" onClick={() => void handleSync()} disabled={isSyncing}>
                  {isSyncing ? 'Syncing…' : 'Sync Now'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={clearSpotify}
                >
                  Disconnect
                </Button>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <Button variant="outline" size="sm" onClick={() => void handleConnect()}>
                  Restart connection
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={clearSpotify}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => void handleConnect()}>
                Connect Spotify
              </Button>
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl px-4 py-6 text-center text-sm text-[var(--riff-text-muted)]"
        style={rowStyle}
      >
        More integrations coming soon — Apple Music, YouTube Music, SoundCloud
      </div>
    </section>
  )
}

function PreferenceRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
      style={rowStyle}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--riff-text-primary)]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  )
}
