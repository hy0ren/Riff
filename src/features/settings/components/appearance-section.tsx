import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'

function SettingRow({
  label,
  description,
  control,
}: {
  label: string
  description: string
  control: ReactNode
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

export function AppearanceSection() {
  const [compactSidebar, setCompactSidebar] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)

  return (
    <section id="appearance" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Appearance
        </h3>
        <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
          Visual density, motion, and accent
        </p>
      </div>

      <div
        className="rounded-xl border border-white/[0.04] px-4 py-1"
        style={{ background: 'var(--riff-surface-low)' }}
      >
        <SettingRow
          label="Theme"
          description="Riff ships in Obsidian dark; light themes are not offered."
          control={
            <Badge variant="outline" className="max-w-full whitespace-normal text-left text-[11px] leading-snug">
              Dark Only — Obsidian is the brand
            </Badge>
          }
        />
        <SettingRow
          label="Accent color"
          description="Brand accent used for focus rings, links, and highlights."
          control={
            <div className="flex items-center gap-2">
              <div
                className="size-9 rounded-lg border border-white/10 shadow-inner"
                style={{ backgroundColor: 'var(--riff-accent)' }}
                aria-hidden
              />
              <span className="font-mono text-xs text-[var(--riff-text-faint)]">--riff-accent</span>
            </div>
          }
        />
        <SettingRow
          label="Sidebar density"
          description="Tighter spacing and smaller type in the app chrome."
          control={
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--riff-text-muted)]">Compact</span>
              <Switch
                size="sm"
                checked={compactSidebar}
                onCheckedChange={setCompactSidebar}
                aria-label="Compact sidebar"
              />
            </div>
          }
        />
        <SettingRow
          label="Reduce motion"
          description="Limits transitions and decorative animation."
          control={
            <Switch
              size="sm"
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
              aria-label="Reduce motion"
            />
          }
        />
        <SettingRow
          label="Typography scale"
          description="Adjusts base reading size across the app."
          control={
            <div
              role="presentation"
              className="flex h-8 min-w-[160px] cursor-default items-center justify-between rounded-lg border border-white/[0.08] bg-[var(--riff-surface-mid)] px-2.5 text-sm text-[var(--riff-text-primary)]"
            >
              <span>Default</span>
              <ChevronDown className="size-4 text-[var(--riff-text-muted)]" aria-hidden />
            </div>
          }
        />
      </div>
    </section>
  )
}
