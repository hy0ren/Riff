import { create } from 'zustand'
import type { PersistedProject } from '@/domain/project'
import { loadProjects, resetProjectsToSeed, saveProjects } from '../lib/project-repository'
import { normalizeProject } from '../lib/project-normalizers'

interface ProjectStoreState {
  projects: PersistedProject[]
  replaceProjects: (projects: PersistedProject[]) => void
  upsertProject: (project: PersistedProject) => void
  deleteProject: (projectId: string) => void
  updateProject: (
    projectId: string,
    updater: (project: PersistedProject) => PersistedProject,
  ) => PersistedProject | undefined
  resetProjects: () => void
}

const initialProjects = loadProjects()

export const useProjectStore = create<ProjectStoreState>((set) => ({
  projects: initialProjects,
  replaceProjects: (projects) => {
    const normalizedProjects = projects.map((project) => normalizeProject(project))
    saveProjects(normalizedProjects)
    set({ projects: normalizedProjects })
  },
  upsertProject: (project) =>
    set((state) => {
      const normalizedProject = normalizeProject(project)
      const existingIndex = state.projects.findIndex(
        (existingProject) => existingProject.id === normalizedProject.id,
      )
      const projects =
        existingIndex >= 0
          ? state.projects.map((existingProject) =>
              existingProject.id === normalizedProject.id ? normalizedProject : existingProject,
            )
          : [normalizedProject, ...state.projects]

      saveProjects(projects)
      return { projects }
    }),
  deleteProject: (projectId) =>
    set((state) => {
      const projects = state.projects.filter((project) => project.id !== projectId)
      saveProjects(projects)
      return { projects }
    }),
  updateProject: (projectId, updater) => {
    let updatedProject: PersistedProject | undefined

    set((state) => {
      const projects = state.projects.map((project) => {
        if (project.id !== projectId) {
          return project
        }

        updatedProject = normalizeProject(updater(project))
        return updatedProject
      })

      saveProjects(projects)
      return { projects }
    })

    return updatedProject
  },
  resetProjects: () => {
    const projects = resetProjectsToSeed()
    set({ projects })
  },
}))
