import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { PageFrame } from '@/components/layout/page-frame'
import { 
  Mic, 
  Music, 
  PlusCircle, 
  FileText, 
  Compass, 
  Share, 
  ChevronRight, 
  Sparkles,
  X,
  Type
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SourceCard } from '@/components/shared/source-card'
import type { SourceSelectionType } from '@/domain/source-input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import { createProjectFromSelection } from './lib/create-project-from-selection'

interface SourceOption {
  type: SourceSelectionType
  label: string
  description: string
  icon: LucideIcon
}

const SOURCE_OPTIONS: SourceOption[] = [
  { 
    type: 'hum', 
    label: 'Record a Hum', 
    description: 'Lead with a hummed or sung melody idea.', 
    icon: Mic 
  },
  { 
    type: 'riff', 
    label: 'Upload a Riff', 
    description: 'Import an audio file, loop, or sample.', 
    icon: Music 
  },
  { 
    type: 'lyrics', 
    label: 'Write Lyrics', 
    description: 'Build a song around specific words.', 
    icon: FileText 
  },
  { 
    type: 'chords', 
    label: 'Chord Sequence', 
    description: 'Define the harmonic spine of the track.', 
    icon: Type 
  },
  { 
    type: 'sheet', 
    label: 'Sheet Music', 
    description: 'Upload notation or MIDI scores.', 
    icon: PlusCircle 
  },
  { 
    type: 'spotify', 
    label: 'Spotify Vibe', 
    description: 'Use a track as a reference for mood.', 
    icon: Compass 
  },
  { 
    type: 'remix', 
    label: 'Remix Track', 
    description: 'Rebuild an existing project or song.', 
    icon: Share 
  },
]

export function CreatePage() {
  const navigate = useNavigate()
  const [selectedTypes, setSelectedTypes] = useState<SourceSelectionType[]>([])
  const upsertProject = useProjectStore((state) => state.upsertProject)

  const toggleSource = (type: SourceSelectionType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const hasSelection = selectedTypes.length > 0

  return (
    <PageFrame 
      title="Create" 
      subtitle="Select one or more sources to begin your song blueprint"
      className="pb-[120px]" // Space for bottom canvas
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {SOURCE_OPTIONS.map(option => (
          <SourceCard 
            key={option.type}
            type={option.type}
            label={option.label}
            description={option.description}
            icon={option.icon}
            selected={selectedTypes.includes(option.type)}
            onClick={() => toggleSource(option.type)}
          />
        ))}

        {/* Informational Empty card */}
        <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-[var(--riff-surface-mid)] bg-[rgba(255,255,255,0.02)]">
          <p className="text-[11px] text-center text-[var(--riff-text-faint)] leading-relaxed">
            Mix multiple sources for best results.<br />
            Example: <strong>Hum + Spotify Reference</strong>
          </p>
        </div>
      </div>

      {/* Assembly Canvas / Selection Bar (Persistent at bottom) */}
      <div className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-4xl",
        "bg-[var(--riff-surface-highest)] border border-[var(--riff-surface-high)] rounded-2xl p-4",
        "shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50",
        "transition-all duration-500 ease-in-out",
        hasSelection ? "translate-y-0 opacity-100" : "translate-y-[200%] opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center gap-6">
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--riff-accent-light)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--riff-accent-light)]">
                Synthesis Canvas
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {selectedTypes.length === 0 ? (
                <span className="text-xs text-[var(--riff-text-faint)]">Select inputs above...</span>
              ) : (
                selectedTypes.map(type => {
                  const option = SOURCE_OPTIONS.find(o => o.type === type)
                  return (
                    <div 
                      key={type} 
                      className="flex items-center gap-2 bg-[var(--riff-surface-low)] border border-[var(--riff-surface-mid)] py-1.5 px-3 rounded-lg animate-in fade-in slide-in-from-left-2"
                    >
                      {option && <option.icon className="h-3.5 w-3.5 text-[var(--riff-accent-light)]" />}
                      <span className="text-xs font-semibold text-[var(--riff-text-primary)]">{option?.label}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleSource(type) }} 
                        className="p-0.5 hover:text-white text-[var(--riff-text-faint)] transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-[var(--riff-text-muted)] font-medium">Ready to Assemble?</p>
              <p className="text-[11px] text-[var(--riff-text-primary)] font-bold">{selectedTypes.length} Inputs Selected</p>
            </div>
            
            <Button
              className="h-12 px-6 rounded-xl font-bold bg-[var(--riff-accent)] hover:bg-[var(--riff-accent-light)] transition-all shadow-[0_0_20px_var(--riff-glow)]"
              disabled={!hasSelection}
              onClick={() => {
                const project = createProjectFromSelection(selectedTypes)
                upsertProject(project)
                navigate(projectRoutes.studio(project.id))
              }}
            >
              Continue to Studio
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageFrame>
  )
}
