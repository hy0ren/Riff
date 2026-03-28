# Lyria + Gemini Integration Architecture

This document defines the integration architecture for Lyria and Gemini inside Riff Radio. It is a binding reference alongside `guardian.md` and `coach_architecture.md`. All future Studio, generation, and intelligence work must follow this document.

---

## 1. Lyria Responsibilities

Lyria is the exclusive audio generation engine in Riff Radio. It renders full audio output from a prepared, committed musical context. It does not interpret, reason, or restructure inputs.

### What Lyria receives

Lyria receives a single `LyriaGenerationRequest` assembled from canonical project state:

| Field | Source | Purpose |
|---|---|---|
| `projectId` | Project | Scoping and persistence |
| `blueprint` | Committed `Blueprint` (not a draft) | Full musical recipe — tempo, key, mode, genre, mood, energy, instrumentation, structure, directives |
| `sourceSet` | Active `SourceSet` | Ordered, weighted, enabled source references |
| `sourceSummary` | `InterpretationSnapshot.summary` | Prose summary of what interpretation extracted from sources |
| `kind` | User selection | `base`, `refinement`, `alternate-mix`, `instrumental`, `acoustic`, `remix` |
| `refinementPrompt` | Optional user text | Freeform generation-time guidance (e.g., "make the chorus more aggressive") |
| `parentVersionId` | Optional | Links refinement/remix to an existing version |

### What Lyria produces

Lyria returns a `LyriaGenerationResult`:

| Field | Purpose |
|---|---|
| `providerRunId` | Provider-side run identifier for traceability |
| `summary` | Brief description of what was generated |
| `durationSeconds` | Length of the generated audio |
| `artifactMimeType` | Audio format (e.g., `audio/wav`) |
| `artifactBase64` | The rendered audio content |
| `provider`, `model`, `schemaVersion`, `requestHash` | Standard `ProviderModelMetadata` for provenance |

### Lyria's scope boundaries

- Lyria is invoked only through `src/lib/providers/lyria-gateway.ts`, never from UI components or stores directly.
- Lyria's only callers in the pipeline are generation flows that first commit a Blueprint and assemble a `GenerationContextSnapshot`.
- Lyria does not analyze source inputs. It does not derive musical intent. It does not summarize results. It renders from a prepared context.
- Lyria never receives a `BlueprintDraft` — only a committed `Blueprint` that has passed through `commitBlueprintDraft`.
- Prompt assembly for Lyria lives inside `lyria-gateway.ts`. No other module constructs Lyria prompt strings.

### Where Lyria is used in the product

| Surface | Role |
|---|---|
| Studio generation pipeline | Primary: renders new `TrackVersion` artifacts from committed blueprints |
| Track version creation | Every `TrackVersion` is the output of a Lyria generation run |
| Variation/refinement | Alternate mixes, instrumentals, acoustics, refinements, and remixes all flow through Lyria |

### Where Lyria is explicitly not used

- Not as a reasoning engine or conversational assistant.
- Not as a live coaching system (that is Live API).
- Not for music analysis, metadata extraction, or summarization (that is Gemini).
- Not for interpreting source inputs or structuring user intent.

---

## 2. Gemini Responsibilities

Gemini is the structured intelligence layer. It interprets raw source material, structures musical intent, proposes blueprint refinements, and derives inspection-ready metadata from generation results. Every Gemini interaction produces typed JSON via `callGeminiJson<T>` — no freeform prose responses.

### Gemini's four defined roles

#### Role 1: Source Interpretation

**Gateway function:** `interpretSourceSet` in `gemini-gateway.ts`

**Input:** `GeminiInterpretationRequest` — project context, `SourceSet`, `SourceInput[]`, optional active `Blueprint`.

**Output:** `GeminiInterpretationResult` containing:
- `summary` — concise prose description of what the sources suggest
- `signals: InterpretationSignal[]` — field-level inferences with `confidence` scores and `sourceInputIds` provenance
- `conflicts: InterpretationConflict[]` — detected ambiguities across source inputs
- `derivedBlueprint: Partial<Blueprint>` — structured musical parameters inferred from the sources

