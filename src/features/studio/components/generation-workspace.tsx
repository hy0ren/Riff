import { Play, SkipBack, SkipForward, Wand2, History, GitMerge, FileAudio } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ProjectVersion } from '@/domain/project'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface GenerationWorkspaceProps {
  versions: ProjectVersion[]
}

export function GenerationWorkspace({ versions }: GenerationWorkspaceProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 rounded-2xl bg-[var(--riff-surface-low)] p-6 shadow-xl relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--riff-accent)] opacity-[0.03] blur-[100px]" />

      {/* Header: Track Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--riff-text-primary)]">
            Generation Stage
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span className="text-sm font-medium text-[var(--riff-text-muted)]">Lyria v1.4 Active</span>
          </div>
        </div>
        <div className="flex bg-[var(--riff-surface)] p-1 rounded-xl">
          <button className="rounded-lg bg-[var(--riff-surface-high)] px-4 py-2 text-sm font-semibold text-[var(--riff-text-primary)] shadow-sm">
            Current Mix
          </button>
          <button className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--riff-text-muted)] hover:text-[var(--riff-text-primary)] transition-colors">
            Stems
          </button>
        </div>
      </div>

      {/* Waveform Player Suite */}
      <div className="flex flex-col gap-4 mt-2">
        {/* Waveform Visualization */}
        <div className="relative h-48 w-full rounded-xl bg-[var(--riff-surface-lowest)] p-4 overflow-hidden border border-[var(--riff-surface-highest)]">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--riff-accent)]/10 to-transparent pointer-events-none" />
          <div className="flex h-full w-full items-end gap-[2px] opacity-80">
            {Array.from({ length: 80 }).map((_, i) => {
              const height = Math.max(10, Math.sin(i * 0.2) * 40 + Math.random() * 60)
              const isPlayed = i < 30
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm transition-all duration-300 ${isPlayed ? 'bg-[var(--riff-accent)] shadow-[0_0_8px_var(--riff-accent)]' : 'bg-[var(--riff-surface-highest)]'}`}
                  style={{ height: `${height}%` }}
                />
              )
            })}
          </div>
          {/* Playhead */}
          <div className="absolute top-0 bottom-0 left-[37.5%] w-px bg-white shadow-[0_0_12px_rgba(255,255,255,1)] flex flex-col justify-start z-10">
            <div className="h-3 w-3 -translate-x-[5px] bg-white rounded-sm drop-shadow-md"></div>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm font-mono text-[var(--riff-text-muted)] w-24">1:04 / 3:40</div>
          <div className="flex items-center gap-6">
            <button className="text-[var(--riff-text-secondary)] hover:text-white transition-colors">
              <SkipBack className="h-5 w-5 fill-current" />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--riff-accent)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
              <Play className="h-5 w-5 ml-1 fill-current" />
            </button>
            <button className="text-[var(--riff-text-secondary)] hover:text-white transition-colors">
              <SkipForward className="h-5 w-5 fill-current" />
            </button>
          </div>
          <div className="flex justify-end gap-3 w-24">
             <button className="text-[var(--riff-text-secondary)] hover:text-[var(--riff-accent-light)] transition-colors" title="Loop region">
               <History className="h-4 w-4" />
             </button>
             <button className="text-[var(--riff-text-secondary)] hover:text-[var(--riff-accent-light)] transition-colors" title="Export track">
               <FileAudio className="h-4 w-4" />
             </button>
          </div>
        </div>
      </div>

      {/* Workspace Tabs (Versions / Arrangement / Copilot) */}
      <Tabs defaultValue="copilot" className="mt-4 flex-1 flex flex-col min-h-0">
        <TabsList className="bg-[var(--riff-surface)] p-1 rounded-xl w-full justify-start overflow-x-auto">
          <TabsTrigger value="copilot" className="rounded-lg data-[state=active]:bg-[var(--riff-surface-high)] font-medium">Copilot</TabsTrigger>
          <TabsTrigger value="versions" className="rounded-lg data-[state=active]:bg-[var(--riff-surface-high)] font-medium">Versions ({versions.length})</TabsTrigger>
          <TabsTrigger value="arrangement" className="rounded-lg data-[state=active]:bg-[var(--riff-surface-high)] font-medium">Arrangement Map</TabsTrigger>
        </TabsList>
        
        <div className="mt-4 flex-1 overflow-y-auto pr-2 pb-4">
          <TabsContent value="copilot" className="h-full focus-visible:outline-none">
             <div className="flex flex-col gap-4">
               <div>
                 <h3 className="text-sm font-semibold text-[var(--riff-text-primary)] mb-1">Refinement Assistant</h3>
                 <p className="text-xs text-[var(--riff-text-muted)]">Guide the next generative pass without losing your structural blueprint.</p>
               </div>
               
               <div className="relative">
                 <textarea 
                   className="w-full h-24 rounded-xl bg-[var(--riff-surface-lowest)] border border-[var(--riff-surface-highest)] p-4 text-sm text-[var(--riff-text-primary)] placeholder-[var(--riff-surface-highest)] focus:outline-none focus:border-[var(--riff-accent)] resize-none"
                   placeholder="E.g., Make the chorus hit harder, add more distortion to the bass, and remove the hats in the verse..."
                 />
                 <button className="absolute bottom-3 right-3 rounded-full bg-[var(--riff-surface-high)] p-2 hover:bg-[var(--riff-accent)] hover:text-white text-[var(--riff-text-secondary)] transition-colors shadow-sm">
                   <Wand2 className="h-4 w-4" />
                 </button>
               </div>
               
               <div className="flex flex-wrap gap-2 mt-2">
                 <button className="rounded-full border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 py-1.5 text-xs text-[var(--riff-text-secondary)] hover:border-[var(--riff-accent)] hover:text-[var(--riff-text-primary)] transition-all">
                   More cinematic
                 </button>
                 <button className="rounded-full border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 py-1.5 text-xs text-[var(--riff-text-secondary)] hover:border-[var(--riff-accent)] hover:text-[var(--riff-text-primary)] transition-all">
                   Make darker
                 </button>
                 <button className="rounded-full border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 py-1.5 text-xs text-[var(--riff-text-secondary)] hover:border-[var(--riff-accent)] hover:text-[var(--riff-text-primary)] transition-all">
                   Strip drums
                 </button>
                 <button className="rounded-full border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 py-1.5 text-xs text-[var(--riff-text-secondary)] hover:border-[var(--riff-accent)] hover:text-[var(--riff-text-primary)] transition-all">
                   Acoustic version
                 </button>
                 <button className="rounded-full border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 py-1.5 text-xs text-[var(--riff-text-secondary)] hover:border-[var(--riff-accent)] hover:text-[var(--riff-text-primary)] transition-all">
                   Closer to source
                 </button>
               </div>
             </div>
          </TabsContent>

          <TabsContent value="versions" className="h-full focus-visible:outline-none">
            <div className="flex flex-col gap-3">
              {versions.map((ver, index) => (
                <div 
                  key={ver.id}
                  className={`flex flex-col gap-2 rounded-xl p-3 border transition-colors cursor-pointer ${
                    ver.isActive 
                      ? 'bg-[var(--riff-surface-highest)] border-[var(--riff-accent)] shadow-[0_0_15px_rgba(18,117,226,0.15)]' // Dark blue focus (1275e2 config)
                      : 'bg-[var(--riff-surface)] border-transparent hover:border-[var(--riff-surface-highest)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--riff-surface-lowest)]">
                        <span className="font-mono text-xs text-[var(--riff-text-secondary)]">v{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--riff-text-primary)]">{ver.name}</p>
                          {ver.isActive && <Badge variant="default" className="bg-[var(--riff-accent)]/20 text-[var(--riff-accent-light)] hover:bg-[var(--riff-accent)]/30 text-[10px] px-1.5 py-0">Active</Badge>}
                        </div>
                        <p className="text-[11px] text-[var(--riff-text-muted)]">
                          {formatDistanceToNow(new Date(ver.timestamp), { addSuffix: true })} • 3:40
                        </p>
                      </div>
                    </div>
                    {ver.isActive ? (
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--riff-accent)]/10 text-[var(--riff-accent)]">
                        <GitMerge className="h-4 w-4" />
                      </div>
                    ) : (
                      <button className="text-xs font-semibold text-[var(--riff-text-secondary)] hover:text-[var(--riff-text-primary)] uppercase tracking-wider py-1 px-2">
                        Load
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-11">
                    {ver.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] px-2 py-0.5 text-[10px] text-[var(--riff-text-muted)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="arrangement" className="h-full focus-visible:outline-none">
            <div className="flex flex-col gap-2 mt-2">
              <div className="relative h-12 w-full rounded-lg bg-[var(--riff-surface)] overflow-hidden flex border border-[var(--riff-surface-highest)]">
                <div className="flex-none w-[15%] h-full bg-[var(--riff-surface-highest)] border-r border-[#202020] flex items-center px-3 hover:bg-[var(--riff-surface-low)] transition-colors cursor-pointer">
                  <span className="text-xs font-semibold text-[var(--riff-text-primary)]">Intro</span>
                </div>
                <div className="flex-none w-[35%] h-full bg-[var(--riff-surface-[05])] border-r border-[#202020] flex flex-col justify-center px-3 hover:bg-[var(--riff-surface-low)] transition-colors cursor-pointer">
                  <span className="text-xs font-semibold text-[var(--riff-text-primary)]">Verse 1</span>
                  <span className="text-[10px] font-mono text-[var(--riff-text-secondary)]">0:15 - 1:04</span>
                </div>
                <div className="flex-none w-[20%] h-full bg-[var(--riff-accent)]/20 border-r border-[#202020] flex flex-col justify-center px-3 shadow-[inset_0_0_10px_rgba(18,117,226,0.1)] hover:bg-[var(--riff-accent)]/30 transition-colors cursor-pointer">
                  <span className="text-xs font-semibold text-[var(--riff-accent-light)]">Chorus</span>
                  <span className="text-[10px] font-mono text-[var(--riff-accent-light)] opacity-80">1:04 - 1:40</span>
                </div>
                <div className="flex-auto h-full bg-[var(--riff-surface-[05])] flex flex-col justify-center px-3 hover:bg-[var(--riff-surface-low)] transition-colors cursor-pointer">
                  <span className="text-xs font-semibold text-[var(--riff-text-primary)]">Verse 2</span>
                  <span className="text-[10px] font-mono text-[var(--riff-text-secondary)]">1:40 - 2:30</span>
                </div>
              </div>
              <p className="text-xs text-[var(--riff-text-muted)] mt-2 text-center">
                Click sections to edit specific harmonic structures.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
    </div>
  )
}
