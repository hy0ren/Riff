import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EmptyStateAction {
  label: string
  onClick: () => void
}

export interface EmptyStateProps {
  /** Visual anchor — pass an icon, illustration, or small composition */
  icon: ReactNode
  title: string
  description: string
  action?: EmptyStateAction
  /** Tighter padding for nested panels */
  compact?: boolean
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] text-center shadow-[0_0_0_1px_var(--riff-glow)_inset]',
        compact ? 'px-6 py-10' : 'px-8 py-14 sm:px-12',
        className,
      )}
    >
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-mid)] text-[var(--riff-accent-dim)]"
        style={{ boxShadow: '0 0 24px var(--riff-glow)' }}
      >
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold tracking-tight text-[var(--riff-text-primary)]">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--riff-text-muted)]">
        {description}
      </p>
      {action ? (
        <Button
          type="button"
          onClick={action.onClick}
          size="sm"
          className="mt-6 h-9 rounded-lg bg-[var(--riff-accent)] px-5 text-[12px] font-semibold text-white shadow-[0_0_20px_var(--riff-glow-strong)] hover:bg-[var(--riff-accent)]/90"
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
