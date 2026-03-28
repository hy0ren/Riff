import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import type { TuningState } from '@/domain/radio'
import { RotateCcw, Zap } from 'lucide-react'

interface TuningPanelProps {
  tuning: TuningState
  onChange: (key: keyof TuningState, value: number | boolean) => void
  onReset: () => void
  onConnectSpotify?: () => void
}

interface TuningSliderProps {
  label: string
  lowLabel: string
  highLabel: string
  value: number
  onChange: (v: number) => void
  accentColor?: string
}

function TuningSlider({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
  accentColor,
}: TuningSliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[var(--riff-text-secondary)]">{label}</span>
        <span
          className="text-[11px] font-medium tabular-nums"
          style={{ color: accentColor ?? 'var(--riff-accent-light)' }}
        >
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={100}
        step={5}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between">
        <span className="text-[10px] text-[var(--riff-text-faint)]">{lowLabel}</span>
        <span className="text-[10px] text-[var(--riff-text-faint)]">{highLabel}</span>
      </div>
    </div>
  )
}

interface SectionHeadingProps {
  label: string
}

function SectionHeading({ label }: SectionHeadingProps) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
      {label}
    </p>
  )
}

export function TuningPanel({ tuning, onChange, onReset, onConnectSpotify }: TuningPanelProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--riff-surface-low)' }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[var(--riff-accent-light)]" />
          <h3 className="font-display text-sm font-bold text-[var(--riff-text-primary)]">
            Tune Station
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-6 gap-1 px-2 text-[11px] text-[var(--riff-text-faint)] hover:text-[var(--riff-text-muted)]"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        {/* Texture & Tone */}
        <div className="space-y-4">
          <SectionHeading label="Texture & Tone" />
          <TuningSlider
            label="Vocals"
            lowLabel="Fewer"
            highLabel="More"
            value={tuning.vocals}
            onChange={(v) => onChange('vocals', v)}
          />
          <TuningSlider
            label="Texture"
            lowLabel="Darker"
            highLabel="Brighter"
            value={tuning.texture}
            onChange={(v) => onChange('texture', v)}
          />
          <TuningSlider
            label="Cinematic"
            lowLabel="Minimal"
            highLabel="Cinematic"
            value={tuning.cinematic}
            onChange={(v) => onChange('cinematic', v)}
          />
        </div>

        <Separator className="bg-[rgba(255,255,255,0.04)]" />

        {/* Energy & Tempo */}
        <div className="space-y-4">
          <SectionHeading label="Energy & Tempo" />
          <TuningSlider
            label="Energy"
            lowLabel="Calmer"
            highLabel="Energetic"
            value={tuning.energy}
            onChange={(v) => onChange('energy', v)}
            accentColor="#fcd34d"
          />
          <TuningSlider
            label="BPM Range"
            lowLabel="Tighter"
            highLabel="Broader"
            value={tuning.bpmBreadth}
            onChange={(v) => onChange('bpmBreadth', v)}
            accentColor="#fcd34d"
          />
          <TuningSlider
            label="Lyrics"
            lowLabel="Instrumental"
            highLabel="Lyrical"
            value={tuning.lyrical}
            onChange={(v) => onChange('lyrical', v)}
            accentColor="#fcd34d"
          />
        </div>

        <Separator className="bg-[rgba(255,255,255,0.04)]" />

        {/* Discovery Mix */}
        <div className="space-y-4">
          <SectionHeading label="Discovery Mix" />
          <TuningSlider
            label="Source"
            lowLabel="My Creations"
            highLabel="Community"
            value={tuning.discovery}
            onChange={(v) => onChange('discovery', v)}
            accentColor="#a78bfa"
          />
          <TuningSlider
            label="Style"
            lowLabel="Mainstream"
            highLabel="Experimental"
            value={tuning.mainstream}
            onChange={(v) => onChange('mainstream', v)}
            accentColor="#a78bfa"
          />
        </div>

        <Separator className="bg-[rgba(255,255,255,0.04)]" />

        {/* Spotify Influence */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeading label="Spotify Influence" />
            {tuning.spotifyConnected ? (
              <Badge className="border border-[#1db954]/30 bg-[#1db954]/10 px-1.5 py-0 text-[10px] font-bold text-[#1db954]">
                Connected
              </Badge>
            ) : (
              <Badge className="border border-[var(--riff-surface-highest)] bg-[var(--riff-surface-high)] px-1.5 py-0 text-[10px] text-[var(--riff-text-faint)]">
                Not connected
              </Badge>
            )}
          </div>
          {tuning.spotifyConnected ? (
            <>
              <TuningSlider
                label="Playlist Influence"
                lowLabel="Less"
                highLabel="More"
                value={tuning.spotifyInfluence}
                onChange={(v) => onChange('spotifyInfluence', v)}
                accentColor="#1db954"
              />
              <p className="text-[11px] leading-relaxed text-[var(--riff-text-faint)]">
                Spotify taste informs personalization. Riff remains the product center.
              </p>
            </>
          ) : (
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'var(--riff-surface-mid)' }}
            >
              <p className="mb-2 text-[12px] text-[var(--riff-text-muted)]">
                Connect Spotify to use playlist-based tuning
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-[#1db954]/30 px-3 text-[12px] font-semibold text-[#1db954] hover:bg-[#1db954]/10"
                onClick={() => onConnectSpotify?.()}
              >
                Connect Spotify
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
