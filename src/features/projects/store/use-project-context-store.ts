import { create } from 'zustand'

interface ActiveProjectContext {
  activeProjectId: string | null
  activeProjectName: string | null
  activeVersionId: string | null
  setActiveProjectContext: (context: {
    projectId: string | null
    projectName?: string | null
    versionId?: string | null
  }) => void
}

export const useProjectContextStore = create<ActiveProjectContext>((set) => ({
  activeProjectId: null,
  activeProjectName: null,
  activeVersionId: null,
  setActiveProjectContext: ({
    projectId,
    projectName = null,
    versionId = null,
  }) =>
    set({
      activeProjectId: projectId,
      activeProjectName: projectName,
      activeVersionId: versionId,
    }),
}))
