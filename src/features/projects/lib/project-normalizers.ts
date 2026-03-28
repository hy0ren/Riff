import type { Blueprint } from '@/domain/blueprint'
import type { ExportBundle } from '@/domain/exports'
import type { PracticeSession } from '@/domain/practice-session'
import type { PersistedProject, Project, ProjectBlueprint, ProjectLibraryState, SourceType } from '@/domain/project'
import type { SourceInput } from '@/domain/source-input'
import type { TrackVersion } from '@/domain/track-version'

function createIsoTimestamp(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString()
}

function createSourceInputs(project: Project): SourceInput[] {
  if (project.sourceInputs?.length) {
    return project.sourceInputs
  }

  const createdAt = project.createdAt ?? createIsoTimestamp()
  const description = project.description ?? `${project.title} source material`

  switch (project.sourceType) {
    case 'hum':
      return [
        {
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
        },
      ]
    case 'riff':
      return [
        {
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
        },
      ]
    case 'chords':
      return [
        {
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
        },
      ]
    case 'sheet_music':
      return [
        {
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
        },
      ]
    case 'lyrics':
      return [
        {
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
        },
      ]
    case 'spotify_track':
      return [
        {
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
        },
      ]
    case 'spotify_playlist':
      return [
        {
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
        },
      ]
    case 'remix':
      return [
        {
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
        },
      ]
    case 'mixed':
      return [
        {
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
        },
        {
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
        },
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
      sourceInputIds: draftBlueprint.sourceInputIds ?? sourceInputs.map((sourceInput) => sourceInput.id),
    },
  ]
}

function createTrackVersions(project: Project, blueprints: Blueprint[]): TrackVersion[] {
  const versions = project.versions ?? []
  const fallbackBlueprintId = blueprints[0]?.id

  return versions.map((version) => ({
    ...version,
    projectId: project.id,
    kind: version.kind ?? 'base',
    sourceBlueprintId: version.sourceBlueprintId ?? fallbackBlueprintId,
  }))
}

function createPracticeSessions(project: Project, versions: TrackVersion[]): PracticeSession[] {
  if (project.practiceSessions?.length) {
    return project.practiceSessions
  }

  if (!project.lastPracticed || !versions.length) {
    return []
  }

  return [
    {
      id: `${project.id}-practice-1`,
      projectId: project.id,
      versionId: versions.find((version) => version.isActive)?.id ?? versions[versions.length - 1].id,
      mode: project.vocalsEnabled ? 'vocal' : 'guitar',
      focusArea: project.vocalsEnabled ? 'rhythm' : 'chords',
      selectedSection: 'Chorus',
      startedAt: project.lastPracticed,
      endedAt: project.lastPracticed,
      summary: project.practiceReady ? 'Recent practice session available.' : undefined,
    },
  ]
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
        format: asset.type === 'midi' ? 'MID' : asset.type === 'chord_sheet' ? 'TXT' : asset.type === 'lyrics' ? 'TXT' : 'WAV',
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

export function normalizeProject(project: Project): PersistedProject {
  const sourceInputs = createSourceInputs(project)
  const blueprints = createBlueprints(project, sourceInputs)
  const versions = createTrackVersions(project, blueprints)
  const practiceSessions = createPracticeSessions(project, versions)
  const exportBundles = createExportBundles(project, versions)

  const activeBlueprint = blueprints.find((blueprint) => blueprint.id === project.activeBlueprintId)
    ?? blueprints[blueprints.length - 1]
  const activeVersion = versions.find((version) => version.id === project.activeVersionId)
    ?? versions.find((version) => version.isActive)
    ?? versions[versions.length - 1]
  const lastPracticeSession = practiceSessions[practiceSessions.length - 1]

  const library: ProjectLibraryState = project.library ?? {
    sourceType: deriveSourceType(sourceInputs, project.sourceType),
    isFavorite: project.isFavorite ?? false,
    isExported: project.isExported ?? exportBundles.length > 0,
    collection: project.collection,
  }

  return {
    ...project,
    sourceInputs,
    blueprints,
    activeBlueprintId: project.activeBlueprintId ?? activeBlueprint?.id,
    versions,
    activeVersionId: project.activeVersionId ?? activeVersion?.id,
    practiceSessions,
    exportBundles,
    library,
    publication: project.publication ?? {
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
    mood: project.mood ?? activeBlueprint?.mood,
    vocalsEnabled: project.vocalsEnabled ?? activeBlueprint?.vocalsEnabled,
    lastPracticed: project.lastPracticed ?? lastPracticeSession?.endedAt ?? lastPracticeSession?.startedAt,
    practiceReady: project.practiceReady ?? versions.length > 0,
    bpm: project.bpm ?? activeBlueprint?.bpm,
    key: project.key ?? activeBlueprint?.key,
    genre: project.genre ?? activeBlueprint?.genre,
  }
}
