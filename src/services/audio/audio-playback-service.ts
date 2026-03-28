/**
 * AudioPlaybackService — Audio Infrastructure Layer
 *
 * Manages mixing and playback of:
 *  1. The local backing track (the generated song)
 *  2. The remote Coach TTS audio (from the Live API)
 *
 * Implements "ducking" — automatically lowers the backing track while
 * the Coach is speaking to prevent the voice from being drowned out and
 * to avoid microphone feedback loops.
 *
 * Per coach_architecture.md §3C.
 */

const DUCK_VOLUME = 0.15
const FULL_VOLUME = 1.0
const UNDUCK_RAMP_MS = 300

export class AudioPlaybackService {
  private audioContext: AudioContext | null = null
  private backingTrackGain: GainNode | null = null
  private coachVoiceGain: GainNode | null = null
  private masterAnalyser: AnalyserNode | null = null
  private coachSourceNodes: AudioBufferSourceNode[] = []
  private backingTrackSource: AudioBufferSourceNode | null = null

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  private _ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
      this.backingTrackGain = this.audioContext.createGain()
      this.coachVoiceGain = this.audioContext.createGain()
      this.masterAnalyser = this.audioContext.createAnalyser()
      this.masterAnalyser.fftSize = 256

      this.backingTrackGain.connect(this.masterAnalyser)
      this.coachVoiceGain.connect(this.masterAnalyser)
      this.masterAnalyser.connect(this.audioContext.destination)

      this.backingTrackGain.gain.value = FULL_VOLUME
      this.coachVoiceGain.gain.value = FULL_VOLUME
    }
    return this.audioContext
  }

  dispose(): void {
    this.flushCoachQueue()
    this.backingTrackSource?.stop()
    this.backingTrackSource = null

    const ctx = this.audioContext
    this.audioContext = null
    this.backingTrackGain = null
    this.coachVoiceGain = null
    this.masterAnalyser = null
    this.coachSourceNodes = []

    if (ctx) {
      setTimeout(() => void ctx.close(), 100)
    }
  }

  // ---------------------------------------------------------------------------
  // Ducking
  // ---------------------------------------------------------------------------

  /**
   * Lowers the backing track volume immediately.
   * Call when the Coach starts speaking.
   */
  duck(): void {
    const ctx = this._ensureContext()
    if (!this.backingTrackGain) return
    this.backingTrackGain.gain.cancelScheduledValues(ctx.currentTime)
    this.backingTrackGain.gain.setValueAtTime(DUCK_VOLUME, ctx.currentTime)
  }

  /**
   * Restores the backing track volume with a smooth ramp.
   * Call when the Coach stops speaking or is interrupted.
   */
  unduck(): void {
    const ctx = this._ensureContext()
    if (!this.backingTrackGain) return
    const rampSeconds = UNDUCK_RAMP_MS / 1000
    this.backingTrackGain.gain.cancelScheduledValues(ctx.currentTime)
    this.backingTrackGain.gain.setValueAtTime(this.backingTrackGain.gain.value, ctx.currentTime)
    this.backingTrackGain.gain.linearRampToValueAtTime(FULL_VOLUME, ctx.currentTime + rampSeconds)
  }

  // ---------------------------------------------------------------------------
  // Coach TTS
  // ---------------------------------------------------------------------------

  /**
   * Decodes and enqueues a base64 PCM chunk from the Live API for immediate playback.
   */
  async enqueueCoachAudio(base64: string): Promise<void> {
    const ctx = this._ensureContext()
    if (!this.coachVoiceGain) return

    try {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      // Live API sends PCM16 at 24kHz for audio responses
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer)
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.coachVoiceGain)

      source.onended = () => {
        const idx = this.coachSourceNodes.indexOf(source)
        if (idx !== -1) this.coachSourceNodes.splice(idx, 1)
      }

      this.coachSourceNodes.push(source)
      source.start()
    } catch {
      // Decode failures are non-fatal — just drop the chunk
    }
  }

  /**
   * Immediately stops all in-progress Coach TTS playback.
   * Called when barge-in is detected.
   */
  flushCoachQueue(): void {
    for (const node of this.coachSourceNodes) {
      try {
        node.stop()
        node.disconnect()
      } catch {
        // Already stopped
      }
    }
    this.coachSourceNodes = []
  }

  // ---------------------------------------------------------------------------
  // Visualizer
  // ---------------------------------------------------------------------------

  /**
   * Returns the master AnalyserNode for frequency-based UI visualizations.
   * Components poll this via requestAnimationFrame.
   */
  getAnalyserNode(): AnalyserNode | null {
    this._ensureContext()
    return this.masterAnalyser
  }
}
