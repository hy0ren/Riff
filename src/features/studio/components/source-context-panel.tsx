import { useState } from 'react'
import {
  FileAudio,
  FileMusic,
  FileText,
  ListMusic,
  Mic,
  Music2,
  RefreshCcw,
  Share2,
} from 'lucide-react'
import type { InstrumentPlan } from '@/domain/blueprint'
import type { InterpretationSnapshot } from '@/domain/interpretation'
import type { SourceInput } from '@/domain/source-input'
import type { SourceInfluence, SourceSet } from '@/domain/source-set'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getSafeDerivedBlueprint, getSafeInterpretationConflicts } from '@/lib/interpretation-utils'

interface SourceContextPanelProps {
  sourceInputs: SourceInput[]
  sourceSet?: SourceSet
  interpretation?: InterpretationSnapshot
  interpretationStatus: 'idle' | 'refreshing'
  draftInstruments?: InstrumentPlan
  onRefreshInterpretation: () => void
  onToggleSourceEnabled: (sourceInputId: string) => void
  onSourceWeightChange: (sourceInputId: string, weight: number) => void
  onSourceInfluenceChange: (sourceInputId: string, influence: SourceInfluence) => void
  onSourceFieldChange: (
    sourceInputId: string,
    field: 'label' | 'description' | 'text',
    value: string,
  ) => void
  onInstrumentToggle?: (instrument: string, active: boolean) => void
}

function getSourceIcon(sourceInput: SourceInput) {
  switch (sourceInput.type) {
    case 'hum':
    case 'sung_melody':
      return Mic
    case 'riff_audio':
      return Music2
    case 'sheet_music':
      return FileMusic
    case 'lyrics':
    case 'typed_notes':
    case 'chord_progression':
      return FileText
    case 'spotify_track_reference':
    case 'spotify_playlist_reference':
      return ListMusic
    case 'remix_source':
      return Share2
    default:
      return FileAudio
  }
}

function getSourceMeta(sourceInput: SourceInput): string {
  if ('durationSeconds' in sourceInput && sourceInput.durationSeconds) {
    return `${sourceInput.durationSeconds}s · ${sourceInput.role}`
  }

  if ('text' in sourceInput) {
    return `${sourceInput.text.length} chars · ${sourceInput.role}`
  }

  if ('playlistName' in sourceInput) {
    return `${sourceInput.playlistName} · ${sourceInput.role}`
  }

  if ('artistName' in sourceInput && sourceInput.artistName) {
    return `${sourceInput.artistName} · ${sourceInput.role}`
  }

  if ('fileName' in sourceInput && sourceInput.fileName) {
    return `${sourceInput.fileName} · ${sourceInput.role}`
  }

  return sourceInput.role
}

function getInfluenceLabel(influence: SourceInfluence): string {
  switch (influence) {
    case 'supporting':
      return 'secondary'
    case 'reference':
      return 'tertiary'
    default:
      return 'primary'
  }
}

function SourceWeightControl({
  sourceInputId,
  itemWeight,
  enabled,
  onSourceWeightChange,
}: {
  sourceInputId: string
  itemWeight: number
  enabled: boolean
  onSourceWeightChange: (sourceInputId: string, weight: number) => void
}) {
  const [previewWeight, setPreviewWeight] = useState(itemWeight)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[var(--riff-text-muted)]">
        <span>Influence Weight</span>
        <span className="font-mono text-[var(--riff-text-primary)]">{previewWeight}</span>
      </div>
      <Slider
        key={`${sourceInputId}-${itemWeight}`}
        defaultValue={[itemWeight]}
        min={0}
        max={100}
        step={1}
        disabled={!enabled}
        onValueChange={(value) => setPreviewWeight(value[0] ?? itemWeight)}
        onValueCommit={(value) => {
          const nextWeight = value[0] ?? itemWeight
          setPreviewWeight(nextWeight)
          onSourceWeightChange(sourceInputId, nextWeight)
        }}
      />
    </div>
  )
}

