import { Button } from '@/components/ui/button'
import type { HistoryItem, StationType } from '@/domain/radio'
import { cn } from '@/lib/utils'
import { Music, Play, Radio } from 'lucide-react'

interface ListeningHistoryProps {
  items: HistoryItem[]
  onRelaunch: (item: HistoryItem) => void
}

const STATION_TYPE_COLORS: Record<StationType, string> = {
  personal: 'text-[#aac7ff]',
  'track-based': 'text-[#aac7ff]',
  blueprint: 'text-emerald-400',
  community: 'text-amber-400',
  'spotify-playlist': 'text-[#1db954]',
  'imported-taste': 'text-violet-400',
}

function timeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function HistoryRow({ item, onRelaunch }: { item: HistoryItem; onRelaunch: () => void }) {
  const gradientFrom = item.artworkGradient?.[0] ?? '#131c2b'
  const gradientTo = item.artworkGradient?.[1] ?? '#060e1d'

  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--riff-surface-mid)] transition-colors">
      {/* Artwork / icon */}
      <div className="relative shrink-0">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title}
            className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/05"
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-white/05"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            {item.itemType === 'station' ? (
              <Radio className="h-4 w-4 text-white/30" />
            ) : (
              <Music className="h-4 w-4 text-white/30" />
            )}
          </div>
        )}
        {/* Item type indicator dot */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-[var(--riff-surface-mid)] flex items-center justify-center',
            item.itemType === 'station'
              ? 'bg-[var(--riff-surface-highest)]'
              : 'bg-[var(--riff-surface-highest)]'
          )}
        >
          {item.itemType === 'station' ? (
            <Radio className="h-1.5 w-1.5 text-[var(--riff-text-faint)]" />
          ) : (
            <Music className="h-1.5 w-1.5 text-[var(--riff-text-faint)]" />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[var(--riff-text-secondary)]">
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={cn(
              'text-[10px] font-medium',
              item.stationType ? STATION_TYPE_COLORS[item.stationType] : 'text-[var(--riff-text-faint)]'
            )}
          >
            {item.sourceContext}
          </span>
          <span className="text-[10px] text-[var(--riff-text-faint)]">
            · {timeAgo(item.playedAt)}
          </span>
        </div>
      </div>

      {/* Relaunch */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRelaunch}
        className="h-7 w-7 shrink-0 rounded-md text-[var(--riff-text-faint)] opacity-0 transition-opacity hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-muted)] group-hover:opacity-100"
      >
        <Play className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function ListeningHistory({ items, onRelaunch }: ListeningHistoryProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--riff-surface-low)' }}
    >
      <h3 className="font-display mb-3 text-sm font-bold text-[var(--riff-text-primary)]">
        Recent
      </h3>
      <div className="space-y-0.5">
        {items.map((item) => (
          <HistoryRow
            key={item.id}
            item={item}
            onRelaunch={() => onRelaunch(item)}
          />
        ))}
      </div>
    </div>
  )
}
