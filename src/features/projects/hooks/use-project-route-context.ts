import { useEffect } from 'react'
import { useProjectContextStore } from '../store/use-project-context-store'

interface UseProjectRouteContextOptions {
  projectId: string
  projectName: string
  versionId?: string | null
}

export function useProjectRouteContext({
  projectId,
  projectName,
  versionId = null,
}: UseProjectRouteContextOptions) {
  const setActiveProjectContext = useProjectContextStore(
    (state) => state.setActiveProjectContext,
  )

  useEffect(() => {
    setActiveProjectContext({ projectId, projectName, versionId })
  }, [projectId, projectName, versionId, setActiveProjectContext])
}
