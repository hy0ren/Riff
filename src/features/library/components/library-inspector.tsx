import type { Project } from '@/domain/project'
import { Badge } from '@/components/ui/badge'
import { 
  Music, Layers, Heart, Mic2, Globe, ExternalLink,
  BookOpen, Download, Pencil
} from 'lucide-react'
import { relativeTime, sourceLabel, statusColor, statusLabel } from '../lib/library-utils'
import { useNavigate } from 'react-router-dom'
import { projectRoutes } from '@/features/projects/lib/project-routes'

interface LibraryInspectorProps {
  project: Project
}

export function LibraryInspector({ project }: LibraryInspectorProps) {
  const bp = project.blueprint
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full p-5 gap-6 overflow-y-auto">
      
      {/* Artwork */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[var(--riff-surface)] shadow-2xl group">
        {project.coverUrl ? (
          <img src={project.coverUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--riff-surface)] to-[var(--riff-surface-lowest)]">
            <Music className="h-16 w-16 text-[var(--riff-text-faint)]" />
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex gap-2">
          {project.isFavorite && <Heart className="h-5 w-5 fill-rose-500 text-rose-500 drop-shadow-lg" />}
          {project.isPublished && <Globe className="h-5 w-5 text-emerald-400 drop-shadow-lg" />}
        </div>
      </div>

      {/* Title & Status */}
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-xl font-bold text-white tracking-tight">{project.title}</h3>
        <div className="flex items-center gap-2">
          <Badge className={`text-[9px] uppercase tracking-widest font-bold border-0 ${statusColor(project.status)}`}>
            {statusLabel(project.status)}
          </Badge>
          <span className="text-[10px] text-[var(--riff-text-muted)]">{sourceLabel(project.sourceType)}</span>
        </div>
        {project.description && (
          <p className="text-xs text-[var(--riff-text-secondary)] leading-relaxed mt-1 italic">"{project.description}"</p>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetaCell label="BPM" value={`${bp?.bpm || project.bpm || '—'}`} />
        <MetaCell label="Key" value={`${bp?.key || project.key || '—'}${bp?.mode ? ` ${bp.mode}` : ''}`} />
        <MetaCell label="Genre" value={bp?.genre || project.genre || '—'} />
        <MetaCell label="Mood" value={project.mood || bp?.mood || '—'} />
        <MetaCell label="Versions" value={`${project.versionCount}`} />
        <MetaCell label="Energy" value={bp?.energy || '—'} />
      </div>

      {/* Vocal Indicator */}
      {(project.vocalsEnabled || bp?.vocalsEnabled) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Mic2 className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-medium text-purple-300">{bp?.vocalStyle || 'Vocals Enabled'}</span>
        </div>
      )}

      {/* Collection */}
      {project.collection && (
        <div className="flex items-center gap-2 text-xs text-[var(--riff-text-muted)]">
          <Layers className="h-3.5 w-3.5" />
          <span>Collection: <span className="text-[var(--riff-text-secondary)] font-medium">{project.collection}</span></span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-[var(--riff-surface-highest)]">
        <button 
          onClick={() => navigate(projectRoutes.studio(project.id))}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--riff-accent)] to-[var(--riff-accent-focus)] text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Pencil className="h-4 w-4" /> Open in Studio
        </button>
        <button 
          onClick={() => navigate(projectRoutes.details(project.id))}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-[var(--riff-surface-highest)] text-[var(--riff-text-primary)] font-medium text-sm hover:bg-[var(--riff-surface-high)] transition-colors"
        >
          <ExternalLink className="h-4 w-4" /> Track Details
        </button>
        <button 
          onClick={() => navigate(projectRoutes.learn(project.id))}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-[var(--riff-surface-highest)] text-[var(--riff-text-primary)] font-medium text-sm hover:bg-[var(--riff-surface-high)] transition-colors"
        >
          <BookOpen className="h-4 w-4" /> Learn this Song
        </button>
        {project.isExported && (
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-[var(--riff-surface-highest)] text-[var(--riff-text-primary)] font-medium text-sm hover:bg-[var(--riff-surface-high)] transition-colors">
            <Download className="h-4 w-4" /> Export Project
          </button>
        )}
      </div>

      {/* Timestamps */}
      <div className="text-[10px] text-[var(--riff-text-muted)] space-y-1 pt-2">
        <p>Last edited: {relativeTime(project.updatedAt)}</p>
        {project.createdAt && <p>Created: {relativeTime(project.createdAt)}</p>}
        {project.lastLearnedAt && <p>Last learned: {relativeTime(project.lastLearnedAt)}</p>}
      </div>
    </div>
  )
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-[var(--riff-surface-highest)]">
      <span className="text-[9px] uppercase tracking-widest text-[var(--riff-text-muted)] font-semibold">{label}</span>
      <span className="text-sm font-mono font-bold text-[var(--riff-text-primary)]">{value}</span>
    </div>
  )
}
