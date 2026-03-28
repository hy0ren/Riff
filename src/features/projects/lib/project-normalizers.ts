import type { Blueprint } from '@/domain/blueprint'
import type { BlueprintDraft } from '@/domain/blueprint-draft'
import type { ExportBundle } from '@/domain/exports'
import type { GenerationRun } from '@/domain/generation-run'
import type { InterpretationSnapshot } from '@/domain/interpretation'
import type {
  PersistedProject,
  Project,
  ProjectBlueprint,
  ProjectLibraryState,
  SourceType,
} from '@/domain/project'
import type { SourceInput } from '@/domain/source-input'
import type { SourceSet } from '@/domain/source-set'
import type { TrackVersion } from '@/domain/track-version'
import { createBlueprintDraft, commitBlueprintDraft } from '@/lib/studio-pipeline/blueprint-draft'
import {
  createGenerationRun,
  createMockTrackVersion,
  updateGenerationRunStatus,
} from '@/lib/studio-pipeline/generation'
import { createStudioId } from '@/lib/studio-pipeline/ids'
import { createInterpretationSnapshot } from '@/lib/studio-pipeline/interpretation'
import {
  createSourceSetFromInputs,
  normalizeStudioSourceInput,
} from '@/lib/studio-pipeline/source-assembly'

function createIsoTimestamp(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString()
}

function createSourceInputs(project: Project): SourceInput[] {
  if (project.sourceInputs?.length) {
    return project.sourceInputs.map(normalizeStudioSourceInput)
  }

  const createdAt = project.createdAt ?? createIsoTimestamp()
  const description = project.description ?? `${project.title} source material`

  switch (project.sourceType) {
    case 'hum':
      return [
        normalizeStudioSourceInput({
          id: `${project.id}-src-hum`,
          projectId: project.id,
          type: 'hum',
          label: 'Hum Recording',
          description,
          iconName: 'Mic',
          createdAt,
          role: 'melodic',
          provenance: 'recorded',
          isReference: false,
          interpretationStatus: 'interpreted',
          durationSeconds: 12,
        }),
      ]
    case 'riff':
      return [
        normalizeStudioSourceInput({
          id: `${project.id}-src-riff`,
          projectId: project.id,
          type: 'riff_audio',
          label: 'Riff Recording',
          description,
          iconName: 'Music',
          createdAt,
          role: 'melodic',
          provenance: 'uploaded',
          isReference: false,
          interpretationStatus: 'interpreted',
          durationSeconds: 24,
        }),
      ]
    case 'chords':
      return [
        normalizeStudioSourceInput({
          id: `${project.id}-src-chords`,
          projectId: project.id,
          type: 'chord_progression',
          label: 'Chord Progression',
          description,
          iconName: 'Type',
          createdAt,
          role: 'harmonic',
          provenance: 'typed',
          isReference: false,
          interpretationStatus: 'attached',
          text: project.description ?? 'Cm7 - Fm9',
        }),
      ]
    case 'sheet_music':
      return [
        normalizeStudioSourceInput({
          id: `${project.id}-src-sheet`,
          projectId: project.id,
          type: 'sheet_music',
          label: 'Sheet Music',
          description,
          iconName: 'FileText',
          createdAt,
          role: 'structural',
          provenance: 'uploaded',
          isReference: false,
          interpretationStatus: 'interpreted',
          fileName: `${project.title}.pdf`,
          fileFormat: 'pdf',
        }),
      ]
    case 'lyrics':
      return [
        normalizeStudioSourceInput({
          id: `${project.id}-src-lyrics`,
          projectId: project.id,
          type: 'lyrics',
          label: 'Lyric Draft',
          description,
          iconName: 'FileText',
          createdAt,
          role: 'lyrical',
          provenance: 'typed',
          isReference: false,
          interpretationStatus: 'attached',
          text: project.description ?? 'Untitled lyric concept',
        }),
      ]
    case 'spotify_track':
      return [
        normalizeStudioSourceInput({
          id: `${project.id}-src-spotify-track`,
          projectId: project.id,
          type: 'spotify_track_reference',
          label: 'Spotify Track Reference',
          description,
          iconName: 'Compass',
          createdAt,
          role: 'reference',
          provenance: 'spotify',
          isReference: true,
          interpretationStatus: 'attached',
          spotifyUri: `spotify:track:${project.id}`,
          artistName: 'Spotify Reference',
          providerTrackName: project.title,
        }),
      ]
    case 'spotify_playlist':
      return [
        normalizeStudioSourceInput({
          id: `${project.id}-src-spotify-playlist`,
          projectId: project.id,
          type: 'spotify_playlist_reference',
          label: 'Spotify Playlist Reference',
          description,
          iconName: 'Compass',
          createdAt,
          role: 'reference',
          provenance: 'spotify',
          isReference: true,
          interpretationStatus: 'attached',
          spotifyUri: `spotify:playlist:${project.id}`,
          playlistName: project.collection ?? `${project.title} References`,
        }),
      ]
    case 'remix':
      return [
        normalizeStudioSourceInput({
          id: `${project.id}-src-remix`,
          projectId: project.id,
          type: 'remix_source',
          label: 'Remix Source',
          description,
          iconName: 'Share',
          createdAt,
          role: 'remix',
          provenance: 'project',
          isReference: false,
          interpretationStatus: 'attached',
          sourceProjectId: project.id,
          sourceVersionId: project.versions?.[0]?.id,
          inheritsEditableAudio: true,
        }),
      ]
    case 'mixed':
      return [
        normalizeStudioSourceInput({
          id: `${project.id}-src-hum`,
          projectId: project.id,
          type: 'hum',
          label: 'Hum Recording',
          description: 'Primary melodic idea',
          iconName: 'Mic',
          createdAt,
          role: 'melodic',
          provenance: 'recorded',
          isReference: false,
          interpretationStatus: 'interpreted',
          durationSeconds: 12,
        }),
        normalizeStudioSourceInput({
          id: `${project.id}-src-spotify-track`,
          projectId: project.id,
          type: 'spotify_track_reference',
          label: 'Spotify Reference',
          description: 'Mood and texture reference',
          iconName: 'Compass',
          createdAt,
          role: 'reference',
          provenance: 'spotify',
          isReference: true,
          interpretationStatus: 'attached',
          spotifyUri: `spotify:track:${project.id}:reference`,
          artistName: 'Reference Artist',
          providerTrackName: project.title,
        }),
      ]
    default:
      return []
  }
}

