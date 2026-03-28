import { create } from 'zustand'

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown'

interface DevicePermissionsState {
  microphoneStatus: PermissionStatus
  devices: MediaDeviceInfo[]
  inputDevices: MediaDeviceInfo[]
  outputDevices: MediaDeviceInfo[]
  hasScanned: boolean
  isScanning: boolean
  lastCheckedAt: string | null

  checkMicrophonePermission: () => Promise<PermissionStatus>
  requestMicrophonePermission: () => Promise<PermissionStatus>
  scanDevices: () => Promise<void>
  startVisibilityWatcher: () => () => void
}

export const useDevicePermissionsStore = create<DevicePermissionsState>((set, get) => ({
  microphoneStatus: 'unknown',
  devices: [],
  inputDevices: [],
  outputDevices: [],
  hasScanned: false,
  isScanning: false,
  lastCheckedAt: null,

  checkMicrophonePermission: async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      set({ microphoneStatus: result.state, lastCheckedAt: new Date().toISOString() })

      result.addEventListener('change', () => {
        set({ microphoneStatus: result.state, lastCheckedAt: new Date().toISOString() })
        if (result.state === 'granted') {
          void get().scanDevices()
        }
      })

      return result.state
    } catch {
      return 'unknown'
    }
  },

  requestMicrophonePermission: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())

      set({ microphoneStatus: 'granted', lastCheckedAt: new Date().toISOString() })
      void get().scanDevices()
      return 'granted'
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
        set({ microphoneStatus: 'denied', lastCheckedAt: new Date().toISOString() })
        return 'denied'
      }
      if (e instanceof DOMException && e.name === 'NotFoundError') {
        set({ microphoneStatus: 'denied', lastCheckedAt: new Date().toISOString() })
        return 'denied'
      }
      return 'unknown'
    }
  },

  scanDevices: async () => {
    if (get().isScanning) return

    set({ isScanning: true })
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      set({
        devices,
        inputDevices: devices.filter((d) => d.kind === 'audioinput'),
        outputDevices: devices.filter((d) => d.kind === 'audiooutput'),
        hasScanned: true,
      })
    } catch {
      // Device enumeration failure is non-fatal
    } finally {
      set({ isScanning: false })
    }
  },

  startVisibilityWatcher: () => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        void get().checkMicrophonePermission()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  },
}))
