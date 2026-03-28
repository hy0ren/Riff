import { PageFrame } from '@/components/layout/page-frame'
import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <PageFrame title="Settings" subtitle="Configuration and integrations">
      <div className="flex h-64 items-center justify-center rounded-xl" style={{ background: 'var(--riff-surface-low)' }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Settings className="h-8 w-8 text-[var(--riff-text-faint)]" />
          <p className="text-sm text-[var(--riff-text-muted)]">
            App preferences, Spotify connection, and audio settings
          </p>
        </div>
      </div>
    </PageFrame>
  )
}
