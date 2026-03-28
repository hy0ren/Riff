# Spartan 6: Spotify Auth and Integration Architecture

**Status:** Canonical — supersedes `spotify_architecture.md`

This document defines the complete Spotify authentication and integration architecture for Riff Radio. It specifies how Spotify should be integrated into the product as a bounded, modular subsystem that meaningfully supports creation, personalization, radio, and convenience without becoming the architectural center of the application.

---

## 1. Spotify's Role in the System

### What Spotify supports

Spotify serves five bounded roles in Riff Radio:

1. **Track reference for creation**: Users can select a Spotify track as a source input in the Studio multi-input system. The track's metadata (title, artist, genre, BPM, key, mood) influences blueprint generation through Gemini's interpretation pipeline.

2. **Playlist-based taste import**: Users can import a playlist to derive aggregate taste signals (preferred genres, tempos, moods, energy levels). These signals influence blueprint defaults and radio personalization.

3. **Inspiration and vibe guidance**: Spotify references provide concrete musical anchors ("make it sound like this track") that Gemini interprets into structured blueprint parameters.

4. **Radio station seeding**: Imported playlists and taste profiles can seed Radio stations, providing personalization context for station generation and track selection.

5. **Account/integration convenience**: A connected Spotify account provides identity context and integration presence in Settings, making the product feel connected to the user's existing music ecosystem.

### What Spotify does not own

Spotify references are external metadata. They are never promoted to first-class project assets:

| Riff Radio owns | Spotify does not touch |
|---|---|
| `Project` objects | Spotify does not create or modify projects |
| `Blueprint` and `BlueprintDraft` | Spotify data enters only through interpretation → draft pipeline |
| `TrackVersion` and generated audio | Spotify audio is never stored or played as native content |
| `PracticeSession` records | Spotify has no role in coaching |
| `ExportBundle` artifacts | Spotify references are not included in exports |
| `SourceSet` and `SourceInput` | Spotify tracks become `SourceInput` items of kind `spotify_track_reference`, but these reference external metadata, not owned audio |

### The architectural boundary

The product must make it impossible to confuse a Spotify reference with a Riff Radio project asset. Spotify references carry external identity (Spotify URI, snapshot metadata) and are mediated through the interpretation pipeline before influencing generation. They do not appear in Lyria generation requests directly. They do not appear as owned songs in the Library. They do not replace native playback.

---

## 2. Authentication Architecture

### OAuth flow for desktop

Riff Radio is a Tauri desktop application. Spotify auth uses the OAuth 2.0 Authorization Code with PKCE flow, adapted for desktop:

1. **Initiation**: User clicks "Connect Spotify" in Settings > Integrations. The app generates a PKCE code verifier and challenge.

2. **Authorization**: The app opens the Spotify authorization URL in a system browser or in-app browser view. The URL includes `client_id`, `redirect_uri`, `code_challenge`, `code_challenge_method`, `scope`, and `state`.

3. **Redirect handling**: The `redirect_uri` points to a local route (`/spotify-callback`). When Spotify redirects, the `SpotifyCallbackPage` captures the authorization code from URL parameters.

4. **Token exchange**: The app exchanges the authorization code (plus code verifier) for access and refresh tokens via Spotify's token endpoint.

5. **Token storage**: Tokens are stored in the integration store's persistent layer. In the current implementation, this uses the Zustand store persisted to localStorage. Future hardening should move tokens to OS-level secure storage via a Tauri keychain plugin.

6. **Session ready**: The integration store updates to `connected` status and stores the user's profile summary.

### Token lifecycle

| Event | Behavior |
|---|---|
| Token valid | All Spotify API calls proceed normally |
| Token expired | The Spotify gateway silently attempts a refresh using the refresh token before retrying the original call |
| Refresh fails | Connection status transitions to `auth_required`. The UI prompts the user to reconnect. No crash, no cascade. |
| User disconnects | Tokens are cleared. Connection status transitions to `disconnected`. All cached Spotify data is marked stale but not deleted (the user may reconnect). |
| User revokes | Same as disconnect — the next API call fails, refresh fails, status transitions to `auth_required`. |

