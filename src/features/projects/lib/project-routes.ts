export const projectRoutes = {
  details: (projectId: string) => `/projects/${projectId}`,
  version: (projectId: string, versionId: string) =>
    `/projects/${projectId}/versions/${versionId}`,
  studio: (projectId: string) => `/projects/${projectId}/studio`,
  coach: (projectId: string) => `/projects/${projectId}/coach`,
}
