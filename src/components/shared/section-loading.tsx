import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg', className)}
      style={{ background: 'var(--riff-surface-mid)' }}
    />
  )
}

export function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Bone className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-3 w-2/3" />
            <Bone className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({ cols = 4, rows = 2 }: { cols?: number; rows?: number }) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl"
          style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <Bone className="h-36 w-full rounded-b-none rounded-t-xl" />
          <div className="space-y-2 p-3">
            <Bone className="h-3 w-3/4" />
            <Bone className="h-2.5 w-1/2" />
            <div className="flex gap-1.5 pt-1">
              <Bone className="h-4 w-12 rounded-md" />
              <Bone className="h-4 w-10 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl"
      style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="flex gap-8 p-8">
        <Bone className="h-48 w-48 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col justify-center gap-3">
          <Bone className="h-4 w-24 rounded-md" />
          <Bone className="h-6 w-2/3" />
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-4/5" />
          <div className="flex gap-2 pt-3">
            <Bone className="h-5 w-16 rounded-md" />
            <Bone className="h-5 w-14 rounded-md" />
            <Bone className="h-5 w-18 rounded-md" />
          </div>
          <div className="flex gap-3 pt-4">
            <Bone className="h-9 w-24 rounded-lg" />
            <Bone className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
