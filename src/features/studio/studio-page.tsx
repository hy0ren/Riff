import { PageFrame } from '@/components/layout/page-frame'
import { Navigate, useParams } from 'react-router-dom'
import { SourceContextPanel } from './components/source-context-panel'
import { GenerationWorkspace } from './components/generation-workspace'
import { BlueprintEditor } from './components/blueprint-editor'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { findProjectById, resolveProject } from '@/features/projects/lib/project-selectors'
import { useProjectRouteContext } from '@/features/projects/hooks/use-project-route-context'

export function StudioPage() {
  const { projectId } = useParams()
  const matchedProject = findProjectById(projectId)
  const activeProject = resolveProject(projectId)

  useProjectRouteContext({
    projectId: activeProject.id,
    projectName: activeProject.title,
  })

  if (!matchedProject && projectId) {
    return <Navigate to={projectRoutes.studio(activeProject.id)} replace />
  }

  if (!activeProject || !activeProject.blueprint || !activeProject.versions) {
    return <Navigate to="/" replace />
  }

  return (
    <PageFrame title={activeProject.title} subtitle="Multi-Input Studio" fullBleed>
      <div className="flex flex-1 overflow-hidden p-4 gap-0">
        
        {/* Left Column: Source Assembly */}
        <div className="w-[320px] shrink-0 overflow-y-auto pr-2">
          <SourceContextPanel />
        </div>

        {/* Center Column: Generation Canvas */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden px-4 border-l border-r border-[rgba(255,255,255,0.04)]">
          <GenerationWorkspace versions={activeProject.versions} />
        </div>

        {/* Right Column: Blueprint & Refinement */}
        <div className="w-[340px] shrink-0 overflow-y-auto pl-2">
          <BlueprintEditor blueprint={activeProject.blueprint} />
        </div>

      </div>
    </PageFrame>
  )
}