function SourceInfluenceControl({
  sourceInputId,
  itemInfluence,
  enabled,
  onSourceInfluenceChange,
}: {
  sourceInputId: string
  itemInfluence: SourceInfluence
  enabled: boolean
  onSourceInfluenceChange: (sourceInputId: string, influence: SourceInfluence) => void
}) {
  const [previewInfluence, setPreviewInfluence] = useState<SourceInfluence>(itemInfluence)

  const influenceOptions: Array<{ value: SourceInfluence; label: string }> = [
    { value: 'primary', label: 'primary' },
    { value: 'supporting', label: 'secondary' },
    { value: 'reference', label: 'tertiary' },
  ]

  return (
    <>
      <div className="flex items-center justify-between text-xs text-[var(--riff-text-muted)]">
        <span>Influence Mode</span>
        <span className="font-mono text-[var(--riff-text-primary)]">
          {getInfluenceLabel(previewInfluence)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {influenceOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={!enabled}
            onClick={() => {
              setPreviewInfluence(option.value)
              onSourceInfluenceChange(sourceInputId, option.value)
            }}
            className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition ${
              previewInfluence === option.value
                ? 'border-[var(--riff-accent)] bg-[var(--riff-accent)]/15 text-[var(--riff-accent-light)]'
                : 'border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] text-[var(--riff-text-muted)]'
            } ${!enabled ? 'opacity-50' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  )
}

export function SourceContextPanel({
  sourceInputs,
  sourceSet,
  interpretation,
  interpretationStatus,
  draftInstruments,
  onRefreshInterpretation,
  onToggleSourceEnabled,
  onSourceWeightChange,
  onSourceInfluenceChange,
  onSourceFieldChange,
  onInstrumentToggle,
}: SourceContextPanelProps) {
  const items = [...(sourceSet?.items ?? [])].sort((left, right) => left.order - right.order)
  const sourceById = new Map(sourceInputs.map((sourceInput) => [sourceInput.id, sourceInput]))
  const activeItems = items.filter((item) => item.enabled)
  const derivedBlueprint = getSafeDerivedBlueprint(interpretation)
  const interpretationConflicts = getSafeInterpretationConflicts(interpretation)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--riff-text-primary)]">
            Source Assembly
          </h2>
          <p className="text-sm text-[var(--riff-text-muted)]">
            {activeItems.length} active input{activeItems.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onRefreshInterpretation}
          disabled={interpretationStatus === 'refreshing'}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          {interpretationStatus === 'refreshing' ? 'Refreshing' : 'Re-interpret'}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const sourceInput = sourceById.get(item.sourceInputId)
          if (!sourceInput) {
            return null
          }

          const Icon = getSourceIcon(sourceInput)

          return (
            <div
              key={sourceInput.id}
              className="flex flex-col gap-3 rounded-xl bg-[var(--riff-surface-low)] p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--riff-surface-highest)]">
                    <Icon className="h-4 w-4 text-[var(--riff-accent-light)]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--riff-text-faint)]">Source</p>
                    <p className="text-xs text-[var(--riff-text-muted)]">{getSourceMeta(sourceInput)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    item.enabled
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-[var(--riff-surface-highest)] text-[var(--riff-text-muted)]'
                  }`}
                  onClick={() => onToggleSourceEnabled(sourceInput.id)}
                >
                  {item.enabled ? 'Active' : 'Muted'}
                </button>
              </div>

              <div className="space-y-2">
                <Input
                  value={sourceInput.label}
                  onChange={(event) =>
                    onSourceFieldChange(sourceInput.id, 'label', event.target.value)
                  }
                  className="bg-[var(--riff-surface)] border-[var(--riff-surface-highest)] text-sm"
                />
                <Input
                  value={sourceInput.description}
                  onChange={(event) =>
                    onSourceFieldChange(sourceInput.id, 'description', event.target.value)
                  }
                  className="bg-[var(--riff-surface)] border-[var(--riff-surface-highest)] text-xs text-[var(--riff-text-muted)]"
                />
                {'text' in sourceInput ? (
                  <Textarea
                    value={sourceInput.text}
                    rows={3}
                    onChange={(event) =>
                      onSourceFieldChange(sourceInput.id, 'text', event.target.value)
                    }
                    className="bg-[var(--riff-surface)] border-[var(--riff-surface-highest)] text-xs"
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-[var(--riff-surface-highest)] text-[var(--riff-text-secondary)]">
                  {getInfluenceLabel(item.influence)}
                </Badge>
                <Badge variant="secondary" className="bg-[var(--riff-surface-highest)] text-[var(--riff-text-secondary)]">
                  {sourceInput.provenance}
                </Badge>
                {sourceInput.isReference && (
                  <Badge variant="secondary" className="bg-[#1DB954]/15 text-[#82f0aa]">
                    Reference
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <SourceInfluenceControl
                  sourceInputId={sourceInput.id}
                  itemInfluence={item.influence}
                  enabled={item.enabled}
                  onSourceInfluenceChange={onSourceInfluenceChange}
                />
                <SourceWeightControl
                  sourceInputId={sourceInput.id}
                  itemWeight={item.weight}
                  enabled={item.enabled}
                  onSourceWeightChange={onSourceWeightChange}
                />
              </div>
            </div>
          )
        })}
      </div>

      <Separator className="bg-[var(--riff-surface-highest)]" />

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-[var(--riff-text-secondary)] uppercase">
            Interpreted Signals
          </h3>
          <p className="mt-1 text-xs text-[var(--riff-text-muted)]">
            {interpretation?.summary ?? 'No interpretation snapshot yet.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SignalCard
            label="Detected Key"
            value={
              derivedBlueprint.key && derivedBlueprint.mode
                ? `${derivedBlueprint.key} ${derivedBlueprint.mode}`
                : 'Awaiting'
            }
          />
          <SignalCard
            label="Est. BPM"
            value={derivedBlueprint.bpm ? `${derivedBlueprint.bpm}` : 'Awaiting'}
          />
          <SignalCard label="Mood" value={derivedBlueprint.mood ?? 'Awaiting'} />
          <SignalCard label="Energy" value={derivedBlueprint.energy ?? 'Awaiting'} />
        </div>

        <div className="rounded-lg bg-[var(--riff-surface-low)] p-3">
          <p className="mb-2 text-xs text-[var(--riff-text-muted)]">Instrumentation</p>
          <div className="flex flex-wrap gap-1.5">
            {(() => {
              const instruments = draftInstruments ?? derivedBlueprint.instruments ?? {}
              const entries = Object.entries(instruments)
              if (!entries.length) {
                return <span className="text-xs text-[var(--riff-text-muted)]">No instrumentation signal yet.</span>
              }
              return entries.map(([instrument, active]) => (
                <button
                  key={instrument}
                  type="button"
                  onClick={() => onInstrumentToggle?.(instrument, !active)}
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs capitalize transition-colors ${
                    active
                      ? 'bg-[var(--riff-accent)]/20 text-[var(--riff-accent-light)] ring-1 ring-[var(--riff-accent)]/30'
                      : 'bg-[var(--riff-surface-highest)] text-[var(--riff-text-muted)] hover:text-[var(--riff-text-secondary)]'
                  }`}
                >
                  {instrument}
                </button>
              ))
            })()}
          </div>
        </div>

        {interpretationConflicts.length ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
              Signal Conflicts
            </p>
            <div className="mt-2 space-y-2">
              {interpretationConflicts.map((conflict) => (
                <p key={`${conflict.field}-${conflict.summary}`} className="text-xs text-amber-100/85">
                  {conflict.summary}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--riff-surface-low)] p-2">
      <p className="text-xs text-[var(--riff-text-muted)]">{label}</p>
      <p className="text-sm text-[var(--riff-text-primary)]">{value}</p>
    </div>
  )
}
