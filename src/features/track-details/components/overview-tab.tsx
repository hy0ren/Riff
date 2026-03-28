import type { Blueprint, TrackStructureNode } from '@/domain/blueprint'
import type { Project, ProjectVersion } from '@/domain/project'
import { Mic2, Guitar, AlignLeft } from 'lucide-react'

interface OverviewTabProps {
  project: Project
  version: ProjectVersion
  blueprint?: Blueprint
  structure?: TrackStructureNode[]
}

export function OverviewTab({ project, version, blueprint, structure }: OverviewTabProps) {
  const bpm = blueprint?.bpm || project.bpm
  const keyMode = blueprint ? `${blueprint.key} ${blueprint.mode}` : project.key
  
  return (
    <div className="flex gap-12">
      {/* Main Content Column */}
      <div className="flex-1 flex flex-col gap-10">
        
        {/* Structure Map */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-[var(--riff-text-primary)]">
            <AlignLeft className="h-5 w-5 opacity-70" />
            <h2 className="font-display text-lg font-semibold tracking-wide">Arrangement Map</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {structure?.map((section) => (
              <div key={section.id} className="flex flex-col gap-2 p-4 rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] hover:border-[var(--riff-accent)]/30 hover:bg-[var(--riff-surface-high)] transition-colors group cursor-default">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-bold text-[var(--riff-text-primary)] group-hover:text-[var(--riff-accent-light)] transition-colors">{section.label}</span>
                  <span className="text-xs font-mono text-[var(--riff-text-muted)]">{Math.floor(section.startTime / 60)}:{(section.startTime % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--riff-surface-lowest)] rounded-full overflow-hidden mt-1 opacity-50">
                  <div className="h-full bg-[var(--riff-text-secondary)] w-full transition-opacity group-hover:bg-[var(--riff-accent)]" />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--riff-text-secondary)] font-semibold mt-1">
                  {section.duration}s
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Instrumentation */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-[var(--riff-text-primary)]">
            <Guitar className="h-5 w-5 opacity-70" />
            <h2 className="font-display text-lg font-semibold tracking-wide">Instrumentation Map</h2>
          </div>
          
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
             {Object.entries(blueprint?.instruments || {}).map(([inst, active]) => {
               if (!active) return null;
               return (
                 <div key={inst} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--riff-surface-highest)] border border-transparent hover:border-[var(--riff-text-muted)] transition-colors">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                   <span className="text-sm font-medium capitalize text-[var(--riff-text-primary)]">{inst}</span>
                 </div>
               )
             })}
          </div>
        </section>

      </div>

      {/* Right Column: Key Details & History */}
      <aside className="w80 shrink-0 flex flex-col gap-8">
        
        {/* Analytics Card */}
        <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-6 shadow-xl">
           <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--riff-text-secondary)] mb-6">Track Analytics</h3>
           
           <div className="space-y-5">
             <div className="flex justify-between items-center border-b border-[var(--riff-surface-highest)] pb-5">
               <span className="text-sm font-medium text-[var(--riff-text-muted)]">Tempo</span>
               <span className="text-lg font-mono font-bold text-[var(--riff-text-primary)]">{bpm} <span className="text-xs text-[var(--riff-text-secondary)] font-sans ml-0.5">BPM</span></span>
             </div>
             <div className="flex justify-between items-center border-b border-[var(--riff-surface-highest)] pb-5">
               <span className="text-sm font-medium text-[var(--riff-text-muted)]">Key Signature</span>
               <span className="text-lg font-mono font-bold text-[var(--riff-text-primary)]">{keyMode}</span>
             </div>
             <div className="flex justify-between items-center border-b border-[var(--riff-surface-highest)] pb-5">
              <span className="text-sm font-medium text-[var(--riff-text-muted)]">Energy</span>
               <span className="text-sm font-medium text-[var(--riff-accent-light)]">{blueprint?.energy || 'Medium'}</span>
             </div>
             <div className="flex justify-between items-center pt-2">
               <span className="text-sm font-medium text-[var(--riff-text-muted)]">Format</span>
               <span className="text-xs font-semibold px-2 py-1 bg-[var(--riff-surface-highest)] rounded text-[var(--riff-text-primary)]">Stereo 48kHz</span>
             </div>
           </div>
        </div>

        {/* Vocal Details */}
        {blueprint?.vocalsEnabled && (
          <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-6 shadow-xl">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--riff-text-secondary)] mb-4 flex items-center gap-2">
              <Mic2 className="h-4 w-4" /> Vocal Print
            </h3>
            <div className="space-y-3">
               <div>
                 <p className="text-[10px] text-[var(--riff-text-muted)] uppercase tracking-wider mb-1">Style</p>
                 <p className="text-sm font-medium text-[var(--riff-text-primary)]">{blueprint.vocalStyle}</p>
               </div>
               <div>
                 <p className="text-[10px] text-[var(--riff-text-muted)] uppercase tracking-wider mb-1">Theme</p>
                 <p className="text-sm italic text-[var(--riff-text-secondary)]">"{blueprint.lyricTheme || 'Reflective, atmospheric'}"</p>
               </div>
           </div>
          </div>
        )}

        {version.insight && (
          <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-6 shadow-xl">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--riff-text-secondary)] mb-4">
              Version Insight
            </h3>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                {version.insight.summary}
              </p>
              <div>
                <p className="text-[10px] text-[var(--riff-text-muted)] uppercase tracking-wider mb-1">
                  Arrangement
                </p>
                <p className="text-sm text-[var(--riff-text-primary)]">
                  {version.insight.arrangementSummary}
                </p>
              </div>
              {!!(version.insight.learningNotes ?? version.insight.practiceNotes ?? []).length && (
                <div>
                  <p className="text-[10px] text-[var(--riff-text-muted)] uppercase tracking-wider mb-1">
                    Learning Notes
                  </p>
                  <div className="space-y-1.5">
                    {(version.insight.learningNotes ?? version.insight.practiceNotes ?? []).slice(0, 3).map((note) => (
                      <p key={note} className="text-sm text-[var(--riff-text-secondary)]">
                        • {note}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </aside>
    </div>
  )
}