Interpretation runs when sources change, are toggled, or are re-weighted. It produces structured proposals that feed into `BlueprintDraft` as `inferred` origin values.

#### Role 2: Blueprint Refinement

**Gateway function:** `refineBlueprint` in `gemini-gateway.ts`

**Input:** `GeminiBlueprintRefinementRequest` — a committed `Blueprint` and a `refinementPrompt`.

**Output:** `GeminiBlueprintRefinementResult` containing:
- `summary` — what the refinement addresses
- `proposedBlueprintChanges: Partial<Blueprint>` — structured field deltas, not a rewritten blueprint
- `rationale: string[]` — reasoning for each proposed change

Refinement is advisory. Proposed changes enter the draft for user review — they do not mutate the canonical Blueprint directly.

#### Role 3: Version Summarization

**Gateway function:** `summarizeTrackVersion` in `gemini-gateway.ts`

**Input:** `GeminiTrackSummaryRequest` — project/version context, the `Blueprint` used for generation, version name and notes.

**Output:** `GeminiTrackSummaryResult` containing:
- `summary` — overall description of the generated version
- `arrangementSummary` — structural and instrumental breakdown
- `lyricalThemeSummary` — thematic summary when vocals/lyrics are present
- `practiceNotes: string[]` — structured guidance for Coach prep

Summarization runs after generation succeeds. The result attaches to `TrackVersion.insight` for Track Details display and Coach session prep.

#### Role 4: Practice Briefing

**Gateway function:** `preparePracticeBrief` in `gemini-gateway.ts`

**Input:** `GeminiPracticeBriefRequest` — project/version context, `Blueprint`, focus area, selected section, practice mode.

**Output:** `GeminiPracticeBriefResult` containing:
- `title` — brief title for the practice session
- `summary` — what the session covers
- `cues: string[]` — ordered practice guidance cues

The practice brief feeds into `LiveSessionConfig.practiceBrief` as context for the Coach session setup frame. Gemini prepares the brief; it does not participate in the live session itself.

### Where Gemini is used in the product

| Surface | Role | Gateway function |
|---|---|---|
| Studio — source panel | Interpret sources into structured signals | `interpretSourceSet` |
| Studio — blueprint editor | Propose refinements to committed blueprints | `refineBlueprint` |
| Track Details — overview/tabs | Summarize generated versions for inspection | `summarizeTrackVersion` |
| Coach — session setup | Prepare practice briefs from version context | `preparePracticeBrief` |

### Where Gemini is explicitly not used

- Not as the audio generation engine (that is Lyria).
- Not as the real-time low-latency coach (that is Live API).
- Not as a general chatbot, freeform conversational assistant, or generic UI copilot.
- Not as an undifferentiated "AI does everything" layer.

---

## 3. Cooperation Model

Lyria and Gemini cooperate through the Studio pipeline but never call each other. They share data through persisted domain objects, not through direct invocation.

### Studio pipeline flow

```
User assembles SourceInputs into a SourceSet
            |
            v
  [Gemini: interpretSourceSet]
            |
            v
  InterpretationSnapshot (signals, conflicts, derivedBlueprint)
            |
            v
  BlueprintDraft merges interpretation with user state
  (inferred values fill unset/unlocked fields)
            |
            v
  User reviews, edits, overrides fields in BlueprintDraft
            |
            v
  [Optional: Gemini: refineBlueprint]
  (proposes changes to draft, user accepts/rejects)
            |
            v
  commitBlueprintDraft --> canonical Blueprint
            |
            v
  createGenerationRun + createGenerationContextSnapshot
  (freezes blueprint, sources, interpretation at this moment)
            |
            v
  [Lyria: generateTrack]
  (receives LyriaGenerationRequest built from committed state)
            |
            v
  LyriaGenerationResult --> TrackVersion (persisted)
            |
            v
  [Gemini: summarizeTrackVersion]
  (attaches insight to the new TrackVersion)
```

### Key cooperation rules

