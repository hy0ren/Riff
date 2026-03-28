import { Settings2 } from 'lucide-react'
import type { BlueprintDraft, BlueprintDraftField } from '@/domain/blueprint-draft'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface BlueprintEditorProps {
  draft: BlueprintDraft
  isGenerating: boolean
  onFieldChange: (field: BlueprintDraftField, value: unknown) => void
  onCommitDraft: () => void
  onGenerate: () => void
}

function FieldBadge({
  origin,
  conflicted = false,
}: {
  origin?: BlueprintDraft['origins'][BlueprintDraftField]
  conflicted?: boolean
}) {
  if (!origin && !conflicted) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {origin ? (
        <Badge variant="secondary" className="bg-[var(--riff-surface-highest)] text-[var(--riff-text-secondary)]">
          {origin}
        </Badge>
      ) : null}
      {conflicted ? (
        <Badge variant="secondary" className="bg-amber-500/15 text-amber-200">
          conflict
        </Badge>
      ) : null}
    </div>
  )
}

export function BlueprintEditor({
  draft,
  isGenerating,
  onFieldChange,
  onCommitDraft,
  onGenerate,
}: BlueprintEditorProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--riff-text-primary)]">
            Blueprint Draft
          </h2>
          <p className="text-sm text-[var(--riff-text-muted)]">
            Auto-filled from sources, then locked by your edits.
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--riff-surface-low)]">
          <Settings2 className="h-4 w-4 text-[var(--riff-text-secondary)]" />
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['core', 'vocals', 'notes', 'instruments']} className="w-full">
        <AccordionItem value="core" className="border-b-0 pb-2">
          <AccordionTrigger className="py-2 hover:no-underline text-[var(--riff-text-primary)]">
            Core Musical Settings
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pt-4 pb-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--riff-text-secondary)]">Tempo (BPM)</span>
                <FieldBadge
                  origin={draft.origins.bpm}
                  conflicted={draft.conflictFields.includes('bpm')}
                />
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[draft.bpm]}
                  max={200}
                  min={60}
                  step={1}
                  className="w-full"
                  onValueChange={(value) => onFieldChange('bpm', value[0] ?? draft.bpm)}
                />
                <span className="w-10 text-right text-sm font-mono text-[var(--riff-text-primary)]">
                  {draft.bpm}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldInput
                label="Key"
                value={draft.key}
                origin={draft.origins.key}
                conflicted={draft.conflictFields.includes('key')}
                onChange={(value) => onFieldChange('key', value)}
              />
              <FieldInput
                label="Mode"
                value={draft.mode}
                origin={draft.origins.mode}
                conflicted={draft.conflictFields.includes('mode')}
                onChange={(value) => onFieldChange('mode', value)}
              />
              <FieldInput
                label="Genre"
                value={draft.genre}
                origin={draft.origins.genre}
                conflicted={draft.conflictFields.includes('genre')}
                onChange={(value) => onFieldChange('genre', value)}
              />
              <FieldInput
                label="Subgenre"
                value={draft.subgenre ?? ''}
                origin={draft.origins.subgenre}
                conflicted={draft.conflictFields.includes('subgenre')}
                onChange={(value) => onFieldChange('subgenre', value)}
              />
              <FieldInput
                label="Mood"
                value={draft.mood}
                origin={draft.origins.mood}
                conflicted={draft.conflictFields.includes('mood')}
                onChange={(value) => onFieldChange('mood', value)}
              />
              <FieldInput
                label="Energy"
                value={draft.energy}
                origin={draft.origins.energy}
                conflicted={draft.conflictFields.includes('energy')}
                onChange={(value) => onFieldChange('energy', value)}
              />
              <FieldInput
                label="Duration"
                value={draft.targetDuration}
                origin={draft.origins.targetDuration}
                conflicted={draft.conflictFields.includes('targetDuration')}
                onChange={(value) => onFieldChange('targetDuration', value)}
              />
              <FieldInput
                label="Time Signature"
                value={draft.timeSignature}
                origin={draft.origins.timeSignature}
                conflicted={draft.conflictFields.includes('timeSignature')}
                onChange={(value) => onFieldChange('timeSignature', value)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="vocals" className="border-b-0 pb-2">
          <AccordionTrigger className="py-2 hover:no-underline text-[var(--riff-text-primary)]">
            Vocal Design
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4 pb-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={draft.vocalsEnabled ? 'outline' : 'default'}
                size="sm"
                onClick={() => {
                  onFieldChange('vocalsEnabled', false)
                  onFieldChange('vocalStyle', '')
                }}
              >
                Instrumental Mode
              </Button>
              <Button
                type="button"
                variant={draft.vocalsEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFieldChange('vocalsEnabled', true)}
              >
                Vocal-led
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[var(--riff-surface-low)] p-3">
              <div>
                <p className="text-sm font-medium text-[var(--riff-text-primary)]">Enable Vocals</p>
                <p className="text-xs text-[var(--riff-text-muted)]">
                  Keep lyric and melody interpretation active in generation.
                </p>
              </div>
              <Switch
                checked={draft.vocalsEnabled}
                onCheckedChange={(checked) => onFieldChange('vocalsEnabled', checked)}
              />
            </div>

            <FieldInput
              label="Vocal Style"
              value={draft.vocalStyle ?? ''}
              origin={draft.origins.vocalStyle}
              conflicted={draft.conflictFields.includes('vocalStyle')}
              onChange={(value) => onFieldChange('vocalStyle', value)}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">
                  Lyric Theme
                </label>
                <FieldBadge
                  origin={draft.origins.lyricTheme}
                  conflicted={draft.conflictFields.includes('lyricTheme')}
                />
              </div>
              <Textarea
                value={draft.lyricTheme ?? ''}
                rows={4}
                onChange={(event) => onFieldChange('lyricTheme', event.target.value)}
                className="bg-[var(--riff-surface)] border-[var(--riff-surface-highest)]"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notes" className="border-b-0 pb-2">
          <AccordionTrigger className="py-2 hover:no-underline text-[var(--riff-text-primary)]">
            Direction Notes
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4 pb-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">
                  Melody Direction
                </label>
                <FieldBadge
                  origin={draft.origins.melodyDirection}
                  conflicted={draft.conflictFields.includes('melodyDirection')}
                />
              </div>
              <Textarea
                value={draft.melodyDirection ?? ''}
                rows={3}
                onChange={(event) => onFieldChange('melodyDirection', event.target.value)}
                className="bg-[var(--riff-surface)] border-[var(--riff-surface-highest)]"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">
                  Texture
                </label>
                <FieldBadge
                  origin={draft.origins.texture}
                  conflicted={draft.conflictFields.includes('texture')}
                />
              </div>
              <Textarea
                value={draft.texture ?? ''}
                rows={3}
                onChange={(event) => onFieldChange('texture', event.target.value)}
                className="bg-[var(--riff-surface)] border-[var(--riff-surface-highest)]"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="instruments" className="border-b-0 pb-2">
          <AccordionTrigger className="py-2 hover:no-underline text-[var(--riff-text-primary)]">
            Instrumentation
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(draft.instruments).map(([instrument, active]) => {
                const field = `instruments.${instrument}` as BlueprintDraftField
                return (
                  <button
                    key={instrument}
                    type="button"
                    onClick={() => onFieldChange(field, !active)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? 'border-[var(--riff-accent)] bg-[var(--riff-accent)] text-white'
                        : 'border-[var(--riff-surface-highest)] bg-[var(--riff-surface-low)] text-[var(--riff-text-muted)]'
                    }`}
                  >
                    {instrument}
                  </button>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-auto flex flex-col gap-3 pt-4 pb-2">
        <Button variant="outline" className="w-full" onClick={onCommitDraft}>
          Commit Blueprint Revision
        </Button>
        <Button className="w-full" onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating…' : 'Generate with Lyria'}
        </Button>
      </div>
    </div>
  )
}

function FieldInput({
  label,
  value,
  origin,
  conflicted,
  onChange,
}: {
  label: string
  value: string
  origin?: BlueprintDraft['origins'][BlueprintDraftField]
  conflicted?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">
          {label}
        </label>
        <FieldBadge origin={origin} conflicted={conflicted} />
      </div>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-[var(--riff-surface)] border-[var(--riff-surface-highest)]"
      />
    </div>
  )
}
