# Spartan 7: Tauri Desktop, Permissions, Audio I/O, and Release Strategy

**Status:** Canonical — supersedes `desktop_architecture.md`

This document defines the desktop-native architecture for Riff Radio. It specifies what responsibilities belong to Tauri/native layers versus frontend layers, how permissions should be modeled, how audio I/O should be structured, how filesystem and export concerns should be handled, and how the application should be packaged and released as a real installable desktop product.

---

## 1. Tauri's Role in the System

### What Tauri is responsible for

Tauri is the desktop shell that grounds the React frontend in native OS reality. Its responsibilities are bounded and specific:

| Responsibility | Description |
|---|---|
| **App shell and window management** | Main window creation (1440×900 default), window lifecycle, minimize/maximize/close behavior, title bar |
| **Local filesystem access** | Reading and writing project data, export bundles, and cached assets to OS-appropriate directories |
| **Native command bridging** | `invoke` calls for operations that require OS access (reveal-in-folder, file dialog, directory creation) |
| **Export file operations** | Writing WAV/MP3 files, lyric sheets, chord PDFs, and metadata bundles to user-selected directories |
| **OS permission requests** | Microphone access prompts, filesystem access, and future permissions as needed |
| **Desktop packaging** | Building installable bundles (DMG for macOS, MSI/NSIS for Windows) with proper signing, icons, and metadata |
| **App lifecycle** | Startup behavior, graceful shutdown, and future auto-update infrastructure |

### What Tauri is not

Tauri should not become:
- A general-purpose backend for business logic (domain logic belongs in frontend service layers)
- A dumping ground for API orchestration (Gemini, Lyria, Live API, and Spotify calls happen in the frontend)
- A replacement for React state management (Zustand stores manage application state; Tauri commands are invoked for specific native operations)
- A monolithic module that tries to own everything "native" (each native concern has its own bounded module)

### Current implementation state

`src-tauri/` currently provides:
- A minimal Tauri 2 app shell (`com.riff.app`, v0.1.0)
- `tauri-plugin-log` for debug logging
- Default window configuration (1440×900)
- No custom Rust commands yet — all native interaction currently goes through Tauri's built-in APIs and the `@tauri-apps/api` JavaScript bindings
- The `capabilities/default.json` grants `core:default` permissions to the `main` window

---

## 2. Responsibility Boundaries

### Five-layer architecture

| Layer | Responsibilities | Examples |
|---|---|---|
| **1. Frontend UI (React)** | Visual rendering, routing, component state, user interactions, page composition | Page components, shared UI primitives, sidebar, global player UI |
| **2. Feature logic (React/TS)** | Feature-specific orchestration, domain workflows, store management | `useStudioStore`, `usePracticeSessionStore`, `useProjectStore`, feature hooks |
| **3. Shared services (TS)** | API gateway functions, domain transformations, pipeline logic | `gemini-gateway.ts`, `lyria-gateway.ts`, `live-gateway.ts`, `spotify-gateway.ts`, studio pipeline |
| **4. Platform abstraction (TS → Tauri)** | Thin wrappers that bridge frontend intent to Tauri commands | `fs-commands.ts`, `use-device-permissions-store.ts`, future audio-device helpers |
| **5. Tauri/Native (Rust)** | OS-level operations, file I/O, permission prompts, window management, packaging | `src-tauri/src/lib.rs`, Tauri commands, Tauri plugins |

### Drawing the line

**Belongs in Layer 1-2 (Frontend):**
- Page layout and navigation
- Form state and UI interactions
- Store-driven state machines (session lifecycle, generation pipeline)
- Audio graph construction (Web Audio API contexts, nodes)
- WebSocket management (Live API connections)

**Belongs in Layer 3 (Shared services):**
- API call construction and response parsing
- Domain type transformations
- Pipeline orchestration (interpretation → draft → commit → generation)
- Provider configuration and model selection

