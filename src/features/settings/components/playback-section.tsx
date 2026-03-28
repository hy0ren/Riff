import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ChevronDown } from 'lucide-react'

const cardStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
      style={cardStyle}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--riff-text-primary)]">{label}</div>
        {description ? (
          <p className="mt-0.5 text-[11px] text-[var(--riff-text-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}

export function PlaybackSection() {
  const [crossfadeSec, setCrossfadeSec] = useState(2)

  return (
    <section id="playback" className="space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Playback
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          How Riff plays audio, transitions between tracks, and restores your queue.
        </p>
      </div>
      <Separator className="bg-white/[0.06]" />
      <div className="flex flex-col gap-2">
        <SettingRow
          label="Autoplay"
          description="Start the next track when the current one ends."
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          label="Gapless Playback"
          description="Remove silence between consecutive tracks when supported."
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          label="Normalize Volume"
          description="Apply loudness matching so tracks feel closer in level."
        >
          <Switch />
        </SettingRow>
        <SettingRow
          label="Default Audio Quality"
          description="Streaming and download quality for playback."
        >
          <div
            className="flex h-9 min-w-[9.5rem] cursor-default items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[var(--riff-surface-mid)] px-3 text-sm text-[var(--riff-text-primary)]"
            role="presentation"
          >
            <span className="truncate">High (320kbps)</span>
            <ChevronDown className="size-4 shrink-0 text-[var(--riff-text-faint)]" />
          </div>
        </SettingRow>
        <SettingRow
          label="Crossfade"
          description="Overlap the outgoing and incoming track for smoother transitions."
        >
          <div className="flex w-44 flex-col items-stretch gap-2">
            <div className="flex justify-end">
              <Badge
                variant="outline"
                className="border-white/[0.08] bg-[var(--riff-surface-mid)] text-[11px] font-medium tabular-nums text-[var(--riff-text-primary)]"
              >
                {crossfadeSec}s
              </Badge>
            </div>
            <Slider
              min={0}
              max={12}
              step={1}
              value={[crossfadeSec]}
              onValueChange={(v) => setCrossfadeSec(v[0] ?? 0)}
              className="w-full"
            />
          </div>
        </SettingRow>
        <SettingRow
          label="Queue Persistence"
          description="Remember your queue and position between sessions."
        >
          <Switch defaultChecked />
        </SettingRow>
      </div>
    </section>
  )
}
