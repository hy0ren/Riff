import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ExploreTrack } from '@/domain/explore'
import { Play, BookOpen, Wand2, ArrowRight } from 'lucide-react'

interface ExploreHeroProps {
  track: ExploreTrack
  onPlay: () => void
  onViewTrack: () => void
  onRemix: () => void
  onOpenLearn: () => void
}

export function ExploreHero({ track, onPlay, onViewTrack, onRemix, onOpenLearn }: ExploreHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ background: 'var(--riff-surface-low)' }}>
      {/* Blurred artwork backdrop */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `url(${track.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(50px) saturate(1.5)',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(6,14,29,0.85), rgba(11,19,34,0.95))' }} />

      <div className="relative z-10 flex gap-8 p-8">
        {/* Cover art */}
        <div className="shrink-0">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="h-52 w-52 rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-center gap-3">
          <div className="flex items-center gap-2">
            <Badge className="border border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Featured Track
            </Badge>
            {track.badges.includes('staff-pick') && (
              <Badge className="border border-[var(--riff-accent)]/30 bg-[var(--riff-accent)]/10 px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider text-[var(--riff-accent-light)]">
                Staff Pick
              </Badge>
            )}
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--riff-text-primary)]">
            {track.title}
          </h2>

          <div className="flex items-center gap-3">
            <img src={track.creatorAvatar} alt="" className="h-6 w-6 rounded-full ring-1 ring-white/10" />
            <span className="text-sm font-medium text-[var(--riff-text-secondary)]">{track.creator}</span>
            <span className="text-[12px] text-[var(--riff-text-faint)]">
              {track.plays.toLocaleString()} plays · {track.remixCount} remixes
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="rounded-md bg-[var(--riff-surface-high)] px-2 py-0.5 text-[11px] text-[var(--riff-text-secondary)]">{track.genre}</span>
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300/80">{track.mood}</span>
            <span className="rounded-md bg-[#1275e2]/10 px-2 py-0.5 text-[11px] text-[#aac7ff]/80">{track.bpm} BPM</span>
            <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-300/80">
              {track.hasVocals ? 'Vocals' : 'Instrumental'}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button onClick={onPlay} className="h-10 gap-2 rounded-xl px-5 text-sm font-bold shadow-lg" style={{ background: 'var(--riff-accent)', boxShadow: '0 0 20px var(--riff-glow)' }}>
              <Play className="h-4 w-4 fill-current" /> Play
            </Button>
            <Button onClick={onViewTrack} variant="ghost" className="h-10 gap-2 rounded-xl px-4 text-sm font-semibold text-[var(--riff-text-secondary)] hover:bg-[var(--riff-surface-high)]">
              View Track <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={onRemix} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-accent-light)]">
              <Wand2 className="h-4 w-4" />
            </Button>
            <Button onClick={onOpenLearn} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-high)] hover:text-[var(--riff-accent-light)]">
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