1. **Gemini operates before Lyria** (interpretation and refinement) and **after Lyria** (summarization). Lyria operates exactly once per generation run.
2. **They communicate through domain objects**, not function calls. Gemini produces an `InterpretationSnapshot`; the draft system merges it; `commitBlueprintDraft` produces a `Blueprint`; the generation pipeline assembles a `LyriaGenerationRequest` from that `Blueprint`.
3. **Neither system is aware of the other.** Gemini does not know its output feeds Lyria. Lyria does not know its input came from Gemini. The pipeline is the mediator.
4. **The user sits between them.** After Gemini interprets and before Lyria generates, the user reviews and edits the blueprint. This is not optional — the draft-commit cycle is the product's core editorial control.

### Refinement and iteration

When a user requests a refinement after generation:
1. Gemini's `refineBlueprint` proposes changes based on the existing Blueprint and the user's refinement prompt.
2. Proposed changes enter the draft as `inferred` values (respecting locked fields).
3. The user reviews and commits.
4. Lyria generates again from the newly committed Blueprint, with `parentVersionId` linking to the previous version and `kind: 'refinement'`.

This cycle can repeat indefinitely. Each iteration produces a new `GenerationRun`, `GenerationContextSnapshot`, and `TrackVersion` — preserving the full history.

---

## 4. Integration Boundaries

Five hard boundaries govern how Lyria and Gemini connect to the rest of the application.

### Boundary 1: Gateway boundary

Features and stores call `gemini-gateway.ts` and `lyria-gateway.ts` from `src/lib/providers/`. They never import from `src/services/google/` directly.

```
React components / Zustand stores
        |
        v
  src/lib/providers/*-gateway.ts    <-- feature-facing API
        |
        v
  src/services/google/*.ts          <-- raw HTTP/WebSocket clients
```

The gateway layer owns:
- System instruction construction
- Prompt assembly
- Request hashing
- Response shaping into domain DTOs
- Fallback/error handling

The service layer owns:
- HTTP transport (`generateContent` REST calls)
- WebSocket management (Live API)
- Response modality extraction (`extractGoogleText`, `extractGoogleInlineData`)
- Model selection (`getGoogleModel`)

### Boundary 2: Contract boundary

All communication between the application and Gemini/Lyria uses typed DTOs defined in `src/domain/providers.ts`. No ad hoc prompt strings are constructed in UI code, stores, or feature modules.

Every provider result carries `ProviderModelMetadata`:
- `provider` — which system produced the result (`google-gemini`, `google-lyria`, `google-live`, `spotify`)
- `model` — which model was used
- `schemaVersion` — version tag for the contract shape (e.g., `spartan4.v1`)
- `requestHash` — SHA-256 of the request payload for deduplication

### Boundary 3: State boundary

Lyria requests are built exclusively from persisted project state. The chain is:

```
PersistedProject
  .blueprints[]     --> committed Blueprint
  .sourceSets[]     --> active SourceSet
  .interpretations[] --> active InterpretationSnapshot
  .generationRuns[] --> GenerationRun with GenerationContextSnapshot
```

Lyria never receives transient UI state such as uncommitted draft values, in-progress form fields, or component-local state. The `createGenerationContextSnapshot` function in `src/lib/studio-pipeline/generation.ts` enforces this by building the snapshot from the committed project graph.

### Boundary 4: Draft boundary

Gemini's structured outputs enter the system through `BlueprintDraft`, never directly into `Blueprint`.

```
Gemini interpretation
        |
        v
  derivedBlueprint: Partial<Blueprint>
        |
        v
  createBlueprintDraft (merges with user state, respects lockedFields)
        |
        v
  BlueprintDraft (origin: 'inferred' for Gemini values, 'user' for user values)
        |
        v
  commitBlueprintDraft (sole promotion path)
        |
        v
  Blueprint (canonical, generation-ready)
```

Gemini proposals are always suggestions. The draft system enforces that user-committed values take precedence. Only `commitBlueprintDraft` promotes a draft into the canonical Blueprint that Lyria consumes.

### Boundary 5: Session boundary

Coach / Live API has its own lifecycle, completely separate from Studio generation.

