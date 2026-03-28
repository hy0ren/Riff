import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface InlineErrorAction {
  label: string
  onClick: () => void
}

interface InlineErrorProps {
  title: string
  description: string
  retryAction?: InlineErrorAction
  secondaryAction?: InlineErrorAction
}

export function InlineError({ title, description, retryAction, secondaryAction }: InlineErrorProps) {
  return (
    <div
      className="flex items-start gap-3.5 rounded-xl p-4"
      style={{
        background: 'rgba(255,107,107,0.06)',
        border: '1px solid rgba(255,107,107,0.15)',
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'rgba(255,107,107,0.1)' }}
      >
        <AlertTriangle className="h-4.5 w-4.5 text-[#ff6b6b]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--riff-text-primary)]">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--riff-text-muted)]">{description}</p>
        {(retryAction || secondaryAction) && (
          <div className="mt-3 flex items-center gap-2">
            {retryAction && (
              <Button
                onClick={retryAction.onClick}
                size="sm"
                className="h-7 rounded-md px-3 text-[11px] font-semibold"
              >
                {retryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="ghost"
                size="sm"
                className="h-7 rounded-md px-3 text-[11px] text-[var(--riff-text-muted)]"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