### Auth subsystem ownership

The auth subsystem is contained in:
- `useIntegrationStore` — owns connection status, profile, token lifecycle state
- `spotify-gateway.ts` — owns token exchange, refresh, and all API calls
- `spotify/client.ts` — owns HTTP transport to Spotify API

The auth subsystem exposes to the rest of the app:
- `connectionStatus`: `'connected'` | `'disconnected'` | `'connecting'` | `'auth_required'` | `'error'`
- `spotifyProfile`: `{ displayName, avatarUrl, email }` or null
- `isSpotifyConnected`: derived boolean

The auth subsystem does not expose raw tokens, refresh logic, or HTTP headers to any feature module or UI component.

### Auth isolation from feature logic

No page component, store, or service outside the Spotify integration module should:
- Read or write tokens
- Call Spotify API endpoints directly
- Construct Spotify authorization URLs
- Handle token refresh logic

All Spotify data access goes through `spotify-gateway.ts` functions that internally handle auth, refresh, and error recovery.

---

## 3. Data Categories and Modeling

### Essential data

| Category | Description | Example |
|---|---|---|
| Account identity | Connected user's display name and avatar | `{ displayName: "Alex", avatarUrl: "..." }` |
| Connection status | Auth lifecycle state | `'connected'` |

### Reference data (important, persisted locally)

| Category | Description | Persistence |
|---|---|---|
| Track references | Spotify URI + snapshot metadata (title, artist, album, BPM, key) for tracks used as source inputs | Persisted as part of `SourceInput` in project data |
| Playlist references | Spotify URI + snapshot metadata (name, track count, owner) for playlists used as seed sources | Persisted in settings/preferences |
| Taste summaries | Aggregate genre/mood/energy profile derived from imported playlists | Persisted in settings as a snapshot with timestamp |

### Ephemeral data (fetched on demand, never persisted)

| Category | Description |
|---|---|
| Search results | Live search queries against Spotify API |
| Playlist item lists | Full track lists for a playlist (fetched when browsing) |
| Track audio features | Spotify's audio analysis data (tempo, valence, etc.) — fetched during interpretation |

### Modeling rules

1. **Track references** are stored as `SourceInput` items with `kind: 'spotify_track_reference'`. They carry a Spotify URI, snapshot title, snapshot artist, and optionally audio features. They do not carry audio data.

2. **Playlist references** are stored as lightweight objects (`{ spotifyUri, name, trackCount, snapshotId, importedAt }`). They are used for radio seeding and taste derivation.

3. **Taste summaries** are derived artifacts, not raw Spotify data. They are generated by analyzing a playlist's tracks and producing aggregate signals (top genres, average BPM range, mood distribution). The summary is a Riff Radio object; it does not reference individual Spotify tracks.

4. **Staleness**: All Spotify-derived data is inherently a snapshot. Playlists change, tracks are removed, audio features may be updated. Locally stored references should carry `importedAt` timestamps. The product treats these as "best available" and degrades gracefully if the underlying Spotify content has changed.

---

## 4. Creation-Flow Integration

### How Spotify enters the creation pipeline

Spotify references enter the Studio's multi-input source system as one of many possible source types. The flow:

1. **Selection**: In the Create page or Studio source panel, the user opens a Spotify picker (search or browse). They select a track or playlist.

2. **SourceInput creation**: The selected track becomes a `SourceInput` with `kind: 'spotify_track_reference'`, carrying the Spotify URI and snapshot metadata. A selected playlist is decomposed into individual track references or used as an aggregate taste signal.

3. **Source assembly**: The Spotify reference is added to the active `SourceSet` alongside other source inputs (hums, lyrics, chord progressions, uploads, etc.).

4. **Interpretation**: When `interpretSourceSet()` is called, Gemini receives all source inputs including the Spotify reference. Gemini interprets the reference's metadata (genre, BPM, key, mood) as influence signals, producing `InterpretationSignal[]` with `sourceInputIds` provenance linking back to the Spotify reference.

5. **Blueprint influence**: Interpreted signals from Spotify references merge into the `BlueprintDraft` as `inferred` origin values, subject to the same locked-field and user-override rules as any other interpretation signal.

