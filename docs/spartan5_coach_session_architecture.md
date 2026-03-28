# Spartan 5: Live API / Coach Session Architecture

**Status:** Canonical — supersedes `coach_architecture.md`

This document defines the complete architecture for the Coach / Practice subsystem in Riff Radio. It specifies how the live, real-time, session-based experience should function as a dedicated architectural subsystem with clean boundaries between persistent project data, transient live session state, audio input/output handling, WebSocket transport, and spoken coaching behavior.

---

## 1. Coach as a Dedicated Subsystem

### Why Coach needs its own architecture

Coach / Practice is not a page that fetches data and renders it. It is a live, bidirectional, session-scoped subsystem that manages concurrent WebSocket connections, microphone hardware, audio playback mixing, and real-time spoken feedback. These concerns are fundamentally different from request/response page logic.

Ordinary frontend pages read persisted data, render UI, and write back on user action. Coach, by contrast, maintains a continuous open session with live audio streaming in both directions, real-time state transitions driven by external events (model speech, barge-in detection, connection loss), and hardware resources (microphone, audio output) that must be explicitly acquired and released.

This means Coach requires:
- An explicit session lifecycle with defined states and transitions
- Module-level service singletons that outlive React render cycles
- Separation between transport state (WebSocket), audio state (mic/playback), and coaching state (feedback, transcript, session progress)
- Its own persistence boundary for practice history that is independent of Studio's generation pipeline

### How Coach connects to the rest of the product

Coach reads from the project/version graph. It never writes to it.

| System | Relationship to Coach |
|---|---|
| Studio | Creates the song. Coach practices it. No runtime coupling. |
| Track Details | Explains the song. Coach may use the same version metadata for context. No shared runtime state. |
| Project Store | Coach reads `PersistedProject`, `Blueprint`, `TrackVersion`, structure, and lyrics. Coach never modifies these. |
| Library | Library shows practice session counts. Coach writes these counts via the persistence layer, not by touching the Library store. |
| Playback Store | Coach uses its own `AudioPlaybackService`, separate from the global playback system. They share the hardware device but not the audio graph. |

Coach accesses project context through `useProjectStore` selectors and route parameters (`projectId`, `versionId`). It does not import from `useStudioStore` or couple to Studio page state.

---

## 2. Session Model

### What a session is

A Coach session is a temporal container representing a single practice attempt against a specific song context. It begins when the user initiates a connection (explicitly or on page mount), and ends when the user stops or the connection is terminated.

### Session identity

