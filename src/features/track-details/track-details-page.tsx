import { Navigate, useParams } from 'react-router-dom'
import { PageFrame } from '@/components/layout/page-frame'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrackHero } from './components/track-hero'
import { OverviewTab } from './components/overview-tab'
import { ChordsTab } from './components/chords-tab'
import { MelodyTab } from './components/melody-tab'
import { LyricsTab } from './components/lyrics-tab'
import { ExportsTab } from './components/exports-tab'
import {
  getProjectVersion,
  useMatchedProject,
  useResolvedProject,
} from '@/features/projects/lib/project-selectors'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { useProjectRouteContext } from '@/features/projects/hooks/use-project-route-context'

export function TrackDetailsPage() {
  const { projectId, versionId } = useParams()
  const matchedProject = useMatchedProject(projectId)
  const activeProject = useResolvedProject(projectId)
  const activeVersion = activeProject.versions
    ? getProjectVersion(activeProject, versionId)
    : undefined

  useProjectRouteContext({
    projectId: activeProject.id,
    projectName: activeProject.title,
    versionId: activeVersion?.id ?? null,
  })

  if (!activeProject || !activeProject.versions) {
    return <Navigate to="/" replace />
  }

  if (!matchedProject && projectId) {
    return <Navigate to={projectRoutes.details(activeProject.id)} replace />
  }

  if (!activeVersion) {
    return <Navigate to={projectRoutes.details(activeProject.id)} replace />
  }

  return (
    <PageFrame fullBleed>
      <div className="flex h-full flex-col bg-[var(--riff-background)] overflow-y-auto">
        
        {/* Rich Hero Section */}
        <TrackHero project={activeProject} activeVersion={activeVersion} />

        {/* Tabbed Inspector Workspace */}
        <div className="mx-auto w-full max-w-[1400px] px-8 pb-12">
          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="bg-[var(--riff-surface-low)] p-1 rounded-xl w-full justify-start overflow-x-auto border border-[var(--riff-surface-highest)]">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[var(--riff-surface-high)] font-medium px-6">Overview</TabsTrigger>
              <TabsTrigger value="chords" className="rounded-lg data-[state=active]:bg-[var(--riff-surface-high)] font-medium px-6">Chords</TabsTrigger>
              <TabsTrigger value="melody" className="rounded-lg data-[state=active]:bg-[var(--riff-surface-high)] font-medium px-6">Melody</TabsTrigger>
              <TabsTrigger value="lyrics" className="rounded-lg data-[state=active]:bg-[var(--riff-surface-high)] font-medium px-6">Lyrics</TabsTrigger>
              <TabsTrigger value="exports" className="rounded-lg data-[state=active]:bg-[var(--riff-surface-high)] font-medium px-6">Exports</TabsTrigger>
            </TabsList>
            
            <div className="mt-8">
              <TabsContent value="overview" className="focus-visible:outline-none">
                <OverviewTab project={activeProject} version={activeVersion} />
              </TabsContent>
              <TabsContent value="chords" className="focus-visible:outline-none">
                <ChordsTab version={activeVersion} />
              </TabsContent>
              <TabsContent value="melody" className="focus-visible:outline-none">
                <MelodyTab version={activeVersion} />
              </TabsContent>
              <TabsContent value="lyrics" className="focus-visible:outline-none">
                <LyricsTab version={activeVersion} />
              </TabsContent>
              <TabsContent value="exports" className="focus-visible:outline-none">
                <ExportsTab version={activeVersion} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

      </div>
    </PageFrame>
  )
}
