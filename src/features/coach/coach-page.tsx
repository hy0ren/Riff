import { useEffect } from 'react'
import { PageFrame } from '@/components/layout/page-frame'
import { Navigate, useParams } from 'react-router-dom'
import { PracticeContextPanel } from './components/practice-context-panel'
import { LivePerformanceStage } from './components/live-performance-stage'
import { CoachTranscriptPanel } from './components/coach-transcript-panel'
import {
  getProjectVersion,
  useMatchedProject,
  useResolvedProject,
} from '@/features/projects/lib/project-selectors'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { useProjectRouteContext } from '@/features/projects/hooks/use-project-route-context'
import { usePracticeSessionStore } from './store/use-practice-session-store'

export function CoachPage() {
  const { projectId } = useParams()
  const matchedProject = useMatchedProject(projectId)
  const activeProject = useResolvedProject(projectId)
  const activeVersion = getProjectVersion(activeProject)
  const {
    sessionState,
    practiceMode,
    focusArea,
    selectedSection,
    practiceBrief,
    feedbackEvents,
    setTarget,
    setSessionState,
    setPracticeMode,
    setFocusArea,
    setSelectedSection,
    connectSession,
    requestFeedback,
    disconnectSession,
  } = usePracticeSessionStore()

  useProjectRouteContext({
    projectId: activeProject.id,
    projectName: activeProject.title,
    versionId: activeVersion?.id ?? null,
  })

  useEffect(() => {
    setTarget(activeProject.id, activeVersion?.id ?? null)
  }, [activeProject.id, activeVersion?.id, setTarget])

  useEffect(() => {
    void connectSession(activeProject, activeVersion)

    return () => {
      disconnectSession()
    }
  }, [activeProject, activeVersion, connectSession, disconnectSession])

  if (!matchedProject && projectId) {
    return <Navigate to={projectRoutes.coach(activeProject.id)} replace />
  }

  const handleToggleRehearsal = () => {
    if (sessionState === 'idle' || sessionState === 'paused') {
      setSessionState('listening')
    } else {
      setSessionState('paused')
    }
  }

  const triggerCoachResponse = () => {
    void requestFeedback(activeProject, activeVersion)
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
            selectedSection={selectedSection}
            onSectionChange={setSelectedSection}
            practiceBrief={practiceBrief}
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
          <CoachTranscriptPanel sessionState={sessionState} feedbackEvents={feedbackEvents} />
        </aside>

      </div>
    </PageFrame>
  )
}
