import type { PersistedProject, ProjectVersion } from '@/domain/project'
import { exportAssetToDisk } from '@/lib/platform/fs-commands'
import { buildLyricsPlainText, getVersionLyrics } from './project-details'

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
  const safeBaseName = `${project.title}-${version.name}`.replace(/\s+/g, '-').toLowerCase()

  if (version.audioUrl) {
    const parsedAudio = parseDataUrl(version.audioUrl)
    await exportAssetToDisk({
      projectId: project.id,
      assetId: `${version.id}-audio`,
      filename: `${safeBaseName}.wav`,
      format: 'wav',
      base64Data: parsedAudio?.base64Data,
      mimeType: parsedAudio?.mimeType,
    })
  }

  const lyricText = buildLyricsPlainText(getVersionLyrics(project, version))
  await exportAssetToDisk({
    projectId: project.id,
    assetId: `${version.id}-lyrics`,
    filename: `${safeBaseName}-lyrics.txt`,
    format: 'txt',
    contents: lyricText,
    mimeType: 'text/plain',
  })
}