6. **Generation**: When the draft is committed and Lyria generates, the `LyriaGenerationRequest` contains the committed `Blueprint` and the interpretation summary. Spotify URIs do not appear in the Lyria request. The influence is fully mediated.

### Bounded presence

The Spotify picker is a self-contained UI surface (modal or panel) that:
- Calls `spotify-gateway.ts` for search/browse
- Handles loading, empty, and error states internally
- Outputs standard `SourceInput` objects that the Studio consumes

The Studio source panel accepts `SourceInput` items regardless of their kind. It does not know how to query Spotify. The Spotify picker does not know how to assemble blueprints. The boundary is clean.

### Influence mediation

Spotify-derived influence reaches the blueprint only through the interpretation pipeline. This means:
- No Spotify-specific fields exist on `Blueprint` or `BlueprintDraft`
- No Spotify API calls happen during generation
- No Spotify URIs appear in generation context snapshots (only the interpreted signals and their provenance)
- If Spotify is disconnected, previously saved references still work (their metadata is snapshotted locally)

---

## 5. Radio Integration

### How Spotify supports Radio

Spotify influences Radio through two paths:

1. **Playlist-seeded stations**: A user selects an imported Spotify playlist as the seed for a Radio station. The station definition stores a reference to the playlist (URI + snapshot metadata). The Radio system uses the playlist's aggregate characteristics (genre, tempo, mood) to select and generate station content.

2. **Taste-based personalization**: Imported taste summaries (derived from playlists) provide a baseline preference profile that the Radio system uses for station recommendations and track selection.

### Station seed modeling

A station seed referencing Spotify should be structured as:

```
{
  seedType: 'spotify_playlist',
  spotifyUri: 'spotify:playlist:...',
  snapshotName: 'My Chill Mix',
  derivedSignals: { genres: [...], avgBpm: 95, mood: 'chill' },
  importedAt: '2026-03-28T...'
}
```

The station's runtime behavior uses `derivedSignals`, not the Spotify API. After import, the station is self-sufficient. If the Spotify playlist is later deleted or the user disconnects Spotify, the station continues to function with its derived signals.

### Spotify is not required for Radio

Radio must function independently of Spotify. Stations can be created from:
- Native Riff Radio projects (genre, mood, BPM)
- Manual genre/mood selection
- Imported Spotify taste signals

If Spotify is not connected, Radio simply lacks the Spotify-seeded station option. All other Radio functionality remains unaffected.

---

## 6. Settings and Integration Ownership

### What lives in Settings > Integrations

- Spotify connection status badge (`connected` / `disconnected` / `error`)
- Connect / Disconnect buttons
- Connected account profile (name, avatar)
- Last sync timestamp
- Import actions (sync playlists, refresh taste profile)
- Sync health indicators

### What lives in user preferences

- Default Spotify playlist for radio seeding (optional)
- Taste profile sync preferences (auto-sync on connect, manual only)
- Playlist cache refresh interval preference

### What lives in route-local UI state

- Current Spotify search query in a picker modal
- Currently browsing playlist items
- Selected track in the picker (before confirming as a source input)

### What does not belong in Settings

- Spotify API call logic (belongs in `spotify-gateway.ts`)
- Token refresh logic (belongs in the auth subsystem)
- Source input creation logic (belongs in the Studio/Create feature)
- Radio station generation logic (belongs in the Radio feature)

---

## 7. Persistence and Caching

### Locally persisted (durable across app restarts)

| Data | Where | Why |
|---|---|---|
| Connection status | `useIntegrationStore` (persisted) | Reconnect on app restart |
| Auth tokens | Integration store (future: OS keychain) | Session continuity |
| Connected profile | Integration store | Display without re-fetching |
| Imported playlist references | Settings/preferences | Radio seeding, quick access |
| Taste summary snapshots | Settings/preferences | Personalization without re-fetching |
| `SourceInput` references with Spotify URIs | Project data (via `useProjectStore`) | Source provenance |

### Cached for smoothness (refreshable, not authoritative)

