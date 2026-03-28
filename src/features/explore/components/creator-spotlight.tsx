import { Button } from '@/components/ui/button'
import type { Creator } from '@/domain/explore'
import { Radio, UserPlus } from 'lucide-react'

interface CreatorSpotlightProps {
  creators: Creator[]
  onView: (id: string) => void
  onFollow: (id: string) => void
  onRadio: (id: string) => void
}

export function CreatorSpotlight({ creators, onView, onFollow, onRadio }: CreatorSpotlightProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {creators.map((creator) => (
        <div
          key={creator.id}
          className="group flex w-48 shrink-0 cursor-pointer flex-col items-center gap-3 rounded-xl p-4 text-center transition-colors hover:bg-[var(--riff-surface-mid)]"
          style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
          onClick={() => onView(creator.id)}
        >
          <img
            src={creator.avatar}
            alt={creator.name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-[var(--riff-surface-highest)]"
          />
          <div>
            <p className="text-sm font-bold text-[var(--riff-text-primary)]">{creator.name}</p>
            <p className="mt-0.5 text-[11px] text-[var(--riff-text-muted)]">{creator.genres.join(' · ')}</p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-sm font-bold text-[var(--riff-text-primary)]">{creator.trackCount}</p>
              <p className="text-[10px] text-[var(--riff-text-faint)]">tracks</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--riff-text-primary)]">{(creator.followerCount / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-[var(--riff-text-faint)]">followers</p>
            </div>
          </div>
          <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              onClick={(e) => { e.stopPropagation(); onFollow(creator.id) }}
              size="sm"
              variant="outline"
              className="h-7 gap-1 rounded-lg px-2.5 text-[11px] font-semibold"
            >
              <UserPlus className="h-3 w-3" /> Follow
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); onRadio(creator.id) }}
              size="sm"
              variant="ghost"
              className="h-7 w-7 rounded-lg p-0 text-[var(--riff-text-muted)]"
            >
              <Radio className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