- Gemini contributes a `GeminiPracticeBriefResult` upstream of the live session (via `preparePracticeBrief`).
- That brief enters `LiveSessionConfig.practiceBrief` as read-only context for the setup frame.
- Once the Live API session begins, Gemini is no longer involved. The `LiveConnectionClient` and `AudioCaptureService`/`AudioPlaybackService` own the session.
- Coach session state (`usePracticeSessionStore`) is independent of Studio state (`useStudioStore`). They share project/version references but not runtime state.

---

## 5. Data Contract Philosophy

Integration quality depends on structured contracts, not ad hoc prompt chaining.

### Structured JSON everywhere

Every Gemini gateway function uses `callGeminiJson<T>` with `responseMimeType: 'application/json'` and a typed generic. The response is parsed into the specified shape or fails — there is no partial-prose fallback at the contract level.

This means:
- Interpretation produces `InterpretationSignal[]` with numeric `confidence` scores and `sourceInputIds[]` provenance, not paragraphs of text.
- Refinement produces `proposedBlueprintChanges: Partial<Blueprint>` with `rationale: string[]`, not a rewritten blueprint blob.
- Summarization produces field-separated `arrangementSummary`, `lyricalThemeSummary`, and `practiceNotes[]`, not a single summary paragraph.
- Practice briefing produces `cues: string[]`, not unstructured coaching prose.

### Generation context snapshots

`GenerationContextSnapshot` (defined in `src/domain/generation-run.ts`) freezes the exact state that produced a generation:

| Field | What it captures |
|---|---|
| `blueprintSnapshot` | Full `Blueprint` at generation time |
| `blueprintId`, `blueprintRevision` | Identity and version of that blueprint |
| `sourceSetId` | Which source set was active |
| `sources[]` | Per-source summary: type, role, influence, weight, enabled status |
| `sourceItems[]` | Raw `SourceSetItem[]` ordering |
| `interpretationId` | Which interpretation was active |
| `interpretationSummary` | Prose summary from interpretation |
| `kind` | Generation variant type |
| `parentVersionId` | Lineage for refinements/remixes |
| `modifiers` | Refinement prompt, load-on-success flag |

This snapshot is immutable once created. It enables:
- **Reproducibility** — regenerating with the same inputs
- **Inspection** — viewing exactly what was sent to Lyria in Track Details
- **Comparison** — diffing generation contexts across versions
- **Debugging** — tracing failures back to specific input states

### Request hashing

Every provider result carries a `requestHash` (SHA-256 via `crypto.subtle`). This serves:
- **Deduplication** — detecting identical requests across sessions
- **Cache-hit detection** — recognizing when the same interpretation or generation has already been computed
- **Provenance linking** — connecting results back to their exact request payloads

### Schema versioning

Every provider result carries a `schemaVersion` string. When contract shapes evolve:
- New fields are additive (old results remain valid)
- Breaking changes increment the version
- Persistence layers can migrate or gracefully degrade based on version tags

---

## 6. User Override Rules

The architecture preserves user agency at every stage. Gemini suggestions are helpful and structured, never authoritarian. User-committed values always take precedence.

### The origin system

Every blueprint field in `BlueprintDraft` carries a `BlueprintFieldOrigin`:

| Origin | Meaning | Set by |
|---|---|---|
| `default` | Application default; no source signal or user input | `createBlueprintDraft` initial values |
| `inferred` | Derived from source interpretation by Gemini | `createBlueprintDraft` merging `derivedBlueprint` |
| `user` | Explicitly set by the user | `updateBlueprintDraftField` |

### Field locking

When a user explicitly sets a field value via `updateBlueprintDraftField`:
1. The field's origin becomes `user`.
2. The field is added to `lockedFields`.
3. The draft is marked `isDirty: true`.

Locked fields are protected: when a subsequent Gemini interpretation runs (`createBlueprintDraft` with new interpretation data), `mergeInferredValue` checks `lockedFields` and preserves the user's value. Gemini cannot overwrite a locked field.

### Conflict surfacing

