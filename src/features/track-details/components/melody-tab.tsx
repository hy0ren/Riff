import type { ProjectVersion } from '@/domain/project'
import { Download, Activity } from 'lucide-react'

interface MelodyTabProps {
  version: ProjectVersion
}

export function MelodyTab({ version: _version }: MelodyTabProps) {
  void _version

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h2 className="font-display text-xl font-semibold tracking-wide text-[var(--riff-text-primary)]">Melody Analysis</h2>
           <p className="text-sm text-[var(--riff-text-muted)] mt-1">Lead contour and motif data</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--riff-surface-high)] hover:bg-[var(--riff-surface-highest)] rounded border border-[var(--riff-surface-highest)] transition-colors text-sm font-medium text-[var(--riff-text-primary)]">
          <Download className="h-4 w-4" /> Export Lead MIDI
        </button>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Placeholder Piano Roll Visualization */}
        <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-[var(--riff-accent-light)]" />
            <h3 className="font-semibold tracking-wide text-[var(--riff-text-primary)]">Contour Visualization</h3>
          </div>
          <div className="w-full h-48 rounded bg-[var(--riff-surface-lowest)] border border-[var(--riff-surface-highest)] relative overflow-hidden flex items-center p-4">
             {/* Fake MIDI blocks */}
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(transparent 90%, var(--riff-surface-highest) 100%)', backgroundSize: '100% 10px' }} />
             <div className="relative w-full h-full flex items-center">
                <div className="absolute left-[10%] top-[40%] h-3 w-12 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div className="absolute left-[20%] top-[30%] h-3 w-8 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div className="absolute left-[28%] top-[20%] h-3 w-16 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div className="absolute left-[45%] top-[50%] h-3 w-20 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div className="absolute left-[65%] top-[35%] h-3 w-10 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div className="absolute left-[75%] top-[45%] h-3 w-24 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             </div>
          </div>
        </div>

        {/* Melody Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-5 shadow-sm">
             <span className="text-xs font-semibold uppercase tracking-widest text-[var(--riff-text-secondary)]">Primary Range</span>
             <p className="font-mono text-2xl font-bold mt-2 text-[var(--riff-text-primary)]">C4 - G5</p>
          </div>
          <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-5 shadow-sm">
             <span className="text-xs font-semibold uppercase tracking-widest text-[var(--riff-text-secondary)]">Note Density</span>
             <p className="font-mono text-2xl font-bold mt-2 text-[var(--riff-text-primary)]">Medium/High</p>
          </div>
          <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-5 shadow-sm">
             <span className="text-xs font-semibold uppercase tracking-widest text-[var(--riff-text-secondary)]">Motifs</span>
             <p className="font-mono text-2xl font-bold mt-2 text-[var(--riff-text-primary)]">3 Detected</p>
          </div>
        </div>

      </div>
    </div>
  )
}
