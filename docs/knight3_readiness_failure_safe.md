# Knight 3: Final Readiness / Failure-Safe Pass

**Status:** Canonical — final readiness and resilience document

This document evaluates whether Riff Radio is ready to be trusted, demonstrated, and used with confidence — especially when conditions are imperfect. It identifies fragility risks, missing fallback behaviors, and the highest-priority fixes needed to make the product feel stable, recoverable, and real.

---

## 1. Overall Readiness Verdict

**Riff Radio is architecturally sound and feature-complete for a serious demo.** The domain model is well-structured, the service layers are cleanly separated, the flagship experiences (Studio and Coach) have real implementations with real Google AI integration, and the product's feature hierarchy is clear.

**The main readiness gaps are in edge-case handling, state resilience, and graceful degradation.** The happy path through Studio creation, Track Details inspection, Coach practice, and Library browsing works. The unhappy paths — generation failures, connection drops, missing data, and permission denials — need explicit handling to prevent the product from feeling brittle under demo conditions or real use.

**Verdict:** Ready to demo with moderate risk. The high-priority fixes below would reduce that to low risk.

---

## 2. Strongest Readiness/Trust Qualities

These already make the product feel reliable:

1. **Clean architectural separation.** The four-layer Coach architecture (UI, Orchestrator, Audio Infrastructure, Transport) means failures in one layer don't cascade. The WebSocket can reconnect without crashing the UI. Audio can fail without losing session state.

2. **Explicit session lifecycle.** The Coach session has defined states (`idle` → `connecting` → `listening` → `coaching` → `paused` → `finalizing` → `error`) with clear transitions. This is far more resilient than implicit boolean state management.

3. **Generation context snapshots.** Every generation run captures a full `GenerationContextSnapshot` that freezes the exact blueprint, source set, and interpretation at generation time. This means generation results are always explainable and reproducible, even if the project state changes later.

4. **Domain type safety.** The domain model (`Project`, `Blueprint`, `BlueprintDraft`, `TrackVersion`, `SourceInput`, `GenerationRun`, etc.) is fully typed with clear contracts. This prevents the most common class of "mysterious undefined" failures.

5. **Gemini fallback interpretation.** If the Gemini interpretation call fails, `createInterpretationSnapshot()` produces a heuristic fallback using source-type hint tables. The Studio pipeline doesn't break — it just produces lower-confidence signals.

6. **Practice session persistence.** Coach sessions are finalized and saved to localStorage with proper caps (50 per project). This creates a durable practice history that survives app restarts.

---

## 3. Biggest Fragility Risks

These are the areas most likely to weaken perceived quality if unresolved:

### Risk 1: Generation failure with no recovery path

**Issue:** If `generateTrack()` fails (Lyria API error, timeout, malformed response), the `GenerationRun` should transition to `status: 'failed'`. The current implementation in `useStudioStore.startGeneration` does attempt to handle this, but the UI must clearly surface the failure and offer retry without losing the committed blueprint or source context.

**Impact:** Generation is the product's core moment. A failure here with no clear recovery is the highest-trust-risk scenario.

### Risk 2: Live API connection instability during Coach demo

**Issue:** The Live API WebSocket can close unexpectedly due to session timeouts, network hiccups, or server-side limits. The `LiveConnectionClient` has reconnect logic (3 attempts, 1.5s backoff), but if all reconnects fail, the session enters `error` state. The UI needs a clear, non-panic recovery path.

**Impact:** Coach is the second flagship. A connection failure during a live demo would be very visible.

### Risk 3: Microphone permission denial or device absence

**Issue:** The Coach page has a microphone permission overlay, which is good. But the transition from permission-denied to session-ready needs to be smooth. If the user grants permission in OS settings and returns to the app, the permission state should re-check automatically.

**Impact:** If the demo machine has microphone issues, the Coach experience is completely blocked without a workaround.

### Risk 4: Mock data gaps and stale references

