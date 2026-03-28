import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'

type BannerStatus = 'generating' | 'saving' | 'syncing' | 'exporting'

interface StatusBannerProps {
  status: BannerStatus
  label: string
  progress?: number
  cancellable?: boolean
  onCancel?: () => void
}

const STATUS_ACCENTS: Record<BannerStatus, string> = {
  generating: 'var(--riff-accent)',
  saving: '#10b981',
  syncing: '#1db954',
  exporting: '#a78bfa',
}

export function StatusBanner({ status, label, progress, cancellable, onCancel }: StatusBannerProps) {
  const accent = STATUS_ACCENTS[status]

  return (
    <div
      className="relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3"
      style={{
        background: 'var(--riff-surface-low)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Animated accent bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5"
        style={{
          background: accent,
          width: progress != null ? `${progress}%` : '100%',
          boxShadow: `0 0 8px ${accent}`,
          transition: progress != null ? 'width 0.3s ease' : 'none',
          animation: progress == null ? 'pulse 2s ease-in-out infinite' : 'none',
        }}
      />

      <Loader2
        className="h-4 w-4 shrink-0 animate-spin"
        style={{ color: accent }}
      />
      <span className="flex-1 text-[12px] font-medium text-[var(--riff-text-secondary)]">
        {label}
      </span>
      {progress != null && (
        <span className="text-[11px] tabular-nums text-[var(--riff-text-faint)]">
          {Math.round(progress)}%
        </span>
      )}
      {cancellable && onCancel && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-6 w-6 rounded-md text-[var(--riff-text-faint)] hover:text-[var(--riff-text-muted)]"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
