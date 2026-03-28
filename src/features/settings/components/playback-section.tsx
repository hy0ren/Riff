import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '../store/use-settings-store'

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
  const playback = useSettingsStore((state) => state.playback)
  const setPlayback = useSettingsStore((state) => state.setPlayback)

  return (
    <section id="playback" className="space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Playback
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Defaults used by the global player when you open songs from Library, Learn, or Track Details.
        </p>
      </div>
      <Separator className="bg-white/[0.06]" />
      <div className="flex flex-col gap-2">
        <SettingRow
          label="Default player volume"
          description="Applied to the bottom player every time the app loads."
        >
          <div className="flex w-44 flex-col items-stretch gap-2">
            <div className="flex justify-end">
              <Badge
                variant="outline"
                className="border-white/[0.08] bg-[var(--riff-surface-mid)] text-[11px] font-medium tabular-nums text-[var(--riff-text-primary)]"
              >
                {Math.round(playback.defaultVolume * 100)}%
              </Badge>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round(playback.defaultVolume * 100)]}
              onValueChange={(value) =>
                setPlayback({ defaultVolume: (value[0] ?? 80) / 100 })
              }
              className="w-full"
            />
          </div>
        </SettingRow>
        <SettingRow
          label="Autoplay selected songs"
          description="If off, selecting a song loads it into the player without immediately starting playback."
        >
          <Switch
            checked={playback.autoplayOnSelect}
            onCheckedChange={(value) => setPlayback({ autoplayOnSelect: value })}
          />
        </SettingRow>
      </div>
    </section>
  )
}