function createBlueprints(project: Project, sourceInputs: SourceInput[]): Blueprint[] {
  if (project.blueprints?.length) {
    return project.blueprints
  }

  if (!project.blueprint) {
    return []
  }

  const blueprintId = project.blueprint.id ?? `${project.id}-bp-1`
  const createdAt = project.createdAt ?? createIsoTimestamp()
  const updatedAt = project.updatedAt ?? createdAt
  const draftBlueprint = project.blueprint as ProjectBlueprint

  return [
    {
      ...draftBlueprint,
      id: blueprintId,
      projectId: project.id,
      revision: draftBlueprint.revision ?? 1,
      createdAt: draftBlueprint.createdAt ?? createdAt,
      updatedAt: draftBlueprint.updatedAt ?? updatedAt,
      sourceInputIds:
        draftBlueprint.sourceInputIds ?? sourceInputs.map((sourceInput) => sourceInput.id),
    },
  ]
}

function createSourceSets(project: Project, sourceInputs: SourceInput[]): SourceSet[] {
  if (project.sourceSets?.length) {
    return project.sourceSets.map((sourceSet) =>
      createSourceSetFromInputs(project.id, sourceInputs, sourceSet),
    )
  }

  if (!sourceInputs.length) {
    return []
  }

  return [createSourceSetFromInputs(project.id, sourceInputs)]
}

