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

export function CreationSection() {
  const [bpmRange, setBpmRange] = useState<[number, number]>([80, 140])

  return (
    <section id="creation" className="space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Creation
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Defaults applied when you start a new idea or generate arrangements.
        </p>
      </div>
      <Separator className="bg-white/[0.06]" />
      <div className="flex flex-col gap-2">
        <SettingRow
          label="Default Genre"
          description="Starting style for new projects and quick starts."
        >
          <div
            className="flex h-9 min-w-[9.5rem] cursor-default items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[var(--riff-surface-mid)] px-3 text-sm text-[var(--riff-text-primary)]"
            role="presentation"
          >
            <span className="truncate">Synthwave</span>
            <ChevronDown className="size-4 shrink-0 text-[var(--riff-text-faint)]" />
          </div>
        </SettingRow>
        <SettingRow
          label="Preferred BPM Range"
          description="Targets tempo when generating grooves and drum patterns."
        >
          <div className="flex w-52 flex-col items-stretch gap-2">
            <div className="flex justify-end">
              <Badge
                variant="outline"
                className="border-white/[0.08] bg-[var(--riff-surface-mid)] text-[11px] font-medium tabular-nums text-[var(--riff-text-primary)]"
              >
                {bpmRange[0]}-{bpmRange[1]}
              </Badge>
            </div>
            <Slider
              min={60}
              max={200}
              step={1}
              value={bpmRange}
              onValueChange={(v) => {
                const a = v[0] ?? 60
                const b = v[1] ?? 200
                setBpmRange(a <= b ? [a, b] : [b, a])
              }}
              className="w-full"
            />
          </div>
        </SettingRow>
        <SettingRow
          label="Default Vocal Mode"
          description="Vocals enabled by default for new generations."
        >
          <Switch />
        </SettingRow>
        <SettingRow
          label="Auto-save Drafts"
          description="Continuously save work-in-progress to avoid losing changes."
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          label="Default Visibility"
          description="Who can see new projects when you first publish or share."
        >
          <div
            className="flex h-9 min-w-[9.5rem] cursor-default items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[var(--riff-surface-mid)] px-3 text-sm text-[var(--riff-text-primary)]"
            role="presentation"
          >
            <span className="truncate">Private</span>
            <ChevronDown className="size-4 shrink-0 text-[var(--riff-text-faint)]" />
          </div>
        </SettingRow>
      </div>
    </section>
  )
}
