import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'ghost' | 'outline'
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl text-center"
      style={{
        background: 'var(--riff-surface-low)',
        border: '1px solid rgba(255,255,255,0.04)',
        padding: compact ? '2rem 1.5rem' : '3.5rem 2rem',
      }}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'var(--riff-surface-mid)' }}
      >
        <Icon className="h-6 w-6 text-[var(--riff-text-faint)]" />
      </div>
      <h3 className="font-display text-sm font-bold text-[var(--riff-text-primary)]">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[12px] leading-relaxed text-[var(--riff-text-muted)]">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-5 flex items-center gap-2">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant ?? 'default'}
              size="sm"
              className="h-8 rounded-lg px-4 text-[12px] font-semibold"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant ?? 'ghost'}
              size="sm"
              className="h-8 rounded-lg px-4 text-[12px] font-semibold text-[var(--riff-text-muted)]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
