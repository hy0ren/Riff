import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { openExportFolder } from '@/lib/platform/fs-commands'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import { useIntegrationStore } from '@/features/integrations/store/use-integration-store'
import { useSettingsStore } from '../store/use-settings-store'

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string
  description?: string
  control: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
      style={{
        background: 'var(--riff-surface-low)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--riff-text-primary)]">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0 shrink-0">{control}</div>
    </div>
  )
}

export function StorageSection() {
  const projects = useProjectStore((state) => state.projects)
  const integrationState = useIntegrationStore((state) => state.spotify)
  const clearSpotifyCache = useIntegrationStore((state) => state.clearSpotifyCache)
  const appearance = useSettingsStore((state) => state.appearance)
  const playback = useSettingsStore((state) => state.playback)
  const creation = useSettingsStore((state) => state.creation)
  const exports = useSettingsStore((state) => state.exports)
  const advanced = useSettingsStore((state) => state.advanced)
  const [feedback, setFeedback] = useState<string | null>(null)

  const stats = useMemo(() => {
    const settingsSnapshot = {
      appearance,
      playback,
      creation,
      exports,
      advanced,
    }
    const projectBytes = JSON.stringify(projects).length
    const settingsBytes = JSON.stringify(settingsSnapshot).length
    const integrationBytes = JSON.stringify(integrationState).length
    const coverBytes = projects.reduce((sum, project) => sum + (project.coverUrl?.length ?? 0), 0)

    return {
      projectBytes,
      settingsBytes,
      integrationBytes,
      coverBytes,
      totalBytes: projectBytes + settingsBytes + integrationBytes,
    }
  }, [advanced, appearance, creation, exports, integrationState, playback, projects])

  const handleOpenExportFolder = async () => {
    try {
      await openExportFolder()
      setFeedback('Opened the export folder.')
    } catch {
      setFeedback('Could not open the export folder on this device.')
    }
  }

  const handleClearCache = () => {
    clearSpotifyCache()
    setFeedback('Cleared Spotify sync cache and stale connection state.')
  }

  return (
    <section id="storage" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">Storage</h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Real local data on this device: projects, preferences, and sync cache.
        </p>
      </div>

      <div className="space-y-3">
        <SettingRow
          label="Library storage"
          description="All songs and project metadata currently stored in the local library."
          control={
            <div className="text-right">
              <p className="text-sm text-[var(--riff-text-secondary)]">
                {projects.length} projects
              </p>
              <p className="text-xs text-[var(--riff-text-muted)]">{formatBytes(stats.projectBytes)}</p>
            </div>
          }
        />

        <SettingRow
          label="Preferences and sync state"
          description="Saved settings plus imported Spotify metadata cached for convenience."
          control={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant="secondary" className="font-normal text-[var(--riff-text-secondary)]">
                {formatBytes(stats.settingsBytes + stats.integrationBytes)}
              </Badge>
              <Button type="button" variant="outline" size="sm" onClick={handleClearCache}>
                Clear Cache
              </Button>
            </div>
          }
        />

        <SettingRow
          label="Cover art storage"
          description="Approximate local weight of generated cover art attached to your projects."
          control={
            <Badge variant="secondary" className="font-normal tabular-nums text-[var(--riff-text-secondary)]">
              {formatBytes(stats.coverBytes)}
            </Badge>
          }
        />

        <SettingRow
          label="Export folder"
          description="Open the desktop export destination used by Library and Track Details downloads."
          control={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="font-mono text-xs text-[var(--riff-text-muted)]">~/Riff/exports</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void handleOpenExportFolder()}>
                Open
              </Button>
            </div>
          }
        />
      </div>

      {feedback ? (
        <p className="text-xs text-[var(--riff-text-secondary)]">{feedback}</p>
      ) : null}
      <p className="text-xs text-[var(--riff-text-faint)]">
        Total local footprint currently tracked by the app: {formatBytes(stats.totalBytes)}.
      </p>
    </section>
  )
}