**Belongs in Layer 4 (Platform abstraction):**
- `revealInFolder(path)` — wraps Tauri `invoke` for OS file reveal
- `openExportFolder()` — opens the default export directory
- `exportAssetToDisk(asset, destination)` — writes a file via Tauri FS
- `selectExportDirectory()` — opens a native folder picker dialog
- `checkMicrophonePermission()` — queries OS permission state
- `requestMicrophonePermission()` — triggers OS permission prompt
- `enumerateAudioDevices()` — lists available input/output devices
- `getAppDataDir()` — returns OS-appropriate application data directory

**Belongs in Layer 5 (Tauri/Rust):**
- Actual file read/write syscalls
- OS keychain access for secure token storage
- Native dialog presentation
- App bundle configuration and signing
- Future: background audio processing, native audio device enumeration if Web APIs are insufficient

### Current platform abstraction files

- `src/lib/platform/fs-commands.ts` — Export/reveal filesystem operations via Tauri `invoke`
- `src/lib/platform/permissions/use-device-permissions-store.ts` — Microphone permission state via Web APIs (`navigator.permissions`, `navigator.mediaDevices.getUserMedia`)

---

## 3. Permissions Architecture

### Permission-sensitive capabilities

| Capability | Permission required | When needed |
|---|---|---|
| Microphone access | OS-level microphone permission | Coach / Practice (audio capture) |
| Local file read/write | Filesystem access (Tauri grants by default for app directories) | Project persistence, export writing |
| Export folder selection | Filesystem dialog access | Exports page, Settings |
| Future: auto-updater | Network + filesystem | App updates |
| Future: notifications | OS notification permission | Export completion, community activity |

### Permission state model

Permission state is tracked in `useDevicePermissionsStore`:

```
{
  microphonePermission: 'granted' | 'denied' | 'prompt' | 'unknown'
  lastCheckedAt: string | null
}
```

This store:
1. Probes permission status on mount via `navigator.permissions.query({ name: 'microphone' })`
2. Falls back to attempting `getUserMedia()` if the Permissions API is unavailable
3. Exposes `checkMicrophonePermission()` and `requestMicrophonePermission()` actions
4. Is read by Coach UI (to show permission overlay) and Settings > Audio (to show permission badge)

### Permission state vs. preferences

Permissions are not preferences. They represent OS-enforced constraints that may change outside the app's control (user revokes in System Preferences). The app must:
- Re-check permission state on relevant page mount (Coach, Settings > Audio)
- Never cache permission state as "permanently granted"
- Treat permission denial as a recoverable state, not a fatal error
- Provide clear guidance for how to grant permission (link to System Preferences)

### Graceful degradation

| Permission denied | Behavior |
|---|---|
| Microphone | Coach page shows permission overlay. Session cannot start. All other features unaffected. |
| Filesystem (unlikely — Tauri grants app directories) | Export operations show "Cannot write to directory" with folder picker retry |
| Future: notifications | Notification-dependent features silently skip notifications |

### Separation from session state

Permission state is never embedded in session state or page component state. It lives in a dedicated store that multiple features can read. The Coach page reads `microphonePermission` to decide whether to show the permission overlay or the session controls. It does not query permissions itself.

---

## 4. Audio I/O Architecture

### Audio subsystems

Riff Radio has four distinct audio concerns that must remain architecturally separate:

#### 4A. Shared playback system

**Owner:** `usePlaybackStore` + `playable-track.ts`

**Purpose:** Plays generated songs across Library, Radio, Track Details, and Studio preview. This is the global audio player visible in the app shell's bottom bar.

**Scope:**
- Queue management (play, pause, skip, shuffle)
- Volume control
- Playback position tracking
- Song metadata display
- Cross-page continuity (plays while navigating)

**Does not own:** Microphone input, Coach TTS playback, Live API audio streams.

#### 4B. Coach live input system

**Owner:** `AudioCaptureService` (class, instantiated per session)

**Purpose:** Captures microphone audio, encodes it as PCM16 at 16kHz, and streams base64 chunks to the Live API.

**Scope:**
- `getUserMedia()` calls
- `AudioContext` at 16kHz
- `MediaStreamAudioSourceNode` → `AnalyserNode` → `ScriptProcessorNode`
- Float32 → Int16 → base64 encoding
- Chunk callback delivery to transport layer

