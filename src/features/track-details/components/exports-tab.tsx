import type { LyricsSection, TrackStructureNode } from '@/domain/blueprint'
import type { PersistedProject, ProjectVersion } from '@/domain/project'
import { Download, FileAudio, FileText, CheckCircle2, Clock, Waves } from 'lucide-react'
import type { VersionExportAssetType, VersionExportStatus } from '@/domain/track-version'

interface ExportsTabProps {
  project: PersistedProject
  version: ProjectVersion
  lyrics?: LyricsSection[]
  structure?: TrackStructureNode[]
  onExportSong: () => void
  onExportLyrics: () => void
  onExportChords: () => void
  onExportMelodyGuide: () => void
}

interface ExportCard {
  id: string
  label: string
  type: VersionExportAssetType | 'melody_guide'
  size?: string
  status: 'ready' | 'generating' | 'unavailable'
  description: string
  onDownload?: () => void
}

function getIcon(type: ExportCard['type']) {
  switch (type) {
    case 'audio':
      return <FileAudio className="h-6 w-6 text-emerald-500" />
    case 'lyrics':
      return <FileText className="h-6 w-6 text-slate-200" />
    case 'chord_sheet':
      return <Waves className="h-6 w-6 text-blue-400" />
    case 'melody_guide':
      return <Waves className="h-6 w-6 text-purple-400" />
    default:
      return <FileAudio className="h-6 w-6 text-slate-400" />
  }
}

function getStatusForType(
  version: ProjectVersion,
  type: VersionExportAssetType,
): VersionExportStatus | undefined {
  return version.exports?.find((asset) => asset.type === type)
}

export function ExportsTab({
  project,
  version,
  lyrics,
  structure,
  onExportSong,
  onExportLyrics,
  onExportChords,
  onExportMelodyGuide,
}: ExportsTabProps) {
  const cards: ExportCard[] = [
    {
      id: `${version.id}-audio`,
      label: 'Song Mix',
      type: 'audio',
      size: getStatusForType(version, 'audio')?.size,
      status: version.audioUrl ? 'ready' : 'unavailable',
      description: 'Download the latest rendered song audio for this version.',
      onDownload: version.audioUrl ? onExportSong : undefined,
    },
    {
      id: `${version.id}-lyrics`,
      label: 'Lyric Sheet',
      type: 'lyrics',
      size: getStatusForType(version, 'lyrics')?.size,
      status: lyrics?.length ? 'ready' : 'unavailable',
      description: 'Export the current lyric sheet with section labels and cues.',
      onDownload: lyrics?.length ? onExportLyrics : undefined,
    },
    {
      id: `${version.id}-chords`,
      label: 'Chord Sheet',
      type: 'chord_sheet',
      size: getStatusForType(version, 'chord_sheet')?.size,
      status: structure?.length ? 'ready' : 'unavailable',
      description: 'Download the section-by-section chord map with timestamps.',
      onDownload: structure?.length ? onExportChords : undefined,
    },
    {
      id: `${version.id}-melody`,
      label: 'Melody Guide',
      type: 'melody_guide',
      status: version.insight?.sectionGuides?.length || version.insight?.summary || structure?.length ? 'ready' : 'unavailable',
      description: 'Export the learnable melody guide with section focus and cues.',
      onDownload:
        version.insight?.sectionGuides?.length || version.insight?.summary || structure?.length
          ? onExportMelodyGuide
          : undefined,
    },
  ]

  return (
    <div className="flex flex-col gap-10 max-w-5xl">
      <div className="mb-2">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-wide text-[var(--riff-text-primary)]">Project Exports</h2>
          <p className="text-sm text-[var(--riff-text-muted)] mt-1">
            Download usable assets from {project.title} and its active version.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="flex flex-col justify-between rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--riff-accent)] to-transparent opacity-70" />

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[var(--riff-surface-highest)] flex items-center justify-center">
                  {getIcon(card.type)}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--riff-text-primary)] tracking-wide">{card.label}</h3>
                  <p className="text-xs font-mono text-[var(--riff-text-secondary)] mt-0.5">
                    {card.size ?? (card.status === 'ready' ? 'Ready' : 'Unavailable')}
                  </p>
                </div>
              </div>
              {card.status === 'ready' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-80" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500 opacity-80" />
              )}
            </div>

            <p className="mb-5 text-sm leading-relaxed text-[var(--riff-text-secondary)]">
              {card.description}
            </p>

            <div className="flex items-center justify-between border-t border-[var(--riff-surface-highest)] pt-4 mt-auto">
              <span className="text-[10px] uppercase text-[var(--riff-text-muted)] tracking-widest font-semibold">
                {card.status}
              </span>
              <button
                className="flex items-center gap-2 text-[var(--riff-text-primary)] transition-colors hover:text-[var(--riff-accent-light)] disabled:cursor-not-allowed disabled:text-[var(--riff-text-muted)]"
                onClick={card.onDownload}
                disabled={!card.onDownload}
              >
                <Download className="h-5 w-5" />
                <span className="text-xs font-medium">Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
