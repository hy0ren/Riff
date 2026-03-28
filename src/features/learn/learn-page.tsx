import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, Clock3, Music2, Play, Sparkles } from 'lucide-react'
import { PageFrame } from '@/components/layout/page-frame'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getProjectVersion, useMatchedProject, useResolvedProject } from '@/features/projects/lib/project-selectors'
import { projectRoutes } from '@/features/projects/lib/project-routes'
import { useProjectRouteContext } from '@/features/projects/hooks/use-project-route-context'
import { usePlaybackStore } from '@/features/playback/store/use-playback-store'
import { toProjectVersionTrack } from '@/features/playback/lib/playable-track'

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
  const activeVersion = activeProject.versions
    ? getProjectVersion(activeProject, versionId)
    : undefined
  const setTrack = usePlaybackStore((state) => state.setTrack)

  useProjectRouteContext({
    projectId: activeProject.id,
    projectName: activeProject.title,
    versionId: activeVersion?.id ?? null,
  })

  if (!activeProject || !activeProject.versions) {
    return <Navigate to="/" replace />
  }

  if (!matchedProject && projectId) {
    return <Navigate to={projectRoutes.learn(activeProject.id)} replace />
  }

  if (!activeVersion) {
    return <Navigate to={projectRoutes.learn(activeProject.id)} replace />
  }

  const learningNotes = activeVersion.insight?.learningNotes ?? activeVersion.insight?.practiceNotes ?? []
  const sections = activeVersion.structure ?? []
  const lyricSections = activeVersion.lyrics ?? []
  const keyMode = activeProject.blueprint ? `${activeProject.blueprint.key} ${activeProject.blueprint.mode}` : activeProject.key ?? 'Unknown'
  const bpm = activeProject.blueprint?.bpm ?? activeProject.bpm ?? '—'

  return (
    <PageFrame
      title="Learn"
      subtitle="Use the finished arrangement, lyrics, and chord map to learn your generated song."
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
              <span>Learning Focus</span>
            </div>
            <h2 className="font-display text-lg font-bold text-[var(--riff-text-primary)]">{activeProject.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--riff-text-muted)]">
              {activeVersion.insight?.summary ?? 'Use this page to follow the song section-by-section and lock in the arrangement.'}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--riff-text-secondary)]">Quick Facts</h3>
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
                <span>{formatDuration(activeVersion.duration)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--riff-text-secondary)]">Learning Notes</h3>
            <div className="mt-4 space-y-2">
              {learningNotes.length ? (
                learningNotes.map((note) => (
                  <p key={note} className="text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                    • {note}
                  </p>
                ))
              ) : (
                <p className="text-sm text-[var(--riff-text-muted)]">
                  Listen through the current version twice, then learn the chorus and verse entrances first.
                </p>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] p-6">
            <div className="mb-5 flex items-center gap-2 text-[var(--riff-text-primary)]">
              <Music2 className="h-5 w-5 opacity-70" />
              <h2 className="font-display text-lg font-semibold">Song Roadmap</h2>
            </div>
            <div className="space-y-3">
              {sections.length ? (
                sections.map((section, index) => {
                  const matchingLyrics = lyricSections.find(
                    (candidate) => candidate.label.toLowerCase() === section.label.toLowerCase(),
                  )

                  return (
                    <div
                      key={section.id}
                      className="rounded-xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-mid)] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                            Section {index + 1}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-[var(--riff-text-primary)]">{section.label}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--riff-text-muted)]">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>{formatDuration(section.startTime)} · {section.duration}s</span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(section.chords ?? []).map((chord) => (
                          <span
                            key={`${section.id}-${chord}`}
                            className="rounded-lg bg-[var(--riff-surface-high)] px-2.5 py-1 text-xs font-semibold text-[var(--riff-text-primary)]"
                          >
                            {chord}
                          </span>
                        ))}
                      </div>
                      {matchingLyrics?.lines?.length ? (
                        <div className="mt-4 rounded-lg bg-[var(--riff-surface)] p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                            Lyric Cue
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                            {matchingLyrics.lines.slice(0, 2).join(' ')}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-[var(--riff-text-muted)]">
                  Generate or summarize a version in Studio to unlock section-by-section learning guidance here.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] p-6">
            <div className="mb-5 flex items-center gap-2 text-[var(--riff-text-primary)]">
              <Sparkles className="h-5 w-5 opacity-70" />
              <h2 className="font-display text-lg font-semibold">Lyrics and Memory Cues</h2>
            </div>
            <div className="space-y-4">
              {lyricSections.length ? (
                lyricSections.map((section) => (
                  <div key={section.id} className="rounded-xl bg-[var(--riff-surface-mid)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[var(--riff-text-primary)]">{section.label}</h3>
                      {section.deliveryNotes ? (
                        <Badge variant="outline" className="text-[10px]">
                          {section.deliveryNotes}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {section.lines.map((line) => (
                        <p key={`${section.id}-${line}`} className="text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--riff-text-muted)]">
                  This version does not have lyric sections yet. Add lyrics in Studio to build a richer Learn view.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </PageFrame>
  )
}
