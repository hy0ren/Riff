import type { SourceInputType } from '@/domain/source-input'
import { CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SourceCardProps {
  type: SourceInputType
  label: string
  description: string
  icon: LucideIcon
  selected?: boolean
  onClick: () => void
}
export function SourceCard({
  type: _type, // ignore unused var if needed
  label,
  description,
  icon: Icon,
  selected = false,
  onClick
}: SourceCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-4 rounded-2xl p-6 text-center transition-all duration-300",
        "bg-[var(--riff-surface-low)] hover:bg-[var(--riff-surface-high)] border-transparent",
        selected 
          ? "border-[2px] border-[var(--riff-accent)] shadow-[0_0_30px_rgba(18,117,226,0.15)] bg-[var(--riff-surface-high)]"
          : "hover:scale-[1.02]"
      )}
    >
      {/* Icon frame */}
      <div 
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
          selected 
            ? "bg-[var(--riff-accent)] text-white shadow-[0_0_20px_var(--riff-glow)]" 
            : "bg-[var(--riff-surface-mid)] text-[var(--riff-text-muted)] group-hover:text-[var(--riff-text-primary)]"
        )}
      >
        <Icon className={cn("h-7 w-7", selected ? "scale-110" : "group-hover:scale-105")} />
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-1.5">
        <span className={cn(
          "font-display text-sm font-bold tracking-tight",
          selected ? "text-[var(--riff-text-primary)]" : "text-[var(--riff-text-secondary)]"
        )}>
          {label}
        </span>
        <p className="text-[11px] leading-relaxed text-[var(--riff-text-muted)] opacity-80 group-hover:opacity-100 transition-opacity">
          {description}
        </p>
      </div>

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-3 right-3 text-[var(--riff-accent-light)] animate-in zoom-in duration-200">
          <CheckCircle2 className="h-5 w-5 fill-[var(--riff-surface-high)]" />
        </div>
      )}
      
      {/* Subtle bottom glow in selected mode */}
      {selected && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1/2 blur-lg bg-[var(--riff-accent)] opacity-40 rounded-full" />
      )}
    </button>
  )
}
