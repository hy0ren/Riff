import { Navigate, useParams } from 'react-router-dom'
import { PageFrame } from '@/components/layout/page-frame'
import { RECENT_PROJECTS } from '@/mocks/mock-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrackHero } from './components/track-hero'
import { OverviewTab } from './components/overview-tab'
import { ChordsTab } from './components/chords-tab'
import { MelodyTab } from './components/melody-tab'
import { LyricsTab } from './components/lyrics-tab'
import { ExportsTab } from './components/exports-tab'

export function TrackDetailsPage() {
  const { id } = useParams()
  
  // For the prototype, if no ID is passed or if it doesn't match, we fallback to our highly-mocked active project
  const projectId = id || 'proj-active-1'
  const activeProject = RECENT_PROJECTS.find(p => p.id === projectId) || RECENT_PROJECTS.find(p => p.id === 'proj-active-1')

  if (!activeProject || !activeProject.versions) {
    return <Navigate to="/" replace />
  }

  const activeVersion = activeProject.versions.find(v => v.isActive) || activeProject.versions[activeProject.versions.length - 1]

  return (
    <PageFrame fullBleed noPadding>
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
