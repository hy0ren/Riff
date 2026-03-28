/**
 * CoachTranscriptPanel — UI Layer
 *
 * Displays the Coach orb, real-time transcript stream, and session feedback history.
 * Adapts its visual state based on SessionState from the Orchestrator.
 *
 * Per coach_architecture.md §3A.
 */

import { useEffect, useRef } from 'react'
import type { SessionState } from '../types/practice-session'
import type { LiveFeedbackEvent } from '@/domain/providers'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, MessageSquare, CheckCircle2, History, Loader2 } from 'lucide-react'

interface CoachTranscriptPanelProps {
  sessionState: SessionState
  feedbackEvents: LiveFeedbackEvent[]
  sessionDuration: number
  rawTranscript: string
}

// ---------------------------------------------------------------------------
// Status label helper
// ---------------------------------------------------------------------------

function getStatusLabel(state: SessionState): string {
  switch (state) {
    case 'connecting':   return 'Connecting...'
    case 'listening':    return 'Listening...'
    case 'analyzing':    return 'Analyzing Input...'
    case 'coaching':     return 'Speaking...'
    case 'paused':       return 'Paused'
    case 'finalizing':   return 'Saving Session...'
    case 'error':        return 'Connection Error'
    default:             return 'Ready'
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Coach Orb
// ---------------------------------------------------------------------------

function CoachOrb({ sessionState }: { sessionState: SessionState }) {
  const isCoaching  = sessionState === 'coaching'
  const isAnalyzing = sessionState === 'analyzing'
  const isConnecting = sessionState === 'connecting' || sessionState === 'finalizing'
  const isListening  = sessionState === 'listening'
  const isError      = sessionState === 'error'

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {/* Outer pulse ring — coaching */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-[2000ms]"
        style={{
          background: isError ? '#ef4444' : 'var(--riff-accent)',
          transform: isCoaching ? 'scale(1.8)' : 'scale(1)',
          opacity: isCoaching ? 0.08 : 0,
        }}
      />

      {/* Rotating dashed ring — analyzing/connecting */}
      {(isAnalyzing || isConnecting) && (
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed animate-spin"
          style={{
            borderColor: isConnecting ? 'rgba(251,191,36,0.5)' : 'rgba(18,117,226,0.5)',
            animationDuration: '3s',
          }}
        />
      )}

      {/* Steady glow ring — listening */}
      <div
        className="absolute inset-0 rounded-full border transition-all duration-700"
        style={{
          borderColor: isListening ? 'rgba(18,117,226,0.4)' : 'transparent',
          boxShadow: isListening ? '0 0 20px rgba(18,117,226,0.15)' : 'none',
        }}
      />

      {/* Core orb */}
      <div
        className="rounded-full shadow-xl transition-all duration-700"
        style={{
          width: 72,
          height: 72,
          background: isError
            ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
            : isConnecting
            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
            : 'linear-gradient(135deg, var(--riff-accent), #8b5cf6)',
          transform: isCoaching ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isCoaching
            ? '0 0 40px rgba(18,117,226,0.5)'
            : isListening
            ? '0 0 20px rgba(18,117,226,0.25)'
            : '0 0 10px rgba(18,117,226,0.1)',
        }}
      >
        {/* Loading spinner overlay for connecting state */}
        {isConnecting && (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-white/70" />
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CoachTranscriptPanel({
  sessionState,
  feedbackEvents,
  sessionDuration,
  rawTranscript,
}: CoachTranscriptPanelProps) {
  const isCoaching  = sessionState === 'coaching'
  const latestEvent = feedbackEvents[0]
  const historicalEvents = feedbackEvents.slice(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to top when new feedback arrives
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [feedbackEvents.length])

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-5">

      {/* Coach Orb + Status */}
      <div
        className="flex shrink-0 flex-col items-center pb-6 pt-6"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <CoachOrb sessionState={sessionState} />

        <h3 className="mt-5 font-display text-base font-bold text-[var(--riff-text-primary)] tracking-tight">
          Riff Coach
        </h3>
        <p className="mt-1 min-h-[16px] text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
          {getStatusLabel(sessionState)}
        </p>

        {/* Session timer — visible when active */}
        {sessionDuration > 0 && (
          <p className="mt-1.5 font-mono text-[11px] text-[var(--riff-text-faint)]">
            {formatDuration(sessionDuration)}
          </p>
        )}
      </div>

      {/* Transcript Stream */}
      <ScrollArea className="flex-1 pt-5">
        <div ref={scrollRef} className="space-y-5 pr-2 pb-4">

          {/* Live streaming bubble */}
          <div
            className="flex gap-3.5 transition-all duration-500"
            style={{
              opacity: isCoaching || latestEvent ? 1 : 0.4,
              transform: isCoaching ? 'translateY(0)' : 'translateY(6px)',
            }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(18,117,226,0.12)', border: '1px solid rgba(18,117,226,0.25)' }}
            >
              <MessageSquare className="h-3.5 w-3.5 text-[var(--riff-accent-light)]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-accent-light)]">
                {isCoaching ? 'Live Feedback' : 'Last Feedback'}
              </span>
              <p className="mt-1 font-display text-sm italic leading-relaxed text-[var(--riff-text-primary)]">
                {latestEvent
                  ? `"${latestEvent.text}"`
                  : '"Start rehearsal to receive live coaching feedback."'}
              </p>

              {/* Partial streaming indicator (text is still incoming) */}
              {isCoaching && !latestEvent && rawTranscript && (
                <p className="mt-1 text-xs text-[var(--riff-text-faint)] animate-pulse">
                  {rawTranscript.slice(-120)}
                  <span className="ml-0.5 inline-block h-3 w-0.5 bg-[var(--riff-accent)] animate-blink" />
                </p>
              )}
            </div>
          </div>

          {/* History divider */}
          {historicalEvents.length > 0 && (
            <div className="flex items-center gap-3 opacity-40">
              <div className="h-px flex-1 bg-[var(--riff-surface-highest)]" />
              <History className="h-3 w-3 text-[var(--riff-text-faint)]" />
              <div className="h-px flex-1 bg-[var(--riff-surface-highest)]" />
            </div>
          )}

          {/* Historical feedback */}
          {historicalEvents.length > 0 ? (
            historicalEvents.map((event, index) => (
              <div key={event.id} className="flex gap-3.5 opacity-70">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--riff-surface-high)' }}
                >
                  {index % 2 === 0
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    : <Activity className="h-3.5 w-3.5 text-amber-500" />
                  }
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                    "{event.text}"
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex gap-3.5 opacity-50">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--riff-surface-high)' }}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
                  Waiting for first pass
                </span>
                <p className="mt-1 text-sm leading-relaxed text-[var(--riff-text-secondary)]">
                  Start rehearsing to build a feedback history here.
                </p>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>
    </div>
  )
}
