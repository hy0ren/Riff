import { Play, Share, Settings2, BookOpen } from 'lucide-react'
import type { Project, ProjectVersion } from '@/domain/project'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { usePlaybackStore } from '@/features/playback/store/use-playback-store'
import { toProjectVersionTrack } from '@/features/playback/lib/playable-track'

interface TrackHeroProps {
  project: Project
  activeVersion: ProjectVersion
}

export function TrackHero({ project, activeVersion }: TrackHeroProps) {
  const navigate = useNavigate()
  const setTrack = usePlaybackStore((state) => state.setTrack)
  const waveformBars = Array.from({ length: 120 }, (_, index) => ({
    id: index,
    height: Math.max(15, Math.sin(index * 0.1) * 30 + ((index * 17) % 70)),
    isPlayed: index < 40,
  }))

  return (
    <div className="relative w-full border-b border-[var(--riff-surface-highest)] bg-gradient-to-b from-[var(--riff-surface-low)] to-[var(--riff-surface)] pt-12 pb-8 px-8 xl:px-12">
      
      {/* Decorative Glow */}
      <div className="pointer-events-none absolute left-20 top-0 z-0 h-[300px] w-[600px] rounded-full bg-[var(--riff-accent)] opacity-[0.03] blur-[120px]" />

      <div className="relative z-10 flex max-w-[1400px] mx-auto gap-8 items-end">
        
        {/* Artwork */}
        <div className="shrink-0 h-48 w-48 rounded-xl overflow-hidden shadow-2xl relative group cursor-pointer border border-[var(--riff-surface-highest)]">
          <img 
            src={project.coverUrl ?? project.artUrl ?? 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400&h=400'} 
            alt="Track Artwork"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Settings2 className="h-8 w-8 text-white opacity-80" />
          </div>
        </div>

        {/* Info & Player */}
        <div className="flex-1 flex flex-col justify-end min-w-0 pb-2">
          
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="default" className="bg-[var(--riff-accent)]/10 text-[var(--riff-accent-light)] hover:bg-[var(--riff-accent)]/20 uppercase tracking-wider text-[10px] font-bold">
              {project.status === 'draft' ? 'Draft Project' : 'Finalized'}
            </Badge>
            <span className="text-xs font-mono text-[var(--riff-text-muted)]">Lyria v1.4</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--riff-surface-high)] text-xs text-[var(--riff-text-secondary)]">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
               {activeVersion.name}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="text-xs text-[var(--riff-accent)] hover:text-[var(--riff-accent-light)] font-medium underline underline-offset-4 ml-1">
                Change Version
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-[var(--riff-surface-low)] border-[var(--riff-surface-highest)]">
                {project.versions?.map((v) => {
                  const isSelectedVersion = v.id === activeVersion.id

                  return (
                    <DropdownMenuItem
                      key={v.id}
                      onClick={() => navigate(projectRoutes.version(project.id, v.id))}
                      className="flex justify-between items-center py-2 cursor-pointer focus:bg-[var(--riff-surface-high)]"
                    >
                      <span className={`text-sm ${isSelectedVersion ? 'text-[var(--riff-accent-light)] font-semibold' : 'text-[var(--riff-text-primary)]'}`}>{v.name}</span>
                      {isSelectedVersion && <div className="h-1.5 w-1.5 rounded-full bg-[var(--riff-accent)]"></div>}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

          <h1 className="riff-display-tight font-display text-5xl font-bold tracking-tight text-[var(--riff-text-primary)] mb-6 truncate">
            {project.title}
          </h1>

          <div className="flex items-center gap-8">
            {/* Primary Transport */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTrack(toProjectVersionTrack(project, activeVersion))}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--riff-accent)] to-[var(--riff-accent-focus)] text-white shadow-[0_0_20px_rgba(18,117,226,0.2)] transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="h-6 w-6 ml-1 fill-current" />
              </button>
            </div>
            
            {/* Waveform Representation */}
            <div className="flex-1 max-w-2xl h-12 flex items-center gap-[2px] opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
              {waveformBars.map(({ id, height, isPlayed }) => {
                return (
                  <div
                    key={id}
                    className={`flex-1 rounded-sm transition-colors ${
                      isPlayed 
                        ? 'bg-[var(--riff-accent-light)] shadow-[0_0_5px_var(--riff-accent-light)]' 
                        : 'bg-[var(--riff-surface-highest)] hover:bg-[var(--riff-text-muted)]'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                )
              })}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(projectRoutes.learn(project.id))}
                className="flex items-center justify-center h-10 w-10 rounded-full border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] text-[var(--riff-text-secondary)] hover:text-white hover:border-[var(--riff-text-muted)] transition-all"
                title="Open Learn"
              >
                <BookOpen className="h-4 w-4" />
              </button>
              <button className="flex items-center justify-center h-10 w-10 rounded-full border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] text-[var(--riff-text-secondary)] hover:text-white hover:border-[var(--riff-text-muted)] transition-all" title="Share Project">
                <Share className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate(projectRoutes.studio(project.id))}
                className="flex items-center gap-2 h-10 px-4 rounded-full border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-high)] text-[var(--riff-text-primary)] hover:bg-[var(--riff-surface-highest)] transition-all font-medium text-sm"
              >
                Open in Studio
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
