# guardian.md

## Riff Radio — Product Doctrine & Governance

This document is the permanent source of truth for Riff Radio. It defines the product’s identity, hierarchy, capability boundaries, design rules, domain model, and architecture governance. All future Warrior, Spartan, and Knight work must follow this document.

---

## 1. Product Identity & Core Thesis

### Identity
Riff Radio is a premium, desktop-native AI music creation workspace.

### Core Thesis
Song creation is a persistent, iterative project workflow. Raw musical ideas become finished, learnable tracks through structured AI guidance, revision, and live practice.

### Core Pillars
1. Multi-input song generation
2. Structured editing and refinement
3. Project persistence and version history
4. Live coaching and practice

### Product Loops (in order of importance)
1. **Creation Loop** — source inputs → interpretation → generation → refinement
2. **Persistence Loop** — save project → version history → revisit → inspect
3. **Coaching Loop** — open track → practice live → receive feedback → improve
4. **Listening Loop** — browse library → seed radio/explore → listen and discover

### Product Promise
Riff Radio helps users turn rough ideas into finished tracks, then helps them learn and practice what they made.

---

## 2. Non-Goals

Riff Radio is **not**:

- a disposable one-shot text-to-song web toy
- a Spotify replacement or streaming client clone
- a generic chatbot with music branding
- a social network where community is the main product
- a full professional DAW
- a guaranteed notation/transcription system
- an “AI demo bundle” made of loosely connected APIs

Community, listening, and polish features support the music workflow. They do not define the product.

---

## 3. Feature Hierarchy & Tradeoff Governance

All resource allocation, implementation effort, and design complexity must follow this hierarchy.

### Tier 1 — Core Identity
These features are the reason the product exists. If they fail, the product fails.

#### Create
The project-starting intake surface for collecting source material, references, and initial creative intent.

#### Studio
The main flagship workspace. Multi-input generation, blueprint refinement, and structured iteration happen here. This is the center of gravity of the product.

#### Coach / Practice
The second flagship experience. Real-time spoken and visual feedback for practicing songs created inside Riff Radio.

#### Track Details & Persistence
The system that proves Riff Radio is a serious creative product rather than a one-shot generator. Includes metadata, history, generated revisions, and inspection.

### Tier 2 — Platform Context
These features add depth and context, but must remain subordinate to Tier 1.

#### Library
The organizational home for persistent projects, tracks, and versions.

#### Spotify Integration
A utility layer for inspiration, reference tracks, taste importing, and radio seeding.

#### Radio / Explore
Listening and discovery surfaces for completed work, inspiration, and atmosphere.

### Tier 3 — Trust & Utility
These features make the product feel real, durable, and installable.

- Exports
- Settings / Integrations
- Desktop-native behavior
- Filesystem / local storage behavior
- hardware routing and permissions

### Tier 4 — Optional Polish
These are non-core and must never delay or complicate Tiers 1–3.

- visualizers
- heavy animation
- decorative media generation
- social templates
- optional visual AI tooling

### Tradeoff Rule
If a decision improves a secondary or polish feature at the expense of Studio, Coach, or project persistence, reject or demote it.

### Golden Priority Order
When making product decisions:

1. protect the Studio workflow
2. protect the Coach workflow
3. protect Track Details and persistence
4. keep supporting features in their place

---

## 4. AI Role Map & Capability Boundaries

AI is not one undifferentiated blob. Each model must stay in its lane.

### Lyria — Audio Generation Engine
**Role:** Lyria is the exclusive music generation engine. It renders full audio output from structured musical blueprints.

**Used in:**
- Studio generation pipeline
- Track rendering
- track revision output

**Explicitly not:**
- a reasoning engine
- a conversational assistant
- a live coaching system
- a general music analysis engine

### Gemini — Copilot & Interpretation Layer
**Role:** Gemini is the interpretation, structuring, and reasoning layer. It converts raw source material and user intent into structured musical blueprints, helps refine them, and can derive practice-ready guidance from generated results.

