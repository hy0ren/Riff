import type { PersistedProject, Project } from '@/domain/project'
import { readStorageJson, writeStorageJson } from '@/lib/persistence/local-storage'
import { LIBRARY_PROJECTS } from '@/mocks/mock-data'
import { normalizeProject } from './project-normalizers'

const PROJECTS_STORAGE_KEY = 'riff.projects'

function cloneProjects(projects: Project[]): Project[] {
  return JSON.parse(JSON.stringify(projects)) as Project[]
}

function createSeedProjects(): PersistedProject[] {
  return cloneProjects(LIBRARY_PROJECTS).map(normalizeProject)
}

export function resetProjectsToSeed(): PersistedProject[] {
  const seedProjects = createSeedProjects()
  writeStorageJson(PROJECTS_STORAGE_KEY, seedProjects)
  return seedProjects
}

export function loadProjects(): PersistedProject[] {
  const storedProjects = readStorageJson<Project[]>(PROJECTS_STORAGE_KEY, [])

  if (!storedProjects.length) {
    return resetProjectsToSeed()
  }

  return storedProjects.map(normalizeProject)
}

export function saveProjects(projects: PersistedProject[]): void {
  writeStorageJson(PROJECTS_STORAGE_KEY, projects)
}
