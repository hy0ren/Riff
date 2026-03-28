import { create } from 'zustand'
import type { PersistedProject } from '@/domain/project'
import { loadProjects, resetProjectsToSeed, saveProjects } from '../lib/project-repository'

interface ProjectStoreState {
  projects: PersistedProject[]
  replaceProjects: (projects: PersistedProject[]) => void
  upsertProject: (project: PersistedProject) => void
  resetProjects: () => void
}

const initialProjects = loadProjects()

export const useProjectStore = create<ProjectStoreState>((set) => ({
  projects: initialProjects,
  replaceProjects: (projects) => {
    saveProjects(projects)
    set({ projects })
  },
  upsertProject: (project) =>
    set((state) => {
      const existingIndex = state.projects.findIndex(
        (existingProject) => existingProject.id === project.id,
      )
      const projects =
        existingIndex >= 0
          ? state.projects.map((existingProject) =>
              existingProject.id === project.id ? project : existingProject,
            )
          : [project, ...state.projects]

      saveProjects(projects)
      return { projects }
    }),
  resetProjects: () => {
    const projects = resetProjectsToSeed()
    set({ projects })
  },
}))
