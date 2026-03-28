import { Mic, ListMusic } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function SourceContextPanel() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--riff-text-primary)]">
          Source Assembly
        </h2>
        <p className="text-sm text-[var(--riff-text-muted)]">
          2 active inputs
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Source 1: Hum Recording */}
        <div className="flex flex-col gap-2 rounded-xl bg-[var(--riff-surface-low)] p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--riff-surface-highest)]">
                <Mic className="h-4 w-4 text-[var(--riff-accent-light)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--riff-text-primary)]">Hum Recording</p>
                <p className="text-xs text-[var(--riff-text-muted)]">0:12 duration</p>
              </div>
            </div>
          </div>
          <div className="h-6 w-full rounded bg-[var(--riff-surface)] overflow-hidden flex items-center px-1">
            {/* Fake waveform */}
            <div className="flex w-full items-end gap-[2px] h-full opacity-60">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-[var(--riff-accent)] rounded-t-sm"
                  style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Source 2: Spotify Reference */}
        <div className="flex flex-col gap-3 rounded-xl bg-[var(--riff-surface-low)] p-3 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-[var(--riff-surface-highest)]">
                <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=64&h=64" alt="Album art" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--riff-text-primary)]">Spotify Reference</p>
                <p className="text-xs text-[var(--riff-text-muted)]">"Neon Horizon" by The Midnight</p>
              </div>
            </div>
            <ListMusic className="h-4 w-4 text-[#1DB954]" />
          </div>
        </div>
      </div>

      <Separator className="bg-[var(--riff-surface-highest)]" />

      {/* Inferred Signals */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wide text-[var(--riff-text-secondary)] uppercase">
          Inferred Signals
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[var(--riff-surface-low)] p-2">
            <p className="text-xs text-[var(--riff-text-muted)]">Detected Key</p>
            <p className="text-sm font-mono text-[var(--riff-text-primary)]">F Minor</p>
          </div>
          <div className="rounded-lg bg-[var(--riff-surface-low)] p-2">
            <p className="text-xs text-[var(--riff-text-muted)]">Est. BPM</p>
            <p className="text-sm font-mono text-[var(--riff-text-primary)]">118-122</p>
          </div>
          <div className="rounded-lg bg-[var(--riff-surface-low)] p-2">
            <p className="text-xs text-[var(--riff-text-muted)]">Rhythm Feel</p>
            <p className="text-sm text-[var(--riff-text-primary)]">Driving</p>
          </div>
          <div className="rounded-lg bg-[var(--riff-surface-low)] p-2">
            <p className="text-xs text-[var(--riff-text-muted)]">Energy</p>
            <p className="text-sm text-[var(--riff-text-primary)]">High</p>
          </div>
        </div>
        
        <div className="rounded-lg bg-[var(--riff-surface-low)] p-3 mt-2">
          <p className="text-xs text-[var(--riff-text-muted)] mb-1">Instrumentation Lean</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-md bg-[var(--riff-surface-highest)] px-2 py-0.5 text-xs text-[var(--riff-accent-light)]">Heavy Bass</span>
            <span className="inline-flex items-center rounded-md bg-[var(--riff-surface-highest)] px-2 py-0.5 text-xs text-[var(--riff-text-primary)]">Analog Synths</span>
            <span className="inline-flex items-center rounded-md bg-[var(--riff-surface-highest)] px-2 py-0.5 text-xs text-[var(--riff-text-primary)]">Drum Machine</span>
          </div>
        </div>
      </div>
    </div>
  )
}
