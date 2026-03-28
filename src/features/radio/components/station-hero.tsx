import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { RadioStation } from '@/domain/radio'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  BookmarkCheck,
  Music2,
  Pause,
  Play,
  Plus,
  Settings2,
  Share2,
  Sparkles,
} from 'lucide-react'

interface StationHeroProps {
  station: RadioStation
  onPlayPause: () => void
  onSave: () => void
  onTune: () => void
  onNewStation: () => void
  onShare: () => void
}

const TYPE_LABELS: Record<RadioStation['type'], string> = {
  personal: 'Personal Station',
  'track-based': 'Track-Based Radio',
  blueprint: 'Blueprint Radio',
  community: 'Community Station',
  'spotify-playlist': 'Spotify Playlist Radio',
  'imported-taste': 'Imported Taste Radio',
}

const TYPE_COLORS: Record<RadioStation['type'], string> = {
  personal: 'bg-[#1275e2]/20 text-[#aac7ff] border-[#1275e2]/30',
  'track-based': 'bg-[#1275e2]/20 text-[#aac7ff] border-[#1275e2]/30',
  blueprint: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  community: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'spotify-playlist': 'bg-[#1db954]/15 text-[#1db954] border-[#1db954]/25',
  'imported-taste': 'bg-violet-500/15 text-violet-300 border-violet-500/25',
}

const VIBE_TAG_COLORS: Record<string, string> = {
  genre: 'bg-[var(--riff-surface-high)] text-[var(--riff-text-secondary)]',
  mood: 'bg-amber-500/10 text-amber-300/80',
  bpm: 'bg-[#1275e2]/10 text-[#aac7ff]/80',
  vocal: 'bg-violet-500/10 text-violet-300/80',
  instrument: 'bg-emerald-500/10 text-emerald-300/80',
  energy: 'bg-rose-500/10 text-rose-300/80',
}

export function StationHero({
  station,
  onPlayPause,
  onSave,
  onTune,
  onNewStation,
  onShare,
}: StationHeroProps) {
  const gradientFrom = station.artworkGradient?.[0] ?? '#0d1a2e'
  const gradientTo = station.artworkGradient?.[1] ?? '#060e1d'

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ minHeight: 220 }}
    >
      {/* Layered background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        }}
      />
      {/* Station artwork color bleed */}
      {station.artworkUrl && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${station.artworkUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) saturate(1.4)',
          }}
        />
      )}
      {/* Accent glow blobs */}
      <div
        className="absolute -top-16 right-40 h-64 w-64 rounded-full opacity-20 blur-[80px]"
        style={{ background: 'var(--riff-accent)' }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-40 w-80 rounded-full opacity-10 blur-[60px]"
        style={{ background: '#5f78a3' }}
      />
      {/* Bottom fade to content */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--riff-base))' }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-end gap-7 px-8 pb-7 pt-8">
        {/* Station artwork */}
        <div className="shrink-0">
          {station.artworkUrl ? (
            <img
              src={station.artworkUrl}
              alt={station.title}
              className="h-24 w-24 rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
            />
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-xl shadow-2xl ring-1 ring-white/10"
              style={{
                background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              }}
            >
              <Music2 className="h-10 w-10 text-white/30" />
            </div>
          )}
          {/* Live pulse indicator */}
          {station.isPlaying && (
            <div className="mt-2 flex items-center justify-center gap-1.5">
              {[0.5, 1, 0.7, 0.9, 0.4].map((h, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-[var(--riff-accent)]"
                  style={{
                    height: `${h * 14}px`,
                    animation: `pulse ${0.8 + i * 0.15}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Station identity */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Type badge + seed */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                'border text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
                TYPE_COLORS[station.type]
              )}
            >
              {station.type === 'spotify-playlist' && (
                <span className="mr-1 font-bold text-[#1db954]">♫</span>
              )}
              {TYPE_LABELS[station.type]}
            </Badge>
            <span className="flex items-center gap-1 text-[11px] text-[var(--riff-text-muted)]">
              <Sparkles className="h-3 w-3 shrink-0" />
              {station.seedExplanation}
            </span>
          </div>

          {/* Title + description */}
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight text-[var(--riff-text-primary)]">
              {station.title}
            </h1>
            <p className="mt-1 max-w-lg text-sm text-[var(--riff-text-muted)]">
              {station.description}
            </p>
          </div>

          {/* Vibe tags */}
          <div className="flex flex-wrap gap-1.5">
            {station.vibeTags.map((tag) => (
              <span
                key={tag.label}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[11px] font-medium',
                  VIBE_TAG_COLORS[tag.type ?? 'genre']
                )}
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* Station meta */}
          <p className="text-[11px] text-[var(--riff-text-faint)]">
            {station.freshnessLabel}
          </p>
        </div>

        {/* Primary controls */}
        <div className="flex shrink-0 flex-col items-end gap-3">
          {/* Play / Pause */}
          <Button
            onClick={onPlayPause}
            className="h-12 w-12 rounded-full p-0 shadow-lg transition-all hover:scale-105"
            style={{
              background: station.isPlaying
                ? 'var(--riff-surface-bright)'
                : 'var(--riff-accent)',
              boxShadow: station.isPlaying
                ? 'none'
                : '0 0 24px var(--riff-glow-strong)',
            }}
          >
            {station.isPlaying ? (
              <Pause className="h-5 w-5 fill-current text-[var(--riff-text-primary)]" />
            ) : (
              <Play className="h-5 w-5 fill-current text-white" />
            )}
          </Button>

          {/* Secondary controls row */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSave}
                  className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-primary)]"
                >
                  {station.isSaved ? (
                    <BookmarkCheck className="h-4 w-4 text-[var(--riff-accent-light)]" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{station.isSaved ? 'Saved' : 'Save station'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onTune}
                  className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-primary)]"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tune station</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNewStation}
                  className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-primary)]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New station</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onShare}
                  className="h-8 w-8 rounded-lg text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-text-primary)]"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share station</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
