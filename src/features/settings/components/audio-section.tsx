import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'

const rowStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

function ValuePill({ children }: { children: ReactNode }) {
  return (
    <div
      className="max-w-[min(100%,280px)] truncate rounded-lg border border-white/[0.04] px-3 py-1.5 text-sm text-[var(--riff-text-primary)]"
      style={{ background: 'var(--riff-surface-mid)' }}
    >
      {children}
    </div>
  )
}

export function AudioSection() {
  return (
    <section id="audio" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Audio
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Playback behavior for previews, generated songs, and Learn mode
        </p>
      </div>

      <div className="space-y-2">
        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">
              Playback engine
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
              Generated tracks play locally inside the desktop app shell
            </p>
          </div>
          <Badge className="border-emerald-500/35 bg-emerald-500/15 text-emerald-400" variant="outline">
            Ready
          </Badge>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Output routing</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">Playback follows your system default output device</p>
          </div>
          <ValuePill>System Default</ValuePill>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Learn mode</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">No microphone or live coaching setup is required</p>
          </div>
          <ValuePill>Output-only</ValuePill>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Preview fidelity</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">Use exported song versions to evaluate arrangement and memorization cues</p>
          </div>
          <ValuePill>High</ValuePill>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Recording input</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
              Not required for the current product direction
            </p>
          </div>
          <ValuePill>Disabled</ValuePill>
        </div>
      </div>
    </section>
  )
}
