import { Switch } from '@/components/ui/switch'
import { useState, type ReactNode } from 'react'

function SettingRow({
  label,
  description,
  control,
}: {
  label: string
  description?: string
  control: ReactNode
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
      <div className="shrink-0">{control}</div>
    </div>
  )
}

export function NotificationsSection() {
  const [exportComplete, setExportComplete] = useState(true)
  const [remixNotifications, setRemixNotifications] = useState(true)
  const [communityEngagement, setCommunityEngagement] = useState(false)
  const [appUpdates, setAppUpdates] = useState(true)
  const [coachingReminders, setCoachingReminders] = useState(false)

  return (
    <section id="notifications" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Notifications
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          In-app and email alerts for exports, community, and product updates
        </p>
      </div>

      <div className="space-y-3">
        <SettingRow
          label="Export Complete"
          control={
            <Switch
              size="sm"
              checked={exportComplete}
              onCheckedChange={setExportComplete}
              aria-label="Export complete notifications"
            />
          }
        />
        <SettingRow
          label="Remix Notifications"
          description="When someone remixes your public track"
          control={
            <Switch
              size="sm"
              checked={remixNotifications}
              onCheckedChange={setRemixNotifications}
              aria-label="Remix notifications"
            />
          }
        />
        <SettingRow
          label="Community Engagement"
          description="Likes, follows, and plays on public tracks"
          control={
            <Switch
              size="sm"
              checked={communityEngagement}
              onCheckedChange={setCommunityEngagement}
              aria-label="Community engagement notifications"
            />
          }
        />
        <SettingRow
          label="App Updates"
          control={
            <Switch
              size="sm"
              checked={appUpdates}
              onCheckedChange={setAppUpdates}
              aria-label="App updates"
            />
          }
        />
        <SettingRow
          label="Coaching Reminders"
          description="Practice session suggestions"
          control={
            <Switch
              size="sm"
              checked={coachingReminders}
              onCheckedChange={setCoachingReminders}
              aria-label="Coaching reminders"
            />
          }
        />
      </div>
    </section>
  )
}
