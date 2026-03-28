import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogOut, Pencil } from 'lucide-react'

export function AccountSection() {
  return (
    <section id="account" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Account
        </h3>
        <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
          Profile, plan, and session
        </p>
      </div>

      <div
        className="rounded-xl border border-white/[0.04] p-5"
        style={{ background: 'var(--riff-surface-low)' }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-[var(--riff-text-primary)]"
              style={{ background: 'var(--riff-surface-mid)' }}
            >
              AR
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
                  Alex Rivera
                </h4>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  Pro
                </Badge>
              </div>
              <p className="text-sm text-[var(--riff-text-secondary)]">@alexrivera</p>
              <p className="text-sm text-[var(--riff-text-muted)]">alex@riffradio.com</p>
              <p className="text-xs text-[var(--riff-text-faint)]">Joined March 12, 2024</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="size-3.5" data-icon="inline-start" />
              Edit Profile
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[var(--riff-text-muted)]">
              <LogOut className="size-3.5" data-icon="inline-start" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
              Library hours
            </p>
            <p className="mt-1 font-display text-lg font-bold text-[var(--riff-text-primary)]">
              142 hrs
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
              Exports this month
            </p>
            <p className="mt-1 font-display text-lg font-bold text-[var(--riff-text-primary)]">
              18
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
              Storage used
            </p>
            <p className="mt-1 font-display text-lg font-bold text-[var(--riff-text-primary)]">
              24.6 GB / 100 GB
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
