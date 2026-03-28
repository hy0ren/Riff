# Live API / Coach Session Architecture

This document defines the architecture for the **Coach / Practice** subsystem in Riff. It describes how the live, real-time, session-based experience functions within the desktop application, establishing clean boundaries between long-term project data, transient session state, low-level audio handling, and the Gemini Live API integration.

---

## 1. System Boundaries and Philosophy

The Coach subsystem is a dedicated, real-time environment built on top of the Riff Project architecture. It is strictly separated from the Studio (where music is created) and the Library (where music is organized).

**Core Tenets:**
- **Read-Only Context:** The Coach subsystem reads `Project`, `TrackVersion`, and `Section` data to understand the song. It **never** mutates the song's blueprint or structure. Practice does not alter the underlying composition.
- **Transient by Default:** A live session is highly volatile. Audio buffers, connection states, and raw transcripts exist only during the active session. Only high-level summaries and metrics are persisted back to the Project when the session concludes.
- **Interruption-Tolerant:** Practice is messy. The architecture must gracefully handle the user pausing, rewinding, coughing, or talking over the model (barge-in).
- **Desktop Native:** The audio pipeline leverages Tauri's hardware proximity where possible to ensure low-latency monitoring and capture, separating it from standard web-audio constraints.

## 2. Live Session Model

A **Practice Session** (`PracticeSession` within the domain model) is a temporal container representing a user practicing a specific version of a song.

**Session State (`PracticeSessionState`):**
- **`idle`:** Component is mounted, but no hardware is active.
- **`connecting`:** Initializing the WebSocket connection to the Live API and locking audio devices.
- **`active` (Listening/Coaching):** The core loop. Microphones are hot, audio is streaming up, and model responses (both audio and text) are streaming down.
- **`paused`:** The user has temporarily halted the session. Hardware is released or muted; the Live API connection may be maintained or paused depending on API constraints.
- **`finalizing`:** The session is wrapping up. The raw transcript is being summarized by a standard Gemini call to produce durable feedback.

## 3. Architecture Layers

The Coach subsystem is composed of four distinct layers to ensure separation of concerns:

### A. The UI Layer (React Components)
- **`CoachPage` / `LivePerformanceStage`:** Displays real-time visualizers, transport controls (play/pause/stop), and contextual information (current section, lyrics).
- **`CoachTranscriptPanel`:** Renders the real-time textual transcript of the Coach's speech and system events.
- *Rule:* UI components NEVER directly access the WebSocket or call `getUserMedia`. They strictly observe the Orchestrator Layer.

### B. The Orchestrator Layer (`usePracticeSessionStore`)
- The central state machine (Zustand store).
- Coordinates the initialization of the Audio Infrastructure and the Live API connection.
- Manages the transition between session states (`connecting` -> `active` -> `finalizing`).
- Syncs the playback of the local backing track with the active practice session, ensuring they start and stop together.

### C. The Audio Infrastructure Layer
- **`AudioCaptureService`:** Manages the user's microphone. Captures PCM audio, applies necessary formatting (e.g., sample rate conversion to 16kHz for Gemini), and pipes it to the Transport Layer.
- **`AudioPlaybackService`:** Manages mixing the local backing track and the remote Coach TTS audio. Implements "ducking" (lowering the backing track volume when the Coach speaks).
- *Rule:* This layer is decoupled from the UI. It provides frequency data (via AnalyserNodes) that the UI can poll for visualizers, but the heavy lifting happens outside the React render cycle.

### D. The Transport Layer (`LiveConnectionClient`)
- Dedicated to managing the WebSocket connection to the Gemini Live API.
- **Outbound:** Streams base64-encoded PCM audio chunks from the `AudioCaptureService` to the server.
- **Inbound:** Receives `serverContent` containing the Coach's TTS audio (piped to `AudioPlaybackService`) and text transcripts (dispatched to the Orchestrator Layer).
- Handles connection fragility, automatic reconnects, and socket lifecycle operations without disrupting the Orchestrator's high-level state.

## 4. Song-Aware Context Initialization

For the Coach to provide meaningful feedback, it must be deeply aware of the song. This is achieved via a robust initialization protocol when the WebSocket is opened.

**The `setup` Frame:**
When the `LiveConnectionClient` connects, its first message must be a `setup` frame containing:
1.  **System Instruction:** Defining the persona (e.g., "You are an expert vocal coach guiding a student...").
2.  **Project Context:** The BPM, Key Signature, Time Signature, and overall genre.
3.  **Structural Context:** The map of sections (Verse, Chorus) and their timestamps.
4.  **Lyrical/Musical Context:** The lyrics or chord progressions for the specific `TrackVersion` being practiced.
5.  **Practice Brief:** The user's specific goal for this session (e.g., "Focus on hitting the high notes in the chorus").

This explicit context injection ensures the model evaluates the live, unformatted audio stream against the structured reality of the Riff project.

## 5. Handling Interruptions and Resiliency

The system must handle the chaotic nature of practice:

- **Barge-in:** If the user starts singing or speaking while the Coach is providing feedback, the `AudioCaptureService` continues streaming to the Live API. If the model detects barge-in, the server stops sending audio. The Transport Layer must instantly flush the `AudioPlaybackService`'s Coach TTS queue to silence the Coach locally.
- **Transport Failures:** The Gemini Live API may enforce session timeouts or drop connections. The Transport Layer must transparently establish a new WebSocket connection, re-injecting the necessary `setup` context, while the Orchestrator Layer buffers user audio so data isn't lost.
- **Latency Masking:** Visualizers in the `LivePerformanceStage` must be driven by local audio capture and local playback buffers, not round-trip server data, ensuring the UI feels instantly responsive.

## 6. Data Persistence Lifecycle

1.  **During Session:** Millions of bytes of audio and raw transcript text are generated. This is held entirely in transient memory (RAM) within the Orchestrator and Transport layers.
2.  **Session End:** The user stops the session.
3.  **Summarization:** The Orchestrator collects the final transcript and key events. It makes a standard (non-Live) asynchronous call to a Gemini Flash model to generate a structured `SessionSummary`.
4.  **Persistence:** The resulting `SessionSummary` (duration, brief summary, key areas for improvement) is appended as a historical `PracticeSession` object to the `Project` domain model and saved to disk.
5.  **Discard:** The raw audio buffers, WebSocket connections, and real-time state are completely garbage-collected.

## 7. Anti-Patterns to Avoid

- **DO NOT** couple WebSocket logic directly into React components. The Transport Layer must be isolated.
- **DO NOT** save raw audio files of practice sessions to the filesystem unless explicitly requested for export. It bloats the project size and degrades performance.
- **DO NOT** mix playback of the local track and Coach TTS blindly. Implement ducking to prevent the Coach's voice from being drowned out by the music, which causes a feedback loop into the microphone.
- **DO NOT** attempt to perform structural editing or prompting via the Coach interface. If the user says "Change the song to be faster," the Coach must redirect them to the Studio interface. The Coach does not mutate.
