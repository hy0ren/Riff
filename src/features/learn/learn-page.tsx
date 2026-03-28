import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  Music2,
  Play,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { PageFrame } from '@/components/layout/page-frame'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  getActiveBlueprint,
  getProjectVersion,
  useMatchedProject,
  useResolvedProject,
} from '@/features/projects/lib/project-selectors'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { useProjectRouteContext } from '@/features/projects/hooks/use-project-route-context'
import { usePlaybackStore } from '@/features/playback/store/use-playback-store'
import { toProjectVersionTrack } from '@/features/playback/lib/playable-track'
import { summarizeTrackVersion } from '@/lib/providers/gemini-gateway'
import { useProjectStore } from '@/features/projects/store/use-project-store'

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function LearnPage() {
  const navigate = useNavigate()
  const { projectId, versionId } = useParams()
  const matchedProject = useMatchedProject(projectId)
  const activeProject = useResolvedProject(projectId)
  const activeBlueprint = getActiveBlueprint(activeProject)
  const activeVersion = activeProject.versions
    ? getProjectVersion(activeProject, versionId)
    : undefined
  const setTrack = usePlaybackStore((state) => state.setTrack)
  const updateProject = useProjectStore((state) => state.updateProject)
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false)
  const [guideError, setGuideError] = useState<string | null>(null)
  const autoRequestedVersionId = useRef<string | null>(null)

  useProjectRouteContext({
    projectId: activeProject.id,
    projectName: activeProject.title,
    versionId: activeVersion?.id ?? null,
  })

  const buildLearnGuide = useCallback(async () => {
    if (!activeVersion || !activeBlueprint || isGeneratingGuide) {
      return
    }

    setIsGeneratingGuide(true)
    setGuideError(null)

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
        versions: project.versions.map((version) =>
          version.id === activeVersion.id
            ? {
                ...version,
                insight,
                structure: insight.chordSections ?? version.structure,
                lyrics: insight.lyricSections ?? version.lyrics,
              }
            : version,
        ),
      }))
    } catch (error) {
      setGuideError(
        error instanceof Error
          ? error.message
          : 'Learn guide generation failed. Try again in a moment.',
      )
    } finally {
      setIsGeneratingGuide(false)
    }
  }, [activeBlueprint, activeProject.id, activeProject.title, activeVersion, isGeneratingGuide, updateProject])

  useEffect(() => {
    if (!activeVersion || !activeBlueprint || !activeVersion.audioUrl) {
      return
    }

    const hasLearnPack = Boolean(
      activeVersion.insight?.sectionGuides?.length ||
        activeVersion.insight?.lyricSections?.length ||
        activeVersion.insight?.chordSections?.length,
    )

    if (hasLearnPack || autoRequestedVersionId.current === activeVersion.id) {
      return
    }

    autoRequestedVersionId.current = activeVersion.id
    void buildLearnGuide()
  }, [
    activeBlueprint,
    activeVersion,
    buildLearnGuide,
  ])

  if (!activeProject || !activeProject.versions) {
    return <Navigate to="/" replace />
  }

  if (!matchedProject && projectId) {
    return <Navigate to={projectRoutes.learn(activeProject.id)} replace />
  }

  if (!activeVersion) {
    return <Navigate to={projectRoutes.learn(activeProject.id)} replace />
  }

  const insight = activeVersion.insight
  const learningNotes = insight?.learningNotes ?? insight?.practiceNotes ?? []
  const chordSections = insight?.chordSections ?? activeVersion.structure ?? []
  const lyricSections = insight?.lyricSections ?? activeVersion.lyrics ?? []
  const rawSectionGuides =
    insight?.sectionGuides ??
    chordSections.map((section, index) => {
      const matchingLyrics = lyricSections.find(
        (candidate) => candidate.label.toLowerCase() === section.label.toLowerCase(),
      )
      const chordDesc =
        section.chords.length > 1
          ? `${section.chords[0]} → ${section.chords[section.chords.length - 1]} progression`
          : `${section.chords[0] ?? 'root chord'} foundation`
      const focusOptions = [
        `Lock in the ${section.label.toLowerCase()} rhythm and ${chordDesc}.`,
        `Focus on the ${section.label.toLowerCase()} groove — feel the ${chordDesc}.`,
        `Nail the ${section.label.toLowerCase()} timing, especially the ${chordDesc}.`,
        `Internalize the ${section.label.toLowerCase()} energy and ${chordDesc}.`,
      ]
      return {
        id: `fallback-${section.id}`,
        label: section.label,
        startTime: section.startTime,
        duration: section.duration,
        chords: section.chords,
        lyricCue: matchingLyrics?.lines.slice(0, 2),
        focus: focusOptions[index % focusOptions.length],
        memoryCue: matchingLyrics?.lines[0],
      }
    })

  const sectionGuides = rawSectionGuides.map((section, index) => {
    if (index === 0) return section
    const prev = rawSectionGuides[index - 1]
    const expectedStart = prev.startTime + prev.duration
    if (section.startTime > expectedStart) {
      return { ...section, startTime: expectedStart }
    }
    return section
  })
  const practiceChecklist = insight?.practiceChecklist ?? [
    'Listen through once from start to finish.',
    'Loop the chorus until the transition feels automatic.',
    'Run the full song with the chord map visible, then once from memory.',
  ]
  const keyMode = activeProject.blueprint
    ? `${activeProject.blueprint.key} ${activeProject.blueprint.mode}`
    : activeProject.key ?? 'Unknown'
  const bpm = activeProject.blueprint?.bpm ?? activeProject.bpm ?? '—'
  const hasLearnPack = Boolean(
    sectionGuides.length || lyricSections.length || chordSections.length,
  )

  const computedDuration = sectionGuides.reduce(
    (max, section) => Math.max(max, section.startTime + section.duration),
    0,
  )
  const totalDuration = Math.max(activeVersion.duration, computedDuration)

  return (
    <PageFrame
      title="Learn"
      subtitle="Turn a generated song into a study guide with chords, lyrics, and section-by-section memory cues."
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-lg"
            onClick={() => setTrack(toProjectVersionTrack(activeProject, activeVersion))}
          >
            <Play className="h-4 w-4" /> Play Version
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-lg"
            disabled={isGeneratingGuide || !activeProject.blueprint}
            onClick={() => void buildLearnGuide()}
          >
            {isGeneratingGuide ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Building Guide
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Refresh Learn Pack
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg"
            onClick={() => navigate(projectRoutes.details(activeProject.id))}
          >
            Track Details
          </Button>
          <Button
            size="sm"
            className="h-9 rounded-lg"
            onClick={() => navigate(projectRoutes.studio(activeProject.id))}
          >
            Open Studio
          </Button>
        </>
      }
      inspectorSlot={
        <div className="flex h-full flex-col gap-6 p-5">
          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-mid)] p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--riff-accent-light)]">
              <BookOpen className="h-4 w-4" />
              <span>Learn Pack</span>
            </div>
            <h2 className="font-display text-lg font-bold text-[var(--riff-text-primary)]">
              {activeProject.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--riff-text-muted)]">
              {insight?.summary ??
                'Gemini will turn the generated song into a section-by-section practice guide with chord and lyric cues.'}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--riff-text-secondary)]">
              Quick Facts
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between text-[var(--riff-text-primary)]">
                <span className="text-[var(--riff-text-muted)]">Version</span>
                <Badge variant="outline">{activeVersion.name}</Badge>
              </div>
              <div className="flex items-center justify-between text-[var(--riff-text-primary)]">
                <span className="text-[var(--riff-text-muted)]">Tempo</span>
                <span>{bpm} BPM</span>
              </div>
              <div className="flex items-center justify-between text-[var(--riff-text-primary)]">
                <span className="text-[var(--riff-text-muted)]">Key</span>
                <span>{keyMode}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--riff-text-primary)]">
                <span className="text-[var(--riff-text-muted)]">Duration</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--riff-text-primary)]">
                <span className="text-[var(--riff-text-muted)]">Sections</span>
                <span>{chordSections.length || '—'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--riff-text-secondary)]">
              Practice Checklist
            </h3>
            <div className="mt-4 space-y-3">
              {practiceChecklist.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <p className="text-sm leading-relaxed text-[var(--riff-text-secondary)]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--riff-text-secondary)]">
              Learning Notes
            </h3>
            <div className="mt-4 space-y-2">
              {learningNotes.length ? (
                learningNotes.map((note) => (
                  <p key={note} className="text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                    • {note}
                  </p>
                ))
              ) : (
                <p className="text-sm text-[var(--riff-text-muted)]">
                  Build the learn pack to unlock section-specific practice notes.
                </p>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          {guideError ? (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" />
                <div>
                  <p className="text-sm font-semibold text-red-100">Learn pack generation failed</p>
                  <p className="mt-1 text-sm text-red-100/80">{guideError}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] p-6">
            <div className="mb-5 flex items-center gap-2 text-[var(--riff-text-primary)]">
              <Music2 className="h-5 w-5 opacity-70" />
              <h2 className="font-display text-lg font-semibold">Section Practice Roadmap</h2>
            </div>

            {isGeneratingGuide && !hasLearnPack ? (
              <div className="flex items-center gap-3 rounded-xl bg-[var(--riff-surface-mid)] p-4 text-sm text-[var(--riff-text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gemini is analyzing the generated song and building your learn guide.
              </div>
            ) : sectionGuides.length ? (
              <div className="space-y-4">
                {sectionGuides.map((section, index) => (
                  <div
                    key={section.id}
                    className="rounded-xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-mid)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                          Section {index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-[var(--riff-text-primary)]">
                          {section.label}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--riff-text-muted)]">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>
                          {formatDuration(section.startTime)} – {formatDuration(section.startTime + section.duration)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {section.chords.map((chord) => (
                        <span
                          key={`${section.id}-${chord}`}
                          className="rounded-lg bg-[var(--riff-surface-high)] px-2.5 py-1 text-xs font-semibold text-[var(--riff-text-primary)]"
                        >
                          {chord}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-[var(--riff-surface)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                          Focus
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                          {section.focus}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[var(--riff-surface)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                          Memory Cue
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                          {section.memoryCue ?? `Anchor the ${section.label.toLowerCase()} by feeling the ${section.chords.length > 1 ? `${section.chords[0]} → ${section.chords[section.chords.length - 1]} movement` : `${section.chords[0] ?? 'root'} groove`} at ${formatDuration(section.startTime)}.`}
                        </p>
                      </div>
                    </div>

                    {section.lyricCue?.length ? (
                      <div className="mt-4 rounded-lg bg-[var(--riff-surface)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                          Lyric Cue
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                          {section.lyricCue.join(' ')}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--riff-text-muted)]">
                Generate a learn pack to unlock section-by-section practice guidance.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] p-6">
            <div className="mb-5 flex items-center gap-2 text-[var(--riff-text-primary)]">
              <Sparkles className="h-5 w-5 opacity-70" />
              <h2 className="font-display text-lg font-semibold">Lyrics and Chord Sheet</h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl bg-[var(--riff-surface-mid)] p-4">
                <h3 className="text-sm font-semibold text-[var(--riff-text-primary)]">Chord Map</h3>
                <div className="mt-4 space-y-3">
                  {chordSections.length ? (
                    chordSections.map((section) => (
                      <div key={section.id} className="rounded-lg bg-[var(--riff-surface)] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-secondary)]">
                            {section.label}
                          </p>
                          <span className="text-[10px] text-[var(--riff-text-muted)]">
                            {formatDuration(section.startTime)} – {formatDuration(section.startTime + section.duration)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {section.chords.map((chord) => (
                            <span
                              key={`${section.id}-sheet-${chord}`}
                              className="rounded-md border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] px-2 py-1 text-xs font-semibold text-[var(--riff-text-primary)]"
                            >
                              {chord}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--riff-text-muted)]">
                      No chord sections yet. Generate the learn pack or regenerate the song summary.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-[var(--riff-surface-mid)] p-4">
                <h3 className="text-sm font-semibold text-[var(--riff-text-primary)]">Lyric Sheet</h3>
                <div className="mt-4 space-y-4">
                  {lyricSections.length ? (
                    lyricSections.map((section) => (
                      <div key={section.id} className="rounded-lg bg-[var(--riff-surface)] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-secondary)]">
                            {section.label}
                          </p>
                          {section.deliveryNotes ? (
                            <Badge variant="outline" className="text-[10px]">
                              {section.deliveryNotes}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {section.lines.map((line) => (
                            <p
                              key={`${section.id}-${line}`}
                              className="text-sm leading-relaxed text-[var(--riff-text-secondary)]"
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--riff-text-muted)]">
                      No lyric sheet is available for this version yet. Instrumental versions will
                      intentionally stay lyric-free.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {insight?.arrangementSummary ? (
              <>
                <Separator className="my-5 bg-[var(--riff-surface-highest)]" />
                <div className="rounded-xl bg-[var(--riff-surface-mid)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                    Arrangement Summary
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                    {insight.arrangementSummary}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </PageFrame>
  )
}
