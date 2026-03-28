import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { ProjectBlueprint } from '@/domain/project'
import { Badge } from '@/components/ui/badge'
import { Settings2 } from 'lucide-react'

interface BlueprintEditorProps {
  blueprint: ProjectBlueprint
}

export function BlueprintEditor({ blueprint }: BlueprintEditorProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--riff-text-primary)]">
            Blueprint
          </h2>
          <p className="text-sm text-[var(--riff-text-muted)]">
            Configure generation parameters
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--riff-surface-low)] hover:bg-[var(--riff-surface-highest)] transition-colors cursor-pointer">
          <Settings2 className="h-4 w-4 text-[var(--riff-text-secondary)]" />
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['core', 'vocals', 'instruments']} className="w-full">
        {/* Core Settings */}
        <AccordionItem value="core" className="border-b-0 pb-2">
          <AccordionTrigger className="hover:no-underline py-2 text-[var(--riff-text-primary)] data-[state=open]:text-[var(--riff-accent-light)]">
            Core Musical Settings
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-2">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-[var(--riff-text-secondary)]">Tempo (BPM)</span>
                  <span className="text-sm font-mono text-[var(--riff-text-primary)]">{blueprint.bpm}</span>
                </div>
                <Slider defaultValue={[blueprint.bpm]} max={200} min={60} step={1} className="w-full" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">Key</label>
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 text-sm font-mono shadow-sm">
                    {blueprint.key}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">Mode</label>
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 text-sm font-mono shadow-sm">
                    {blueprint.mode}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">Genre</label>
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 text-sm shadow-sm truncate">
                    {blueprint.genre}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">Energy</label>
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 text-sm shadow-sm">
                    {blueprint.energy}
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Vocals */}
        <AccordionItem value="vocals" className="border-b-0 pb-2">
          <AccordionTrigger className="hover:no-underline py-2 text-[var(--riff-text-primary)] data-[state=open]:text-[var(--riff-accent-light)]">
            Vocal Design
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-2 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-[var(--riff-surface-low)] p-3">
              <div>
                <p className="text-sm font-medium text-[var(--riff-text-primary)]">Enable Vocals</p>
                <p className="text-xs text-[var(--riff-text-muted)]">Generate lyrics and voice</p>
              </div>
              <Switch defaultChecked={blueprint.vocalsEnabled} />
            </div>

            {blueprint.vocalsEnabled && (
              <div className="space-y-3 px-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">Vocal Style</label>
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] px-3 text-sm shadow-sm">
                    {blueprint.vocalStyle}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--riff-text-muted)]">Lyric Theme</label>
                  <div className="flex h-20 w-full rounded-md border border-[var(--riff-surface-highest)] bg-[var(--riff-surface)] p-3 text-sm shadow-sm">
                    "Late night city driving, reflection, neon lights, empty streets."
                  </div>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Instruments */}
        <AccordionItem value="instruments" className="border-b-0 pb-2">
          <AccordionTrigger className="hover:no-underline py-2 text-[var(--riff-text-primary)] data-[state=open]:text-[var(--riff-accent-light)]">
            Instrumentation
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={blueprint.instruments.drums ? "default" : "secondary"} className={blueprint.instruments.drums ? "bg-[var(--riff-accent)] text-white hover:bg-[var(--riff-accent-focus)]" : "bg-[var(--riff-surface-low)] text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-highest)] cursor-pointer"}>
                Drums
              </Badge>
              <Badge variant={blueprint.instruments.bass ? "default" : "secondary"} className={blueprint.instruments.bass ? "bg-[var(--riff-accent)] text-white hover:bg-[var(--riff-accent-focus)]" : "bg-[var(--riff-surface-low)] text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-highest)] cursor-pointer"}>
                Synth Bass
              </Badge>
              <Badge variant={blueprint.instruments.synths ? "default" : "secondary"} className={blueprint.instruments.synths ? "bg-[var(--riff-accent)] text-white hover:bg-[var(--riff-accent-focus)]" : "bg-[var(--riff-surface-low)] text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-highest)] cursor-pointer"}>
                Lead Synths
              </Badge>
              <Badge variant={blueprint.instruments.pads ? "default" : "secondary"} className={blueprint.instruments.pads ? "bg-[var(--riff-accent)] text-white hover:bg-[var(--riff-accent-focus)]" : "bg-[var(--riff-surface-low)] text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-highest)] cursor-pointer"}>
                Ambient Pads
              </Badge>
              <Badge variant={blueprint.instruments.guitar ? "default" : "secondary"} className={blueprint.instruments.guitar ? "bg-[var(--riff-accent)] text-white hover:bg-[var(--riff-accent-focus)]" : "bg-[var(--riff-surface-low)] text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-highest)] cursor-pointer"}>
                Electric Guitar
              </Badge>
              <Badge variant={blueprint.instruments.strings ? "default" : "secondary"} className={blueprint.instruments.strings ? "bg-[var(--riff-accent)] text-white hover:bg-[var(--riff-accent-focus)]" : "bg-[var(--riff-surface-low)] text-[var(--riff-text-muted)] hover:bg-[var(--riff-surface-highest)] cursor-pointer"}>
                Strings
              </Badge>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Generate Handoff Action */}
      <div className="mt-auto pt-6 pb-2">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[var(--riff-accent)] to-[var(--riff-accent-focus)] py-3 px-4 font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98]">
          <span className="text-sm">Generate with Lyria</span>
        </button>
      </div>
    </div>
  )
}
