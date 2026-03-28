import type { LyricsSection, TrackStructureNode } from '@/domain/blueprint'
import { Download, Mic2 } from 'lucide-react'

interface LyricsTabProps {
  lyrics?: LyricsSection[]
  structure?: TrackStructureNode[]
  onExport?: () => void
}

function findSectionTiming(
  label: string,
  structure: TrackStructureNode[] | undefined,
): TrackStructureNode | undefined {
  return structure?.find(
    (section) => section.label.toLowerCase() === label.toLowerCase(),
  )
}

function formatTimestamp(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function LyricsTab({ lyrics, structure, onExport }: LyricsTabProps) {
  if (!lyrics?.length) {
    return <div className="p-8 text-center text-[var(--riff-text-muted)]">No vocal or lyric data for this version.</div>
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h2 className="font-display text-xl font-semibold tracking-wide text-[var(--riff-text-primary)]">Lyric Sheet</h2>
           <p className="text-sm text-[var(--riff-text-muted)] mt-1">Written structure and performance cues</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-[var(--riff-surface-high)] hover:bg-[var(--riff-surface-highest)] rounded border border-[var(--riff-surface-highest)] transition-colors text-sm font-medium text-[var(--riff-text-primary)]"
          onClick={onExport}
        >
          <Download className="h-4 w-4" /> Export Lyrics
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {lyrics.map((lyric, idx) => {
          const timing = findSectionTiming(lyric.label, structure)
          return (
          <div key={idx} className="flex gap-12 group">
             {/* Metadata Side */}
             <div className="w-48 shrink-0 flex flex-col items-end text-right border-r-2 border-[var(--riff-surface-highest)] pr-8 pt-1 group-hover:border-[var(--riff-accent)]/80 transition-colors">
               <h3 className="font-bold uppercase tracking-widest text-[var(--riff-text-primary)] text-sm">{lyric.label}</h3>
               {timing ? (
                 <p className="mt-2 text-xs font-mono text-[var(--riff-text-secondary)]">
                   {formatTimestamp(timing.startTime)} · {timing.duration}s
                 </p>
               ) : null}
               {lyric.deliveryNotes && (
                 <p className="text-xs text-[var(--riff-text-muted)] italic mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Mic2 className="h-3 w-3" />
                   {lyric.deliveryNotes}
                 </p>
               )}
             </div>

             {/* Lyrics Content */}
             <div className="flex-1 pb-4">
                {lyric.lines.map((line, lIdx) => (
                  <p key={lIdx} className="font-display text-lg text-[var(--riff-text-primary)] leading-loose tracking-wide hover:text-white transition-colors cursor-text">
                    {line}
                  </p>
                ))}
             </div>
          </div>
        )})}
      </div>
    </div>
  )
}
