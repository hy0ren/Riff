import type { SessionState } from '../types/practice-session'
import type { LiveFeedbackEvent } from '@/domain/providers'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, MessageSquare, CheckCircle2, History } from 'lucide-react'

interface CoachTranscriptPanelProps {
  sessionState: SessionState
  feedbackEvents: LiveFeedbackEvent[]
}

export function CoachTranscriptPanel({ sessionState, feedbackEvents }: CoachTranscriptPanelProps) {
  const isCoaching = sessionState === 'coaching'
  const isAnalyzing = sessionState === 'analyzing'
  const latestEvent = feedbackEvents[0]
  const historicalEvents = feedbackEvents.slice(1)
  
  return (
    <div className="flex flex-1 flex-col overflow-hidden p-5">
      
      {/* Coach Orb */}
      <div
        className="flex shrink-0 flex-col items-center pb-6 pt-6"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="relative flex h-28 w-28 items-center justify-center">
          {/* Base orb */}
          <div
            className="h-18 w-18 rounded-full shadow-xl transition-all duration-700"
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, var(--riff-accent), #8b5cf6)',
              transform: isCoaching ? 'scale(1.1)' : 'scale(1)',
              boxShadow: isCoaching
                ? '0 0 40px rgba(18,117,226,0.5)'
                : '0 0 15px rgba(18,117,226,0.15)',
            }}
          />
          
          {/* Analyzing ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--riff-accent)] transition-all duration-1000"
            style={{
              transform: isAnalyzing ? 'scale(1.2)' : 'scale(1)',
              opacity: isAnalyzing ? 0.5 : 0,
              animation: isAnalyzing ? 'spin 8s linear infinite' : 'none',
            }}
          />
          
          {/* Coaching pulse */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-[2000ms]"
            style={{
              background: 'var(--riff-accent)',
              transform: isCoaching ? 'scale(1.8)' : 'scale(1)',
              opacity: isCoaching ? 0.08 : 0,
            }}
          />
        </div>
        
        <h3 className="mt-5 font-display text-base font-bold text-[var(--riff-text-primary)] tracking-tight">
          Riff Coach
        </h3>
        <p className="mt-1 min-h-[16px] text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--riff-text-faint)]">
          {sessionState === 'error'
            ? 'Connection Error'
            : isCoaching
              ? 'Speaking...'
              : isAnalyzing
                ? 'Analyzing Input...'
                : 'Listening Active'}
        </p>
      </div>

      {/* Transcript Stream */}
      <ScrollArea className="flex-1 pt-5">
        <div className="space-y-5 pr-2 pb-4">
          
          {/* Live feedback bubble */}
          <div
            className="flex gap-3.5 transition-all duration-500"
            style={{
              opacity: isCoaching ? 1 : 0,
              transform: isCoaching ? 'translateY(0)' : 'translateY(12px)',
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
                Live Feedback
              </span>
              <p className="mt-1 font-display text-sm italic leading-relaxed text-[var(--riff-text-primary)]">
                {latestEvent
                  ? `"${latestEvent.text}"`
                  : '"Start rehearsal to receive live coaching feedback."'}
              </p>
            </div>
          </div>

          {/* History divider */}
          <div className="flex items-center gap-3 opacity-40">
            <div className="h-px flex-1 bg-[var(--riff-surface-highest)]" />
            <History className="h-3 w-3 text-[var(--riff-text-faint)]" />
            <div className="h-px flex-1 bg-[var(--riff-surface-highest)]" />
          </div>

          {/* Historical entries */}
          {historicalEvents.length ? (
            historicalEvents.map((event, index) => (
              <div key={event.id} className="flex gap-3.5 opacity-70">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--riff-surface-high)' }}
                >
                  {index % 2 === 0 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Activity className="h-3.5 w-3.5 text-amber-500" />
                  )}
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
            <div className="flex gap-3.5 opacity-70">
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
                  Connect your Live session and rehearse to build a feedback history here.
                </p>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

    </div>
  )
}
