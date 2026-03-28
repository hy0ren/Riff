import { Navigate, useParams } from 'react-router-dom'
import { getPrimaryProjectId, resolveProjectId } from '../lib/project-selectors'
import { projectRoutes } from '../lib/project-routes'
import { useProjectContextStore } from '../store/use-project-context-store'

export function LegacyStudioRedirect() {
  const activeProjectId = useProjectContextStore((state) => state.activeProjectId)
  return <Navigate to={projectRoutes.studio(activeProjectId ?? getPrimaryProjectId())} replace />
}

export function LegacyCoachRedirect() {
  const activeProjectId = useProjectContextStore((state) => state.activeProjectId)
  return <Navigate to={projectRoutes.coach(activeProjectId ?? getPrimaryProjectId())} replace />
}

export function LegacyTrackRedirect() {
  const { id } = useParams()
  return <Navigate to={projectRoutes.details(resolveProjectId(id))} replace />
}