**Used in:**
- Create intake interpretation
- Studio blueprint generation and refinement
- copilot reasoning
- best-effort derived outputs such as structure summaries, chord guidance, and practice cues

**Explicitly not:**
- the final audio renderer
- the real-time low-latency coach
- a substitute for Lyria

### Live API — Real-Time Coaching Layer
**Role:** Live API powers live practice sessions. It listens to user performance in real time and delivers spoken and visual feedback on timing, pitch, rhythm, and related accuracy signals.

**Used in:**
- Coach / Practice

**Explicitly not:**
- the offline generation engine
- a replacement for Studio
- a persistent reasoning/chat layer for the whole app

### Spotify — Context & Reference Integration
**Role:** Spotify is a supporting external integration used for reference tracks, taste context, playlists, and radio seeding.

**Used in:**
- Create references
- Studio inspiration inputs
- Radio seeding
- Settings / account connection

**Explicitly not:**
- the center of the product
- the primary player for user-generated tracks
- the identity of the app

### Optional Media Tools
#### Veo
Optional video polish only, such as ambient canvases or export visuals.

#### Nano Banana
Optional static asset generation such as cover art or thumbnails.

These tools are not core product engines and must never block music creation, saving, playback, or practice.

### Build-Time Tools
#### Stitch / Antigravity
Internal development tools only. They are not runtime product features and must never appear in user-facing product definitions.

---

## 5. Capability Honesty

Riff Radio must stay honest about what the stack can and cannot guarantee.

### What the system can safely claim
- it can interpret rough user input into a structured musical blueprint
- it can generate songs from that blueprint
- it can persist projects and generated revisions
- it can provide practice-ready summaries and coaching flows
- it can give live feedback during practice

### What the system must not overpromise
- exact riff-preserving generation from arbitrary source audio
- guaranteed authoritative symbolic transcription
- guaranteed exact sheet music output from generated audio alone
- perfect chord extraction from every audio file without a dedicated symbolic/transcription layer

### Rule for audio-derived understanding
When hums, riffs, or rough audio ideas are used, the product should describe the process as **interpretation into a musical blueprint**, not exact preservation of the original input.

### Rule for symbolic outputs
Derived artifacts such as chords, lead sheets, structure summaries, and practice guides are **best-effort interpretive outputs** unless backed by a dedicated transcription or symbolic music layer.

### Latency Rule
Generation and interpretation take time. The product must visibly account for waiting, processing, and revision states in a graceful way.

---

## 6. Domain Model

These are the core shared objects of the product.

### Project
The parent container for a user’s creative work.

**Owns:**
- metadata
- source inputs
- blueprint history
- track version history
- export references
- practice history links

### SourceInput
A raw user-provided source.

**Examples:**
- recorded hum
- lyric text
- chord prompt
- reference track URI
- descriptive text prompt
- remix source
- notes or structure ideas

### Blueprint
The structured musical plan generated or refined through Gemini.

**Examples of fields:**
- tempo
- key
- mood
- style
- instrumentation
- structure
- progression guidance
- generation notes
- refinement directives

Blueprint is the recipe, not the final audio.

### TrackVersion
A specific generated revision tied to a Blueprint at a point in time.

**May include:**
- rendered audio
- waveform/stem references
- generation metadata
- timestamps
- version notes
- linked blueprint id

### PracticeSession
An ephemeral or persisted session in which a user practices a TrackVersion inside Coach.

**May include:**
- target track/version reference
- session timestamps
- live feedback summaries
- user performance metrics
- practice notes

### ExportBundle
A packaged output generated from a project or track version.

**May include:**
- rendered audio files
- cover art
- metadata
- best-effort practice materials
- sharing/export assets

### ReferenceSource
External context attached to a project but not owned as core generated output.

**Examples:**
- Spotify URI
- playlist reference
- inspiration notes
- linked external examples

---

## 7. Cross-Feature Handoffs

The product must feel like one coherent system. State flows in this order:

