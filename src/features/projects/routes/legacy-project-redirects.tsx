import { Navigate, useParams } from 'react-router-dom'
import { getPrimaryProjectId, resolveProjectId } from '../lib/project-selectors'
import { projectRoutes } from '../lib/project-routes'
import { useProjectContextStore } from '../store/use-project-context-store'

export function LegacyStudioRedirect() {
  const activeProjectId = useProjectContextStore((state) => state.activeProjectId)
  return <Navigate to={projectRoutes.studio(activeProjectId ?? getPrimaryProjectId())} replace />
}

export function LegacyLearnRedirect() {
  const activeProjectId = useProjectContextStore((state) => state.activeProjectId)
  return <Navigate to={projectRoutes.learn(activeProjectId ?? getPrimaryProjectId())} replace />
}

export function LegacyProjectCoachRedirect() {
  const { projectId } = useParams()
  return <Navigate to={projectRoutes.learn(resolveProjectId(projectId))} replace />
}

export function LegacyTrackRedirect() {
  const { id } = useParams()
  return <Navigate to={projectRoutes.details(resolveProjectId(id))} replace />
}
