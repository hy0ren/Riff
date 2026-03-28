import type { PersistedProject } from '@/domain/project'
import { Badge } from '@/components/ui/badge'
import { 
  Music, Layers, Heart, Play, Mic2, Globe, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime, statusColor, statusLabel } from '../lib/library-utils'
import { usePlaybackStore } from '@/features/playback/store/use-playback-store'
import { getProjectVersion } from '@/features/projects/lib/project-selectors'
import { toProjectVersionTrack } from '@/features/playback/lib/playable-track'

interface LibraryProjectCardProps {
  project: PersistedProject
  isSelected?: boolean
  onClick?: () => void
  onDelete?: () => void
}

export function LibraryProjectCard({ project, isSelected, onClick, onDelete }: LibraryProjectCardProps) {
  const bp = project.blueprint
  const setTrack = usePlaybackStore((state) => state.setTrack)
  const activeVersion = getProjectVersion(project)

  return (
    <div 
      onClick={onClick}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer',
        'bg-[var(--riff-surface-low)] hover:bg-[var(--riff-surface-high)]',
        isSelected
          ? 'border-[var(--riff-accent)] shadow-[0_0_20px_rgba(18,117,226,0.15)]'
          : 'border-transparent hover:border-[var(--riff-surface-highest)]'
      )}
    >
      {/* Artwork */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--riff-surface)]">
        {project.coverUrl ?? project.artUrl ? (
          <img 
            src={project.coverUrl ?? project.artUrl} 
            alt="" 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--riff-surface)] to-[var(--riff-surface-lowest)]">
            <Music className="h-12 w-12 text-[var(--riff-text-faint)]" />
          </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              if (activeVersion?.audioUrl) {
                setTrack(toProjectVersionTrack(project, activeVersion))
              }
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl"
          >
            <Play className="h-5 w-5 ml-0.5 fill-current" />
          </button>
        </div>

        {/* Favorite */}
        {project.isFavorite && (
          <div className="absolute top-2.5 right-2.5">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500 drop-shadow-lg" />
          </div>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-red-500/20 bg-black/45 text-red-200 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20"
            aria-label={`Delete ${project.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        {/* Published Globe */}
        {project.isPublished && (
          <div className="absolute top-2.5 left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30">
            <Globe className="h-3 w-3 text-emerald-400" />
          </div>
        )}

        {/* Status */}
        <div className="absolute bottom-2.5 left-2.5">
          <Badge className={cn('text-[9px] uppercase tracking-widest font-bold border-0 backdrop-blur-sm', statusColor(project.status))}>
            {statusLabel(project.status)}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">
        <h4 className="font-display text-sm font-bold text-[var(--riff-text-primary)] truncate group-hover:text-[var(--riff-accent-light)] transition-colors">
          {project.title}
        </h4>

        <div className="flex items-center gap-2 text-[10px] text-[var(--riff-text-muted)]">
          <span className="font-mono font-semibold">{bp?.genre || project.genre || '—'}</span>
          <span className="opacity-30">·</span>
          <span className="font-mono">{bp?.bpm || project.bpm || '—'} BPM</span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-[10px] text-[var(--riff-text-secondary)]">
            <div className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>v{project.versionCount}</span>
            </div>
            {project.vocalsEnabled && <Mic2 className="h-3 w-3 text-purple-400" />}
          </div>
          <span className="text-[10px] text-[var(--riff-text-muted)]">{relativeTime(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
