import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { RadioStation } from '@/domain/radio'
import { cn } from '@/lib/utils'
import { Bookmark, BookmarkCheck, MoreHorizontal, Music2, Play, Share2 } from 'lucide-react'

interface SavedStationsProps {
  stations: RadioStation[]
  onLaunch: (id: string) => void
  onSave: (id: string) => void
}

const TYPE_BADGE: Record<RadioStation['type'], { label: string; className: string }> = {
  personal: {
    label: 'Personal',
    className: 'bg-[#1275e2]/15 text-[#aac7ff] border-[#1275e2]/25',
  },
  'track-based': {
    label: 'Track Radio',
    className: 'bg-[#1275e2]/15 text-[#aac7ff] border-[#1275e2]/25',
  },
  blueprint: {
    label: 'Blueprint',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  },
  community: {
    label: 'Community',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  },
  'spotify-playlist': {
    label: 'Spotify',
    className: 'bg-[#1db954]/15 text-[#1db954] border-[#1db954]/20',
  },
  'imported-taste': {
    label: 'Imported Taste',
    className: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  },
}

interface StationCardProps {
  station: RadioStation
  onLaunch: () => void
  onSave: () => void
}

function StationCard({ station, onLaunch, onSave }: StationCardProps) {
  const badge = TYPE_BADGE[station.type]
  const gradientFrom = station.artworkGradient?.[0] ?? '#131c2b'
  const gradientTo = station.artworkGradient?.[1] ?? '#060e1d'

  return (
    <div
      className="group relative flex flex-col gap-3 rounded-xl p-3.5 transition-colors hover:bg-[var(--riff-surface-high)]"
      style={{ background: 'var(--riff-surface-mid)' }}
    >
      {/* Artwork */}
      <div className="relative">
        {station.artworkUrl ? (
          <img
            src={station.artworkUrl}
            alt={station.title}
            className="h-28 w-full rounded-lg object-cover ring-1 ring-white/05"
          />
        ) : (
          <div
            className="flex h-28 w-full items-center justify-center rounded-lg ring-1 ring-white/05"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            }}
          >
            <Music2 className="h-8 w-8 text-white/20" />
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            onClick={onLaunch}
            className="h-10 w-10 rounded-full p-0 shadow-lg"
            style={{ background: 'var(--riff-accent)' }}
          >
            <Play className="h-4 w-4 fill-current text-white" />
          </Button>
        </div>

        {/* Type badge */}
        <Badge
          className={cn(
            'absolute left-2 top-2 border px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider',
            badge.className
          )}
        >
          {badge.label}
        </Badge>
      </div>

      {/* Station info */}
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="truncate text-sm font-semibold text-[var(--riff-text-primary)]">
            {station.title}
          </p>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSave}
              className="h-6 w-6 rounded-md text-[var(--riff-text-faint)] hover:text-[var(--riff-text-muted)]"
            >
              {station.isSaved ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-[var(--riff-accent-light)]" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md text-[var(--riff-text-faint)] hover:text-[var(--riff-text-muted)]"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onLaunch}>
                  <Play className="mr-2 h-3.5 w-3.5" />
                  Launch station
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-3.5 w-3.5" />
                  Share station
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--riff-text-faint)]">
          {station.description}
        </p>
        <p className="mt-1.5 text-[10px] text-[var(--riff-text-faint)]">
          {station.freshnessLabel}
        </p>
      </div>
    </div>
  )
}

export function SavedStations({ stations, onLaunch, onSave }: SavedStationsProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--riff-surface-low)' }}
    >
      <h3 className="font-display mb-4 text-sm font-bold text-[var(--riff-text-primary)]">
        Stations
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {stations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            onLaunch={() => onLaunch(station.id)}
            onSave={() => onSave(station.id)}
          />
        ))}
      </div>
    </div>
  )
}
