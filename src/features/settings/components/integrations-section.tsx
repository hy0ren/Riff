import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { beginSpotifyAuthorization, syncSpotifyLibrary } from '@/lib/providers/spotify-gateway'
import { useIntegrationStore } from '@/features/integrations/store/use-integration-store'

const rowStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

export function IntegrationsSection() {
  const [isSyncing, setIsSyncing] = useState(false)
  const spotify = useIntegrationStore((state) => state.spotify)
  const setSpotifyAuth = useIntegrationStore((state) => state.setSpotifyAuth)
  const clearSpotify = useIntegrationStore((state) => state.clearSpotify)
  const setSpotifyProfile = useIntegrationStore((state) => state.setSpotifyProfile)
  const setSpotifyImports = useIntegrationStore((state) => state.setSpotifyImports)
  const setSpotifyPreference = useIntegrationStore((state) => state.setSpotifyPreference)

  const isConnected = Boolean(spotify.auth.accessToken && spotify.profile)
  const lastSyncedLabel = useMemo(() => {
    if (!spotify.lastSyncedAt) {
      return 'Not synced yet'
    }

    return `${formatDistanceToNow(new Date(spotify.lastSyncedAt), { addSuffix: true })}`
  }, [spotify.lastSyncedAt])

  const handleConnect = async () => {
    const authStart = await beginSpotifyAuthorization()
    setSpotifyAuth(authStart.pendingAuth)
    window.location.assign(authStart.authorizeUrl)
  }

  const handleSync = async () => {
    if (!spotify.auth.accessToken && !spotify.auth.refreshToken) {
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
        <div className="space-y-2">
          <p className="font-display text-lg font-bold" style={{ color: '#1db954' }}>
            ♫ Spotify
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className="border border-[#1db954]/35 bg-[#1db954]/15 text-[11px] text-[#1db954]"
              variant="outline"
            >
              {isConnected ? 'Connected' : 'Not Connected'}
            </Badge>
            <span className="text-sm text-[var(--riff-text-secondary)]">
              {spotify.profile?.displayName ?? 'Connect your account'}
            </span>
          </div>
          <p className="text-[12px] text-[var(--riff-text-muted)]">
            {spotify.playlists.length} playlists imported · Last sync {lastSyncedLabel}
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

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {isConnected ? (
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
          ) : (
            <Button size="sm" onClick={() => void handleConnect()}>
              Connect Spotify
            </Button>
          )}
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
