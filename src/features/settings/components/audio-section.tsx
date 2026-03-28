import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
          Input, output, and coaching audio preferences
        </p>
      </div>

      <div className="space-y-2">
        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">
              Microphone permission
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
              Required for practice capture and voice coaching
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className="border border-emerald-500/35 bg-emerald-500/15 text-emerald-400" variant="outline">
              Granted
            </Badge>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              Revoke
            </Button>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Audio input device</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">Microphone used for recording</p>
          </div>
          <ValuePill>Built-in Microphone</ValuePill>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Audio output device</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">Playback destination for previews and radio</p>
          </div>
          <ValuePill>Built-in Speakers</ValuePill>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Coach feedback voice</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">Voice used for coaching prompts</p>
          </div>
          <ValuePill>Default</ValuePill>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Practice sensitivity</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
              How strictly timing and pitch are evaluated
            </p>
          </div>
          <ValuePill>Medium</ValuePill>
        </div>
      </div>
    </section>
  )
}
