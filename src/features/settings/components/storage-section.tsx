import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ReactNode } from 'react'

const CACHE_USED_GB = 2.4
const CACHE_TOTAL_GB = 10
const PROJECT_STORAGE_LABEL = '1.8 GB across 8 projects'
const EXPORT_PATH = '~/Riff/exports'
const ARTWORK_CACHE_MB = 340

function formatGb(value: number): string {
  const digits = Number.isInteger(value) ? 0 : 1
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: 1,
  })} GB`
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string
  description?: string
  control: ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
      style={{
        background: 'var(--riff-surface-low)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--riff-text-primary)]">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0 shrink-0">{control}</div>
    </div>
  )
}

export function StorageSection() {
  const cachePct = (CACHE_USED_GB / CACHE_TOTAL_GB) * 100

  return (
    <section id="storage" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">Storage</h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Local cache, projects on disk, exports folder, and artwork
        </p>
      </div>

      <div className="space-y-3">
        <SettingRow
          label="Local Cache"
          control={
            <div className="flex w-full min-w-[min(100%,240px)] max-w-sm flex-col gap-2">
              <Progress value={cachePct} className="h-1.5 bg-[var(--riff-surface-mid)] [&_[data-slot=progress-indicator]]:bg-[var(--riff-accent)]" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] tabular-nums text-[var(--riff-text-muted)]">
                  {formatGb(CACHE_USED_GB)} of {formatGb(CACHE_TOTAL_GB)}
                </span>
                <Button type="button" variant="outline" size="sm">
                  Clean Cache
                </Button>
              </div>
            </div>
          }
        />

        <SettingRow
          label="Project Storage"
          control={
            <p className="text-right text-sm text-[var(--riff-text-secondary)]">{PROJECT_STORAGE_LABEL}</p>
          }
        />

        <SettingRow
          label="Export Folder"
          control={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="max-w-[220px] truncate font-mono text-xs text-[var(--riff-text-muted)]">
                {EXPORT_PATH}
              </span>
              <Button type="button" variant="outline" size="sm">
                Change
              </Button>
            </div>
          }
        />

        <SettingRow
          label="Artwork Cache"
          control={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant="secondary" className="font-normal tabular-nums text-[var(--riff-text-secondary)]">
                {ARTWORK_CACHE_MB.toLocaleString('en-US')} MB
              </Badge>
              <Button type="button" variant="outline" size="sm">
                Clean
              </Button>
            </div>
          }
        />
      </div>
    </section>
  )
}
