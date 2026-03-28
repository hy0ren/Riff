import type { PracticeFocusArea } from '@/domain/practice-session'
import type { Project, ProjectVersion } from '@/domain/project'
import type { GeminiPracticeBriefResult } from '@/domain/providers'
import type { PracticeMode, SessionState } from '../types/practice-session'
import { Badge } from '@/components/ui/badge'
import { Mic2, Guitar, Layers, Target, Activity, Music, Piano } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PracticeContextPanelProps {
  project: Project
  version: ProjectVersion | undefined
  practiceMode: PracticeMode
  onModeChange: (mode: PracticeMode) => void
  focusArea: PracticeFocusArea
  onFocusChange: (area: PracticeFocusArea) => void
  selectedSection: string
  onSectionChange: (section: string) => void
  practiceBrief: GeminiPracticeBriefResult | null
  sessionState?: SessionState
  pastSessionCount?: number
  onReconnect?: () => void
}

const MODES: { id: PracticeMode; icon: typeof Mic2; label: string }[] = [
  { id: 'vocal', icon: Mic2, label: 'Vocal' },
  { id: 'guitar', icon: Guitar, label: 'Guitar' },
  { id: 'piano', icon: Piano, label: 'Piano' },
  { id: 'humming', icon: Mic2, label: 'Humming' },
]

const SECTIONS = ['Full Song', 'Verse 1', 'Chorus']

export function PracticeContextPanel({ 
  project, 
  version, 
  practiceMode, 
  onModeChange,
  focusArea,
  onFocusChange,
  selectedSection,
  onSectionChange,
  practiceBrief,
}: PracticeContextPanelProps) {
  return (
    <div className="flex flex-col gap-6 p-5">
      
      {/* Session Header */}
      <div>
        <h2 className="font-display text-xl font-bold text-[var(--riff-text-primary)] tracking-tight">Coach</h2>
        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
          Live Practice Session
        </p>
      </div>

      {/* Track Target */}
      <div
        className="relative overflow-hidden rounded-xl p-4"
        style={{ background: 'var(--riff-surface-mid)', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        <Music className="absolute -right-2 -top-2 h-20 w-20 text-[var(--riff-accent)] opacity-[0.06]" />
        
        <div className="relative space-y-3">
          <div>
            <Badge
              className="mb-1.5 border border-[var(--riff-accent)]/30 bg-[var(--riff-accent)]/10 px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider text-[var(--riff-accent-light)]"
            >
              Active Track
            </Badge>
            <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)] truncate pr-4">
              {project.title}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--riff-text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
              {version?.name || 'Latest Version'}
            </p>
          </div>
          
          <div
            className="flex gap-6 pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--riff-text-faint)]">Key</span>
              <p className="text-sm font-bold font-mono text-[var(--riff-text-primary)]">
                {project.blueprint?.key} {project.blueprint?.mode}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--riff-text-faint)]">Tempo</span>
              <p className="text-sm font-bold font-mono text-[var(--riff-text-primary)]">
                {project.blueprint?.bpm}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Focus */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-[var(--riff-text-faint)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
            Section Focus
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {SECTIONS.map((sec) => {
            const isActive = sec === selectedSection
            return (
              <button 
                key={sec}
                onClick={() => onSectionChange(sec)}
                className={cn(
                  'rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--riff-surface-highest)] text-[var(--riff-text-primary)]'
                    : 'text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-mid)] hover:text-[var(--riff-text-secondary)]'
                )}
                style={isActive ? { border: '1px solid rgba(255,255,255,0.06)' } : undefined}
              >
                {sec}
                {sec === selectedSection && (
                  <span className="ml-2 text-[10px] font-mono text-[var(--riff-text-faint)]">1:00 – 1:30</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Input Mode */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-[var(--riff-text-faint)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
            Input Mode
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((mode) => {
            const Icon = mode.icon
            const isActive = practiceMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 rounded-lg px-3 py-3 transition-all',
                  isActive
                    ? 'bg-[var(--riff-accent)]/10 text-[var(--riff-accent-light)]'
                    : 'text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-mid)] hover:text-[var(--riff-text-secondary)]'
                )}
                style={isActive ? { border: '1px solid rgba(18,117,226,0.25)' } : { border: '1px solid transparent' }}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="text-[11px] font-semibold">{mode.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Coach Emphasis */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-[var(--riff-text-faint)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
            Coach Emphasis
          </span>
        </div>
        <select 
          value={focusArea}
          onChange={(e) => onFocusChange(e.target.value as PracticeFocusArea)}
          className="w-full rounded-lg bg-[var(--riff-surface-mid)] px-3 py-2.5 text-sm text-[var(--riff-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--riff-accent)] appearance-none"
          style={{ border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <option value="rhythm">Pitch & Rhythm</option>
          <option value="chords">Chord Accuracy</option>
          <option value="lyric_delivery">Lyric Delivery</option>
          <option value="expression">Overall Expression</option>
        </select>
      </div>

      {practiceBrief ? (
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--riff-surface-mid)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-accent-light)]">
            Practice Brief
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--riff-text-primary)]">
            {practiceBrief.title}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--riff-text-secondary)]">
            {practiceBrief.summary}
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            {(practiceBrief.cues || []).slice(0, 3).map((cue) => (
              <p key={cue} className="text-xs text-[var(--riff-text-muted)]">
                • {cue}
              </p>
            ))}
          </div>
        </div>
      ) : null}

    </div>
  )
}
