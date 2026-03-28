import type { ProjectVersion } from '@/domain/project'
import { Download } from 'lucide-react'

interface ChordsTabProps {
  version: ProjectVersion
}

export function ChordsTab({ version }: ChordsTabProps) {
  if (!version.structure) {
    return <div className="p-8 text-center text-[var(--riff-text-muted)]">No chord data available for this version.</div>
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h2 className="font-display text-xl font-semibold tracking-wide text-[var(--riff-text-primary)]">Chord Progression</h2>
           <p className="text-sm text-[var(--riff-text-muted)] mt-1">Harmonic structure by section</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--riff-surface-high)] hover:bg-[var(--riff-surface-highest)] rounded border border-[var(--riff-surface-highest)] transition-colors text-sm font-medium text-[var(--riff-text-primary)]">
          <Download className="h-4 w-4" /> Export MIDI
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {version.structure.map((section) => (
          <div key={section.id} className="flex flex-col gap-3 rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-6 shadow-sm">
             <div className="flex justify-between items-end border-b border-[var(--riff-surface-lowest)] pb-3">
               <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--riff-text-secondary)]">{section.label}</h3>
               <span className="text-xs font-mono text-[var(--riff-text-muted)]">{section.duration}s</span>
             </div>
             <div className="flex flex-wrap gap-4 mt-2">
               {section.chords.map((chord, i) => (
                 <div key={i} className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--riff-surface-highest)] border border-transparent hover:border-[var(--riff-accent)]/50 transition-colors cursor-pointer group">
                   <span className="font-display text-lg font-bold text-[var(--riff-text-primary)] group-hover:text-[var(--riff-accent-light)] transition-colors">{chord}</span>
                 </div>
               ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
