import type { Project, ProjectVersion } from '@/domain/project'
import type { PracticeMode, SessionState } from '../coach-page'
import { Play, Pause, Square, Mic, Volume2, Target } from 'lucide-react'

interface LivePerformanceStageProps {
  project: Project
  version: ProjectVersion | undefined
  sessionState: SessionState
  practiceMode: PracticeMode
  onToggleRehearsal: () => void
  onSimulateEvent: () => void
}

export function LivePerformanceStage({
  sessionState,
  practiceMode,
  onToggleRehearsal,
  onSimulateEvent
}: LivePerformanceStageProps) {
  
  const isListening = sessionState === 'listening'

  return (
    <div className="relative z-10 flex flex-1 flex-col px-10 py-8">
      
      {/* Top Bar: Metronome & Mode */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--riff-text-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--riff-accent)] opacity-80 shadow-[0_0_8px_rgba(18,117,226,0.6)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--riff-surface-highest)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--riff-surface-highest)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--riff-surface-highest)]" />
            <span className="ml-2 font-bold tracking-widest uppercase">1 : 00 : 00</span>
          </div>
          <div
            className="hidden rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--riff-text-faint)] lg:block"
            style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            Measure 42 · Chorus A
          </div>
        </div>
        
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--riff-text-primary)]"
          style={{ background: 'var(--riff-surface-high)' }}
        >
          {practiceMode === 'vocal' || practiceMode === 'humming'
            ? <Mic className="h-4 w-4 text-[var(--riff-accent-light)]" />
            : <Volume2 className="h-4 w-4 text-emerald-400" />
          }
          <span className="capitalize">{practiceMode} Practice</span>
        </div>
      </div>

      {/* Practice Target (Lyrics / Chords) */}
      <div className="flex flex-1 flex-col items-center justify-center gap-10">
        <div className="flex flex-col items-center justify-center text-center">
          {practiceMode === 'vocal' || practiceMode === 'humming' ? (
            <div className="space-y-3">
              <p className="font-display text-xl text-[var(--riff-text-faint)] blur-[1px]">
                I can feel the static on the wire
              </p>
              <p className="font-display text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                Midnight rider driving out the shadow
              </p>
              <p className="font-display text-xl text-[var(--riff-text-faint)] blur-[1px]">
                Tearing up the silence of the night
              </p>
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-8 rounded-2xl px-14 py-8"
              style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <span className="font-display text-3xl font-medium text-[var(--riff-text-faint)] opacity-40">Bbm</span>
              <span className="font-display text-6xl font-black text-[var(--riff-accent-light)] drop-shadow-[0_0_20px_rgba(18,117,226,0.3)] px-3">Fm</span>
              <span className="font-display text-3xl font-medium text-[var(--riff-text-muted)] opacity-80">Db</span>
            </div>
          )}
        </div>

        {/* Input Waveform */}
        <div className="relative flex h-28 w-full max-w-3xl items-center justify-center">
          {/* Track line */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-[var(--riff-surface-highest)]" />
          
          {/* Playhead */}
          <div className="absolute bottom-0 left-[30%] top-0 z-20 w-0.5 bg-[var(--riff-accent-light)] shadow-[0_0_10px_var(--riff-accent-light)]">
            <div className="absolute -left-1 top-0 h-2.5 w-2.5 rounded-full bg-white" />
          </div>

          {/* Waveform bars */}
          <div className="relative z-10 flex h-full w-full items-center gap-px overflow-hidden px-[30%]">
            {Array.from({ length: 120 }).map((_, i) => {
              const height = isListening
                ? Math.max(8, Math.sin(i * 0.2) * 35 + Math.random() * 55)
                : 8
              const isPassed = i < 35
              const inRange = i >= 35 && i <= 40

              let bg = 'var(--riff-surface-highest)'
              if (isPassed) bg = 'var(--riff-text-faint)'
              if (inRange && isListening) bg = 'var(--riff-accent)'

              return (
                <div 
                  key={i} 
                  className="flex-1 rounded-sm transition-all duration-75"
                  style={{
                    height: `${height}%`,
                    background: bg,
                    boxShadow: inRange && isListening ? '0 0 6px var(--riff-accent)' : 'none',
                  }}
                />
              )
            })}
          </div>
          
          {/* Feedback tag */}
          {isListening && (
            <div
              className="absolute bottom-1 left-[35%] rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              Great Timing
            </div>
          )}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex shrink-0 items-center justify-center gap-5 pb-2">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--riff-text-muted)] transition-colors hover:text-[var(--riff-text-primary)]"
          style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <Square className="h-4 w-4 fill-current" />
        </button>
        
        <button 
          onClick={onToggleRehearsal}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full transition-all duration-300 active:scale-95"
          style={{
            background: isListening
              ? 'var(--riff-surface-high)'
              : 'var(--riff-accent)',
            border: isListening ? '3px solid var(--riff-accent)' : '3px solid transparent',
            boxShadow: isListening
              ? '0 0 30px rgba(18,117,226,0.3)'
              : '0 0 20px rgba(18,117,226,0.2)',
          }}
        >
          {isListening
            ? <Pause className="h-7 w-7 fill-current text-[var(--riff-accent-light)]" />
            : <Play className="ml-1 h-7 w-7 fill-current text-white" />
          }
        </button>

        <button 
          onClick={onSimulateEvent}
          title="Simulate Coach Feedback Event"
          className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--riff-text-muted)] transition-colors hover:text-[var(--riff-text-primary)]"
          style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <Target className="h-4 w-4" />
        </button>
      </div>

    </div>
  )
}