**Issue:** Several pages rely heavily on mock data (`LIBRARY_PROJECTS`, `RADIO_*`, `EXPLORE_*`, `EXPORT_*`). If mock data is incomplete, inconsistent, or creates broken references (e.g., a project ID in mock data that doesn't exist in the project store), the app may show empty states or navigation failures.

**Impact:** Broken mock references during a demo undermine the "real product" impression.

### Risk 5: Spotify disconnection mid-demo

**Issue:** If Spotify auth expires or fails during the demo, any Spotify-dependent UI (source picker, radio seeding, settings integration status) should degrade gracefully. The product should not show error states on pages that don't require Spotify.

**Impact:** Low — Spotify is supporting, not flagship. But stale error indicators in Settings would hurt the polish impression.

---

## 4. Highest-Priority Failure-Safe Improvements

### Fix 1: Explicit generation failure UI with retry (Critical)

**What:** When `generateTrack()` fails, the Studio generation workspace should show:
- A clear "Generation failed" message (not a generic error)
- The reason if available (API error, timeout, invalid request)
- A "Retry" button that re-submits the same generation context
- Preservation of the committed blueprint, source set, and all project state

**Why:** Generation is the #1 product moment. A failure with no recovery feels like a broken product.

**Where:** `useStudioStore.startGeneration` error handling → `GenerationWorkspace` UI.

### Fix 2: Coach session error recovery UI (Critical)

**What:** When the Coach session enters `error` state (connection failed, reconnect exhausted), the Live Performance Stage should show:
- A clear "Session disconnected" or "Connection lost" message
- A "Retry" button that starts a new session (not reconnect — full restart)
- Preservation of any practice history already captured
- Guidance if the error is persistent ("Check your internet connection")

**Why:** Coach is the #2 product moment. A connection failure should feel recoverable, not terminal.

**Where:** `LivePerformanceStage` error state rendering.

### Fix 3: Permission state auto-refresh (High)

**What:** `useDevicePermissionsStore` should re-check microphone permission:
- On Coach page mount (already happens)
- On page visibility change (when user returns from OS settings)
- After a configurable interval during the permission overlay

**Why:** If the user grants permission in System Preferences while the Coach page is open, the UI should detect the change without requiring a page refresh.

**Where:** `useDevicePermissionsStore.checkMicrophonePermission` with `visibilitychange` listener.

### Fix 4: Mock data consistency audit (High)

**What:** Audit all mock data references to ensure:
- Every `projectId` in mock data corresponds to a real project in `LIBRARY_PROJECTS`
- Every version reference is valid
- Export bundles reference valid projects
- Radio and Explore mock data has no broken internal references
- The "active project" used by Home page CTAs always resolves

**Why:** Broken references during a demo create the impression of a buggy product.

**Where:** `src/mocks/mock-data.ts` and all consumers.

### Fix 5: Graceful degradation when no project data exists (Medium)

**What:** Every page that depends on project data should handle the "no projects" case:
- Home: Show "Start Creating" as the primary state, not as a secondary CTA
- Library: Show a purposeful empty state with a creation CTA
- Track Details: Redirect to Home if the project doesn't exist (already partially implemented)
- Coach: Redirect to Library if no project is selected (already partially implemented)
- Exports: Show "No exports yet" with guidance

**Why:** During demo setup or on a fresh app, the product should feel intentional, not broken.

**Where:** Each page component's data-loading logic.

### Fix 6: Spotify degradation without pollution (Medium)

**What:** When Spotify is disconnected:
- Settings > Integrations shows "Not connected" with a "Connect" button (not an error state)
- Create/Studio source panel shows the Spotify source type as available but indicates "Connect to use"
- Radio works without Spotify seeds
- No error indicators appear on pages that don't require Spotify

**Why:** Spotify should degrade to "unavailable" not "broken."

**Where:** `useIntegrationStore` consumers, Spotify-dependent UI surfaces.

---

## 5. Workflow-Specific Failure-Safe Notes

### Studio / Generation

| Scenario | Current | Needed |
|---|---|---|
| Source interpretation fails | Falls back to heuristic snapshot | Correct — ensure fallback is visually indicated ("Basic interpretation — connect to AI for better results") |
| Blueprint commit with no changes | No-op (correct) | Correct |
| Generation API error | Caught in store, error state | Need explicit UI: "Generation failed" + retry button |
| Generation timeout | Not explicitly handled | Add client-side timeout (60-90s) with "Taking longer than expected" indicator |
| User navigates away during generation | Generation continues (no cancellation) | Acceptable for v1. Show "Generation in progress" if user returns. |
| Partial generation result | Not handled | Treat as failure — do not create a TrackVersion from partial results |

### Track Details

| Scenario | Current | Needed |
|---|---|---|
| Version has no insight (summarization failed) | Shows raw blueprint metadata | Correct — ensure the UI doesn't show blank tabs |
| Version has no lyrics | Lyrics tab shows "No lyrics available" | Correct |
| Version has no structure/chords | Tab shows placeholder | Ensure Chords and Melody tabs degrade gracefully |
| Project not found | Redirects via route guard | Correct |

### Coach / Practice

| Scenario | Current | Needed |
|---|---|---|
| Mic permission denied | Permission overlay shown | Correct — ensure it re-checks on visibility change |
| No microphone device | `getUserMedia` rejects, error state | Need specific "No microphone found" message (distinct from permission denied) |
| Practice brief generation fails | Session aborts | Should attempt session with a generic brief fallback |
| WebSocket fails to open | Reconnect logic + error | Correct — ensure error UI has retry |
| WebSocket disconnects mid-session | 3 reconnect attempts | Correct — ensure UI shows "Reconnecting..." during attempts |
| All reconnects fail | Error state | Need clear "Session ended — start new session?" UI |
| Audio decode failure (coach TTS) | Silently dropped | Correct — text feedback still arrives |
| User switches away from Coach | disconnectSession on unmount | Correct — session finalized |
| Session has no transcript | No practice session saved | Correct |

### Library

| Scenario | Current | Needed |
|---|---|---|
| No projects | Shows empty grid | Need purposeful empty state with "Create your first song" CTA |
| Project deletion | Not implemented | Acceptable for v1 — projects are persistent |
| Search with no results | Shows empty state | Ensure "No results" message is specific, not blank |

### Radio

| Scenario | Current | Needed |
|---|---|---|
| No stations | Shows mock data | For demo: ensure mock data always provides at least one station |
| Station playback fails | Uses global playback store | Ensure playback failure shows "Track unavailable" rather than hanging |
| Spotify not connected for seeding | Radio should work without Spotify | Ensure station creation doesn't require Spotify |

### Explore / Community

| Scenario | Current | Needed |
|---|---|---|
| Mock data loads | Content appears | Ensure all mock data references resolve |
| Navigation to project | Uses `resolveProjectId` | Ensure resolution never returns an invalid ID |

### Exports

| Scenario | Current | Needed |
|---|---|---|
| Export folder doesn't exist | Tauri write fails | Need folder-not-found detection with folder picker fallback |
| Export write permission denied | Tauri error | Need "Cannot write to this directory" message |
| No exports available | Shows mock data | Ensure mock data provides realistic export state |
| Reveal-in-folder for deleted file | OS behavior (varies) | Acceptable — OS handles gracefully |

### Settings / Integrations

| Scenario | Current | Needed |
|---|---|---|
| Spotify auth fails | Error state in integration store | Ensure UI shows "Connection failed — try again" not a raw error |
| Spotify token refresh fails | `auth_required` status | Ensure "Reconnect" button is prominent |
| Audio device unavailable | Static display currently | Future: dynamic device enumeration with "No device" state |
| Settings save failure | LocalStorage write | Add try-catch with "Settings couldn't be saved" toast |

### App Shell / Desktop

| Scenario | Current | Needed |
|---|---|---|
| App restart | Persisted stores reload | Ensure no stale session state persists (Coach sessions, generation runs) |
| Window resize | Responsive layouts | Ensure three-column layouts don't break below minimum widths |
| First launch | Empty project store | Ensure Home page looks inviting, not broken |

---

## 6. Demo-Safe Recommendations

### Pre-demo checklist

1. **Verify Google API key is valid and has sufficient quota.** A rate-limited or expired key during a demo is catastrophic.
2. **Verify Spotify is connected** (if Spotify will be shown). Do a test refresh before the demo.
3. **Verify microphone permission is granted** on the demo machine. Test Coach connection before the demo.
4. **Pre-populate at least 2-3 projects** in the Library with realistic names, versions, and metadata. The app should not look fresh-installed.
5. **Test the full Studio generation flow** before the demo. Confirm Lyria responds and generates audio.
6. **Test Coach session start** before the demo. Confirm the Live API connects and the mic streams.
7. **Have a backup narrative** if generation or Coach fails. "Let me show you a previously generated project" is better than fumbling with retry.

### Mock data readiness

- Ensure `LIBRARY_PROJECTS` includes the "active" project that Studio and Coach reference
- Ensure Radio has a playable station with realistic track names
- Ensure Explore has varied, realistic trending content
- Ensure Exports has at least one completed bundle with realistic assets

### Fallback strategies

| Failure | Fallback |
|---|---|
| Lyria generation fails during demo | Show a pre-generated project from Library. "Let me show you one we prepared earlier." |
| Coach connection fails | Show the Coach UI state (transcript panel with past feedback events from mock). Explain the session architecture. |
| Spotify connection fails | Skip Spotify in the demo. It's supporting, not essential. |
| Microphone not working | Show Coach in idle state, explain the session model, show the permission flow UI. |
| Radio playback fails | Skip Radio or show it briefly as a visual surface. |

---

## 7. Final Trust/Readiness Guidance

After applying the high-priority fixes, the product should feel:

**Stable:** Errors are caught, surfaced, and recoverable. No unhandled exceptions crash the UI. No blank pages from missing data.

**Trustworthy:** The user's work is preserved even when operations fail. Generation failures don't lose the blueprint. Session disconnections don't lose the practice history. Permission denials don't break unrelated features.

**Recoverable:** Every error state has a clear "what to do next" — retry, reconnect, choose again, go back. No dead ends.

**Honest:** The product communicates its state clearly. Loading states show progress. Connecting states show activity. Error states explain what happened. The product never appears to freeze or hang without explanation.

**Hierarchically appropriate:** Failures in supporting features (Radio, Explore, Spotify) never impact flagship features (Studio, Coach, Track Details). The product's trust hierarchy matches its feature hierarchy.

**Desktop-serious:** The product feels like an installed application, not a web page. Data persists. Exports write real files. Permissions are handled explicitly. The app opens to a meaningful state.

This is the standard: **a product that feels ready to use, even when the world is imperfect.**