When Gemini detects ambiguity across source inputs (e.g., remix lineage pulling genre one direction while Spotify references pull another), it reports `InterpretationConflict[]`. These map to `conflictFields` on the draft.

Conflicts are advisory:
- They surface in the UI as indicators, not blockers.
- The user resolves them by explicitly setting the contested field (which locks it).
- Unresolved conflicts do not prevent generation — the system uses the best available value.

### The commit gate

`commitBlueprintDraft` is the sole path from draft to canonical `Blueprint`:
1. If the draft is not dirty and a current Blueprint exists, the commit is a no-op.
2. If the draft is dirty, a new `Blueprint` is created with an incremented `revision`, a new `id`, and `basedOnBlueprintId` linking to its predecessor.
3. The draft's `committedBlueprintId` and `isDirty` flag are updated.

Lyria always generates from a committed Blueprint. This means:
- Uncommitted Gemini suggestions do not reach Lyria.
- The user must explicitly commit (or accept defaults) before generation.
- Every generation has a clear, user-sanctioned `Blueprint` in its provenance chain.

### Quick refinement

The `refinementPrompt` on `GenerationRunModifiers` provides a lightweight override path. The user can type a short directive (e.g., "more reverb on the chorus") that passes through to Lyria alongside the committed Blueprint. This does not bypass the Blueprint — it supplements it.

---

## 7. Downstream Outputs

Generation artifacts continue to matter after the Studio pipeline completes. The architecture ensures that projects feel explainable, persistent, and inspectable.

### Track Details

`TrackVersion` carries a full provenance chain:

| Field | Links to |
|---|---|
| `sourceBlueprintId` | The `Blueprint` used for generation |
| `sourceSetId` | The `SourceSet` that was active |
| `interpretationId` | The `InterpretationSnapshot` that informed the blueprint |
| `generationRunId` | The `GenerationRun` with full `GenerationContextSnapshot` |
| `parentVersionId` | The previous version for refinements/remixes |

`TrackVersion.insight` holds `GeminiTrackSummaryResult` with:
- `summary` — for the overview tab
- `arrangementSummary` — for structural inspection
- `lyricalThemeSummary` — for the lyrics tab context
- `practiceNotes[]` — for Coach prep and practice readiness indicators

Track Details tabs can render from these structured fields without additional Gemini calls. The data is computed once (after generation) and persisted on the version.

### Library

Library surfaces project-level metadata derived from:
- The project's `library` state (`sourceType`, `isFavorite`, `isExported`, `collection`)
- The latest active version's Blueprint fields (genre, mood, BPM, key)
- Version count and generation history

Library does not call Gemini or Lyria. It reads persisted project state.

### Coach / Practice

Coach receives Gemini-derived context through two paths:

1. **Practice brief** — `preparePracticeBrief` runs before the live session starts, producing `GeminiPracticeBriefResult` that enters the `LiveSessionConfig.practiceBrief`. This gives the Live API session context about what the user is practicing.

2. **Version insight** — `TrackVersion.insight.practiceNotes[]` from the summarization step can inform practice session setup UI (focus area suggestions, section recommendations).

Once the Live API session begins, Coach operates independently. Gemini's contribution is upstream context only.

### Exports

`ExportBundle` packages output from a project or track version. Export assembly reads from persisted `TrackVersion` and `Blueprint` data. It does not invoke Gemini or Lyria at export time — all generation and summarization has already occurred.

---

## 8. Failure Boundaries and Degradation

Each provider interaction has an independent failure boundary. No single failure destroys the project state.

### Gemini interpretation failure

**Behavior:** Fall back to `createInterpretationSnapshot` from `src/lib/studio-pipeline/interpretation.ts`, which produces a heuristic `InterpretationSnapshot` using source-type hints (BPM, key, mode, genre, mood, energy, texture tables keyed by `SourceInputKind`).

**What is preserved:** The project, source inputs, source set, and any existing blueprint or draft remain intact. The fallback interpretation has lower confidence but still produces a valid `derivedBlueprint`, `signals[]`, and `conflicts[]`.

