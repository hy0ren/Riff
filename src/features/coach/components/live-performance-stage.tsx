/**
 * LivePerformanceStage — UI Layer
 *
 * The center panel of the Coach page. Displays:
 * - A real-time frequency visualizer driven by the AudioCaptureService's AnalyserNode
 * - Current section, lyrics or chords from the actual TrackVersion domain object
 * - A live session timer
 * - Transport controls (Start/Pause/Stop)
 *
 * This component NEVER calls getUserMedia or accesses WebSockets.
 * It reads frequency data from the AnalyserNode supplied by the Orchestrator.
 *
 * Per coach_architecture.md §3A and §5 (latency masking).
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Project, ProjectVersion } from '@/domain/project'
import type { PracticeMode, SessionState } from '../types/practice-session'
import { Play, Pause, Square, Mic, Volume2, ShieldAlert } from 'lucide-react'
import { useDevicePermissionsStore } from '@/lib/platform/permissions/use-device-permissions-store'
import { Button } from '@/components/ui/button'

interface LivePerformanceStageProps {
  project: Project
  version: ProjectVersion | undefined
  sessionState: SessionState
  practiceMode: PracticeMode
  sessionDuration: number
  analyserNode: AnalyserNode | null
  errorMessage: string | null
  isReconnecting: boolean
  onStart: () => void
  onPause: () => void
  onStop: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

// ---------------------------------------------------------------------------
// Visualizer Canvas Hook
// ---------------------------------------------------------------------------

function useFrequencyVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  analyserNode: AnalyserNode | null,
  isActive: boolean,
) {
  const rafRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    if (!analyserNode || !isActive) {
      // Draw a flat idle line
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
      rafRef.current = requestAnimationFrame(draw)
      return
    }

    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserNode.getByteFrequencyData(dataArray)

    const barWidth = width / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height

      // Gradient from accent blue to purple based on frequency position
      const hue = 210 + (i / bufferLength) * 60
      const alpha = 0.6 + (dataArray[i] / 255) * 0.4
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`

      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
      x += barWidth
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [canvasRef, analyserNode, isActive])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [draw])
}

// ---------------------------------------------------------------------------
// Lyrics / Chord display
// ---------------------------------------------------------------------------

function LyricsDisplay({ version, selectedSection }: { version: ProjectVersion | undefined; selectedSection?: string }) {
  const lyricsSection = version?.lyrics?.find(
    (l) => l.label === selectedSection || (!selectedSection && version.lyrics?.[0]?.label),
  ) ?? version?.lyrics?.[0]

  if (!lyricsSection) {
    return (
      <div className="space-y-2 text-center">
        <p className="font-display text-xl text-[var(--riff-text-faint)]">No lyrics available</p>
        <p className="text-sm text-[var(--riff-text-faint)]">Add lyrics in the Studio Blueprint editor</p>
      </div>
    )
  }

  const lines = lyricsSection.lines
  const midLine = Math.floor(lines.length / 2)

  return (
    <div className="space-y-3 text-center">
      {lines.length > 1 && (
        <p className="font-display text-xl text-[var(--riff-text-faint)] blur-[1.5px]">
          {lines[midLine - 1] ?? ''}
        </p>
      )}
      <p className="font-display text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
        {lines[midLine]}
      </p>
      {lines.length > 1 && (
        <p className="font-display text-xl text-[var(--riff-text-faint)] blur-[1.5px]">
          {lines[midLine + 1] ?? ''}
        </p>
      )}
    </div>
  )
}

function ChordsDisplay({ version, selectedSection }: { version: ProjectVersion | undefined; selectedSection?: string }) {
  const section = version?.structure?.find((s) => s.label === selectedSection) ?? version?.structure?.[0]

  if (!section?.chords?.length) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-[var(--riff-text-faint)]">No chord data</p>
        <p className="text-sm text-[var(--riff-text-faint)]">Add chords in the Studio Blueprint editor</p>
      </div>
    )
  }

  const chords = section.chords
  const midIdx = Math.floor(chords.length / 2)

  return (
    <div
      className="flex items-center justify-center gap-8 rounded-2xl px-14 py-8"
      style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      {midIdx > 0 && (
        <span className="font-display text-3xl font-medium text-[var(--riff-text-faint)] opacity-40">
          {chords[midIdx - 1]}
        </span>
      )}
      <span className="font-display text-6xl font-black text-[var(--riff-accent-light)] drop-shadow-[0_0_20px_rgba(18,117,226,0.3)] px-3">
        {chords[midIdx]}
      </span>
      {midIdx < chords.length - 1 && (
        <span className="font-display text-3xl font-medium text-[var(--riff-text-muted)] opacity-80">
          {chords[midIdx + 1]}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LivePerformanceStage({
  version,
  sessionState,
  practiceMode,
  sessionDuration,
  analyserNode,
  errorMessage,
  isReconnecting,
  onStart,
  onPause,
  onStop,
}: LivePerformanceStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { 
    microphoneStatus, 
    checkMicrophonePermission, 
    requestMicrophonePermission,
    startVisibilityWatcher,
  } = useDevicePermissionsStore()

  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    void checkMicrophonePermission()
    const cleanup = startVisibilityWatcher()
    return cleanup
  }, [checkMicrophonePermission, startVisibilityWatcher])

  const isActive = sessionState === 'listening' || sessionState === 'coaching'
  const isConnecting = sessionState === 'connecting' || sessionState === 'finalizing'

  const activeSection = version?.structure?.find((s) => s.label === 'Chorus') ?? version?.structure?.[0]

  useFrequencyVisualizer(canvasRef, analyserNode, isActive)

  const handleRequestMicrophone = async () => {
    setIsRequesting(true)
    await requestMicrophonePermission()
    setIsRequesting(false)
  }

  const handleMainButton = () => {
    if (microphoneStatus !== 'granted') {
      void handleRequestMicrophone()
      return
    }

    if (sessionState === 'idle' || sessionState === 'error') onStart()
    else if (sessionState === 'paused') onStart()
    else if (isActive) onPause()
  }

  const showVocalDisplay = practiceMode === 'vocal' || practiceMode === 'humming'
  const permissionDenied = microphoneStatus === 'denied'
  const needsPermission = microphoneStatus === 'prompt' || permissionDenied

  return (
    <div className="relative z-10 flex flex-1 flex-col px-10 py-8">
      {/* Top Bar: Timer & Mode */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-5">
          {/* Session Timer */}
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--riff-text-muted)]">
            <span
              className={`h-2 w-2 rounded-full transition-all duration-500 ${
                isActive
                  ? 'bg-[var(--riff-accent)] shadow-[0_0_8px_rgba(18,117,226,0.7)]'
                  : isConnecting
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse'
                  : 'bg-[var(--riff-surface-highest)]'
              }`}
            />
            <span className="font-bold tracking-widest uppercase">
              {isConnecting ? 'Connecting...' : formatDuration(sessionDuration)}
            </span>
          </div>

          {/* Active Section Badge */}
          {activeSection && (
            <div
              className="hidden rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--riff-text-faint)] lg:block"
              style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              {activeSection.label}
              {activeSection.startTime != null && (
                <span className="ml-1.5 opacity-60">
                  @ {Math.floor(activeSection.startTime / 60)}:{String(activeSection.startTime % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Practice Mode Badge */}
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--riff-text-primary)]"
          style={{ background: 'var(--riff-surface-high)' }}
        >
          {showVocalDisplay
            ? <Mic className="h-4 w-4 text-[var(--riff-accent-light)]" />
            : <Volume2 className="h-4 w-4 text-emerald-400" />
          }
          <span className="capitalize">{practiceMode} Practice</span>
        </div>
      </div>

      {/* Practice Content / Permission / Error Overlays */}
      <div className="relative mt-8 flex flex-1 flex-col items-center justify-center gap-10">
        {needsPermission && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--riff-surface-mid)]/90 backdrop-blur-md rounded-3xl border border-white/5 animate-in fade-in zoom-in duration-300">
            <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20 mb-4">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white text-center">
              Microphone Access Required
            </h3>
            <p className="mt-2 text-sm text-[var(--riff-text-muted)] text-center max-w-sm px-4">
              The Riff Coach needs your microphone to listen to your performance and provide real-time musical feedback.
            </p>
            <div className="mt-8 flex flex-col gap-3 w-full max-w-[240px]">
              <Button 
                onClick={() => void handleRequestMicrophone()}
                disabled={isRequesting}
                className="w-full bg-[var(--riff-accent)] hover:bg-[var(--riff-accent-light)] text-white h-12 rounded-xl"
              >
                {isRequesting ? 'Permitting...' : permissionDenied ? 'Check OS Settings' : 'Allow Microphone'}
              </Button>
              {permissionDenied && (
                <p className="text-[10px] text-center text-destructive/80 font-medium">
                  Permissions were denied. Please enable them in your system settings.
                </p>
              )}
            </div>
          </div>
        )}

        {sessionState === 'error' && !needsPermission && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--riff-surface-mid)]/90 backdrop-blur-md rounded-3xl border border-white/5 animate-in fade-in zoom-in duration-300">
            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <ShieldAlert className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white text-center">
              Session Disconnected
            </h3>
            <p className="mt-2 text-sm text-[var(--riff-text-muted)] text-center max-w-sm px-4">
              {errorMessage ?? 'The coaching session ended unexpectedly.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 w-full max-w-[240px]">
              <Button
                onClick={onStart}
                className="w-full bg-[var(--riff-accent)] hover:bg-[var(--riff-accent-light)] text-white h-12 rounded-xl"
              >
                Start New Session
              </Button>
            </div>
          </div>
        )}

        {isReconnecting && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-amber-300 animate-in fade-in slide-in-from-top-2"
               style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Reconnecting to coach...
          </div>
        )}

        <div className={`flex flex-col items-center justify-center text-center transition-all duration-500 ${needsPermission ? 'opacity-20 blur-sm scale-95' : 'opacity-100'}`}>
          {showVocalDisplay ? (
            <LyricsDisplay version={version} />
          ) : (
            <ChordsDisplay version={version} />
          )}
        </div>

        {/* Frequency Visualizer */}
        <div className={`relative flex h-28 w-full max-w-3xl items-center justify-center overflow-hidden rounded-xl transition-all duration-500 ${needsPermission ? 'opacity-20 blur-sm scale-95' : 'opacity-100'}`}
          style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <canvas
            ref={(el) => {
              canvasRef.current = el
              if (el) {
                el.width = el.offsetWidth
                el.height = el.offsetHeight
              }
            }}
            className="h-full w-full"
            style={{ display: 'block' }}
          />

          {/* "Great Timing" live feedback tag — shown when listening */}
          {isActive && (
            <div
              className="absolute bottom-2 right-3 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              {sessionState === 'coaching' ? 'Coach Speaking' : 'Listening'}
            </div>
          )}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex shrink-0 items-center justify-center gap-5 pb-2">
        {/* Stop button */}
        <button
          onClick={onStop}
          disabled={sessionState === 'idle' || isConnecting || needsPermission}
          title="End session"
          className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--riff-text-muted)] transition-colors hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <Square className="h-4 w-4 fill-current" />
        </button>

        {/* Main play/pause */}
        <button
          onClick={handleMainButton}
          disabled={isConnecting}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isActive
              ? 'var(--riff-surface-high)'
              : 'var(--riff-accent)',
            border: isActive ? '3px solid var(--riff-accent)' : '3px solid transparent',
            boxShadow: isActive
              ? '0 0 30px rgba(18,117,226,0.3)'
              : '0 0 20px rgba(18,117,226,0.2)',
          }}
        >
          {isActive
            ? <Pause className="h-7 w-7 fill-current text-[var(--riff-accent-light)]" />
            : <Play className="ml-1 h-7 w-7 fill-current text-white" />
          }
        </button>

        {/* Spacer to balance layout */}
        <div className="h-11 w-11" />
      </div>
    </div>
  )
}
