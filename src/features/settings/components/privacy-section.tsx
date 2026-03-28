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

function StatusChip({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--riff-text-secondary)]"
      style={{
        background: 'var(--riff-surface-mid)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  )
}

export function PrivacySection() {
  const [allowRemixes, setAllowRemixes] = useState(true)
  const [publicProfile, setPublicProfile] = useState(true)
  const [hideDraftActivity, setHideDraftActivity] = useState(false)

  return (
    <section id="privacy" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">Privacy</h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Publishing defaults, remix rules, and public profile visibility
        </p>
      </div>

      <div className="space-y-3">
        <SettingRow label="Default Publish Visibility" control={<StatusChip>Private</StatusChip>} />
        <SettingRow
          label="Allow Remixes"
          description="Let others remix your public tracks"
          control={
            <Switch
              size="sm"
              checked={allowRemixes}
              onCheckedChange={setAllowRemixes}
              aria-label="Allow remixes"
            />
          }
        />
        <SettingRow label="Remix Attribution" control={<StatusChip>Required</StatusChip>} />
        <SettingRow
          label="Public Profile"
          description="Make your profile discoverable"
          control={
            <Switch
              size="sm"
              checked={publicProfile}
              onCheckedChange={setPublicProfile}
              aria-label="Public profile"
            />
          }
        />
        <SettingRow
          label="Hide Draft Activity"
          description="Hide drafts from public view"
          control={
            <Switch
              size="sm"
              checked={hideDraftActivity}
              onCheckedChange={setHideDraftActivity}
              aria-label="Hide draft activity"
            />
          }
        />
      </div>
    </section>
  )
}
