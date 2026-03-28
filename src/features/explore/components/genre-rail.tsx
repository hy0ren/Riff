import type { GenreRailItem } from '@/domain/explore'
import { Music2 } from 'lucide-react'

interface GenreRailProps {
  items: GenreRailItem[]
  onSelect: (id: string) => void
}

export function GenreRail({ items, onSelect }: GenreRailProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className="group flex h-28 w-44 shrink-0 flex-col justify-end overflow-hidden rounded-xl p-3.5 transition-transform hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Music2 className="mb-auto h-5 w-5 text-white/20 transition-colors group-hover:text-white/40" />
          <p className="text-sm font-bold text-[var(--riff-text-primary)]">{item.label}</p>
          <p className="text-[10px] text-[var(--riff-text-muted)]">{item.trackCount} tracks</p>
        </button>
      ))}
    </div>
  )
}
