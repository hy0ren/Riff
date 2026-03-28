import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

const cardStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
      style={cardStyle}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--riff-text-primary)]">{label}</div>
        {description ? (
          <p className="mt-0.5 text-[11px] text-[var(--riff-text-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}

export function ExportPrefsSection() {
  return (
    <section id="exports-prefs" className="space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Export preferences
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Choose the files and sidecar assets included when you export a project.
        </p>
      </div>
      <Separator className="bg-white/[0.06]" />
      <div className="flex flex-col gap-2">
        <SettingRow
          label="Default Audio Format"
          description="Container used for bounced audio from the timeline."
        >
          <div className="flex h-9 min-w-[5.5rem] items-center justify-center rounded-lg border border-white/[0.06] bg-[var(--riff-surface-mid)] px-3 text-sm font-medium text-[var(--riff-text-primary)]">
            WAV
          </div>
        </SettingRow>
        <SettingRow
          label="Export Quality"
          description="Bitrate and processing applied to rendered audio."
        >
          <div className="flex h-9 min-w-[6.5rem] items-center justify-center rounded-lg border border-white/[0.06] bg-[var(--riff-surface-mid)] px-3 text-sm font-medium text-[var(--riff-text-primary)]">
            Lossless
          </div>
        </SettingRow>
        <SettingRow
          label="Include Metadata JSON"
          description="Attach machine-readable project metadata alongside exports."
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          label="Include Chord Sheet"
          description="Export a chord chart for collaborators and performers."
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          label="Include Melody Guide"
          description="Add a reference guide track for melodic lines."
        >
          <Switch />
        </SettingRow>
        <SettingRow
          label="Include Lyrics"
          description="Bundle lyric text when available for the project."
        >
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow
          label="Include All Versions"
          description="Export alternate takes and stems in addition to the main mix."
        >
          <Switch />
        </SettingRow>
      </div>
    </section>
  )
}
