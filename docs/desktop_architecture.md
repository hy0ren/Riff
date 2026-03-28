# Tauri Desktop, Permissions, Audio I/O, and Release Strategy

## 1. Tauri/Native Role Definition
Riff Radio is an installable, high-trust desktop application. Tauri is responsible for all OS-level, native, and permission-sensitive capabilities. It acts as the bridge that grounds the React frontend in reality.

**Tauri’s Core Responsibilities:**
- App shell window management and lifecycle.
- Local filesystem access (persisting projects, bundles, exports).
- Execution of native commands (reveal-in-folder).
- System-level permission requests (Microphone).
- Trustable, offline-capable infrastructure grounding.

Tauri should **NOT** become a generalized backend containing React business logic, nor a vague endpoint handler for data the frontend could manage itself.

---

## 2. Responsibility Boundaries
The architecture maintains a strict separation of concerns across the stack:
1. **Frontend UI**: Visual rendering, routing, localized component state, player UI, and orchestrating user intent.
2. **Shared Service Layer**: Orchestrators for Live sessions (`usePracticeSessionStore`), playback queues, and domain logic handling.
3. **Tauri/Native Command Layer**: Strict OS interactions, file I/O operations, directory management, and hardware capability verification.
4. **Local Persistence**: Using desktop-native SQLite or dedicated local storage paths managed by Tauri file APIs, ensuring data lives in the correct OS AppData directories.

---

## 3. Permissions Architecture
Because functionality like the Coach subsystem relies on critical user privacy features (microphone), permissions are a first-class architectural concern.

- **Location of State**: Permission status (granted, denied, prompt) is queried by Tauri but maintained in a dedicated frontend `usePermissionsStore`.
- **Graceful Degradation**: If microphone access is denied, the product gracefully demotes live Coach features, showing an educational prompt without throwing uncaught exceptions. It distinguishes between "device unavailable" and "permission denied."
- **Separation**: Permissions are treated differently from standard product preferences. They reflect strict OS state that might change externally.

---

## 4. Audio I/O Architecture
Riff Radio has complex, competing audio requirements that must remain distinct:

- **Shared Playback System**: A centralized `AudioPlayerService` responsible for Studio previews, Library playback, and Radio. It manages its own WebAudio contexts and volume/ducking logic.
- **Coach Live Input System**: A dedicated `AudioCaptureService` handling `getUserMedia()`, microphone streams, low-latency buffering (16kHz PCM), and visualizer analysis nodes.
- **Coach Live Output System**: An `AudioPlaybackService` tailored for real-time Live API TTS responses. It manages barge-in flush mechanisms and latency masking.
- **Boundary Rules**: Generation audio (Lyria output) never mixes logical pathways with Live API PCM streams. They might share the device hardware, but orchestrators remain fundamentally distinct.

---

## 5. Filesystem, Export, and Local Persistence Guidance
Riff Radio projects have real value, which necessitates trustworthy local storage.

- **Persistence**: Project configurations, metadata, and artifacts are stored in the OS-designated AppData directory, bridged via Tauri FS commands.
- **Exports**: When a user exports a track, Tauri is invoked to write standard file types (WAV/MP3, Stems, lyric sheets) to a user-defined export folder.
- **Reveal in Folder**: Tauri exposes native functionality to "Show in Finder/Explorer", completing the loop of feeling like a real desktop application.
- **Separation**: The internal app storage layer (opaque, fast) is conceptually decoupled from external export behavior (transparent, user-accessible).

---

## 6. App Lifecycle and Continuity Guidance
A desktop app should restore context rather than behaving like a refreshed browser tab.

- **Restoration**: On boot, the product attempts to restore the last active Workspace/Project, window dimensions, and cached library state via local configuration.
- **Transient vs Persistence**: While the chosen project restores, ephemeral states like an active Live Coach connection or a specific modal flow are cleanly torn down. We do not re-establish stateful WebSockets unprompted.

---

## 7. Release and Packaging Assumptions
The architecture assumes an ecosystem ready for bundled releases.

- **Packaging**: Tauri handles building universal binaries (macOS, Windows).
- **Versioning**: Semantic versioning is piped down to the UI. The application uses proper asset bundling patterns avoiding hardcoded localhost URLs in production.
- **Readiness**: All sensitive AI integration endpoints and logic should be modularized, ensuring the app remains stable even if a particular remote service transitions into maintenance.

---

## 8. Failure and Resilience Rules
Native behavior encounters messy OS environments and must handle them durably.

- **No Device Found**: Audio systems emit clear, predictable "NO_DEVICE" events rather than crashing WebAudio API.
- **Write Failures**: Export pipelines catch permissions errors gracefully (e.g., "Cannot write to directory, please choose another").
- **Tauri Bridging Errors**: Any failed IPC call between React and Tauri degrades smoothly to a known error state.

---

## 9. Anti-Patterns to Avoid
- **DO NOT** execute file operations directly in UI button `onClick` handlers; pass through an abstraction layer.
- **DO NOT** mix Coach live session socket handling tightly to the OS device capture.
- **DO NOT** treat Tauri as a generic backend dumping ground for all product business rules.
- **DO NOT** build a "browser app" disguised as desktop where permission and file writes are fake or insecure.
- **DO NOT** store API secrets or keys in plaintext frontend Javascript bundles expected to be publicly released.