**Already implemented:** `gemini-gateway.ts` catches interpretation errors and returns fallback results with the same `GeminiInterpretationResult` shape.

### Gemini refinement failure

**Behavior:** Keep the existing Blueprint unchanged. Surface the error in the UI (e.g., toast notification). The user can retry or manually edit the blueprint.

**What is preserved:** The committed Blueprint, all versions, the working draft.

### Gemini summarization failure

**Behavior:** The `TrackVersion` is saved without the `insight` field populated. Track Details displays available raw metadata (blueprint fields, generation context, version notes) instead of Gemini-derived summaries.

**What is preserved:** The version, its audio artifact, its full provenance chain. Summarization can be retried later without regenerating.

### Lyria generation failure

**Behavior:** The `GenerationRun` transitions to `status: 'failed'` with `errorMessage` and optional `failureCode`. No `TrackVersion` is created. The `GenerationContextSnapshot` is preserved on the failed run.

**What is preserved:** The committed Blueprint, the interpretation, the source set, and the full `GenerationContextSnapshot`. The user can retry generation with the same or modified context. The failed run remains in `project.generationRuns[]` for debugging.

### Partial state resilience

A project may exist in any combination of partial states:
- Sources without interpretation (Gemini hasn't run yet)
- Interpretation without committed blueprint (user hasn't committed)
- Committed blueprint without generation (Lyria hasn't run yet)
- Generation without summarization (Gemini summary hasn't run)
- Failed generation with preserved context (ready for retry)

Every sub-artifact (`InterpretationSnapshot`, `Blueprint`, `GenerationRun`, `TrackVersion`) is independently persisted. The project aggregate (`PersistedProject`) holds arrays of each. There is no all-or-nothing transaction across Gemini and Lyria.

### Retry semantics

- **Interpretation retry:** Re-run `interpretSourceSet` with the same or modified source set. Produces a new `InterpretationSnapshot` that updates the draft.
- **Refinement retry:** Re-run `refineBlueprint` with the same blueprint and prompt. Produces a new set of proposed changes.
- **Generation retry:** Create a new `GenerationRun` from the same committed Blueprint. The previous failed run is preserved for history.
- **Summarization retry:** Re-run `summarizeTrackVersion` and attach the result to the existing `TrackVersion.insight`.

---

## 9. Anti-Patterns

These patterns are prohibited. Future implementation must actively avoid them.

### Merging Lyria and Gemini into one AI blob

Lyria is the audio engine. Gemini is the intelligence layer. They have different inputs, outputs, invocation patterns, and failure modes. Treating them as a single "AI service" leads to unclear contracts, tangled error handling, and responsibility drift.

### Calling raw service clients from UI code

Components and stores must never import from `src/services/google/gemini.ts`, `src/services/google/lyria.ts`, or `src/services/google/client.ts`. All provider access goes through the gateway layer in `src/lib/providers/`.

### Constructing prompts in UI code

System instructions and prompt assembly belong in gateway functions. If a component is building a prompt string to send to Gemini or Lyria, the boundary has been violated. Move the logic to the appropriate gateway.

### Using freeform prose where structured contracts exist

Every Gemini interaction has a typed JSON contract. Do not fall back to `generateContent` with prose responses for tasks that have structured DTOs. If a new Gemini capability is needed, define a new request/result pair in `src/domain/providers.ts` and a new gateway function — do not hack freeform calls into existing code paths.

### Letting Gemini mutate Blueprint directly

Gemini may propose `Partial<Blueprint>` changes. Those changes enter the system through `BlueprintDraft` with `origin: 'inferred'`. They must never bypass the draft system to write directly into a committed `Blueprint`. The commit gate exists to preserve user authority.

### Building generation requests from draft state

`LyriaGenerationRequest.blueprint` must be a committed `Blueprint`, never a `BlueprintDraft`. The `commitBlueprintDraft` step is mandatory before generation. Skipping it means generating from unreviewed, uncommitted state — undermining user control and reproducibility.

### Duplicating pipeline logic across features

The Studio pipeline (`src/lib/studio-pipeline/`) owns interpretation, draft management, generation run creation, and context snapshotting. Track Details, Library, Coach, and other features read the persisted outputs of this pipeline. They do not re-implement interpretation or generation logic. If a downstream feature needs a new derived artifact, add it to the pipeline — do not duplicate.

### Turning Gemini into a generic chatbot

Gemini has four defined roles: source interpretation, blueprint refinement, version summarization, and practice briefing. It is not a general-purpose conversational assistant. If a new product surface needs intelligence, define a specific role with typed contracts — do not route it through an open-ended chat interface.

### Using Lyria for reasoning or metadata

Lyria generates audio. It does not analyze, summarize, extract metadata, or reason about musical structure. If the product needs musical analysis or metadata, that is Gemini's job (or a dedicated future transcription/analysis service).

### Letting Spotify data leak into generation without mediation

Spotify references (`spotify_track_reference`, `spotify_playlist_reference`) enter the system as `SourceInput` items in a `SourceSet`. They influence generation only through the interpretation-to-blueprint pipeline: Gemini interprets them alongside other sources, derives structured blueprint signals, and those signals feed the draft. Spotify URIs, metadata, or audio features must not appear directly in `LyriaGenerationRequest` fields — they are mediated through interpretation and blueprint.

### Coupling Coach to Studio runtime state

Coach reads project and version data from persisted project state. It does not depend on Studio store state (`useStudioStore`), active draft values, or in-progress generation runs. If Coach needs project context, it reads from `useProjectStore` and the `PersistedProject` graph.

### Skipping the generation context snapshot

Every generation run must create a `GenerationContextSnapshot` before invoking Lyria. This snapshot is the reproducibility record. Skipping it (e.g., building the Lyria request inline without snapshotting) makes generation results unexplainable and non-reproducible.

### Scattering provider configuration

Model selection, API keys, and endpoint configuration live in `src/lib/config/provider-config.ts`. Do not hardcode API keys, model names, or endpoint URLs in gateway functions, stores, or components. Use `getProviderConfig()` and `getGoogleModel()`.

---

## Appendix: File Reference

| Concern | Authoritative file |
|---|---|
| Provider request/result DTOs | `src/domain/providers.ts` |
| Blueprint domain type | `src/domain/blueprint.ts` |
| Blueprint draft (editing, origins, locks) | `src/domain/blueprint-draft.ts` |
| Source input discriminated union | `src/domain/source-input.ts` |
| Source set (ordering, weighting) | `src/domain/source-set.ts` |
| Interpretation (signals, conflicts) | `src/domain/interpretation.ts` |
| Generation run (status, context snapshot) | `src/domain/generation-run.ts` |
| Track version (provenance, insight) | `src/domain/track-version.ts` |
| Project aggregate | `src/domain/project.ts` |
| Gemini gateway (4 functions) | `src/lib/providers/gemini-gateway.ts` |
| Lyria gateway (prompt assembly, generation) | `src/lib/providers/lyria-gateway.ts` |
| Live gateway (Coach session) | `src/lib/providers/live-gateway.ts` |
| Spotify gateway (auth, import, mapping) | `src/lib/providers/spotify-gateway.ts` |
| Blueprint draft pipeline (create, update, commit) | `src/lib/studio-pipeline/blueprint-draft.ts` |
| Generation pipeline (run, snapshot, version) | `src/lib/studio-pipeline/generation.ts` |
| Fallback interpretation (heuristics) | `src/lib/studio-pipeline/interpretation.ts` |
| Source assembly (normalize, create set) | `src/lib/studio-pipeline/source-assembly.ts` |
| Provider config (env, model, assertions) | `src/lib/config/provider-config.ts` |
| Raw Gemini client (JSON mode) | `src/services/google/gemini.ts` |
| Raw Lyria client (audio+text modalities) | `src/services/google/lyria.ts` |
| Raw Live client (WebSocket) | `src/services/google/live.ts` |
| Studio store (orchestration) | `src/features/studio/store/use-studio-store.ts` |
| Coach store (session lifecycle) | `src/features/coach/store/use-practice-session-store.ts` |
