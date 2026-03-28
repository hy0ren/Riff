import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { QueueItem, ReasonType } from '@/domain/radio'
import { cn } from '@/lib/utils'
import {
  ArrowUpToLine,
  MoreHorizontal,
  Radio,
  ThumbsDown,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'

interface StationQueueProps {
  items: QueueItem[]
  onSkip: (id: string) => void
  onRemove: (id: string) => void
  onPinNext: (id: string) => void
  onDislike: (id: string) => void
  onRemix: (id: string) => void
  onStartStationFrom: (id: string) => void
  onClearQueue: () => void
}

const REASON_STYLES: Record<ReasonType, string> = {
  mood: 'bg-amber-500/10 text-amber-300/80',
  bpm: 'bg-[#1275e2]/10 text-[#aac7ff]/80',
  creator: 'bg-violet-500/10 text-violet-300/80',
  genre: 'bg-emerald-500/10 text-emerald-300/80',
  taste: 'bg-rose-500/10 text-rose-300/80',
  blueprint: 'bg-sky-500/10 text-sky-300/80',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StationQueue({
  items,
  onSkip,
  onRemove,
  onPinNext,
  onDislike,
  onRemix,
  onStartStationFrom,
  onClearQueue,
}: StationQueueProps) {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{ background: 'var(--riff-surface-low)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-bold text-[var(--riff-text-primary)]">
            Up Next
          </h3>
          <span className="rounded-md bg-[var(--riff-surface-high)] px-1.5 py-0.5 text-[11px] text-[var(--riff-text-faint)]">
            {items.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearQueue}
          className="h-7 px-2 text-[11px] text-[var(--riff-text-faint)] hover:text-[var(--riff-text-muted)]"
        >
          Clear queue
        </Button>
      </div>

      {/* Queue list */}
      <ScrollArea className="max-h-[340px]">
        <div className="py-1">
          {items.map((item) => (
            <QueueRow
              key={item.id}
              item={item}
              onSkip={() => onSkip(item.id)}
              onRemove={() => onRemove(item.id)}
              onPinNext={() => onPinNext(item.id)}
              onDislike={() => onDislike(item.id)}
              onRemix={() => onRemix(item.id)}
              onStartStationFrom={() => onStartStationFrom(item.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface QueueRowProps {
  item: QueueItem
  onSkip: () => void
  onRemove: () => void
  onPinNext: () => void
  onDislike: () => void
  onRemix: () => void
  onStartStationFrom: () => void
}

function QueueRow({
  item,
  onSkip,
  onRemove,
  onPinNext,
  onDislike,
  onRemix,
  onStartStationFrom,
}: QueueRowProps) {
  return (
    <div className="group flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--riff-surface-mid)] transition-colors">
      {/* Position / thumbnail */}
      <div className="relative shrink-0">
        <img
          src={item.coverUrl}
          alt={item.title}
          className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/05"
        />
        {item.isPinned && (
          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--riff-accent)]">
            <ArrowUpToLine className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-[var(--riff-text-primary)]">
            {item.title}
          </span>
          {item.isPinned && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--riff-accent-light)]">
              Next
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[12px] text-[var(--riff-text-muted)]">{item.creator}</span>
          <span
            className={cn(
              'rounded px-1.5 py-0 text-[10px] font-medium',
              REASON_STYLES[item.reason.type]
            )}
          >
            {item.reason.text}
          </span>
        </div>
      </div>

      {/* Duration + actions */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[12px] text-[var(--riff-text-faint)] transition-opacity group-hover:opacity-0">
          {formatTime(item.duration)}
        </span>

        {/* Action menu — visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 -mr-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkip}
            className="h-7 w-7 rounded-md text-[var(--riff-text-faint)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-muted)]"
          >
            <X className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-[var(--riff-text-faint)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-muted)]"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onPinNext}>
                <ArrowUpToLine className="mr-2 h-3.5 w-3.5" />
                Pin next
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemix}>
                <Wand2 className="mr-2 h-3.5 w-3.5" />
                Remix this track
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onStartStationFrom}>
                <Radio className="mr-2 h-3.5 w-3.5" />
                Start station from this
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDislike}>
                <ThumbsDown className="mr-2 h-3.5 w-3.5" />
                Don't play again
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Remove from queue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
