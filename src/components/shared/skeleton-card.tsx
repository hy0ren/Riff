import { cn } from '@/lib/utils'

export interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'riff-skeleton-card rounded-xl',
        className,
      )}
      aria-hidden
    >
      <div className="riff-skeleton-card__shimmer" />
    </div>
  )
}
