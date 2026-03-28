import type { PersistedProject } from '@/domain/project'
import { Badge } from '@/components/ui/badge'
import { 
  Music, Layers, Heart, Play, Mic2, Globe, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime, sourceLabel, statusColor, statusLabel } from '../lib/library-utils'
import { usePlaybackStore } from '@/features/playback/store/use-playback-store'
import { getProjectVersion } from '@/features/projects/lib/project-selectors'
import { toProjectVersionTrack } from '@/features/playback/lib/playable-track'

interface LibraryProjectRowProps {
  project: PersistedProject
  isSelected?: boolean
  onClick?: () => void
  onDelete?: () => void
}

export function LibraryProjectRow({ project, isSelected, onClick, onDelete }: LibraryProjectRowProps) {
  const bp = project.blueprint
  const setTrack = usePlaybackStore((state) => state.setTrack)
  const activeVersion = getProjectVersion(project)

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 border',
        isSelected
          ? 'bg-[var(--riff-surface-high)] border-[var(--riff-accent)]/30'
          : 'bg-transparent border-transparent hover:bg-[var(--riff-surface-low)]'
      )}
    >
      {/* Artwork */}
      <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-[var(--riff-surface)]">
        {project.coverUrl ?? project.artUrl ? (
          <img src={project.coverUrl ?? project.artUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className="h-5 w-5 text-[var(--riff-text-faint)]" />
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            if (activeVersion?.audioUrl) {
              setTrack(toProjectVersionTrack(project, activeVersion))
            }
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
        >
          <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 ml-0.5 fill-current transition-opacity" />
        </button>
      </div>

      {/* Title & Source */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h4 className="font-display text-sm font-semibold text-[var(--riff-text-primary)] truncate group-hover:text-[var(--riff-accent-light)] transition-colors">
            {project.title}
          </h4>
          {project.isFavorite && <Heart className="h-3 w-3 fill-rose-500 text-rose-500 shrink-0" />}
          {project.isPublished && <Globe className="h-3 w-3 text-emerald-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--riff-text-muted)]">
          <span>{sourceLabel(project.sourceType)}</span>
          {project.collection && (
            <>
              <span className="opacity-30">·</span>
              <span className="text-[var(--riff-text-secondary)]">{project.collection}</span>
            </>
          )}
        </div>
      </div>

      {/* Genre */}
      <div className="hidden lg:block w-32 shrink-0">
        <span className="text-xs text-[var(--riff-text-secondary)] font-medium">{bp?.genre || project.genre || '—'}</span>
      </div>

      {/* BPM / Key */}
      <div className="hidden md:flex w-24 shrink-0 items-center gap-2 text-xs font-mono text-[var(--riff-text-muted)]">
        <span>{bp?.bpm || project.bpm || '—'}</span>
        <span className="opacity-30">/</span>
        <span>{bp?.key || project.key || '—'}{bp?.mode ? ` ${bp.mode.charAt(0).toLowerCase()}` : ''}</span>
      </div>

      {/* Versions */}
      <div className="w-16 shrink-0 flex items-center gap-1 text-xs text-[var(--riff-text-muted)]">
        <Layers className="h-3 w-3" />
        <span>v{project.versionCount}</span>
      </div>

      {/* Vocals */}
      <div className="w-8 shrink-0 flex justify-center">
        {(project.vocalsEnabled || bp?.vocalsEnabled) && <Mic2 className="h-3.5 w-3.5 text-purple-400" />}
      </div>

      {/* Status */}
      <div className="w-20 shrink-0">
        <Badge className={cn('text-[9px] uppercase tracking-widest font-bold border-0', statusColor(project.status))}>
          {statusLabel(project.status)}
        </Badge>
      </div>

      {/* Updated */}
      <div className="w-24 shrink-0 text-right text-xs text-[var(--riff-text-muted)]">
        {relativeTime(project.updatedAt)}
      </div>

      {onDelete ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--riff-text-muted)] transition hover:bg-red-500/10 hover:text-red-300"
          aria-label={`Delete ${project.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
