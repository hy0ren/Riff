import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '../store/use-settings-store'

const cardStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

const GENRE_OPTIONS = [
  'Alt Pop',
  'Cinematic',
  'Indie Rock',
  'R&B',
  'Synthwave',
  'Acoustic',
] as const

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

export function CreationSection() {
  const creation = useSettingsStore((state) => state.creation)
  const setCreation = useSettingsStore((state) => state.setCreation)

  return (
    <section id="creation" className="space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Creation
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Defaults that seed new projects before Gemini and Lyria refine the result.
        </p>
      </div>
      <Separator className="bg-white/[0.06]" />
      <div className="flex flex-col gap-2">
        <SettingRow
          label="Default genre"
          description="Used as the first stylistic anchor when a new project is created."
        >
          <select
            value={creation.defaultGenre}
            onChange={(event) => setCreation({ defaultGenre: event.target.value })}
            className="h-9 min-w-[160px] rounded-lg border border-white/[0.08] bg-[var(--riff-surface-mid)] px-3 text-sm text-[var(--riff-text-primary)] outline-none"
            aria-label="Default genre"
          >
            {GENRE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow
          label="Preferred BPM range"
          description="Used as the fallback tempo band when no stronger rhythmic source is present."
        >
          <div className="flex w-52 flex-col items-stretch gap-2">
            <div className="flex justify-end">
              <Badge
                variant="outline"
                className="border-white/[0.08] bg-[var(--riff-surface-mid)] text-[11px] font-medium tabular-nums text-[var(--riff-text-primary)]"
              >
                {creation.bpmRange[0]}-{creation.bpmRange[1]}
              </Badge>
            </div>
            <Slider
              min={60}
              max={200}
              step={1}
              value={creation.bpmRange}
              onValueChange={(value) => {
                const start = value[0] ?? 60
                const end = value[1] ?? 200
                setCreation({ bpmRange: start <= end ? [start, end] : [end, start] })
              }}
              className="w-full"
            />
          </div>
        </SettingRow>
        <SettingRow
          label="Vocals on by default"
          description="New projects start in vocal-led mode unless you flip them instrumental in Studio."
        >
          <Switch
            checked={creation.vocalsEnabledByDefault}
            onCheckedChange={(value) => setCreation({ vocalsEnabledByDefault: value })}
          />
        </SettingRow>
      </div>
    </section>
  )
}
