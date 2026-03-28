import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ExploreTrack, TrackBadge } from '@/domain/explore'
import { cn } from '@/lib/utils'
import { Bookmark, Play, Wand2 } from 'lucide-react'

interface DiscoverTrackCardProps {
  track: ExploreTrack
  onPlay: () => void
  onSave: () => void
  onRemix: () => void
  onOpen: () => void
}

const BADGE_STYLES: Record<TrackBadge, string> = {
  trending: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  remixable: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  rising: 'bg-[#1275e2]/15 text-[#aac7ff] border-[#1275e2]/25',
  'staff-pick': 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  new: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
}

const BADGE_LABELS: Record<TrackBadge, string> = {
  trending: 'Trending',
  remixable: 'Remixable',
  rising: 'Rising',
  'staff-pick': 'Staff Pick',
  new: 'New',
}

export function DiscoverTrackCard({ track, onPlay, onSave, onRemix, onOpen }: DiscoverTrackCardProps) {
  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl transition-colors hover:bg-[var(--riff-surface-mid)]"
      style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
      onClick={onOpen}
    >
      {/* Artwork */}
      <div className="relative">
        <img src={track.coverUrl} alt={track.title} className="h-40 w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            onClick={(e) => { e.stopPropagation(); onPlay() }}
            className="h-11 w-11 rounded-full p-0 shadow-lg"
            style={{ background: 'var(--riff-accent)' }}
          >
            <Play className="h-4.5 w-4.5 fill-current text-white" />
          </Button>
        </div>
        {track.badges.length > 0 && (
          <div className="absolute left-2 top-2 flex gap-1">
            {track.badges.slice(0, 2).map((badge) => (
              <Badge key={badge} className={cn('border px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider', BADGE_STYLES[badge])}>
                {BADGE_LABELS[badge]}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--riff-text-primary)]">{track.title}</p>
            <p className="mt-0.5 truncate text-[12px] text-[var(--riff-text-muted)]">{track.creator}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSave() }} className="h-7 w-7 rounded-md text-[var(--riff-text-faint)] hover:text-[var(--riff-text-muted)]">
                  <Bookmark className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save</TooltipContent>
            </Tooltip>
            {track.isRemixable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRemix() }} className="h-7 w-7 rounded-md text-[var(--riff-text-faint)] hover:text-[var(--riff-accent-light)]">
                    <Wand2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remix</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded bg-[var(--riff-surface-high)] px-1.5 py-0 text-[10px] text-[var(--riff-text-muted)]">{track.genre}</span>
          <span className="rounded bg-[var(--riff-surface-high)] px-1.5 py-0 text-[10px] text-[var(--riff-text-muted)]">{track.bpm} BPM</span>
          <span className="rounded bg-[var(--riff-surface-high)] px-1.5 py-0 text-[10px] text-[var(--riff-text-muted)]">{track.mood}</span>
        </div>
        <p className="mt-2 text-[10px] text-[var(--riff-text-faint)]">
          {track.plays.toLocaleString()} plays{track.remixCount > 0 ? ` · ${track.remixCount} remixes` : ''}
        </p>
      </div>
    </div>
  )
}
