import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore, type TypographyScale } from '../store/use-settings-store'

function SettingRow({
  label,
  description,
  control,
}: {
  label: string
  description: string
  control: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/[0.06] py-4 last:border-b-0 last:pb-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-[var(--riff-text-primary)]">{label}</p>
        <p className="text-xs text-[var(--riff-text-muted)]">{description}</p>
      </div>
      <div className="shrink-0 sm:pl-4">{control}</div>
    </div>
  )
}

const TYPOGRAPHY_LABELS: Record<TypographyScale, string> = {
  compact: 'Compact',
  default: 'Default',
  comfortable: 'Comfortable',
}

export function AppearanceSection() {
  const appearance = useSettingsStore((state) => state.appearance)
  const setAppearance = useSettingsStore((state) => state.setAppearance)

  return (
    <section id="appearance" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Appearance
        </h3>
        <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
          Density, motion, and reading comfort across the app shell.
        </p>
      </div>

      <div
        className="rounded-xl border border-white/[0.04] px-4 py-1"
        style={{ background: 'var(--riff-surface-low)' }}
      >
        <SettingRow
          label="Theme"
          description="Riff stays in its dark desktop palette to keep the product coherent."
          control={
            <Badge
              variant="outline"
              className="max-w-full whitespace-normal text-left text-[11px] leading-snug"
            >
              Obsidian dark only
            </Badge>
          }
        />
        <SettingRow
          label="Sidebar density"
          description="Tighten navigation spacing for a more compact desktop shell."
          control={
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--riff-text-muted)]">Compact</span>
              <Switch
                size="sm"
                checked={appearance.compactSidebar}
                onCheckedChange={(value) => setAppearance({ compactSidebar: value })}
                aria-label="Compact sidebar"
              />
            </div>
          }
        />
        <SettingRow
          label="Reduce motion"
          description="Cuts down decorative animation and smooth scrolling across the app."
          control={
            <Switch
              size="sm"
              checked={appearance.reduceMotion}
              onCheckedChange={(value) => setAppearance({ reduceMotion: value })}
              aria-label="Reduce motion"
            />
          }
        />
        <SettingRow
          label="Typography scale"
          description="Adjust the overall reading scale without changing the design system."
          control={
            <select
              value={appearance.typographyScale}
              onChange={(event) =>
                setAppearance({ typographyScale: event.target.value as TypographyScale })
              }
              className="h-9 min-w-[170px] rounded-lg border border-white/[0.08] bg-[var(--riff-surface-mid)] px-3 text-sm text-[var(--riff-text-primary)] outline-none"
              aria-label="Typography scale"
            >
              {Object.entries(TYPOGRAPHY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          }
        />
      </div>
    </section>
  )
}
