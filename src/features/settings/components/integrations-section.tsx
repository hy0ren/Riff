import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

const rowStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

export function IntegrationsSection() {
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
              Connected
            </Badge>
            <span className="text-sm text-[var(--riff-text-secondary)]">alex.rivera</span>
          </div>
          <p className="text-[12px] text-[var(--riff-text-muted)]">
            12 playlists imported · Last sync 2h ago
          </p>
        </div>

        <Separator className="bg-white/[0.06]" />

        <div className="space-y-2">
          <div
            className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
            style={rowStyle}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--riff-text-primary)]">
                Use for creation references
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
                Pull tracks and moods from Spotify when you create
              </p>
            </div>
            <Switch defaultChecked className="shrink-0" />
          </div>
          <div
            className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
            style={rowStyle}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--riff-text-primary)]">
                Use for radio seeding
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
                Seed stations from your Spotify taste profile
              </p>
            </div>
            <Switch defaultChecked className="shrink-0" />
          </div>
          <div
            className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
            style={rowStyle}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--riff-text-primary)]">
                Sync playlists automatically
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
                Keep imported playlists up to date in the background
              </p>
            </div>
            <Switch className="shrink-0" />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            Disconnect
          </Button>
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
