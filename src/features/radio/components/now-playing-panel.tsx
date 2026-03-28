import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { RadioTrack, ReasonType } from '@/domain/radio'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  PlusCircle,
  SkipForward,
  ThumbsDown,
  ThumbsUp,
  Wand2,
} from 'lucide-react'

interface NowPlayingPanelProps {
  track: RadioTrack
  isPlaying: boolean
  onLike: () => void
  onDislike: () => void
  onSave: () => void
  onRemix: () => void
  onMoreLikeThis: () => void
  onSkip: () => void
  onSeek: (seconds: number) => void
}

const REASON_STYLES: Record<ReasonType, string> = {
  mood: 'bg-amber-500/10 text-amber-300/90 border-amber-500/20',
  bpm: 'bg-[#1275e2]/10 text-[#aac7ff]/90 border-[#1275e2]/20',
  creator: 'bg-violet-500/10 text-violet-300/90 border-violet-500/20',
  genre: 'bg-emerald-500/10 text-emerald-300/90 border-emerald-500/20',
  taste: 'bg-rose-500/10 text-rose-300/90 border-rose-500/20',
  blueprint: 'bg-sky-500/10 text-sky-300/90 border-sky-500/20',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function NowPlayingPanel({
  track,
  isPlaying,
  onLike,
  onDislike,
  onSave,
  onRemix,
  onMoreLikeThis,
  onSkip,
  onSeek,
}: NowPlayingPanelProps) {
  const progress = (track.progressSeconds / track.duration) * 100

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--riff-surface-low)' }}
    >
      <div className="flex gap-6">
        {/* Cover art */}
        <div className="relative shrink-0">
          <img
            src={track.coverUrl}
            alt={track.title}
            className={cn(
              'h-40 w-40 rounded-xl object-cover shadow-2xl ring-1 ring-white/10 transition-all duration-500',
              isPlaying && 'shadow-[0_0_28px_var(--riff-glow-strong)]'
            )}
          />
          {/* Playing pulse overlay */}
          {isPlaying && (
            <div
              className="absolute inset-0 rounded-xl opacity-20"
              style={{
                background: 'radial-gradient(circle at center, var(--riff-accent) 0%, transparent 70%)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          )}
        </div>

        {/* Track info + controls */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Title + reason */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display truncate text-xl font-bold text-[var(--riff-text-primary)]">
                  {track.title}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--riff-text-muted)]">{track.creator}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSkip}
                    className="h-8 w-8 shrink-0 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-primary)]"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Skip track</TooltipContent>
              </Tooltip>
            </div>

            {/* Why playing reason tag */}
            <div className="mt-2.5">
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
                  REASON_STYLES[track.reason.type]
                )}
              >
                {track.reason.text}
              </span>
            </div>
          </div>

          {/* Metadata tags */}
          <div className="flex flex-wrap gap-1.5">
            {track.tags.map((tag) => (
              <span
                key={tag.label}
                className="rounded-md bg-[var(--riff-surface-high)] px-2 py-0.5 text-[11px] text-[var(--riff-text-muted)]"
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* Scrubber */}
          <div className="space-y-1.5">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={([v]) => onSeek(Math.round((v / 100) * track.duration))}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-[var(--riff-text-faint)]">
              <span>{formatTime(track.progressSeconds)}</span>
              <span>{formatTime(track.duration)}</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLike}
                  className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-emerald-400"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Like this track</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDislike}
                  className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-rose-400"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Don't play again</TooltipContent>
            </Tooltip>

            <div className="mx-2 h-4 w-px bg-[var(--riff-surface-highest)]" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSave}
                  className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-primary)]"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save to library</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRemix}
                  className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-accent-light)]"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remix in Studio</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMoreLikeThis}
                  className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-primary)]"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Play more like this</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
