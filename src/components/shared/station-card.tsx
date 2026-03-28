import { Radio, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StationCardProps {
  title: string
  description: string
  listeners: number
  className?: string
}

export function StationCard({ title, description, listeners, className }: StationCardProps) {
  return (
    <Card 
      className={cn(
        "group cursor-pointer border-transparent bg-[var(--riff-surface-low)] hover:bg-[var(--riff-surface-mid)] transition-colors",
        className
      )}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* Play icon / Thumbnail */}
        <div className="h-10 w-10 shrink-0 rounded-lg bg-[var(--riff-surface-high)] flex items-center justify-center group-hover:text-[var(--riff-accent-light)] transition-colors">
          <Radio className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <h5 className="truncate font-semibold text-[13px] text-[var(--riff-text-primary)]">
            {title}
          </h5>
          <p className="truncate text-[11px] text-[var(--riff-text-muted)]">
            {description}
          </p>
        </div>

        {/* Listener count */}
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--riff-text-faint)] bg-[var(--riff-surface-highest)] px-2 py-0.5 rounded-full">
          <Users className="h-3 w-3" />
          <span>{listeners.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