function createInterpretations(
  project: Project,
  sourceSet: SourceSet | undefined,
  sourceInputs: SourceInput[],
  activeBlueprint?: Blueprint,
): InterpretationSnapshot[] {
  if (!sourceSet) {
    return []
  }

  const activeInterpretation = project.interpretations?.find(
    (interpretation) => interpretation.id === project.activeInterpretationId,
  )

  if (project.interpretations?.length) {
    return [
      createInterpretationSnapshot({
        project,
        sourceSet,
        sourceInputs,
        activeBlueprint,
        existingInterpretation: activeInterpretation ?? project.interpretations[project.interpretations.length - 1],
      }),
      ...project.interpretations.filter(
        (interpretation) => interpretation.id !== activeInterpretation?.id,
      ),
    ]
  }

  return [
    createInterpretationSnapshot({
      project,
      sourceSet,
      sourceInputs,
      activeBlueprint,
    }),
  ]
}

function createWorkingBlueprintDraft(
  project: Project,
  sourceSet: SourceSet | undefined,
  interpretation: InterpretationSnapshot | undefined,
  activeBlueprint?: Blueprint,
): BlueprintDraft {
  return createBlueprintDraft({
    projectId: project.id,
    sourceSetId: sourceSet?.id ?? createStudioId('sourceset-empty'),
    interpretation:
      interpretation ??
      {
        id: createStudioId('interp'),
        projectId: project.id,
        sourceSetId: sourceSet?.id ?? '',
        createdAt: createIsoTimestamp(),
        updatedAt: createIsoTimestamp(),
        summary: 'No interpretation available.',
        sourceInputIds: [],
        derivedBlueprint: activeBlueprint ?? {},
        signals: [],
        conflicts: [],
      },
    activeBlueprint,
    existingDraft: project.workingBlueprintDraft,
  })
}

function createTrackVersions(
  project: Project,
  blueprints: Blueprint[],
  sourceSetId?: string,
  interpretationId?: string,
): TrackVersion[] {
  const versions = project.versions ?? []
  const fallbackBlueprintId = blueprints[0]?.id

  return versions.map((version) => ({
    ...version,
    projectId: project.id,
    kind: version.kind ?? 'base',
    sourceBlueprintId: version.sourceBlueprintId ?? fallbackBlueprintId,
    sourceSetId: version.sourceSetId ?? sourceSetId,
    interpretationId: version.interpretationId ?? interpretationId,
  }))
}

function createSyntheticGenerationRuns(
  project: Project,
  versions: TrackVersion[],
  sourceSet: SourceSet | undefined,
  sourceInputs: SourceInput[],
  interpretation: InterpretationSnapshot | undefined,
  blueprints: Blueprint[],
): GenerationRun[] {
  if (!sourceSet || !interpretation) {
    return []
  }

  return versions.map((version) => {
    const blueprint =
      blueprints.find((candidate) => candidate.id === version.sourceBlueprintId) ??
      blueprints[blueprints.length - 1]

    if (!blueprint) {
      const placeholderBlueprint = commitBlueprintDraft({
        projectId: project.id,
        draft: createWorkingBlueprintDraft(project, sourceSet, interpretation),
      }).blueprint
      blueprints = [...blueprints, placeholderBlueprint]
    }

    const run = createGenerationRun({
      project,
      sourceSet,
      sourceInputs,
      interpretation,
      blueprint: blueprint ?? blueprints[blueprints.length - 1],
      kind: version.kind ?? 'base',
      parentVersionId: version.parentVersionId,
      modifiers: {
        loadOnSuccess: version.isActive,
        refinementPrompt: version.notes,
      },
    })

    return updateGenerationRunStatus(run, 'succeeded', {
      createdAt: version.timestamp,
      updatedAt: version.timestamp,
      startedAt: version.timestamp,
      completedAt: version.timestamp,
      outputVersionId: version.id,
      id: version.generationRunId ?? `${project.id}-${version.id}-run`,
    })
  })
}

