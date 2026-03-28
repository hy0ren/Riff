import { useState } from 'react'
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
import {
  buildChordSheetPlainText,
  buildLyricsPlainText,
  buildMelodyGuidePlainText,
  getVersionBlueprint,
  getVersionLyrics,
  getVersionSectionGuides,
  getVersionStructure,
} from '@/features/projects/lib/project-details'
import { exportAssetToDisk } from '@/lib/platform/fs-commands'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import { summarizeTrackVersion } from '@/lib/providers/gemini-gateway'

export function TrackDetailsPage() {
  const { projectId, versionId } = useParams()
  const matchedProject = useMatchedProject(projectId)
  const activeProject = useResolvedProject(projectId)
  const updateProject = useProjectStore((state) => state.updateProject)
  const [isAnalyzingLyrics, setIsAnalyzingLyrics] = useState(false)

  const activeVersion = activeProject.versions
    ? getProjectVersion(activeProject, versionId)
    : undefined
  const activeBlueprint = activeVersion ? getVersionBlueprint(activeProject, activeVersion) : undefined
  const activeLyrics = activeVersion ? getVersionLyrics(activeProject, activeVersion) : undefined
  const activeStructure = activeVersion ? getVersionStructure(activeProject, activeVersion) : undefined
  const activeSectionGuides = activeVersion
    ? getVersionSectionGuides(activeProject, activeVersion)
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

  const handleAnalyzeLyrics = async () => {
    if (!activeVersion?.audioUrl || !activeBlueprint || isAnalyzingLyrics) {
      return
    }

    setIsAnalyzingLyrics(true)
    try {
      const insight = await summarizeTrackVersion({
        projectId: activeProject.id,
        projectTitle: activeProject.title,
        versionId: activeVersion.id,
        blueprint: activeBlueprint,
        versionName: activeVersion.name,
        notes: activeVersion.notes,
        audioDataUrl: activeVersion.audioUrl,
        structure: activeVersion.structure,
        lyrics: activeVersion.lyrics,
      })

      updateProject(activeProject.id, (project) => ({
        ...project,
        versions: project.versions.map((v) =>
          v.id === activeVersion.id
            ? {
                ...v,
                insight,
                structure: insight.chordSections ?? v.structure,
                lyrics: insight.lyricSections ?? v.lyrics,
              }
            : v,
        ),
      }))
    } finally {
      setIsAnalyzingLyrics(false)
    }
  }

  const handleExportLyrics = async () => {
    await exportAssetToDisk({
      projectId: activeProject.id,
      assetId: `${activeVersion.id}-lyrics-sheet`,
      filename: `${activeProject.title}-${activeVersion.name}-lyrics.txt`.replace(/\s+/g, '-').toLowerCase(),
      format: 'txt',
      contents: buildLyricsPlainText(activeLyrics),
      mimeType: 'text/plain',
    })
  }

  const handleExportSong = async () => {
    if (!activeVersion.audioUrl) {
      return
    }

    const match = activeVersion.audioUrl.match(/^data:([^;]+);base64,(.+)$/)
    await exportAssetToDisk({
      projectId: activeProject.id,
      assetId: `${activeVersion.id}-audio`,
      filename: `${activeProject.title}-${activeVersion.name}.wav`.replace(/\s+/g, '-').toLowerCase(),
      format: 'wav',
      base64Data: match?.[2],
      mimeType: match?.[1] ?? 'audio/wav',
    })
  }

  const handleExportChords = async () => {
    await exportAssetToDisk({
      projectId: activeProject.id,
      assetId: `${activeVersion.id}-chord-sheet`,
      filename: `${activeProject.title}-${activeVersion.name}-chords.txt`.replace(/\s+/g, '-').toLowerCase(),
      format: 'txt',
      contents: buildChordSheetPlainText(activeStructure),
      mimeType: 'text/plain',
    })
  }

  const handleExportMelodyGuide = async () => {
    await exportAssetToDisk({
      projectId: activeProject.id,
      assetId: `${activeVersion.id}-melody-guide`,
      filename: `${activeProject.title}-${activeVersion.name}-melody-guide.txt`.replace(/\s+/g, '-').toLowerCase(),
      format: 'txt',
      contents: buildMelodyGuidePlainText(activeBlueprint, activeSectionGuides),
      mimeType: 'text/plain',
    })
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
                <OverviewTab
                  project={activeProject}
                  version={activeVersion}
                  blueprint={activeBlueprint}
                  structure={activeStructure}
                />
              </TabsContent>
              <TabsContent value="chords" className="focus-visible:outline-none">
                <ChordsTab
                  structure={activeStructure}
                  onExport={() => void handleExportChords()}
                />
              </TabsContent>
              <TabsContent value="melody" className="focus-visible:outline-none">
                <MelodyTab
                  version={activeVersion}
                  blueprint={activeBlueprint}
                  structure={activeStructure}
                  lyrics={activeLyrics}
                  sectionGuides={activeSectionGuides}
                  onExport={() => void handleExportMelodyGuide()}
                />
              </TabsContent>
              <TabsContent value="lyrics" className="focus-visible:outline-none">
                <LyricsTab
                  lyrics={activeLyrics}
                  structure={activeStructure}
                  hasAudio={Boolean(activeVersion.audioUrl)}
                  hasVocals={activeBlueprint?.vocalsEnabled}
                  isAnalyzing={isAnalyzingLyrics}
                  onAnalyze={() => void handleAnalyzeLyrics()}
                  onExport={() => void handleExportLyrics()}
                />
              </TabsContent>
              <TabsContent value="exports" className="focus-visible:outline-none">
                <ExportsTab
                  project={activeProject}
                  version={activeVersion}
                  lyrics={activeLyrics}
                  structure={activeStructure}
                  onExportSong={() => void handleExportSong()}
                  onExportLyrics={() => void handleExportLyrics()}
                  onExportChords={() => void handleExportChords()}
                  onExportMelodyGuide={() => void handleExportMelodyGuide()}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

      </div>
    </PageFrame>
  )
}