### Create → Studio
The user starts a project and gathers SourceInputs. Studio initializes the working project state from those inputs.

### Studio → AI Pipeline
Studio sends SourceInputs and user intent to Gemini. Gemini produces or refines a Blueprint. The user edits or approves the Blueprint. The approved Blueprint is sent to Lyria. Lyria returns a TrackVersion.

### Studio → Track Details
Generated revisions become inspectable assets with metadata, playback, and revision history.

### Studio / Track Details → Library
Projects, Blueprints, and TrackVersions are persisted and organized for later use.

### Library / Track Details → Coach
The user opens a saved TrackVersion inside Coach. A PracticeSession is created and the Live API uses the selected track as the practice target.

### Library / Projects → Radio / Explore
Finished or saved work may seed listening, discovery, or exploration experiences.

### Important Rule
Radio and Explore are downstream of creation. They must never become the dominant mental model of the app.

---

## 8. UX & Design Doctrine

### Visual Identity
Riff Radio should feel:
- premium
- dark
- desktop-native
- musically expressive
- creator-first
- calm but powerful

### Visual Direction
- deep graphite / obsidian base
- restrained gradients and soft glows
- clean modern typography
- strong hierarchy through layout, not decorative excess
- subtle layered surfaces
- readable metadata and controls

### Avoid
- generic admin/SaaS dashboard aesthetics
- loud neon “AI” styling
- gamer UI tropes
- excessive glassmorphism
- stretched mobile-web layouts
- random mixed design systems

### Desktop-Native Philosophy
Riff Radio is built for desktop windows and longer sessions.

Use:
- sidebars
- split panes
- inspector panels
- multi-column layouts
- precise hover states
- context menus where appropriate
- keyboard-friendly patterns

Do not:
- center the whole product in one narrow column
- design pages like mobile screens scaled up

### Interaction Rules
- primary actions must be obvious
- dense surfaces must still be logically grouped
- destructive actions require safe confirmation
- loading and empty states must feel intentional
- advanced controls must feel integrated, not piled on

### UX Hierarchy
The highest custom design effort belongs to:
1. Studio
2. Coach / Practice
3. Track Details

Supporting surfaces should remain cleaner and more restrained:
- Home / Create
- Library
- Radio / Explore
- Settings
- Exports

---

## 9. shadcn/ui Governance

shadcn/ui is the primitive foundation, not the visual identity.

### Use and customize shadcn for
- forms
- inputs
- textareas
- buttons
- dialogs
- sheets
- popovers
- dropdowns
- tabs
- sliders
- switches
- toasts
- badges
- command/search interfaces

### Build custom surfaces for
- waveforms
- DAW-like timelines
- blueprint editors
- multi-source ingestion zones
- live feedback rings/meters
- dynamic practice overlays
- rich inspector panels tied to music workflows

### Rules
- theme all primitives to the dark premium system
- do not leave default starter styling in place
- prefer composing shadcn primitives into product-specific components
- do not force shadcn onto music-specific visualization problems

---

## 10. Architecture & Code Organization

The codebase is layered by domain ownership. Each layer has a strict responsibility.

### `src/app/` or `src/routes/` — Page Composition Layer
**Purpose:** routing, shell composition, page assembly

**Rules:**
- pages must stay thin
- pages compose features and shared layouts
- pages do not contain business logic
- pages do not directly call APIs or native commands

### `src/features/` — Feature Domain Layer
**Purpose:** isolated feature modules such as `create`, `studio`, `coach`, `library`, `track-details`

**Rules:**
- feature-specific logic lives here
- feature-specific UI lives here
- feature-specific hooks, stores, and helpers live here
- do not leak feature logic into global shared folders

### `src/components/` — Shared UI Layer
**Purpose:** dumb reusable components and customized primitives

**Rules:**
- components are reusable and presentational
- no business logic
- no AI prompt orchestration
- no native desktop concerns
- no direct integration setup

### `src/lib/` — Infrastructure & Integration Layer
**Purpose:** wrappers around external systems and shared engines

