import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/features/projects/store/use-project-store'
import { useIntegrationStore } from '@/features/integrations/store/use-integration-store'
import { useSettingsStore } from '../store/use-settings-store'

const rowStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

export function AdvancedSection() {
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults)
  const resetProjects = useProjectStore((state) => state.resetProjects)
  const clearSpotify = useIntegrationStore((state) => state.clearSpotify)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleResetLocalData = () => {
    const confirmed = window.confirm(
      'Reset local projects, clear imported Spotify cache, and restore default settings on this device?',
    )

    if (!confirmed) {
      return
    }

    resetProjects()
    clearSpotify()
    resetToDefaults()
    setFeedback('Local library, cache, and settings were reset to their defaults.')
  }

  return (
    <section id="advanced" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Advanced
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Troubleshooting switches and local recovery actions.
        </p>
      </div>

      <div className="space-y-2">
        <div className="rounded-xl px-4 py-3.5" style={rowStyle}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--riff-text-primary)]">Reset local data</p>
              <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
                Restores the seeded local library, clears Spotify cache, and resets settings on this device.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0 sm:ml-4"
              onClick={handleResetLocalData}
            >
              Reset local data
            </Button>
          </div>
        </div>
      </div>

      {feedback ? (
        <p className="text-xs text-[var(--riff-text-secondary)]">{feedback}</p>
      ) : null}
    </section>
  )
}