function createGenerationRuns(
  project: Project,
  versions: TrackVersion[],
  sourceSet: SourceSet | undefined,
  sourceInputs: SourceInput[],
  interpretation: InterpretationSnapshot | undefined,
  blueprints: Blueprint[],
): GenerationRun[] {
  if (project.generationRuns?.length) {
    return project.generationRuns
  }

  return createSyntheticGenerationRuns(
    project,
    versions,
    sourceSet,
    sourceInputs,
    interpretation,
    blueprints,
  )
}

function attachRunIdsToVersions(
  versions: TrackVersion[],
  generationRuns: GenerationRun[],
  sourceSetId?: string,
  interpretationId?: string,
): TrackVersion[] {
  const runByOutputVersionId = new Map(
    generationRuns
      .filter((run) => run.outputVersionId)
      .map((run) => [run.outputVersionId as string, run]),
  )

  return versions.map((version) => ({
    ...version,
    sourceSetId: version.sourceSetId ?? sourceSetId,
    interpretationId: version.interpretationId ?? interpretationId,
    generationRunId: version.generationRunId ?? runByOutputVersionId.get(version.id)?.id,
  }))
}

function createExportBundles(project: Project, versions: TrackVersion[]): ExportBundle[] {
  if (project.exportBundles?.length) {
    return project.exportBundles
  }

  const exportVersion = versions.find((version) => version.exports?.length)

  if (!exportVersion?.exports?.length) {
    return []
  }

  return [
    {
      id: `${project.id}-bundle-1`,
      projectId: project.id,
      versionId: exportVersion.id,
      projectTitle: project.title,
      projectCoverUrl: project.coverUrl,
      status: exportVersion.exports.every((asset) => asset.status === 'ready') ? 'ready' : 'pending',
      bundlePreset: 'full',
      assets: exportVersion.exports.map((asset) => ({
        id: `${project.id}-${exportVersion.id}-${asset.type}`,
        type:
          asset.type === 'midi'
            ? 'metadata'
            : asset.type === 'chord_sheet'
              ? 'chord_sheet'
              : asset.type === 'lyrics'
                ? 'lyrics'
                : asset.type,
        name: `${project.title} ${asset.type.replace('_', ' ')}`,
        description: `${asset.type.replace('_', ' ')} export for ${project.title}`,
        format:
          asset.type === 'midi'
            ? 'MID'
            : asset.type === 'chord_sheet'
              ? 'TXT'
              : asset.type === 'lyrics'
                ? 'TXT'
                : 'WAV',
        status:
          asset.status === 'unavailable'
            ? 'failed'
            : asset.status === 'generating'
              ? 'generating'
              : 'ready',
        size: asset.size ?? '--',
        lastGenerated: asset.lastGenerated ?? 'Unknown',
      })),
      totalSize: '85MB',
      createdAt: exportVersion.timestamp,
      lastRegenerated: exportVersion.timestamp,
    },
  ]
}

function deriveSourceType(sourceInputs: SourceInput[], fallback?: SourceType): SourceType {
  if (fallback) {
    return fallback
  }

  if (sourceInputs.length > 1) {
    return 'mixed'
  }

  switch (sourceInputs[0]?.type) {
    case 'hum':
    case 'sung_melody':
      return 'hum'
    case 'riff_audio':
      return 'riff'
    case 'chord_progression':
      return 'chords'
    case 'sheet_music':
      return 'sheet_music'
    case 'lyrics':
    case 'typed_notes':
      return 'lyrics'
    case 'remix_source':
      return 'remix'
    case 'spotify_track_reference':
      return 'spotify_track'
    case 'spotify_playlist_reference':
      return 'spotify_playlist'
    default:
      return 'mixed'
  }
}

function getActiveBlueprint(project: Project, blueprints: Blueprint[]): Blueprint | undefined {
  return (
    blueprints.find((blueprint) => blueprint.id === project.activeBlueprintId) ??
    blueprints[blueprints.length - 1]
  )
}