**Does not own:** Playback, TTS output, global audio, or permission state. It attempts mic access and throws on failure.

#### 4C. Coach live output system

**Owner:** `AudioPlaybackService` (class, instantiated per session)

**Purpose:** Decodes and plays Coach TTS audio from the Live API. Manages ducking of the backing track when the coach speaks.

**Scope:**
- Separate `AudioContext` for coach audio
- `coachVoiceGain` and `backingTrackGain` nodes
- `masterAnalyser` for combined visualization
- `enqueueCoachAudio()` for TTS chunk decoding and playback
- `flushCoachQueue()` for barge-in silence
- `duck()` / `unduck()` for backing track volume management

**Does not own:** Microphone input, global playback, Live API transport.

#### 4D. Local audio device state

**Owner:** `useDevicePermissionsStore`

**Purpose:** Tracks microphone permission status and available audio devices.

**Scope:**
- Permission probing via Permissions API and `getUserMedia()`
- Device enumeration via `navigator.mediaDevices.enumerateDevices()`
- Device selection preferences (stored in settings)

**Does not own:** Any audio processing, playback, or streaming.

### Why separation matters

These subsystems share physical hardware (speakers, microphone) but must not share audio graphs, state, or lifecycle:

- Global playback runs continuously across pages. Coach audio runs only during sessions.
- Microphone capture requires explicit permission and hardware allocation. Playback does not.
- Coach TTS and backing track require ducking coordination. Global playback does not duck.
- If global playback and Coach playback shared an `AudioContext`, disposing the Coach session could kill global playback.

### Audio in the native layer

Current audio implementation is entirely Web Audio API-based, running in Tauri's WebView. This is appropriate for the current feature set. Future native considerations:

| Concern | Current | Future consideration |
|---|---|---|
| Microphone capture | Web `getUserMedia()` | Tauri Rust plugin for lower-latency capture if WebView constraints appear |
| Device enumeration | Web `enumerateDevices()` | Tauri Rust command for more reliable device listing on some platforms |
| Audio output routing | Web `AudioContext.destination` | Tauri plugin for explicit output device selection if web APIs are insufficient |
| Low-latency monitoring | Not applicable (Coach, not DAW) | Remains web-based unless sub-10ms latency is required |

---

## 5. Coach-Specific Desktop/Audio Concerns

Coach / Practice is the product area where desktop-native behavior matters most because it depends on:
- Real-time microphone access (permission-gated)
- Continuous audio streaming (hardware resource lock)
- Low-latency feedback (audio processing in tight loops)
- Reliable device availability (microphone may disconnect mid-session)

### Permission requirements

Before a Coach session can start:
1. `useDevicePermissionsStore.microphonePermission` must be `'granted'`
2. If `'prompt'`, the Coach UI shows a permission request button that calls `requestMicrophonePermission()`
3. If `'denied'`, the Coach UI shows an explanatory overlay with instructions to grant permission in OS settings
4. The session start flow (`connectSession()`) does not attempt `getUserMedia()` until permission is confirmed at the UI level

### Device readiness

- `AudioCaptureService.start()` creates a new `AudioContext` and `getUserMedia()` stream per session
- If the device is unavailable (no microphone, device error), the promise rejects and the session transitions to `error`
- The Coach UI should display a specific "No microphone found" message distinct from "Permission denied"

### Handling device changes mid-session

If the user unplugs a microphone during a session:
- The `MediaStream` tracks end
- `AudioCaptureService` stops producing chunks
- The Live API continues to run but receives no audio
- The session should detect prolonged silence and warn the user

### Maintaining trust during live sessions

