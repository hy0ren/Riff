import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useShellStore } from '@/stores/use-shell-store'
import { cn } from '@/lib/utils'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function GlobalPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    togglePlayback,
    setCurrentTime,
    setVolume,
  } = useShellStore()

  const hasTrack = !!currentTrack
  const progress = hasTrack && currentTrack.duration > 0
    ? (currentTime / currentTrack.duration) * 100
    : 0

  return (
    <div className={cn(
      'grid h-full grid-cols-[minmax(200px,1fr)_2fr_minmax(160px,1fr)] items-center gap-4 px-4',
      !hasTrack && 'opacity-50'
    )}>
      {/* Left — Track info */}
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Cover art */}
        <div
          className="h-10 w-10 shrink-0 overflow-hidden rounded-md"
          style={{ background: 'var(--riff-surface-high)' }}
        >
          {currentTrack?.artUrl ? (
            <img
              src={currentTrack.artUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ListMusic className="h-4 w-4 text-[var(--riff-text-faint)]" />
            </div>
          )}
        </div>

        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-xs font-medium text-[var(--riff-text-primary)]">
            {currentTrack?.title ?? 'No track playing'}
          </span>
          <span className="truncate text-[10px] text-[var(--riff-text-muted)]">
            {currentTrack?.artist ?? 'Riff Radio'}
          </span>
        </div>

        {hasTrack && (
          <Button variant="ghost" size="icon-xs" className="shrink-0 text-[var(--riff-text-muted)] hover:text-[var(--riff-accent-light)]">
            <Heart className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Center — Transport controls + scrubber */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" className="text-[var(--riff-text-muted)] hover:text-[var(--riff-text-primary)]" disabled={!hasTrack}>
            <Shuffle className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-[var(--riff-text-secondary)] hover:text-[var(--riff-text-primary)]" disabled={!hasTrack}>
            <SkipBack className="h-3.5 w-3.5" />
          </Button>

          {/* Play/Pause — primary action */}
          <Button
            variant="default"
            size="icon"
            className="rounded-full"
            style={{
              background: hasTrack ? 'var(--riff-accent)' : 'var(--riff-surface-highest)',
              boxShadow: hasTrack ? '0 0 16px var(--riff-glow)' : 'none',
            }}
            onClick={togglePlayback}
            disabled={!hasTrack}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-px" />
            )}
          </Button>

          <Button variant="ghost" size="icon-sm" className="text-[var(--riff-text-secondary)] hover:text-[var(--riff-text-primary)]" disabled={!hasTrack}>
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" className="text-[var(--riff-text-muted)] hover:text-[var(--riff-text-primary)]" disabled={!hasTrack}>
            <Repeat className="h-3 w-3" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="flex w-full max-w-md items-center gap-2">
          <span className="w-8 text-right text-[10px] tabular-nums text-[var(--riff-text-muted)]">
            {hasTrack ? formatTime(currentTime) : '0:00'}
          </span>
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={([val]) => {
              if (currentTrack) {
                setCurrentTime((val / 100) * currentTrack.duration)
              }
            }}
            disabled={!hasTrack}
            className="flex-1 [&_[data-slot=slider-range]]:bg-[var(--riff-accent)] [&_[data-slot=slider-thumb]]:h-2.5 [&_[data-slot=slider-thumb]]:w-2.5 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-[var(--riff-surface-highest)]"
          />
          <span className="w-8 text-[10px] tabular-nums text-[var(--riff-text-muted)]">
            {hasTrack ? formatTime(currentTrack.duration) : '0:00'}
          </span>
        </div>
      </div>

      {/* Right — Volume + utility */}
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-[var(--riff-text-muted)] hover:text-[var(--riff-text-primary)]"
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
        >
          {volume === 0 ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </Button>
        <Slider
          value={[volume * 100]}
          max={100}
          step={1}
          onValueChange={([val]) => setVolume(val / 100)}
          className="w-20 [&_[data-slot=slider-range]]:bg-[var(--riff-accent-light)] [&_[data-slot=slider-thumb]]:h-2 [&_[data-slot=slider-thumb]]:w-2 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:h-0.5 [&_[data-slot=slider-track]]:bg-[var(--riff-surface-highest)]"
        />
        <Button variant="ghost" size="icon-xs" className="text-[var(--riff-text-muted)] hover:text-[var(--riff-text-primary)]">
          <ListMusic className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