export function normalizeProject(project: Project): PersistedProject {
  const sourceInputs = createSourceInputs(project)
  const sourceSets = createSourceSets(project, sourceInputs)
  const activeSourceSet =
    sourceSets.find((sourceSet) => sourceSet.id === project.activeSourceSetId) ?? sourceSets[0]
  const blueprints = createBlueprints(project, sourceInputs)
  const activeBlueprint = getActiveBlueprint(project, blueprints)
  const interpretations = createInterpretations(project, activeSourceSet, sourceInputs, activeBlueprint)
  const activeInterpretation =
    interpretations.find((interpretation) => interpretation.id === project.activeInterpretationId) ??
    interpretations[0]
  const workingBlueprintDraft = createWorkingBlueprintDraft(
    project,
    activeSourceSet,
    activeInterpretation,
    activeBlueprint,
  )
  let versions = createTrackVersions(
    project,
    blueprints,
    activeSourceSet?.id,
    activeInterpretation?.id,
  )
  const generationRuns = createGenerationRuns(
    project,
    versions,
    activeSourceSet,
    sourceInputs,
    activeInterpretation,
    blueprints,
  )
  versions = attachRunIdsToVersions(
    versions,
    generationRuns,
    activeSourceSet?.id,
    activeInterpretation?.id,
  )

  if (!versions.length && blueprints.length && activeSourceSet && activeInterpretation) {
    const syntheticRun = createGenerationRun({
      project,
      sourceSet: activeSourceSet,
      sourceInputs,
      interpretation: activeInterpretation,
      blueprint: blueprints[blueprints.length - 1],
      kind: 'base',
      modifiers: { loadOnSuccess: true },
    })
    const generatedVersion = createMockTrackVersion({
      project: {
        ...project,
        versions,
      },
      generationRun: syntheticRun,
    })
    const completedRun = updateGenerationRunStatus(syntheticRun, 'succeeded', {
      outputVersionId: generatedVersion.id,
    })
    versions = [generatedVersion]
    generationRuns.push(completedRun)
  }

  const exportBundles = createExportBundles(project, versions)
  const activeVersion =
    versions.find((version) => version.id === project.activeVersionId) ??
    versions.find((version) => version.isActive) ??
    versions[versions.length - 1]

  const library: ProjectLibraryState = project.library ?? {
    sourceType: deriveSourceType(sourceInputs, project.sourceType),
    isFavorite: project.isFavorite ?? false,
    isExported: project.isExported ?? exportBundles.length > 0,
    collection: project.collection,
  }

  return {
    ...project,
    sourceInputs,
    sourceSets,
    interpretations,
    blueprints,
    generationRuns,
    workingBlueprintDraft,
    activeSourceSetId: project.activeSourceSetId ?? activeSourceSet?.id,
    activeInterpretationId: project.activeInterpretationId ?? activeInterpretation?.id,
    activeBlueprintId: project.activeBlueprintId ?? activeBlueprint?.id,
    versions,
    activeVersionId: project.activeVersionId ?? activeVersion?.id,
    exportBundles,
    library,
    publication:
      project.publication ?? {
        isPublished: project.isPublished ?? false,
        remixable: project.isPublished ?? false,
        discoveryEligible: project.isPublished ?? false,
      },
    versionCount: project.versionCount || versions.length,
    blueprint: activeBlueprint ?? project.blueprint,
    sourceType: library.sourceType,
    isFavorite: library.isFavorite,
    isPublished: project.publication?.isPublished ?? project.isPublished ?? false,
    isExported: library.isExported,
    collection: library.collection,
    description: project.description,
    mood: project.mood ?? activeBlueprint?.mood ?? workingBlueprintDraft.mood,
    vocalsEnabled:
      project.vocalsEnabled ?? activeBlueprint?.vocalsEnabled ?? workingBlueprintDraft.vocalsEnabled,
    lastLearnedAt: project.lastLearnedAt ?? project.lastPracticed,
    learnReady: project.learnReady ?? project.practiceReady ?? versions.length > 0,
    bpm: project.bpm ?? activeBlueprint?.bpm ?? workingBlueprintDraft.bpm,
    key: project.key ?? activeBlueprint?.key ?? workingBlueprintDraft.key,
    genre: project.genre ?? activeBlueprint?.genre ?? workingBlueprintDraft.genre,
  }
}
