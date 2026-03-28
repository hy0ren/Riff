import type { Project } from '@/domain/project'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Music, Clock, Layers, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface ProjectCardProps {
  project: Project
  className?: string
  onClick?: () => void
}

export function ProjectCard({ project, className, onClick }: ProjectCardProps) {
  const isGenerating = project.status === 'generating'
  const isDraft = project.status === 'draft'

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer",
        "border-transparent bg-[var(--riff-surface-low)] hover:bg-[var(--riff-surface-high)]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-4 items-center">
        {/* Artwork / Icon */}
        <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-[var(--riff-surface-mid)]">
          {project.artUrl ? (
            <img src={project.artUrl} alt="" className="h-full w-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music className="h-8 w-8 text-[var(--riff-text-faint)]" />
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--riff-accent-light)]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate font-display text-sm font-semibold text-[var(--riff-text-primary)] group-hover:text-[var(--riff-accent-light)] transition-colors">
              {project.title}
            </h4>
            {isGenerating ? (
              <Badge variant="secondary" className="bg-[var(--riff-accent-dim)] text-[var(--riff-accent-light)] border-0 text-[9px] uppercase tracking-wider">
                Generating
              </Badge>
            ) : isDraft ? (
              <Badge variant="outline" className="text-[var(--riff-text-muted)] border-[var(--riff-surface-high)] text-[9px] uppercase tracking-wider">
                Draft
              </Badge>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--riff-text-muted)]">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>v{project.versionCount}</span>
            </div>
            {project.key && (
              <span className="hidden sm:inline px-1.5 py-0.5 rounded-sm bg-[var(--riff-surface-highest)] text-[var(--riff-text-secondary)]">
                {project.key}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Active hover effect */}
      <div className="absolute inset-0 border border-transparent group-hover:border-[var(--riff-accent-dim)] rounded-xl pointer-events-none transition-colors" />
    </Card>
  )
}
