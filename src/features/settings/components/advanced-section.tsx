import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

const rowStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

export function AdvancedSection() {
  return (
    <section id="advanced" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Advanced
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Diagnostics, data, and experimental options
        </p>
      </div>

      <div className="space-y-2">
        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">App version</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
              Installed build and release channel
            </p>
          </div>
          <p className="shrink-0 text-right text-sm text-[var(--riff-text-secondary)]">
            Riff v0.9.2 (Build 847)
          </p>
        </div>

        <div className="rounded-xl px-4 py-3.5" style={rowStyle}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--riff-text-primary)]">Reset local data</p>
              <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
                Clears cached library, drafts, and offline content on this device. This cannot be
                undone.
              </p>
            </div>
            <Button variant="destructive" size="sm" className="shrink-0 sm:ml-4">
              Reset local data
            </Button>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Debug logging</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
              Verbose logs for troubleshooting
            </p>
          </div>
          <Switch className="shrink-0" />
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Experimental features</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
              Enable beta features that may be unstable
            </p>
          </div>
          <Switch className="shrink-0" />
        </div>
      </div>
    </section>
  )
}