**Suggested subareas:**
- `src/lib/integrations/`
- `src/lib/audio/`
- `src/lib/desktop/`
- `src/lib/db/`

**Rules:**
- UI components never call `fetch` or external SDKs directly
- all AI clients live here
- all Spotify integration logic lives here
- all desktop IPC wrappers live here
- all audio session engines live here

### `src/types/` — Shared Domain Types
**Purpose:** global entity definitions reused across major features

**Rules:**
- shared entities like `Project`, `Blueprint`, `TrackVersion`, `PracticeSession` live here
- feature-local types should stay inside their feature folders
- avoid duplicating shapes across the app

### `src-tauri/src/` — Native Desktop Layer
**Purpose:** Rust implementation of native concerns

**Handles:**
- filesystem access
- local storage / SQLite
- hardware permissions
- native audio or performance-sensitive tasks
- OS-level desktop behavior

**Rules:**
- native code returns typed data and capabilities
- native code must not be shaped around specific UI views
- React components must not talk to Tauri directly without wrappers

---

## 11. Feature Folder Anatomy

Every feature folder inside `src/features/` should follow a consistent structure where useful.

Example structure:

```text
src/features/studio/
  components/
  hooks/
  store/
  utils/
  types/
```

### Folder Roles
- `components/` — feature-specific UI
- `hooks/` — orchestration and local state bindings
- `store/` — feature-scoped global or shared state
- `utils/` — feature-specific transformations only
- `types/` — feature-local types that do not belong in `src/types/`

### Rule
If logic belongs only to one feature, it stays with that feature.

---

## 12. Ownership Rules for Critical Systems

### AI & Integration Ownership
All Lyria, Gemini, Live API, and Spotify integrations must live behind service wrappers in `src/lib/`. UI calls feature or service contracts, not raw SDKs.

### Audio & Realtime Ownership
Realtime practice and microphone/session logic must live in a dedicated audio engine layer, not directly in React component trees.

### Desktop Boundary Ownership
Tauri commands must be wrapped behind a stable frontend API. Native calls must not be scattered through UI event handlers.

### Persistence Ownership
Saving, loading, versioning, and export orchestration must be handled through dedicated persistence interfaces, not improvised inside page components.

---

## 13. Strict Anti-Patterns

Future work must actively avoid these failures.

### Product Anti-Patterns
- turning Riff Radio into a Spotify-like browsing app
- making Radio or Explore visually overshadow Studio
- treating community features like the product center
- overpromising exact music-transcription capabilities

### UX Anti-Patterns
- the admin dashboard trap
- the mobile-web trap
- the neon AI trap
- the Frankenstein design-system trap

### Architecture Anti-Patterns
- fat pages with business logic in route files
- leaky native calls from UI handlers
- UI-coupled integrations
- a flat “god utils” folder
- duplicated type definitions
- mixing realtime audio concerns into generic UI state

### AI Role Anti-Patterns
- asking Lyria to do reasoning work
- asking Gemini to be the final audio engine
- using Live API as a substitute for Studio generation
- letting Spotify dominate the product story

---

## 14. Governance for Future Prompt Families

### Guardian
Guardian defines doctrine, priorities, and boundaries. It does not design screens or write implementation code.

### Warrior
Warrior defines product UX, page structure, and interface behavior. It must preserve the hierarchy in this file and not drift into architecture planning.

### Spartan
Spartan defines technical architecture, state boundaries, persistence, integrations, and native/runtime behavior. It must not redesign the product hierarchy.

### Knight
Knight handles polish, demo readiness, trimming, and refinement. It must not introduce new core product identity or inflate secondary features.

### Permanent Rule
If any future prompt or implementation conflicts with this document, this document wins.

---

## 15. Final Operating Principle

Riff Radio is a creator-first desktop music workspace.

Its identity is not “AI for everything.”  
Its identity is:

- interpret rough ideas
- turn them into real songs
- persist the creative work
- help users practice what they made

Everything else is supporting structure.