| Data | TTL strategy | Fallback if stale |
|---|---|---|
| Recent search results | 5-minute TTL | Re-fetch on next search |
| Playlist item snapshots | 1-hour TTL | Show stale with "last updated" indicator |
| Track audio features | Per-project session | Re-fetch on next interpretation |

### Fetched on demand (never cached)

- Full playlist track lists (too large and volatile to cache)
- Spotify profile refresh
- Token exchange/refresh responses

### Staleness philosophy

The app treats Spotify data as external truth that can become stale. Cached snapshots carry timestamps and are never treated as authoritative. When freshness matters (e.g., during active interpretation), the gateway fetches live data. When convenience matters (e.g., displaying a previously imported playlist name), cached snapshots are acceptable.

---

## 8. State Boundaries and Ownership

### Where Spotify state lives

| Concern | Owner | Boundary |
|---|---|---|
| Auth tokens, connection status, profile | `useIntegrationStore` | Integration module |
| Spotify API calls, token refresh | `spotify-gateway.ts` | Provider layer |
| HTTP transport | `spotify/client.ts` | Service layer |
| Saved playlist references | User preferences/settings | Settings module |
| Taste summary snapshots | User preferences/settings | Settings module |
| `SourceInput` items referencing Spotify | `useProjectStore` / project data | Project domain |
| Radio station seeds referencing Spotify | Station definition in Radio state | Radio module |
| Picker search/browse state | Route-local component state | Ephemeral UI state |

### What must not be duplicated

- Spotify connection status should be read from `useIntegrationStore` by any feature that needs it. It should not be re-derived or cached in feature-specific stores.
- Track reference metadata (URI, title, artist) should be stored once on the `SourceInput` object. It should not be separately cached in a "Spotify tracks" store.
- Taste summaries should be stored once in settings. Radio reads them from there; it does not maintain its own copy.

---

## 9. Separation from Core Product Systems

### Hard boundaries

| Core system | Spotify's relationship | Boundary rule |
|---|---|---|
| Project system | Spotify tracks become `SourceInput` items. They do not become projects, versions, or blueprints. | `SourceInput.kind: 'spotify_track_reference'` is the only contact point. |
| Source input system | Spotify references are one of many source types. The source system treats them identically to other reference inputs. | No Spotify-specific logic in source assembly or interpretation dispatch. |
| Blueprint system | Spotify influence enters through interpretation signals. No Spotify-specific fields on `Blueprint`. | Interpretation mediates all influence. |
| Generation pipeline | Lyria never sees Spotify URIs or metadata. It receives a committed Blueprint and an interpretation summary. | Complete mediation through the draft-commit pipeline. |
| Playback | Riff Radio does not play Spotify audio. The global playback system plays native generated audio. | No Spotify playback integration. |
| Coach / Practice | Coach reads from the project graph. Spotify references that influenced the blueprint are already baked in. Coach does not know about Spotify. | Zero coupling. |
| Exports | Export bundles contain native project artifacts. Spotify references are not exported. | Spotify is excluded from export assembly. |

### Preventing architectural drift

The risk of Spotify becoming too central is real because it's tempting to add "browse Spotify" features everywhere. The countermeasure:

1. All Spotify API access goes through `spotify-gateway.ts`. If a feature needs Spotify data, it calls a gateway function. It never calls the Spotify API directly.
2. Spotify reference objects carry a `spotifyUri` field that marks them as external. Domain logic should treat these as read-only metadata, never as mutable entities.
3. No feature outside the Spotify integration module should import from `src/services/spotify/client.ts`.
4. The integration store is the single source of truth for connection state. Features check `isSpotifyConnected` and degrade gracefully if false.

---

## 10. Desktop-Specific Concerns

### OAuth in a desktop environment

The OAuth flow launches a system browser for the authorization step, then captures the redirect via the app's registered URL scheme or local server. Tauri's shell capabilities handle the browser launch. The `/spotify-callback` route handles the return.

Desktop-specific considerations:
- The redirect URI must be registered in the Spotify developer dashboard and match the app's callback URL
- In development, this is `http://localhost:5173/spotify-callback`
- In production, this should use a custom URL scheme (`riff://spotify-callback`) registered via Tauri's deep-link capability
- PKCE eliminates the need for a client secret in the frontend, which is critical for a desktop-distributed application

