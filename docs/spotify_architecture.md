# Spotify Auth and Integration Architecture

## 1. Spotify's Role in the System
Spotify acts as a powerful supporting integration in Riff Radio. Its primary role is to provide real-world reference material (tracks, playlists, and taste profiles) that influence AI music creation, radio seeding, and personalization. 

Spotify is **not** the main product engine, nor does it replace the native Riff project system. It exists alongside the app's native content to provide inspiration and context, but the native artifacts (blueprints, source inputs, versions, practice sessions) always remain the primary currency of the application. 

**What Spotify Supports:**
- Track reference during creation
- Playlist-based taste import
- Inspiration and vibe guidance
- Radio station seeding
- Personalization support
- Login/account convenience

**What Spotify Does NOT Own:**
- Native project objects or generated songs
- Blueprints or song versions
- Practice sessions or export bundles

---

## 2. Auth Architecture
Because Riff Radio is a Tauri desktop application, auth cannot rely on standard web-based cookie sessions. 

- **Conceptual Flow**: Auth uses an OAuth PKCE flow launched via the Tauri shell (or an in-app browser). Upon success, the redirect URI returns an authorization code back to the desktop shell, which exchanges it for access and refresh tokens.
- **Token Storage**: Tokens must be securely stored using OS-level keychains or encrypted local storage (via a Tauri plugin), not exposed in raw React state or `localStorage`.
- **State Exposure**: The auth subsystem owns token refresh and lifecycle but only exposes an opaque `connectionStatus` (e.g., `connected`, `disconnected`, `error`, `refreshing`) and a generic `IdentityProfile` to the frontend React layer. Feature pages react to this status rather than dealing with raw tokens.

---

## 3. Data Categories and Modeling Rules
The app interacts with several categories of Spotify data. These should be treated as external references, never conflated with Riff’s native entities.

- **Essential Data**: Connected account identity summary (name, avatar, connection health).
- **Reference Data**: Track metadata (URI, title, artist, BPM/Key features if available) and Playlist metadata.
- **Ephemeral Data**: Search results, temporary playlist item fetches.
- **Rules of Reference**: When a user selects a Spotify track to influence a song, the app stores a `SpotifyReference` object (holding URI, snapshot name, and artist) inside the creation payload. It does *not* attempt to store the Spotify audio or pretend the track belongs to the user's local projects.

---

## 4. Creation-Flow Integration Rules
In the Home + Create and Studio workflows, Spotify serves as a critical "Vibe" or "Reference" input.

- **Input Assembly**: A user can drop a Spotify track or playlist into the multi-input assembly alongside native hums, lyrics, or chords.
- **Influence Modeling**: The `SpotifyReference` is passed to the AI blueprint modeling layer as contextual metadata (e.g., "Analyze the vibe of spotify:track:123 and derive stylistic tags"). The output is a native Riff blueprint that has been influenced by Spotify, severing the rigid link to the external track once generation begins.
- **Bounded Presence**: The Spotify picker UI is encapsulated in a dedicated modal or side-panel. It outputs standard reference objects that the Studio consumes without knowing how to query Spotify directly.

---

## 5. Radio Integration Rules
Spotify enhances the app's Radio feature by offering external seed sources.

- **Seeding**: A Radio station can be seeded by an imported Spotify playlist or taste profile.
- **Decoupling**: The station stores a reference to the Spotify seed, but the playback queue and station behavior rely on Riff Radio's internal logic and Lyria-generated content where appropriate.
- **Taste Translation**: Spotify taste data is used as a generic signal (e.g., "User likes upbeat synthwave") which the Radio module uses to select native Riff tracks or generate matching ambient cues.

---

## 6. Settings/Integration Ownership Rules
Settings and integration health belong in the user preferences layer.

- **Visibility**: The Settings page displays the Spotify connection status, last sync timestamp, and options to connect/disconnect.
- **Preference Storage**: User choices like "Default Spotify Playlist for Radio" are stored in the local settings database. The live per-page usage state (e.g., "Current Spotify track being previewed in Studio") lives in transient route-local state.

---

## 7. Persistence and Caching Philosophy
As a desktop app, Riff Radio should feel fast and resilient.

- **Locally Persisted**: Account connection status, refresh tokens, high-level taste summaries, and user selected default preferences.
- **Cached for Smoothness**: Recent searches, favorite playlist snapshots (metadata only). This cache should use standard TTLs and never be treated as authoritative data.
- **On-Demand**: Full playlist fetching, search queries, track analysis. If offline, the app degrades gracefully, showing cached references where possible but disabling live searches.

---

## 8. State Boundary Rules
- **Integration Module**: Owns the Spotify API client, auth lifecycle, token refreshing, and fetch logic.
- **Project/Source Domain**: Only stores `SpotifyReference` metadata (URIs, names) as part of a `SourceInput`.
- **UI Pages**: React components call agnostic hooks like `useSpotifySearch` or `useConnectSpotify`. They never manage tokens or raw API headers directly.

---

## 9. Failure and Recovery Guidance
- **Token Expiry/Failure**: The integration module silently attempts a refresh. If it fails, the global connection status updates to `auth_required`. The UI gracefully prompts the user to reconnect without crashing the current workflow.
- **Fetch Failures**: If playlist items fail to load, display an empty state or generic network error boundary localized to the picker.
- **Stale References**: If a previously saved Spotify track URI is deleted from Spotify, the Studio simply displays "Unknown Reference Track" but proceeds with the generation based on the natively derived blueprint data already securely saved.

---

## 10. Anti-Patterns to Avoid
- **DO NOT** make Spotify the center of the product architecture across all pages.
- **DO NOT** store complete Spotify track data or audio files as native project artifacts.
- **DO NOT** scatter Spotify API fetch calls and token management across React components.
- **DO NOT** make the Radio feature so dependent on Spotify that it breaks if the user logs out.
- **DO NOT** confuse a cached playlist snapshot with the canonical project Library.
