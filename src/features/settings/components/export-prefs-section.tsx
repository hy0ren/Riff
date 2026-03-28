import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore, type ExportAudioFormat } from '../store/use-settings-store'

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
  const exportPrefs = useSettingsStore((state) => state.exports)
  const setExports = useSettingsStore((state) => state.setExports)

  return (
    <section id="exports" className="space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Export preferences
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Defaults used when you export songs directly from the Library.
        </p>
      </div>
      <Separator className="bg-white/[0.06]" />
      <div className="flex flex-col gap-2">
        <SettingRow
          label="Preferred audio format"
          description="Used when the rendered audio already matches the selected format."
        >
          <select
            value={exportPrefs.audioFormat}
            onChange={(event) =>
              setExports({ audioFormat: event.target.value as ExportAudioFormat })
            }
            className="h-9 min-w-[120px] rounded-lg border border-white/[0.08] bg-[var(--riff-surface-mid)] px-3 text-sm text-[var(--riff-text-primary)] outline-none"
            aria-label="Preferred audio format"
          >
            <option value="wav">WAV</option>
            <option value="mp3">MP3</option>
          </select>
        </SettingRow>
        <SettingRow
          label="Include metadata JSON"
          description="Bundle a machine-readable summary with key song attributes."
        >
          <Switch
            checked={exportPrefs.includeMetadataJson}
            onCheckedChange={(value) => setExports({ includeMetadataJson: value })}
          />
        </SettingRow>
        <SettingRow
          label="Include chord sheet"
          description="Adds a timestamped section-by-section chord map."
        >
          <Switch
            checked={exportPrefs.includeChordSheet}
            onCheckedChange={(value) => setExports({ includeChordSheet: value })}
          />
        </SettingRow>
        <SettingRow
          label="Include melody guide"
          description="Adds the Learn-ready melody focus notes when available."
        >
          <Switch
            checked={exportPrefs.includeMelodyGuide}
            onCheckedChange={(value) => setExports({ includeMelodyGuide: value })}
          />
        </SettingRow>
        <SettingRow
          label="Include lyrics"
          description="Attach lyric text for vocal songs whenever a lyric sheet exists."
        >
          <Switch
            checked={exportPrefs.includeLyrics}
            onCheckedChange={(value) => setExports({ includeLyrics: value })}
          />
        </SettingRow>
        <SettingRow
          label="Include all versions"
          description="Exports every saved version instead of only the active one."
        >
          <Switch
            checked={exportPrefs.includeAllVersions}
            onCheckedChange={(value) => setExports({ includeAllVersions: value })}
          />
        </SettingRow>
      </div>
    </section>
  )
}
