import type { Blueprint, LyricsSection, TrackStructureNode } from '@/domain/blueprint'
import type { LearnSectionGuide } from '@/domain/providers'
import type { ProjectVersion } from '@/domain/project'
import { Download, Activity, Music4 } from 'lucide-react'

interface MelodyTabProps {
  version: ProjectVersion
  blueprint?: Blueprint
  structure?: TrackStructureNode[]
  lyrics?: LyricsSection[]
  sectionGuides?: LearnSectionGuide[]
  onExport?: () => void
}

function formatTimestamp(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function inferRange(blueprint: Blueprint | undefined): string {
  if (!blueprint?.vocalsEnabled) {
    return blueprint?.instruments.guitar || blueprint?.instruments.synths ? 'E3 - E5' : 'C3 - C5'
  }

  if (blueprint.energy === 'Extreme') return 'A3 - C6'
  if (blueprint.energy === 'High') return 'G3 - A5'
  if (blueprint.energy === 'Low') return 'C4 - E5'
  return 'D4 - G5'
}

function inferDensity(blueprint: Blueprint | undefined): string {
  if (!blueprint) return 'Medium'
  if (blueprint.bpm >= 150) return 'High'
  if (blueprint.bpm <= 85) return 'Low'
  return blueprint.energy === 'High' || blueprint.energy === 'Extreme' ? 'Medium / High' : 'Medium'
}

function inferMotifCount(sectionGuides: LearnSectionGuide[] | undefined): number {
  if (!sectionGuides?.length) {
    return 1
  }

  const repeatedLabels = new Set(
    sectionGuides
      .map((section) => section.label.toLowerCase())
      .filter((label, index, array) => array.indexOf(label) !== index),
  )

  return Math.max(1, repeatedLabels.size || Math.min(3, sectionGuides.length))
}

export function MelodyTab({
  version,
  blueprint,
  structure,
  lyrics,
  sectionGuides,
  onExport,
}: MelodyTabProps) {
  const guides =
    sectionGuides ??
    structure?.map((section) => ({
      id: `${version.id}-${section.id}`,
      label: section.label,
      startTime: section.startTime,
      duration: section.duration,
      chords: section.chords,
      lyricCue: lyrics?.find((candidate) => candidate.label.toLowerCase() === section.label.toLowerCase())?.lines.slice(0, 2),
      focus: `Keep the ${section.label.toLowerCase()} melodic shape steady over the ${section.chords[0] ?? 'main'} harmony.`,
      memoryCue: lyrics?.find((candidate) => candidate.label.toLowerCase() === section.label.toLowerCase())?.lines[0],
    }))

  if (!guides?.length && !blueprint?.melodyDirection) {
    return <div className="p-8 text-center text-[var(--riff-text-muted)]">No melody guide available for this version yet.</div>
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-wide text-[var(--riff-text-primary)]">Melody Guide</h2>
          <p className="text-sm text-[var(--riff-text-muted)] mt-1">Phrase shape, memory cues, and section focus</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-[var(--riff-surface-high)] hover:bg-[var(--riff-surface-highest)] rounded border border-[var(--riff-surface-highest)] transition-colors text-sm font-medium text-[var(--riff-text-primary)]"
          onClick={onExport}
        >
          <Download className="h-4 w-4" /> Export Melody Guide
        </button>
      </div>

      <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[var(--riff-accent-light)]" />
          <h3 className="font-semibold tracking-wide text-[var(--riff-text-primary)]">Lead Direction</h3>
        </div>
        <p className="text-sm leading-relaxed text-[var(--riff-text-secondary)]">
          {blueprint?.melodyDirection ??
            version.insight?.summary ??
            'Use the section guide below to lock in phrase shape and repetition points.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--riff-text-secondary)]">Primary Range</span>
          <p className="font-mono text-2xl font-bold mt-2 text-[var(--riff-text-primary)]">{inferRange(blueprint)}</p>
        </div>
        <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--riff-text-secondary)]">Note Density</span>
          <p className="font-mono text-2xl font-bold mt-2 text-[var(--riff-text-primary)]">{inferDensity(blueprint)}</p>
        </div>
        <div className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--riff-text-secondary)]">Motifs</span>
          <p className="font-mono text-2xl font-bold mt-2 text-[var(--riff-text-primary)]">{inferMotifCount(guides)} detected</p>
        </div>
      </div>

      {guides?.length ? (
        <div className="flex flex-col gap-4">
          {guides.map((guide) => (
            <div key={guide.id} className="rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Music4 className="h-4 w-4 text-[var(--riff-accent-light)]" />
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--riff-text-primary)]">
                      {guide.label}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-[var(--riff-text-secondary)]">{guide.focus}</p>
                </div>
                <div className="text-right text-xs font-mono text-[var(--riff-text-muted)]">
                  <p>{formatTimestamp(guide.startTime)}</p>
                  <p>{guide.duration}s</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-[var(--riff-surface)] border border-[var(--riff-surface-highest)] p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--riff-text-muted)]">Chord Bed</p>
                  <p className="mt-2 text-sm text-[var(--riff-text-primary)]">
                    {guide.chords.length ? guide.chords.join('  ') : 'No chord bed captured for this section.'}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--riff-surface)] border border-[var(--riff-surface-highest)] p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--riff-text-muted)]">Lyric Cue</p>
                  <div className="mt-2 space-y-1">
                    {guide.lyricCue?.length ? (
                      guide.lyricCue.map((line) => (
                        <p key={line} className="text-sm text-[var(--riff-text-primary)]">
                          {line}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--riff-text-muted)]">Instrumental or no lyric cue available.</p>
                    )}
                  </div>
                </div>
              </div>

              {guide.memoryCue ? (
                <p className="mt-4 text-sm italic text-[var(--riff-accent-light)]">Memory cue: {guide.memoryCue}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