### Secure token handling

Current implementation stores tokens in the Zustand store persisted to localStorage. This is acceptable for development but insufficient for release.

Production requirements:
- Access and refresh tokens should be stored in OS-level secure storage (macOS Keychain, Windows Credential Manager) via a Tauri plugin
- Tokens should never appear in frontend JavaScript bundle inspection
- The Zustand store should hold only the connection status and profile, not raw tokens

### Reconnect after app restart

On app launch, the integration store loads persisted connection status. If status was `connected`:
1. Attempt a silent token refresh
2. If successful, update status to `connected` and load the cached profile
3. If refresh fails, transition to `auth_required` — the user sees a "Reconnect" prompt, not an error

### Offline and disconnected states

If the network is unavailable:
- Connection status remains `connected` (tokens are valid, just not usable)
- Spotify picker shows "Offline" state
- Previously cached references and taste summaries remain available
- The product continues to function fully for all non-Spotify features

---

## 11. Failure and Recovery

| Failure | Behavior | User impact |
|---|---|---|
| Auth flow cancelled | No state change, user returns to Settings | None |
| Token exchange fails | Status → `error`, clear partial state, show retry | "Connection failed, try again" |
| Token refresh fails | Status → `auth_required`, show reconnect prompt | "Reconnect to Spotify" in Settings |
| Playlist fetch fails | Show error in picker, allow retry | "Couldn't load playlist, try again" |
| Track metadata fetch fails | `SourceInput` created with minimal metadata (URI only) | Interpretation may be less informed |
| Stale cached reference | Show cached data with "last updated" indicator | User sees slightly outdated playlist names |
| Spotify track deleted | `SourceInput` shows "Unknown Reference Track" | Interpretation proceeds with remaining sources |
| Account revoked externally | Next API call fails → refresh fails → `auth_required` | "Reconnect to Spotify" |
| Network error during sync | Sync marked as failed, cached data preserved | "Sync failed, using last known data" |

### Graceful degradation principle

Every Spotify failure degrades to "Spotify is unavailable." The core product (Studio, Coach, Library, Exports, Radio without Spotify seeds) continues to function completely. No Spotify failure should ever prevent the user from creating, practicing, or exporting music.

---

## 12. Anti-Patterns to Avoid

1. **Making Spotify the center of the product architecture.** Spotify is supporting infrastructure. Studio is the center.

2. **Storing Spotify tracks as native project songs.** Spotify references are external metadata snapshots, not owned content. They live on `SourceInput` objects, not in the Library as projects.

3. **Scattering Spotify auth and fetch logic across pages.** All Spotify API interaction goes through `spotify-gateway.ts`. No page component should import from `src/services/spotify/`.

4. **Coupling Studio source logic directly to Spotify API calls.** The Studio source panel accepts `SourceInput` items. The Spotify picker produces `SourceInput` items. They are decoupled by the `SourceInput` interface.

5. **Making Radio dependent on Spotify to function.** Radio must work without Spotify. Spotify is one of several possible station seed sources.

6. **Duplicating Spotify reference models across modules.** Track references live on `SourceInput`. Taste summaries live in settings. Playlist references live in settings. These are not duplicated in feature-specific stores.

7. **Confusing cached snapshots with authoritative data.** Cached Spotify data is stale by definition. It carries timestamps and is refreshable. It is never treated as ground truth.

8. **Allowing connection state to pollute unrelated stores.** `isSpotifyConnected` is read from `useIntegrationStore`. It is not duplicated into project stores, radio stores, or feature stores.

9. **Treating Spotify as the user's music library.** The user's library in Riff Radio is their project collection. Spotify is an external reference source.

10. **Embedding Spotify preview playback.** Riff Radio does not play Spotify audio. The product plays its own generated audio. Spotify references contribute influence, not content.

11. **Making Spotify connection mandatory for any core flow.** Creation, generation, coaching, export, and library all function without Spotify. Spotify enhances; it does not gate.