Desktop trust is built by:
- Clear visual feedback of session state at all times (listening/coaching/paused indicators)
- Immediate visual response to microphone input (waveform visualizer driven by `AnalyserNode`)
- Explicit session duration timer (the user knows exactly how long they've practiced)
- Clean session finalization with persisted summaries
- No hidden background recording or silent failures

---

## 6. Filesystem and Local Storage

### Project persistence

Projects are the most important persistent data in the application. They represent the user's creative work.

**Current implementation:** Projects are stored in `useProjectStore` (Zustand with persistence middleware), serialized to localStorage.

**Target architecture:** Projects should be stored in the OS-appropriate application data directory:
- macOS: `~/Library/Application Support/com.riff.app/`
- Windows: `%APPDATA%\com.riff.app\`
- Linux: `~/.local/share/com.riff.app/`

This directory is managed via Tauri's `app_data_dir()` API. The frontend's persistence layer writes to this directory through platform abstraction functions, not through direct filesystem calls.

### Local app data structure

```
{app_data_dir}/
├── projects/
│   ├── proj-001.json       # Serialized PersistedProject
│   ├── proj-002.json
│   └── ...
├── audio/
│   ├── proj-001/
│   │   ├── v1.wav          # Generated audio artifacts
│   │   └── v2.wav
│   └── ...
├── cache/
│   ├── cover-art/          # Cached cover art
│   ├── spotify/            # Cached Spotify reference data
│   └── ...
├── practice/
│   ├── proj-001.json       # Practice session history
│   └── ...
├── settings.json           # User preferences
└── integration-state.json  # Spotify connection state, tokens
```

### Exports

Exports are user-facing file operations, distinct from internal app storage:

| Concern | Internal storage | Export |
|---|---|---|
| **Purpose** | App continuity | User consumption |
| **Location** | `app_data_dir` (opaque) | User-chosen directory (transparent) |
| **Format** | JSON, internal structures | WAV, MP3, PDF, JSON metadata |
| **Visibility** | Hidden from user | Visible in Finder/Explorer |
| **Lifecycle** | Managed by app | Managed by user |
| **Tauri involvement** | `app_data_dir()` API | Native file dialog + `invoke` write commands |

### Export workflow

1. User selects tracks/assets to export in the Exports page
2. Frontend builds an `ExportBundle` definition
3. Frontend calls `exportAssetToDisk(asset, destination)` from `fs-commands.ts`
4. `fs-commands.ts` invokes a Tauri command that writes the file to the selected directory
5. On success, the export history is updated in the product
6. The user can call `revealInFolder(path)` to open the exported file in Finder/Explorer

### Export path management

- Default export directory is configurable in Settings > Exports
- If no default is set, the app uses a native folder picker dialog
- If the configured path no longer exists, the app shows a "Directory not found" message and opens the folder picker
- Overwrite behavior: the app appends a numeric suffix to avoid silent overwrites (`My Song (2).wav`)

### Reveal-in-folder

`revealInFolder(path)` is a Tauri native command that opens the OS file manager with the specified file selected. This is a critical trust signal — it proves the user's work exists on their machine.

---

## 7. App Lifecycle and Desktop Continuity

### Startup behavior

On app launch:
1. Load persisted settings and preferences from `app_data_dir`
2. Load persisted project list from `app_data_dir/projects/`
3. Restore last window dimensions and position
4. Check integration states (Spotify connection, attempt silent token refresh if previously connected)
5. Restore last active project context (for Home page "Continue Creating" section)
6. Do NOT restore ephemeral states (active Coach sessions, Studio generation runs, modal states)

### Shutdown behavior

On app close:
1. If a Coach session is active, trigger `disconnectSession()` and finalize
2. If a generation is in progress, mark it as interrupted (not failed) for potential retry
3. Save current window dimensions and position
4. Persist any dirty project state
5. Clean close — no unsaved data loss for persisted project state

### What restores vs. what does not

| Restores | Does not restore |
|---|---|
| Project list and metadata | Active Coach session |
| Last active project ID | Live API WebSocket connections |
| Window dimensions | Modal or dialog states |
| User preferences | Studio draft in-progress state (draft persists, but active editing context does not) |
| Spotify connection status | Spotify search/browse state |
| Export path preferences | Active export operations |
| Practice session history | Session timer or feedback events |

### Desktop continuity vs. browser-tab assumptions

The app must not behave like a browser tab:
- Data must survive app restarts without explicit "save" actions
- The app should open to a meaningful state, not a blank page
- Hardware permissions should be remembered by the OS (the app re-checks but does not re-prompt every launch)
- Integration connections should attempt silent reconnection, not require manual re-auth every session

---

## 8. Release and Packaging Strategy

### Packaging

Tauri builds native desktop bundles:
- **macOS:** `.dmg` with app bundle, or `.app` directly
- **Windows:** `.msi` or `.exe` installer via NSIS
- **Linux:** `.deb`, `.AppImage`, or `.rpm` as appropriate

The Tauri configuration (`tauri.conf.json`) already defines:
- Bundle identifier: `com.riff.app`
- Product name: `riff`
- Version: `0.1.0`
- Window default: 1440×900
- Build commands: `pnpm build` (frontend) + Tauri Rust compilation

### Environment discipline

| Concern | Development | Production |
|---|---|---|
| API keys | `.env` file with `VITE_*` prefixes | Environment-injected at build time or secure native storage |
| Dev server | `http://localhost:5173` | Bundled `dist/` served by Tauri |
| API endpoints | Same production endpoints (Gemini, Lyria, Live API, Spotify) | Same |
| Logging | Verbose (`tauri-plugin-log` in debug) | Minimal or file-based |
| Source maps | Enabled | Disabled in release builds |

### Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`
- Version is defined in `tauri.conf.json` and `package.json`
- Future: pipe version to the UI (Settings > Advanced currently shows a hardcoded version string)
- Version should be included in error reports and crash logs

### Update strategy

Not yet implemented, but the architecture should assume:
- Tauri's built-in updater plugin can check for and install updates
- Updates should never destroy local project data
- The update mechanism should be opt-in with user notification, not silent
- Update failures should not corrupt the app installation

### Release readiness checklist (conceptual)

Before any release, verify:
1. All `VITE_*` environment variables are documented and non-empty
2. No `localhost` URLs in production code paths
3. No hardcoded API keys in frontend bundles
4. All Tauri commands are registered and functional
5. Export write operations work with the packaged app's permission set
6. Microphone permission flow works in the packaged environment
7. Window behavior (resize, minimize, restore) is stable
8. App data directory is created on first launch
9. Mock data is clearly labeled as mock in any demo paths, or replaced with real data flows

---

## 9. Environment and Secrets

### Current configuration

Environment variables are defined in `.env` (root) with `VITE_` prefix for Vite bundling:
- `VITE_GOOGLE_API_KEY` — Google AI API key
- `VITE_GEMINI_MODEL` — Gemini model name (default: `gemini-2.5-flash`)
- `VITE_LYRIA_MODEL` — Lyria model name (default: `models/lyria-realtime-exp`)
- `VITE_LIVE_MODEL` — Live API model name (default: `gemini-live-2.5-flash-preview`)
- `VITE_SPOTIFY_CLIENT_ID` — Spotify app client ID
- `VITE_SPOTIFY_REDIRECT_URI` — OAuth redirect URI

### Boundary rules

1. **API keys must never be hardcoded** in source files. They are read from environment variables via `getProviderConfig()` in `src/lib/config/provider-config.ts`.

2. **`VITE_*` variables are embedded in the frontend bundle.** This is acceptable for development but creates a risk for distributed desktop builds. Production strategy should either:
   - Inject keys at build time in CI/CD and distribute signed builds
   - Move key management to the Tauri backend (Rust) so keys are not in JavaScript

3. **Spotify tokens are sensitive.** Current implementation stores them in localStorage (via Zustand persistence). Production should use OS keychain storage via a Tauri plugin.

4. **No secrets in `src-tauri/.env`** currently — the file is a placeholder noting that all keys live in the root `.env` for Vite. Future Rust-side secrets should use Tauri's secure storage APIs.

5. **`.env` files must be in `.gitignore`.** Current `.gitignore` includes `.env`. `.env.example` files document required variables without values.

---

## 10. Failure and Resilience

### Failure scenarios and responses

| Failure | Response | User experience |
|---|---|---|
| Missing microphone permission | `useDevicePermissionsStore` reports `denied`. Coach shows permission overlay. | Clear guidance, no crash |
| No audio input device | `getUserMedia()` rejects. Session transitions to `error` with specific message. | "No microphone found" |
| No audio output device | Playback continues to default output. Coach TTS may be inaudible. | Warning in Settings > Audio |
| Invalid export folder | Tauri write command fails. Error caught in `fs-commands.ts`. | "Cannot write to directory, choose another" |
| Local file write failure | Export shows specific error. Retry available. | "Export failed, try again" |
| Stale export path (directory deleted) | Path check on export attempt. Folder picker opens if invalid. | "Directory not found, choose a new one" |
| App restart after interrupted generation | Generation run marked `interrupted`. Retry available from Studio. | "Generation was interrupted — retry?" |
| Failed Tauri command | Platform abstraction catches error, surfaces as typed failure. | Feature-specific error message |
| Partial export success | Some assets written, some failed. Individual status shown. | Per-asset success/failure indicators |
| Desktop environment inconsistency | Feature degradation with specific messaging. | "Feature unavailable on this system" |

### Resilience principles

1. **No silent failures.** Every error surfaces as a typed result that the UI can display.
2. **No cascading failures.** A Tauri command failure does not crash the React app. A permission denial does not break unrelated features.
3. **Retry over restart.** Operations that fail should offer retry, not require app restart.
4. **Data preservation over operation completion.** If an export fails halfway, the files already written are preserved. If a session fails, the project data is untouched.

---

## 11. Relationship to the Rest of the Product

Desktop-native architecture is not an isolated utility layer. It directly strengthens the core product loops:

| Product area | Desktop-native contribution |
|---|---|
| **Studio** | Project persistence (work is saved automatically). Generation artifacts stored locally. |
| **Track Details** | Version inspection backed by durable local data. Export from Track Details writes real files. |
| **Coach** | Microphone permission and device management. Session finalization persists locally. Real-time audio performance. |
| **Library** | Project list loaded from persistent local storage. Continuity across app restarts. |
| **Exports** | Real file output to real directories. Reveal-in-folder. Export history tracking. |
| **Settings** | Audio device configuration. Integration state persistence. Preference durability. |
| **App Shell** | Window management. Desktop-native chrome. Installable, launchable experience. |

---

## 12. Anti-Patterns to Avoid

1. **Treating Tauri as a random backend for all logic.** Tauri handles OS-level operations. Domain logic, API orchestration, and state management belong in the frontend.

2. **Mixing native command logic directly into UI components.** Components call platform abstraction functions (`revealInFolder`, `exportAssetToDisk`). They do not call `invoke()` directly.

3. **Hiding permission state in ad hoc component state.** Permission state lives in `useDevicePermissionsStore`. Components read it, they do not independently query it.

4. **Coupling Coach session logic directly to OS device plumbing.** The session orchestrator calls `AudioCaptureService`, which handles the device. The orchestrator does not call `getUserMedia()` or manage `AudioContext` directly.

5. **Conflating app persistence with export file operations.** Internal app data goes to `app_data_dir`. Exports go to user-chosen directories. These are different concerns with different APIs and different error handling.

6. **Assuming browser-like permission or storage behavior.** Desktop permissions persist differently than web permissions. localStorage in a WebView has different reliability guarantees than in a browser. The architecture should plan for robust local storage rather than relying on browser-style ephemeral storage.

7. **Making filesystem behavior feel untrustworthy.** Every file operation should provide clear feedback: success, failure, or in-progress. The user should never wonder if their export worked or if their project is saved.

8. **Ignoring packaging and release realities until too late.** The architecture must work when the app is built and distributed, not just when running `pnpm dev`. Environment variables, file paths, and native commands must be tested in packaged builds.

9. **Storing sensitive configuration in the wrong layer.** API keys belong in environment configuration, not in source code. Spotify tokens belong in secure storage, not in localStorage. Model names belong in `provider-config.ts`, not scattered across gateway functions.

10. **Overcentralizing native concerns into one giant module.** Each native concern (filesystem, permissions, audio devices, export operations, window management) should have its own bounded module in the platform abstraction layer. They should not all live in a single `native-bridge.ts` file.
