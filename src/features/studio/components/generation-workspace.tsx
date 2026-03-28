import {
  FileAudio,
  GitMerge,
  History,
  Play,
  SkipBack,
  SkipForward,
  Wand2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { GenerationRun } from '@/domain/generation-run'
import type { ProjectVersion } from '@/domain/project'
import type { TrackVersionKind } from '@/domain/track-version'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface GenerationWorkspaceProps {
  versions: ProjectVersion[]
  generationRuns: GenerationRun[]
  activeVersionId?: string
  activeGenerationRunId?: string | null
  quickRefinementText: string
  onQuickRefinementChange: (value: string) => void
  onGenerate: (kind?: TrackVersionKind) => void
  onLoadVersion: (versionId: string) => void
}

const VARIANT_ACTIONS: { label: string; kind: TrackVersionKind }[] = [
  { label: 'Refinement', kind: 'refinement' },
  { label: 'Instrumental', kind: 'instrumental' },
  { label: 'Acoustic', kind: 'acoustic' },
  { label: 'Remix', kind: 'remix' },
]

export function GenerationWorkspace({
  versions,
  generationRuns,
  activeVersionId,
  activeGenerationRunId,
  quickRefinementText,
  onQuickRefinementChange,
  onGenerate,
  onLoadVersion,
}: GenerationWorkspaceProps) {
  const activeRun =
    generationRuns.find((generationRun) => generationRun.id === activeGenerationRunId) ??
    [...generationRuns].sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )[0]

  return (
    <div className="relative flex flex-1 flex-col gap-6 overflow-hidden rounded-2xl bg-[var(--riff-surface-low)] p-6 shadow-xl">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--riff-accent)] opacity-[0.03] blur-[100px]" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--riff-text-primary)]">
            Generation Stage
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-medium text-[var(--riff-text-muted)]">
              Mock Lyria pipeline · {activeRun?.status ?? 'idle'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[var(--riff-surface)] p-1">
          <button className="rounded-lg bg-[var(--riff-surface-high)] px-4 py-2 text-sm font-semibold text-[var(--riff-text-primary)] shadow-sm">
            Current Mix
          </button>
          <button className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--riff-text-muted)]">
            Stems
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative h-48 w-full overflow-hidden rounded-xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-lowest)] p-4">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--riff-accent)]/10 to-transparent" />
          <div className="flex h-full w-full items-end gap-[2px] opacity-80">
            {Array.from({ length: 80 }).map((_, index) => {
              const height = Math.max(10, Math.sin(index * 0.2) * 40 + (index % 7) * 7 + 32)
              const isPlayed = index < 30
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-t-sm transition-all duration-300 ${
                    isPlayed
                      ? 'bg-[var(--riff-accent)] shadow-[0_0_8px_var(--riff-accent)]'
                      : 'bg-[var(--riff-surface-highest)]'
                  }`}
                  style={{ height: `${height}%` }}
                />
              )
            })}
          </div>
          <div className="absolute bottom-0 left-[37.5%] top-0 z-10 flex w-px flex-col justify-start bg-white shadow-[0_0_12px_rgba(255,255,255,1)]">
            <div className="h-3 w-3 -translate-x-[5px] rounded-sm bg-white drop-shadow-md" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="w-28 text-sm font-mono text-[var(--riff-text-muted)]">
            {versions.find((version) => version.id === activeVersionId)?.duration
              ? `0:00 / ${Math.floor((versions.find((version) => version.id === activeVersionId)?.duration ?? 0) / 60)}:${String((versions.find((version) => version.id === activeVersionId)?.duration ?? 0) % 60).padStart(2, '0')}`
              : '0:00 / --:--'}
          </div>
          <div className="flex items-center gap-6">
            <button className="text-[var(--riff-text-secondary)] transition-colors hover:text-white">
              <SkipBack className="h-5 w-5 fill-current" />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--riff-accent)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
              <Play className="ml-1 h-5 w-5 fill-current" />
            </button>
            <button className="text-[var(--riff-text-secondary)] transition-colors hover:text-white">
              <SkipForward className="h-5 w-5 fill-current" />
            </button>
          </div>
          <div className="flex w-24 justify-end gap-3">
            <button className="text-[var(--riff-text-secondary)] transition-colors hover:text-[var(--riff-accent-light)]" title="Loop region">
              <History className="h-4 w-4" />
            </button>
            <button className="text-[var(--riff-text-secondary)] transition-colors hover:text-[var(--riff-accent-light)]" title="Export track">
              <FileAudio className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="copilot" className="mt-4 flex min-h-0 flex-1 flex-col">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-[var(--riff-surface)] p-1">
          <TabsTrigger value="copilot" className="rounded-lg font-medium data-[state=active]:bg-[var(--riff-surface-high)]">
            Generation
          </TabsTrigger>
          <TabsTrigger value="versions" className="rounded-lg font-medium data-[state=active]:bg-[var(--riff-surface-high)]">
            Versions ({versions.length})
          </TabsTrigger>
          <TabsTrigger value="runs" className="rounded-lg font-medium data-[state=active]:bg-[var(--riff-surface-high)]">
            Runs ({generationRuns.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 flex-1 overflow-y-auto pb-4 pr-2">
          <TabsContent value="copilot" className="h-full focus-visible:outline-none">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-[var(--riff-text-primary)]">
                  Refinement Assistant
                </h3>
                <p className="text-xs text-[var(--riff-text-muted)]">
                  This text is captured into the next generation run snapshot for reproducibility.
                </p>
              </div>

              <div className="space-y-3">
                <Textarea
                  value={quickRefinementText}
                  onChange={(event) => onQuickRefinementChange(event.target.value)}
                  className="min-h-24 bg-[var(--riff-surface-lowest)] border-[var(--riff-surface-highest)]"
                  placeholder="Make the chorus hit harder, strip the hats in the verse, and keep the hook closer to the hum."
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => onGenerate('base')}>
                    <Wand2 className="h-4 w-4" />
                    New Base Run
                  </Button>
                  {VARIANT_ACTIONS.map((action) => (
                    <Button
                      key={action.kind}
                      variant="outline"
                      onClick={() => onGenerate(action.kind)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {activeRun ? (
                <div className="rounded-xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--riff-text-primary)]">
                        Latest Run
                      </p>
                      <p className="text-xs text-[var(--riff-text-muted)]">
                        Blueprint rev {activeRun.blueprintRevision} · Source set snapshot
                      </p>
                    </div>
                    <Badge className="bg-[var(--riff-accent)]/15 text-[var(--riff-accent-light)]">
                      {activeRun.status}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-[var(--riff-text-secondary)]">
                    {activeRun.generationContextSnapshot.interpretationSummary}
                  </p>
                </div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="versions" className="h-full focus-visible:outline-none">
            <div className="flex flex-col gap-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
                    version.id === activeVersionId
                      ? 'border-[var(--riff-accent)] bg-[var(--riff-surface-highest)] shadow-[0_0_15px_rgba(18,117,226,0.15)]'
                      : 'border-transparent bg-[var(--riff-surface)] hover:border-[var(--riff-surface-highest)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--riff-surface-lowest)]">
                        <span className="font-mono text-xs text-[var(--riff-text-secondary)]">
                          v{index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--riff-text-primary)]">
                            {version.name}
                          </p>
                          {version.id === activeVersionId ? (
                            <Badge className="bg-[var(--riff-accent)]/20 text-[var(--riff-accent-light)]">
                              Active
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-[var(--riff-text-muted)]">
                          {formatDistanceToNow(new Date(version.timestamp), { addSuffix: true })} ·{' '}
                          {Math.floor(version.duration / 60)}:
                          {String(version.duration % 60).padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                    {version.id === activeVersionId ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--riff-accent)]/10 text-[var(--riff-accent)]">
                        <GitMerge className="h-4 w-4" />
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => onLoadVersion(version.id)}>
                        Load
                      </Button>
                    )}
                  </div>
                  <div className="ml-11 flex flex-wrap gap-1.5">
                    {version.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] px-2 py-0.5 text-[10px] text-[var(--riff-text-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="runs" className="h-full focus-visible:outline-none">
            <div className="flex flex-col gap-3">
              {[...generationRuns]
                .sort(
                  (left, right) =>
                    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
                )
                .map((generationRun) => (
                  <div
                    key={generationRun.id}
                    className="rounded-xl border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--riff-text-primary)]">
                          {generationRun.kind} run
                        </p>
                        <p className="text-xs text-[var(--riff-text-muted)]">
                          {formatDistanceToNow(new Date(generationRun.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge className="bg-[var(--riff-accent)]/15 text-[var(--riff-accent-light)]">
                        {generationRun.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--riff-text-secondary)]">
                      {generationRun.generationContextSnapshot.interpretationSummary}
                    </p>
                  </div>
                ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
