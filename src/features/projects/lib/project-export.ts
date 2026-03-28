import type { PersistedProject, ProjectVersion } from '@/domain/project'
import { exportAssetToDisk } from '@/lib/platform/fs-commands'
import { useSettingsStore } from '@/features/settings/store/use-settings-store'
import {
  buildChordSheetPlainText,
  buildLyricsPlainText,
  buildMelodyGuidePlainText,
  getVersionBlueprint,
  getVersionLyrics,
  getVersionSectionGuides,
  getVersionStructure,
} from './project-details'

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    return null
  }

  return {
    mimeType: match[1],
    base64Data: match[2],
  }
}

export async function exportLatestProjectVersion(
  project: PersistedProject,
  version: ProjectVersion,
): Promise<void> {
  const exportPrefs = useSettingsStore.getState().exports
  const safeBaseName = `${project.title}-${version.name}`.replace(/\s+/g, '-').toLowerCase()
  const versionsToExport = exportPrefs.includeAllVersions ? project.versions : [version]

  for (const candidateVersion of versionsToExport) {
    const candidateBaseName = `${project.title}-${candidateVersion.name}`.replace(/\s+/g, '-').toLowerCase()
    const parsedAudio = candidateVersion.audioUrl ? parseDataUrl(candidateVersion.audioUrl) : null
    const audioFormat =
      exportPrefs.audioFormat === 'mp3' && parsedAudio?.mimeType?.includes('mpeg')
        ? 'mp3'
        : 'wav'

    if (candidateVersion.audioUrl) {
      await exportAssetToDisk({
        projectId: project.id,
        assetId: `${candidateVersion.id}-audio`,
        filename: `${candidateBaseName}.${audioFormat}`,
        format: audioFormat,
        base64Data: parsedAudio?.base64Data,
        mimeType: parsedAudio?.mimeType,
      })
    }

    if (exportPrefs.includeLyrics) {
      const lyricText = buildLyricsPlainText(getVersionLyrics(project, candidateVersion))
      await exportAssetToDisk({
        projectId: project.id,
        assetId: `${candidateVersion.id}-lyrics`,
        filename: `${candidateBaseName}-lyrics.txt`,
        format: 'txt',
        contents: lyricText,
        mimeType: 'text/plain',
      })
    }

    if (exportPrefs.includeChordSheet) {
      await exportAssetToDisk({
        projectId: project.id,
        assetId: `${candidateVersion.id}-chords`,
        filename: `${candidateBaseName}-chords.txt`,
        format: 'txt',
        contents: buildChordSheetPlainText(getVersionStructure(project, candidateVersion)),
        mimeType: 'text/plain',
      })
    }

    if (exportPrefs.includeMelodyGuide) {
      await exportAssetToDisk({
        projectId: project.id,
        assetId: `${candidateVersion.id}-melody-guide`,
        filename: `${candidateBaseName}-melody-guide.txt`,
        format: 'txt',
        contents: buildMelodyGuidePlainText(
          getVersionBlueprint(project, candidateVersion),
          getVersionSectionGuides(project, candidateVersion),
        ),
        mimeType: 'text/plain',
      })
    }

    if (exportPrefs.includeMetadataJson) {
      await exportAssetToDisk({
        projectId: project.id,
        assetId: `${candidateVersion.id}-metadata`,
        filename: `${candidateBaseName}-metadata.json`,
        format: 'txt',
        contents: JSON.stringify(
          {
            projectId: project.id,
            projectTitle: project.title,
            versionId: candidateVersion.id,
            versionName: candidateVersion.name,
            bpm: getVersionBlueprint(project, candidateVersion)?.bpm ?? project.bpm,
            key: getVersionBlueprint(project, candidateVersion)?.key ?? project.key,
            genre: getVersionBlueprint(project, candidateVersion)?.genre ?? project.genre,
          },
          null,
          2,
        ),
        mimeType: 'application/json',
      })
    }
  }

  if (!exportPrefs.includeAllVersions && version.audioUrl && exportPrefs.audioFormat === 'mp3') {
    const parsedAudio = parseDataUrl(version.audioUrl)
    if (parsedAudio?.mimeType && !parsedAudio.mimeType.includes('mpeg')) {
      console.warn(
        '[Export] MP3 export preference requested, but current version is not MP3. Falling back to original asset format.',
      )
    }
  }
}
