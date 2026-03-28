/**
 * AudioCaptureService — Audio Infrastructure Layer
 *
 * Manages the user's microphone. Captures PCM audio, formats it to 16kHz,
 * and streams base64-encoded chunks to the provided callback.
 *
 * This class is NEVER imported by React components. Only the Orchestrator calls it.
 * The UI reads frequency data via getAnalyserNode() to drive visualizers.
 *
 * Per coach_architecture.md §3C.
 */

const SAMPLE_RATE = 16000
const BUFFER_SIZE = 4096 // ~256ms at 16kHz

export class AudioCaptureService {
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private scriptProcessor: ScriptProcessorNode | null = null
  private analyserNode: AnalyserNode | null = null
  private onChunkCallback: ((base64: string) => void) | null = null
  private isRunning = false

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Requests microphone access and begins streaming audio chunks.
   * @param onChunk - Called for each PCM chunk, base64-encoded at 16kHz.
   */
  async start(onChunk: (base64: string) => void): Promise<void> {
    if (this.isRunning) return

    this.onChunkCallback = onChunk
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: SAMPLE_RATE,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })

    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
    this.analyserNode = this.audioContext.createAnalyser()
    this.analyserNode.fftSize = 256

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
    this.sourceNode.connect(this.analyserNode)

    // ScriptProcessorNode is deprecated but widely supported in Tauri/WebView.
    // An AudioWorklet migration can replace this later without changing the interface.
    this.scriptProcessor = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1)
    this.scriptProcessor.onaudioprocess = (event) => {
      if (!this.isRunning) return
      const float32 = event.inputBuffer.getChannelData(0)
      const base64 = this._float32ToBase64Pcm16(float32)
      this.onChunkCallback?.(base64)
    }

    this.analyserNode.connect(this.scriptProcessor)
    this.scriptProcessor.connect(this.audioContext.destination)
    this.isRunning = true
  }

  /**
   * Stops microphone capture and releases all hardware resources.
   */
  stop(): void {
    this.isRunning = false

    this.scriptProcessor?.disconnect()
    this.analyserNode?.disconnect()
    this.sourceNode?.disconnect()

    this.mediaStream?.getTracks().forEach((t) => t.stop())

    this.scriptProcessor = null
    this.analyserNode = null
    this.sourceNode = null
    this.mediaStream = null
    this.onChunkCallback = null

    // Close AudioContext on a delay to avoid cuts on fast start/stop cycles
    const ctx = this.audioContext
    this.audioContext = null
    if (ctx) {
      setTimeout(() => void ctx.close(), 100)
    }
  }

  /**
   * Returns the AnalyserNode for UI frequency visualization.
   * Components poll this node via requestAnimationFrame — they never call getUserMedia.
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode
  }

  get running(): boolean {
    return this.isRunning
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /**
   * Converts a Float32Array of audio samples to a base64-encoded PCM Int16 string.
   * The Gemini Live API expects 16-bit PCM at 16kHz.
   */
  private _float32ToBase64Pcm16(float32: Float32Array): string {
    const pcm16 = new Int16Array(float32.length)
    for (let i = 0; i < float32.length; i++) {
      const clamped = Math.max(-1, Math.min(1, float32[i]))
      pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
    }

    // Convert Int16Array bytes to base64
    const bytes = new Uint8Array(pcm16.buffer)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    return btoa(binary)
  }
}
