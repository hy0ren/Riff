import { useState } from 'react'
import { PageFrame } from '@/components/layout/page-frame'
import { RECENT_PROJECTS } from '@/mocks/mock-data'
import { PracticeContextPanel } from './components/practice-context-panel'
import { LivePerformanceStage } from './components/live-performance-stage'
import { CoachTranscriptPanel } from './components/coach-transcript-panel'

export type PracticeMode = 'vocal' | 'humming' | 'guitar' | 'piano'
export type SessionState = 'idle' | 'listening' | 'analyzing' | 'coaching' | 'paused'

export function CoachPage() {
  const [activeProjectId] = useState<string>('proj-active-1')
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('vocal')
  const [focusArea, setFocusArea] = useState<string>('rhythm')
  
  const activeProject = RECENT_PROJECTS.find(p => p.id === activeProjectId) || RECENT_PROJECTS[0]
  const activeVersion = activeProject.versions?.[activeProject.versions.length - 1]

  const handleToggleRehearsal = () => {
    if (sessionState === 'idle' || sessionState === 'paused') {
      setSessionState('listening')
    } else {
      setSessionState('paused')
    }
  }

  const triggerCoachResponse = () => {
    setSessionState('analyzing')
    setTimeout(() => {
      setSessionState('coaching')
      setTimeout(() => setSessionState('listening'), 4000)
    }, 1500)
  }

  return (
    <PageFrame fullBleed>
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left: Practice Context */}
        <aside
          className="w-[300px] shrink-0 overflow-y-auto"
          style={{
            background: 'var(--riff-surface-low)',
            borderRight: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <PracticeContextPanel 
            project={activeProject} 
            version={activeVersion}
            practiceMode={practiceMode}
            onModeChange={setPracticeMode}
            focusArea={focusArea}
            onFocusChange={setFocusArea}
          />
        </aside>

        {/* Center: Live Performance Stage */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden"
          style={{ background: 'var(--riff-surface)' }}
        >
          {/* Ambient glow when listening */}
          <div 
            className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
            style={{
              background: 'radial-gradient(circle at center, var(--riff-accent) 0%, transparent 60%)',
              opacity: sessionState === 'listening' ? 0.06 : 0,
            }}
          />
          
          <LivePerformanceStage 
            project={activeProject}
            version={activeVersion}
            sessionState={sessionState}
            practiceMode={practiceMode}
            onToggleRehearsal={handleToggleRehearsal}
            onSimulateEvent={triggerCoachResponse}
          />
        </div>

        {/* Right: Coach Transcript */}
        <aside
          className="flex w-[360px] shrink-0 flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(to bottom, var(--riff-surface-low), var(--riff-base))',
            borderLeft: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <CoachTranscriptPanel sessionState={sessionState} />
        </aside>

      </div>
    </PageFrame>
  )
}
