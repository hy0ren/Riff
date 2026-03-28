import { useEffect } from 'react'
import { PageFrame } from '@/components/layout/page-frame'
import { Navigate, useParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { SourceContextPanel } from './components/source-context-panel'
import { GenerationWorkspace } from './components/generation-workspace'
import { BlueprintEditor } from './components/blueprint-editor'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import {
  getActiveInterpretation,
  getActiveSourceSet,
  getWorkingBlueprintDraft,
  useMatchedProject,
  useResolvedProject,
} from '@/features/projects/lib/project-selectors'
import { useProjectRouteContext } from '@/features/projects/hooks/use-project-route-context'
import { useStudioStore } from './store/use-studio-store'

export function StudioPage() {
  const { projectId } = useParams()
  const matchedProject = useMatchedProject(projectId)
  const activeProject = useResolvedProject(projectId)
  const activeSourceSet = getActiveSourceSet(activeProject)
  const activeInterpretation = getActiveInterpretation(activeProject)
  const workingBlueprintDraft = getWorkingBlueprintDraft(activeProject)
  const {
    selectedSourceSetId,
    interpretationStatus,
    quickRefinementText,
    activeGenerationRunId,
    generationError,
    hydrateProject,
    renameProject,
    refreshInterpretation,
    toggleSourceEnabled,
    setSourceWeight,
    updateSourceInputField,
    updateDraftField,
    commitDraft,
    startGeneration,
    loadVersion,
    setQuickRefinementText,
  } = useStudioStore()

  useProjectRouteContext({
    projectId: activeProject.id,
    projectName: activeProject.title,
  })

  useEffect(() => {
    hydrateProject(activeProject.id)
  }, [activeProject.id, hydrateProject])

  if (!matchedProject && projectId) {
    return <Navigate to={projectRoutes.studio(activeProject.id)} replace />
  }

  if (!activeProject || !activeProject.versions) {
    return <Navigate to="/" replace />
  }

  return (
    <PageFrame
      subtitle="Multi-Input Studio"
      fullBleed
      actions={
        <div className="w-[360px]">
          <Input
            value={activeProject.title}
            onChange={(event) => renameProject(activeProject.id, event.target.value)}
            className="bg-[var(--riff-surface-low)] border-[var(--riff-surface-highest)] text-sm font-semibold"
          />
        </div>
      }
    >
      <div className="flex flex-1 overflow-hidden p-4 gap-0">
        
        {/* Left Column: Source Assembly */}
        <div className="w-[320px] shrink-0 overflow-y-auto pr-2">
          <SourceContextPanel
            sourceInputs={activeProject.sourceInputs}
            sourceSet={activeProject.sourceSets.find((sourceSet) => sourceSet.id === selectedSourceSetId) ?? activeSourceSet}
            interpretation={activeInterpretation}
            interpretationStatus={interpretationStatus}
            onRefreshInterpretation={() => refreshInterpretation(activeProject.id)}
            onToggleSourceEnabled={(sourceInputId) => toggleSourceEnabled(activeProject.id, sourceInputId)}
            onSourceWeightChange={(sourceInputId, weight) =>
              setSourceWeight(activeProject.id, sourceInputId, weight)
            }
            onSourceFieldChange={(sourceInputId, field, value) =>
              updateSourceInputField(activeProject.id, sourceInputId, field, value)
            }
          />
        </div>

        {/* Center Column: Generation Canvas */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden px-4 border-l border-r border-[rgba(255,255,255,0.04)]">
          <GenerationWorkspace
            projectTitle={activeProject.title}
            projectArtUrl={activeProject.coverUrl ?? activeProject.artUrl}
            versions={activeProject.versions}
            generationRuns={activeProject.generationRuns}
            activeVersionId={activeProject.activeVersionId}
            activeGenerationRunId={activeGenerationRunId}
            generationError={generationError}
            quickRefinementText={quickRefinementText}
            onQuickRefinementChange={setQuickRefinementText}
            onGenerate={(kind) => startGeneration(activeProject.id, { kind })}
            onLoadVersion={(versionId) => loadVersion(activeProject.id, versionId)}
          />
        </div>

        {/* Right Column: Blueprint & Refinement */}
        <div className="w-[340px] shrink-0 overflow-y-auto pl-2">
          <BlueprintEditor
            draft={workingBlueprintDraft}
            isGenerating={activeProject.generationRuns.some((generationRun) =>
              ['queued', 'running'].includes(generationRun.status),
            )}
            onFieldChange={(field, value) => updateDraftField(activeProject.id, field, value)}
            onCommitDraft={() => commitDraft(activeProject.id)}
            onGenerate={() => startGeneration(activeProject.id, { kind: 'base' })}
          />
        </div>

      </div>
    </PageFrame>
  )
}
