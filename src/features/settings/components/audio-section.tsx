import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDevicePermissionsStore } from '@/lib/platform/permissions/use-device-permissions-store'

const rowStyle = {
  background: 'var(--riff-surface-low)',
  border: '1px solid rgba(255,255,255,0.04)',
} as const

function ValuePill({ children }: { children: ReactNode }) {
  return (
    <div
      className="max-w-[min(100%,280px)] truncate rounded-lg border border-white/[0.04] px-3 py-1.5 text-sm text-[var(--riff-text-primary)]"
      style={{ background: 'var(--riff-surface-mid)' }}
    >
      {children}
    </div>
  )
}

function DeviceListValue({
  devices,
  hasScanned,
  isScanning,
}: {
  devices: MediaDeviceInfo[]
  hasScanned: boolean
  isScanning: boolean
}) {
  if (isScanning) {
    return (
      <ValuePill>
        <span className="text-[var(--riff-text-muted)]">Scanning...</span>
      </ValuePill>
    )
  }
  if (hasScanned && devices.length === 0) {
    return (
      <ValuePill>
        <span className="text-[var(--riff-text-muted)]">No devices found</span>
      </ValuePill>
    )
  }
  if (devices.length > 0) {
    return (
      <div className="flex max-w-[min(100%,280px)] flex-col items-end gap-1.5">
        {devices.map((d) => (
          <ValuePill key={d.deviceId}>
            {d.label?.trim() ? d.label : 'Unnamed device'}
          </ValuePill>
        ))}
      </div>
    )
  }
  return null
}

export function AudioSection() {
  const {
    microphoneStatus,
    checkMicrophonePermission,
    requestMicrophonePermission,
    inputDevices,
    outputDevices,
    hasScanned,
    isScanning,
    scanDevices,
  } = useDevicePermissionsStore()

  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await checkMicrophonePermission()
      if (!cancelled) {
        await scanDevices()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [checkMicrophonePermission, scanDevices])

  const handleRequestMicrophone = async () => {
    if (microphoneStatus === 'granted') return
    setIsRequesting(true)
    await requestMicrophonePermission()
    setIsRequesting(false)
  }

  const badgeProps = {
    granted: {
      className: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-400',
      label: 'Granted'
    },
    denied: {
      className: 'border-destructive/35 bg-destructive/15 text-destructive',
      label: 'Denied'
    },
    prompt: {
      className: 'border-yellow-500/35 bg-yellow-500/15 text-yellow-400',
      label: 'Not granted'
    },
    unknown: {
      className: 'border-[var(--riff-text-muted)] bg-[var(--riff-surface-mid)] text-[var(--riff-text-secondary)]',
      label: 'Unknown'
    }
  }

  const badgeConfig = badgeProps[microphoneStatus] || badgeProps.unknown

  return (
    <section id="audio" className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--riff-text-primary)]">
          Audio
        </h3>
        <p className="mt-1 text-[12px] text-[var(--riff-text-muted)]">
          Input, output, and coaching audio preferences
        </p>
      </div>

      <div className="space-y-2">
        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">
              Microphone permission
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
              Required for practice capture and voice coaching
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className={`border ${badgeConfig.className}`} variant="outline">
              {badgeConfig.label}
            </Badge>
            {microphoneStatus !== 'granted' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => void handleRequestMicrophone()}
                disabled={isRequesting}
              >
                {microphoneStatus === 'denied' ? 'Check OS Settings' : 'Request Access'}
              </Button>
            )}
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Audio input device</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">Microphone used for recording</p>
          </div>
          <DeviceListValue
            devices={inputDevices}
            hasScanned={hasScanned}
            isScanning={isScanning}
          />
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Audio output device</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">Playback destination for previews and radio</p>
          </div>
          <DeviceListValue
            devices={outputDevices}
            hasScanned={hasScanned}
            isScanning={isScanning}
          />
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Coach feedback voice</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">Voice used for coaching prompts</p>
          </div>
          <ValuePill>Default</ValuePill>
        </div>

        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={rowStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--riff-text-primary)]">Practice sensitivity</p>
            <p className="mt-0.5 text-[12px] text-[var(--riff-text-muted)]">
              How strictly timing and pitch are evaluated
            </p>
          </div>
          <ValuePill>Medium</ValuePill>
        </div>
      </div>
    </section>
  )
}