A session is defined by:
- `targetProjectId` — the project being practiced
- `targetVersionId` — the specific version being practiced (or the project's active version)
- `selectedSection` — the section in focus (Chorus, Verse, Full Song, etc.)
- `practiceMode` — vocal, humming, guitar, or piano
- `focusArea` — rhythm, pitch, chords, note_accuracy, lyric_delivery, or expression
- `sessionStartedAt` — ISO timestamp
- `practiceBrief` — Gemini-derived guidance context for the session

### What persists after a session

When a session ends with meaningful content (non-empty transcript), the following is persisted as a `PracticeSession` record:

| Field | Source |
|---|---|
| `id` | Generated UUID |
| `projectId` | From session target |
| `versionId` | From session target |
| `mode` | practiceMode at session time |
| `focusArea` | focusArea at session time |
| `selectedSection` | selectedSection at session time |
| `startedAt` | sessionStartedAt |
| `endedAt` | Timestamp at disconnect |
| `summary` | Truncated raw transcript (≤800 chars) or future Gemini-summarized output |
| `metrics` | Optional `PracticeMetricSummary` (rhythm, pitch, chord accuracy, note accuracy scores) |

This record is appended to a localStorage-backed per-project practice history (capped at 50 entries per project). It is the only durable artifact of a session.

### What remains transient

Everything else is ephemeral and discarded when the session ends:
- The active WebSocket connection
- The `AudioCaptureService` instance and its media stream
- The `AudioPlaybackService` instance and its coach audio queue
- The raw transcript accumulator
- The `LiveFeedbackEvent[]` array (capped at 20 most recent)
- The `AnalyserNode` references for visualizers
- The session duration timer
- Any partial text tokens from mid-turn model output

### How a session differs from a project

A project is a permanent creative artifact with versions, blueprints, and generation history. A session is a temporary performance event that references a project but does not modify it. Sessions produce practice summaries; projects produce track versions. These are separate domains with separate persistence strategies.

### Session resumability

Sessions are not resumable across page navigations or app restarts. When the user leaves the Coach page, the session disconnects and finalizes. This is intentional: a live audio session with an open WebSocket and active microphone should not persist as background state. The user starts a new session when they return.

Within a single page visit, however, pause/resume is supported. Pausing releases the microphone and stops the timer. Resuming reacquires the microphone and reconnects audio capture to the existing Live API socket (if still open). If the socket has closed during pause, a new connection is established transparently.

---

## 3. Session Lifecycle

### State machine

```
idle ──────────────────────────────────────────────────────────┐
  │                                                            │
  │ connectSession()                                           │
  v                                                            │
connecting ─── (brief prepared, mic acquired, socket opened) ──│
  │                                                            │
  │ onReady                                                    │
  v                                                            │
listening ◄──── (user performing, mic streaming) ──────────────│
  │     │                                                      │
  │     │ onTextOut                    onInterrupted            │
  │     v                                  │                   │
  │  coaching ── (coach speaking) ─────────┘                   │
  │     │                                                      │
  │     │ pauseSession()                                       │
  │     v                                                      │
  │  paused ── resumeSession() ──► listening                   │
  │                                                            │
  │ disconnectSession()                                        │
  v                                                            │
finalizing ── (persist summary) ──► idle ──────────────────────┘
  │
  │ (or error at any point)
  v
error ── connectSession() ──► connecting
```

### State definitions

| State | Hardware | WebSocket | User can... |
|---|---|---|---|
| `idle` | Released | Closed | Start a session, change config |
| `connecting` | Acquiring | Opening | Wait |
| `listening` | Mic active, streaming | Open, sending audio | Perform, pause, stop, request feedback |
| `analyzing` | Mic active | Open, awaiting response | Wait for coach |
| `coaching` | Mic active, coach speaking | Open, receiving text+audio | Listen, interrupt (barge-in), pause, stop |
| `paused` | Mic released | May be open or closed | Resume, stop, change section/mode/focus |
| `finalizing` | Released | Closing | Wait |
| `error` | Released | Closed | Retry, change config |

### Transition rules

- **idle → connecting**: User action (explicit start or page mount auto-connect). Guard: must have targetProjectId and a resolved project.
- **connecting → listening**: All three systems ready (Gemini brief returned, AudioCaptureService started, LiveConnectionClient connected and setup frame sent).
- **connecting → error**: Any subsystem fails (mic denied, brief generation fails, socket fails to open).
- **listening → coaching**: `onTextOut` fires with model response. Backing track ducks.
- **coaching → listening**: `onInterrupted` fires (barge-in detected). Coach audio flushed, backing track unducks.
- **listening/coaching → paused**: User action. Mic stopped, timer stopped, coach audio flushed.
- **paused → listening**: User action. New AudioCaptureService started, timer resumed. Socket may reconnect if it closed during pause.
- **any active state → finalizing**: User stops the session. All hardware released.
- **finalizing → idle**: Practice summary persisted (or skipped if no transcript).
- **any state → error**: Unrecoverable failure. Hardware released, timer stopped.
- **error → connecting**: User retries.

### What happens during interruptions

The Live API natively supports barge-in. When the user speaks while the coach is talking, the server sends an `interrupted` signal. The architecture responds:

1. `LiveConnectionClient` receives the interrupted payload
2. It calls `handlers.onInterrupted()`
3. The store flushes the `AudioPlaybackService` coach queue (silences the coach immediately)
4. The store unducks the backing track
5. The store transitions to `listening`
6. Audio capture continues uninterrupted — the microphone never stops during barge-in

This makes the coach feel conversational rather than scripted.

### Retries and section restarts

- **Retry same section**: The user can request feedback again via `requestFeedback()`, which sends a text prompt to the active Live session asking for another coaching pass. The session state transitions to `analyzing` → `coaching` when the response arrives.
- **Change section mid-session**: The user can change `selectedSection` while paused. The next `resumeSession()` continues with the new section context. The Live API session retains the full song context from the setup frame, so section-specific coaching notes are requested via text prompts.
- **Change mode or focus mid-session**: Same pattern — pause, change config, resume. The store updates config state, and subsequent text prompts reflect the new focus.

---

## 4. WebSocket / Live API Connection Model

### Architecture layers

The connection architecture has three distinct layers:

**Raw transport** (`src/services/google/live.ts`): Owns the WebSocket lifecycle. Connects to `wss://generativelanguage.googleapis.com/...`, parses JSON frames, exposes `sendSetup`, `sendText`, `sendAudioChunk`, and `close`. Knows nothing about music, coaching, or React.

**Connection client** (`src/services/google/live-connection-client.ts`): Adds session semantics on top of raw transport. Owns connection state (`disconnected` → `connecting` → `connected` → `closing`), reconnect logic (3 attempts with 1.5s/3s/4.5s backoff), song context injection (system instruction assembly), and message routing (text extraction, audio extraction, interruption detection). Knows about `SongContext` and `LiveConnectionHandlers` but not about React or Zustand.

**Orchestrator** (`usePracticeSessionStore`): Coordinates the connection client with audio services and UI state. Owns the mapping between transport events (`onReady`, `onTextOut`, `onAudioOut`, `onInterrupted`, `onError`) and session state transitions. This is the only layer React components observe.

### Connection establishment

1. Orchestrator calls `liveClient.connect(songContext, handlers)`
2. Connection client validates it is in `disconnected` state
3. Connection client calls `connectRawLiveSession()` which opens the WebSocket
4. On WebSocket open, connection client sends the `setup` frame containing:
   - System instruction with full song context (BPM, key, mode, time signature, genre, sections, lyrics, practice brief, session settings)
   - Generation config requesting `['TEXT', 'AUDIO']` response modalities
5. Connection client calls `handlers.onReady()`
6. Orchestrator transitions to `listening` and starts the session timer

### Bidirectional streaming

**Outbound (user → model)**: `AudioCaptureService` produces base64 PCM16 chunks at 16kHz. The orchestrator's chunk callback calls `liveClient.sendAudioChunk(chunk)`. The connection client forwards to `rawSession.sendAudioChunk()`. This is continuous during `listening`, `analyzing`, and `coaching` states.

**Inbound (model → user)**: The connection client receives JSON frames and routes them:
- Interrupted signal → `handlers.onInterrupted()`
- Audio data (inlineData) → `handlers.onAudioOut(base64)`
- Text data (modelTurn.parts[].text) → `handlers.onTextOut(text, isPartial)`

Text and audio can arrive in the same frame. Audio is TTS output from the coach; text is the transcript of what the coach is saying.

### Session configuration

The entire coaching persona and song awareness is established in the single `setup` frame at connection start. There is no subsequent reconfiguration of the system instruction during a session. If the user changes sections or focus areas, new coaching prompts are sent as user text turns via `sendText()`, not as reconfigured system instructions.

### Reconnection strategy

If the WebSocket closes unexpectedly (not via deliberate `close()`):
1. Connection client sets state to `connecting`
2. Schedules reconnect after `1500ms * attemptNumber`
3. On reconnect, opens a new socket and re-sends the full setup frame
4. Up to 3 attempts. On max failures, calls `handlers.onError()` with a clear message.
5. During reconnect, the orchestrator keeps the session in its current state (listening/coaching). Audio capture continues locally. Outbound audio chunks are silently dropped by the connection client (it checks `state === 'connected'` before sending).

### Session expiration and GoAway

The Live API enforces session timeouts. When a session expires, the server closes the connection. The reconnect logic handles this identically to any unexpected close. After 3 failed reconnects, the orchestrator transitions to `error` with a user-facing message explaining that the session timed out.

### Separation of connection state and coaching state

Connection state lives in `LiveConnectionClient.state` (`disconnected` | `connecting` | `connected` | `closing`). Coaching state lives in `usePracticeSessionStore.sessionState` (`idle` | `connecting` | `listening` | `coaching` | `paused` | `finalizing` | `error`). These are independent:

- The socket can be `connected` while the coaching state is `paused` (mic stopped but socket maintained)
- The socket can be `connecting` (reconnecting) while the coaching state is `listening` (audio capture continues locally)
- The socket can be `disconnected` while the coaching state is `finalizing` (writing summary)

This separation prevents transport hiccups from immediately disrupting the user's perceived session state.

---

## 5. Audio Input and Output Architecture

### Overview

Audio is a first-class architectural concern with three independent subsystems:

| Subsystem | Owns | Used by |
|---|---|---|
| `AudioCaptureService` | Microphone, MediaStream, PCM encoding, AnalyserNode | Coach only |
| `AudioPlaybackService` | Coach TTS decoding, backing track mixing, ducking, master analyser | Coach only |
| Global playback (`usePlaybackStore`) | Song playback for Library, Radio, Track Details, Studio preview | Everything except Coach |

Coach audio and global playback never share an audio graph. They may share the physical output device, but their `AudioContext` instances, gain nodes, and analyser nodes are completely separate.

### Microphone / device management

Microphone access is requested through `navigator.mediaDevices.getUserMedia()` inside `AudioCaptureService.start()`. Permission state is tracked separately by `useDevicePermissionsStore` (in `src/lib/platform/permissions/`), which probes permission status on mount and exposes `granted` | `denied` | `prompt` state to the UI.

The `AudioCaptureService` does not check permissions — it attempts to acquire the mic and throws if denied. The orchestrator catches this and transitions to `error`. The UI reads permission state from `useDevicePermissionsStore` to show appropriate guidance before the session starts.

Device enumeration (selecting specific input devices) is modeled in Settings > Audio but currently uses static display. Future implementation should allow device selection via `useDevicePermissionsStore` and pass `deviceId` constraints to `getUserMedia()`.

### Audio capture

`AudioCaptureService` is a stateful class instantiated per session. It:
1. Calls `getUserMedia()` with mono, 16kHz, echo cancellation, and noise suppression
2. Creates a dedicated `AudioContext` at 16kHz sample rate
3. Connects the media stream through `MediaStreamAudioSourceNode` → `AnalyserNode` → `ScriptProcessorNode`
4. Converts Float32 audio samples to Int16 PCM, base64-encodes them, and delivers chunks via callback
5. Exposes its `AnalyserNode` for UI visualizers (frequency data)

On stop, it releases all hardware: stops all media tracks, disconnects all nodes, and closes the AudioContext.

### Audio buffering and streaming

Audio chunks are produced at approximately 256ms intervals (4096 samples at 16kHz). Each chunk is base64-encoded and immediately forwarded to the Live API via the connection client. There is no local buffering or queuing of outbound audio — if the socket is not connected, chunks are silently dropped.

### Live input monitoring and visualization

The `AnalyserNode` from `AudioCaptureService` is exposed to the store as `analyserNode`. UI components in `LivePerformanceStage` poll this node via `requestAnimationFrame` to drive waveform or frequency bar visualizers. The UI never calls `getUserMedia` or touches the audio pipeline directly.

### Reference and guide playback

The `AudioPlaybackService` has a backing track path (backing track gain node connected to the master output), designed for playing the generated song as a reference during practice. The backing track source is architecturally separate from the coach voice path.

Currently, backing track playback is wired but not loaded with actual audio content. Future implementation should:
1. Load the `TrackVersion` audio artifact into a buffer
2. Create an `AudioBufferSourceNode` connected to `backingTrackGain`
3. Synchronize playback start with the session start
4. Support section-specific looping

### Spoken coach output

Coach TTS audio arrives as base64 PCM chunks from the Live API. `AudioPlaybackService.enqueueCoachAudio()` decodes each chunk via `decodeAudioData()`, creates a `BufferSourceNode`, connects it to `coachVoiceGain`, and starts playback immediately.

When barge-in is detected, `flushCoachQueue()` stops all in-progress coach source nodes instantly, achieving immediate silence.

### Ducking

When coach text output arrives, the orchestrator calls `playbackService.duck()`, which drops `backingTrackGain` to 0.15 (15%). When the coach is interrupted or finishes speaking, `unduck()` ramps `backingTrackGain` back to 1.0 over 300ms. This prevents the coach from being drowned out by the backing track and reduces microphone feedback loops.

### Audio device and permission state

Permission and device state is architecturally separated from session state:

| Concern | Owner | Accessed by |
|---|---|---|
| Mic permission (`granted`/`denied`/`prompt`) | `useDevicePermissionsStore` | Coach UI, Settings > Audio |
| Device enumeration | `useDevicePermissionsStore` (future) | Settings > Audio |
| Mic acquisition and streaming | `AudioCaptureService` | `usePracticeSessionStore` only |
| Coach audio playback | `AudioPlaybackService` | `usePracticeSessionStore` only |
| Global song playback | `usePlaybackStore` | Library, Radio, Track Details, Studio |

---

## 6. Song-Aware Coaching Context

### What the coach receives

The coach is not a generic voice assistant. Every session is initialized with rich song-specific context injected via the system instruction in the WebSocket setup frame.

The `SongContext` object contains:

| Field | Source | Purpose |
|---|---|---|
| `projectTitle` | `PersistedProject.title` | Coach references the song by name |
| `bpm` | `Blueprint.bpm` | Rhythm coaching context |
| `key` | `Blueprint.key` | Pitch and chord coaching context |
| `mode` | `Blueprint.mode` | Major/minor awareness |
| `timeSignature` | `Blueprint.timeSignature` | Rhythm coaching context |
| `genre` | `Blueprint.genre` | Style-appropriate feedback |
| `sections` | `TrackVersion.structure` | Section map with timestamps and chords |
| `lyrics` | `TrackVersion.lyrics` | Lyric delivery coaching |
| `practiceBrief` | `GeminiPracticeBriefResult` | Structured practice cues from Gemini |
| `practiceMode` | User selection | Vocal/hum/guitar/piano awareness |
| `focusArea` | User selection | Rhythm/pitch/chords/accuracy focus |
| `selectedSection` | User selection | Which section to concentrate on |

### How song context is supplied

Before the Live API session starts, the orchestrator calls `preparePracticeBrief()` via `gemini-gateway.ts`. This is a standard Gemini JSON call (not Live API) that takes the project, version, blueprint, focus area, section, and mode, and returns structured practice guidance.

The brief, combined with the project/version metadata, is assembled into the `SongContext` by `buildSongContext()`. This context is then formatted into the system instruction by `buildSystemInstruction()` in the `LiveConnectionClient`.

### Persistent musical context vs. transient performance events

**Persistent context** (read from project graph, never modified by Coach):
- Blueprint fields (BPM, key, mode, time signature, genre, instruments, structure)
- Track version data (structure sections with timestamps, lyrics, chord progressions)
- Practice brief (Gemini-derived session guidance)

**Transient performance events** (exist only during the active session):
- Live audio input from the microphone
- Coach spoken responses
- Real-time feedback events (`LiveFeedbackEvent[]`)
- Raw transcript accumulator
- Barge-in and interruption signals
- Session duration counter

### Keeping Coach connected to songs without coupling to Studio

Coach accesses project data through:
1. Route parameters (`projectId` from the URL)
2. `useProjectStore` selectors (to resolve the `PersistedProject`)
3. Version resolution (either explicit `versionId` from URL or `project.activeVersionId`)

Coach never imports from `useStudioStore`. It never reads draft state, generation run state, or interpretation state. If the user modifies the blueprint in Studio and generates a new version, Coach will see the new version the next time a session starts — but only because it re-reads from the persisted project graph.

---

## 7. Realtime Feedback Model

### Feedback events

`LiveFeedbackEvent` is the unit of coach feedback:

| Field | Type | Purpose |
|---|---|---|
| `id` | `string` | UUID for deduplication and UI keys |
| `timestamp` | `string` | ISO timestamp when received |
| `text` | `string` | The coaching note content |
| `isPartial` | `boolean?` | Whether this is a mid-turn partial token |
| `provider` | `string` | Always `'google-live'` |
| `model` | `string` | Model identifier |
| `schemaVersion` | `string` | Contract version |

Events are stored in `feedbackEvents[]` on the store, capped at 20 most recent entries. Partial tokens are not added to the event list — only complete turn outputs become events.

### Coach commentary feed

The `CoachTranscriptPanel` renders the `feedbackEvents` array as a scrolling feed, newest first. Each event shows the coaching note text and a relative timestamp. The raw transcript (full accumulated text) is also available but is primarily used for session summary generation, not direct UI rendering.

### Feedback flow

1. User performs → mic audio streams to Live API
2. Model processes audio and generates a coaching response
3. Text tokens arrive via `onTextOut(text, isPartial)`
   - Partial tokens: appended to raw transcript, no new event created
   - Complete turns: appended to raw transcript AND prepended to `feedbackEvents[]`
4. Audio tokens arrive via `onAudioOut(base64)` → enqueued for immediate TTS playback
5. If the user interrupts (barge-in), coach audio is flushed and the model stops its current response

### What is transient vs. captured

| Data | Transient | Captured in summary |
|---|---|---|
| Individual feedback events | Yes (discarded on disconnect) | Only via raw transcript → summary text |
| Raw transcript | Yes | Truncated to ≤800 chars as `PracticeSession.summary` |
| Coach audio playback | Yes (never persisted) | No |
| Barge-in events | Yes | No |
| Session duration | Yes (timer state) | Inferred from `startedAt`/`endedAt` |
| Focus area/mode/section | Stored on session record | Yes |

### Future: Structured metrics

`PracticeMetricSummary` is defined in the domain (`rhythm`, `pitch`, `chordAccuracy`, `noteAccuracy` as optional numbers) but not yet populated. Future implementation should:
1. Have the Live API system instruction request structured JSON feedback at session end
2. Parse metric scores from the model's final turn
3. Attach them to the `PracticeSession` record

This preserves the possibility of progress tracking without forcing premature analytics implementation.

---

## 8. Persistent Practice Summaries vs. Transient Session Events

### Persistence rules

**Persisted (durable across sessions and app restarts):**
- `PracticeSession` records in localStorage (`riff:practice:${projectId}`)
- Each record contains: id, projectId, versionId, mode, focusArea, selectedSection, startedAt, endedAt, summary, metrics
- Per-project cap: 50 sessions (oldest evicted on overflow)
- `pastSessionCount` is derived from persistence at session target time

**Transient (exist only during active session):**
- `sessionState` — the current lifecycle state
- `feedbackEvents[]` — the most recent 20 coaching notes
- `rawTranscript` — accumulated text output from the coach
- `sessionStartedAt` — the start timestamp (moved to persistence on finalize)
- `sessionDuration` — the live counter (seconds elapsed)
- `analyserNode` — the audio analyser reference for visualizers
- `practiceBrief` — the Gemini-derived session brief
- `AudioCaptureService`, `AudioPlaybackService`, `LiveConnectionClient` instances
- Timer handle

### Finalization flow

When `disconnectSession()` is called:
1. Stop timer, stop capture, flush and dispose playback
2. If `rawTranscript` is non-empty and `targetProjectId` exists:
   a. Set state to `finalizing`
   b. Build a `PracticeSession` record with summary = truncated transcript
   c. Call `savePracticeSession()` to append to localStorage
   d. Update `pastSessionCount`
   e. Close the Live API connection
   f. Reset all transient state to initial values
3. If no transcript, skip persistence, close connection, reset state

### Why this split matters

The split between persistent summaries and transient events prevents:
- Unbounded storage growth from raw audio/transcript data
- Confusion between "what the coach said in real time" and "what the user should review later"
- Performance degradation from persisting high-frequency micro-events
- Stale transient state leaking across sessions

---

## 9. Interruption, Pause, and Retry Handling

### User pause

1. Guard: only from `listening` or `coaching` states
2. Stop `AudioCaptureService` (releases mic, stops streaming)
3. Flush coach audio queue (silence any in-progress TTS)
4. Unduck backing track
5. Stop session timer
6. Set state to `paused`, clear `analyserNode`
7. The WebSocket connection may remain open or close due to inactivity — both are handled

### User resume

1. Guard: only from `paused` state
2. Create new `AudioCaptureService` instance
3. Start capture with chunk callback routed to `liveClient.sendAudioChunk`
4. Set `analyserNode` from the new capture service
5. Set state to `listening`, restart timer
6. If the WebSocket closed during pause, the next `sendAudioChunk` call is silently dropped; the user can `requestFeedback()` to prompt the model, which will trigger reconnection if needed

### User retries a section

The user taps "Get Feedback" (`requestFeedback()`). If the session is active (not idle/error), it sends a text prompt to the Live API with the current practice context. The model responds with coaching notes. No session restart is needed.

### Connection interruption

Handled entirely by `LiveConnectionClient._scheduleReconnect()`. Up to 3 attempts with linear backoff. During reconnect, audio capture continues locally (no mic interruption). Chunks sent during reconnect are dropped. On successful reconnect, the setup frame is re-sent with the full song context.

### Switching songs or sections

Section changes are supported mid-session (while paused). The user updates `selectedSection` via the store, and the next coaching interaction will reference the new section. Switching to a different project/version requires navigating away from the Coach page, which triggers `disconnectSession()` and finalization. A new session starts when the user arrives at the Coach page for the new project.

### Changing performance mode

Same as section changes — update the config while paused, resume with the new mode. The Live API session retains all song context; mode-specific coaching is requested via text prompts.

### Coach feedback interruption (barge-in)

Natively supported. The model detects user speech during its own output, sends an `interrupted` signal, and stops generating. The client flushes all coach audio immediately and transitions to `listening`.

### Session resumption after connection expiry

Not supported across page navigations. Within a single page visit, reconnection is automatic (up to 3 attempts). After 3 failures, the session enters `error` state, and the user must explicitly retry to start a new connection.

---

## 10. Relationship to Other AI / Model Layers

### Live API

Live API is the real-time session engine. It powers all bidirectional audio streaming and spoken coaching feedback. It is the only AI layer active during a coaching session.

### Gemini

Gemini provides upstream context for coaching sessions:
1. `preparePracticeBrief()` — called before the session starts to generate structured practice cues
2. `summarizeTrackVersion()` — produces `practiceNotes[]` on the version's insight object, which can inform session setup UI

Gemini does not participate in the live session loop. Once the WebSocket opens, Gemini's contribution is frozen in the setup frame's `practiceBrief` field.

Future enhancement: Use Gemini to summarize the raw transcript into a structured `PracticeSession.summary` at finalization time (replacing the current truncation approach).

### Lyria

Lyria has no role in Coach. Lyria generates audio tracks in Studio. Coach practices those tracks. There is no runtime connection between Lyria and the coaching session.

### Spotify

Spotify has no role in Coach. Spotify references may have influenced the blueprint during creation, but that influence is already baked into the persisted project data. Coach reads the project; it does not know or care about Spotify.

---

## 11. Desktop and Native Concerns

### Microphone permission handling

Microphone permission is an OS-level concern. `useDevicePermissionsStore` probes permission status via the Permissions API and `getUserMedia()`. The Coach UI shows a prominent permission prompt if status is `denied` or `prompt`, guiding the user to grant access before starting a session.

Permission state is architecturally separate from session state. A denied microphone does not crash the app — it prevents session start and shows a clear explanation.

### Audio device awareness

Audio device selection (input and output) is configured in Settings > Audio and persisted in user preferences. Coach uses the system default device unless overridden. Device changes during a session (e.g., headphones unplugged) may cause audio interruption — the `AudioCaptureService` will stop producing chunks, and the session should detect silence and surface a device warning.

### Local performance stability

Audio processing runs at 16kHz sample rate with 4096-sample buffers (256ms latency). This is acceptable for coaching feedback (not a DAW-level latency requirement). The `ScriptProcessorNode` is deprecated but widely supported in Tauri's WebView. Migration to `AudioWorklet` is planned but does not change the external interface.

### Desktop-specific session trust

Sessions feel serious because:
- Practice history persists locally across app restarts
- The session timer provides real-time feedback on practice duration
- The finalization flow produces a durable summary, not just a "session ended" message
- The permission and device flow is handled explicitly, not hidden

---

## 12. Failure Boundaries and Resilience

| Failure | Behavior | User sees |
|---|---|---|
| Mic permission denied | `connectSession` catches error, state → `error` | Permission overlay with instructions |
| No input device | `getUserMedia()` throws, state → `error` | Device unavailable message |
| Practice brief fails | `preparePracticeBrief()` error caught, session still attempts to connect with a fallback brief | Degraded but functional (generic coaching) |
| WebSocket fails to open | `LiveConnectionClient._openSocket()` triggers `onError`, state → `error` | "Connection failed" with retry option |
| WebSocket disconnects mid-session | Auto-reconnect (3 attempts). Audio capture continues locally. | Brief pause in coach responses, then recovery |
| Reconnect exhausted | `onError` called, state → `error` | "Session timed out" with restart option |
| Coach audio decode fails | `enqueueCoachAudio` catches silently, drops the chunk | No audible coach for that chunk, text still arrives |
| User switches away mid-session | `disconnectSession()` called on unmount, finalizes if transcript exists | Session saved, clean exit |
| Project/version missing | Route guard redirects before Coach mounts | Never reaches Coach page |
| Finalization fails | Catch block closes socket, resets to `idle` without persisting | Session data lost (acceptable — it's just a practice attempt) |

### Trust preservation

The system preserves trust by:
1. Never losing project data (Coach is read-only against the project graph)
2. Always attempting to save a practice summary before exiting
3. Providing clear state feedback at every lifecycle stage
4. Handling errors with specific messages, not generic crashes
5. Supporting retry from error state without page reload

---

## 13. Separation of Concerns

### Architectural layers

| Layer | Responsibility | Files |
|---|---|---|
| **Coach page UI** | Layout, routing, visual rendering, user interactions | `coach-page.tsx`, `live-performance-stage.tsx`, `practice-context-panel.tsx`, `coach-transcript-panel.tsx` |
| **Session orchestrator** | State machine, lifecycle coordination, connecting services to events | `use-practice-session-store.ts` |
| **Transport client** | WebSocket lifecycle, reconnection, message routing, system instruction assembly | `live-connection-client.ts` |
| **Raw transport** | WebSocket open/close, JSON frame send/receive | `live.ts` |
| **Audio capture** | Microphone acquisition, PCM encoding, analyser exposure | `audio-capture-service.ts` |
| **Audio playback** | Coach TTS decoding, backing track mixing, ducking | `audio-playback-service.ts` |
| **Permission store** | Mic permission probe, device enumeration | `use-device-permissions-store.ts` |
| **Practice persistence** | localStorage read/write of `PracticeSession` records | `practice-session-store.ts` |
| **Practice brief gateway** | Gemini call for structured practice context | `gemini-gateway.ts` (`preparePracticeBrief`) |
| **Song context provider** | Route params → project/version resolution | `useProjectStore`, router params |
| **Domain types** | `PracticeSession`, `PracticeMode`, `PracticeFocusArea`, `LiveFeedbackEvent` | `domain/practice-session.ts`, `domain/providers.ts`, `features/coach/types/practice-session.ts` |

### Boundary rules

1. UI components never call `getUserMedia`, `WebSocket`, or audio APIs directly
2. The orchestrator store is the sole coordinator between transport, audio, and UI
3. `LiveConnectionClient` knows nothing about React, Zustand, or audio devices
4. `AudioCaptureService` and `AudioPlaybackService` know nothing about WebSockets or React
5. Practice persistence knows nothing about live sessions — it only stores/retrieves records
6. Permission state is read by both Coach UI and Settings UI but mutated only by the permission store
7. Global playback (`usePlaybackStore`) and Coach playback (`AudioPlaybackService`) are completely independent

---

## 14. Anti-Patterns to Avoid

1. **Treating Coach as a chatbot page.** Coach is a live session subsystem with hardware resources, not a text input/output page.

2. **Putting WebSocket logic in React components.** Transport belongs in `LiveConnectionClient`. Components observe the orchestrator store.

3. **Mixing persistent project state with transient session state.** The project graph is long-lived and shared. Session state is ephemeral and scoped to one practice attempt.

4. **Storing every micro feedback event permanently.** Individual `LiveFeedbackEvent` entries are transient. Only the session summary persists.

5. **Making microphone/device state a hidden side effect.** Permission state has its own store. Mic acquisition happens in `AudioCaptureService`, coordinated by the orchestrator. No component should call `getUserMedia` directly.

6. **Coupling Coach to Studio page state.** Coach reads from `useProjectStore` (the persisted project graph), never from `useStudioStore` (the active Studio editing session).

7. **Failing to model session lifecycle explicitly.** Every state and transition must be accounted for. Ad hoc boolean flags for "is connected" and "is recording" will collapse under real-world complexity.

8. **Letting connection state and coaching state blur together.** The WebSocket can be reconnecting while the session is logically "listening." These are separate concerns with separate state machines.

9. **Treating session failure as project failure.** A failed coaching session loses nothing permanent. The project, its versions, and its history are untouched.

10. **Making Coach depend on Spotify or other secondary integrations.** Coach depends on the project graph and the Live API. Period.

11. **Saving raw audio files to disk.** Practice audio is ephemeral. Persisting it would bloat project storage and create privacy concerns.

12. **Skipping the practice brief.** The Gemini-derived brief is what makes coaching song-aware rather than generic. It should always be attempted before session start, with a graceful fallback if it fails.
