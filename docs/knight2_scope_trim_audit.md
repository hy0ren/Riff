# Knight 2: Scope Trim / Keep-Cut Audit

**Status:** Canonical — final scope discipline document

This document evaluates the current scope of Riff Radio and determines what must stay, what can be simplified, what should be de-emphasized, what should be merged, and what should be cut or postponed to maintain product coherence, focus, and quality.

---

## 1. Overall Scope Verdict

Riff Radio's scope is ambitious but defensible. The product covers creation, performance, persistence, listening, discovery, export, and integration — and each layer serves a clear product purpose.

**The risk is not that there are too many features.** The risk is that supporting features receive too much detail and attention relative to their role, diluting the flagship experiences. The product has the right features; some of them need to be lighter.

**Current scope assessment:** Slightly over-detailed in supporting areas (Radio, Explore, Settings sections), exactly right in flagship areas (Studio, Coach, Track Details), and correctly present but appropriately thin in seriousness areas (Exports, Library).

---

## 2. Must-Keep Features

These are non-negotiable. They define the product:

### Studio / Multi-Input Generation

The entire creation pipeline: source selection → source assembly → interpretation → blueprint draft → commit → generation → version creation. This is the product. Every sub-feature within Studio earns its place.

**Keep fully:** Source panel, blueprint editor, generation workspace, version history, refinement prompts, interpretation signals.

### Coach / Practice

The complete live session subsystem: practice context panel, live performance stage with frequency visualizer, coach transcript panel, session lifecycle, Live API integration, practice brief generation, session persistence.

**Keep fully:** All three columns, all session states, microphone permission flow, ducking, barge-in handling.

### Track Details

The persistent project inspector: hero with version switcher, overview tab with arrangement map, chords tab, melody tab, lyrics tab, exports tab.

**Keep fully:** All tabs, version navigation, metadata display. This is the proof that songs are real projects.

### Library

The creative archive. Project grid/list with filtering, search, sorting, and inspector panel.

**Keep fully** but keep lightweight. Library should feel functional and reliable, not visually overwhelming.

### Exports

The desktop seriousness layer: bundle spotlight, asset grid, export history, reveal-in-folder.

**Keep fully** but keep lightweight. Exports proves the product is real. It does not need to be elaborate.

---

## 3. Keep-But-Simplify

These features are worth having but should be tighter, less detailed, or more focused:

### Radio

**Current state:** Full-featured radio system with station hero, now playing panel, queue, tuning panel, saved stations, and listening history. This is very detailed for a supporting feature.

**Simplify to:** Station selection + now playing + queue. The tuning panel (fine-grained knobs for genre mix, tempo range, mood balance) adds complexity without proportional product value. Saved stations and listening history are nice but not essential for the demo or first product version.

**Cut or defer:** TuningPanel detailed sliders, ListeningHistory as a full separate surface. Keep saved stations as a simple list.

### Explore / Community

**Current state:** Hero, trending tracks, remix chain visualization, creator spotlight, genre rail, recent releases. This is a lot of surface area for a feature that exists primarily to make the platform feel alive.

**Simplify to:** Featured/trending grid + genre discovery rail. The remix chain and creator spotlight are interesting but create narrative complexity that the demo and first product version don't need.

**Cut or defer:** RemixChain visualization, CreatorSpotlight as a separate section. These can be future additions.

### Settings sections

**Current state:** 11 navigation sections (account, appearance, playback, creation, exports, storage, privacy, notifications, integrations, audio, advanced). This is very granular.

**Simplify to:** Merge related sections. Suggested grouping:
- **Account & Appearance** (merge — both are profile/personalization)
- **Audio & Playback** (merge — both affect audio behavior)
- **Creation Preferences** (keep — Studio defaults)
- **Exports** (keep — export path, format defaults)
- **Integrations** (keep — Spotify connection, most important setting)
- **Storage & Advanced** (merge — both are technical/maintenance)
- **Privacy & Notifications** (merge or cut — not essential for v1)

This reduces 11 sections to 6-7, making Settings feel tighter and more desktop-native.

---

## 4. Keep-But-De-Emphasize

These should remain present but should not receive too much visual weight or demo time:

### Spotify integration

Spotify should feel seamlessly present, not prominently featured. It should appear as:
- One source type among many in Create/Studio
- A connected integration in Settings
- A possible station seed in Radio

It should not receive its own page, its own dashboard, or its own prominent section in Home.

### Radio (after simplification)

Radio should feel like "the app has a listening layer" — one station playing, a queue visible, a brief tuning surface. It should not compete with Studio or Coach for visual real estate or cognitive attention.

### Explore / Community (after simplification)

Explore should feel like "the platform is alive" — a trending grid, a genre rail, brief social proof. It should not feel like a separate app or a major product pillar.

### Privacy, Notifications, Storage settings

These settings should exist for completeness but should be visually quiet. They should not receive prominent Settings nav real estate. Users who need them will find them; they should not distract from Audio, Integrations, and Creation preferences.

---

## 5. Merge or Boundary-Fix Recommendations

### Home + Library overlap

**Issue:** Home shows "Recent Projects" and Library shows the full project collection. These are similar surfaces.

**Fix:** Home's "Recent Projects" should be a lightweight preview (3-4 cards) with a "See All in Library" link. Home should focus on the "Start Creating" CTA and contextual entries (suggested stations, Coach promo). Library is the full archive.

### Track Details + Studio metadata overlap

**Issue:** Both Track Details and Studio show blueprint/metadata information. Track Details shows it in inspection tabs; Studio shows it in the blueprint editor.

**Fix:** This is correct as-is. Studio is the editing surface (mutable draft). Track Details is the inspection surface (read-only committed state). The overlap is intentional — they show the same data in different modes. No merge needed, but ensure the visual language is consistent between them.

### Exports page + Track Details exports tab overlap

**Issue:** Both the standalone Exports page and the Track Details exports tab show export-related information.

**Fix:** Track Details > Exports tab should show version-specific export status (what's exportable for this version). The standalone Exports page should show cross-project export history and bundle management. They serve different scopes and should remain separate, but their visual treatment of export assets should be consistent.

### Radio + Explore discovery overlap

**Issue:** Both Radio and Explore serve "discovery" functions. Radio discovers through listening; Explore discovers through browsing.

**Fix:** Keep them separate but ensure clear differentiation. Radio is passive discovery (listen to a station, find things you like). Explore is active discovery (browse trends, find inspiration). If scope pressure increases, Explore is the more cuttable of the two — Radio provides the core "platform is alive" signal.

---

## 6. Cut or Postpone Recommendations

### Defer: Remix chain visualization (Explore)

The remix chain is a cool concept but adds significant visual and conceptual complexity to Explore. It implies a level of community infrastructure (tracking remix lineage) that the product doesn't need in v1. Defer to a future version when community features are more developed.

### Defer: Creator spotlight (Explore)

Similar to remix chains — this implies user profiles, follower counts, and social features that are premature. A simple "trending tracks" grid achieves the same "platform is alive" goal with less scope.

### Defer: Listening history (Radio)

A full listening history surface adds persistence complexity without proportional demo or product value. The Radio page already has a queue and now-playing panel. History can be a future addition.

### Defer: Privacy and notifications settings

These settings sections exist for product completeness but are not essential for v1 or the demo. They can be stubbed or combined into a minimal "Preferences" section. No user will judge the product on its notification toggle.

### Simplify: Tuning panel (Radio)

The fine-grained tuning sliders (genre mix, tempo range, mood balance, energy level) are detailed audio-engineering-style controls. For v1, station tuning should be simpler: pick a genre/mood seed, adjust a single "variety" slider, done. The granular controls can be a future "advanced tuning" feature.

---

## 7. Top Scope Risks

### Risk 1: Supporting features stealing attention from flagships

If Radio, Explore, or Settings sections are too elaborate, they distract from the creation and performance story. The demo and product should spend 70%+ of attention on Studio, Coach, and Track Details.

**Mitigation:** Apply the simplification recommendations above. Keep supporting features visually lighter.

### Risk 2: Settings sprawl

11 settings sections is a lot. Users (and judges) may perceive the product as overly complex rather than thoughtfully comprehensive.

**Mitigation:** Merge sections as recommended. Aim for 6-7 well-organized groups.

### Risk 3: Mock data creating false impressions

The product uses extensive mock data for Radio, Explore, and Home. If mock data looks too polished, it creates expectations the product can't yet fulfill. If it looks too generic, it undermines the premium feel.

**Mitigation:** Curate mock data to be realistic but clearly representative. Don't over-populate mock content to the point where it suggests features that aren't real.

### Risk 4: Explore implying a social platform

The remix chain, creator spotlight, and community framing in Explore suggest a social music platform. This is not the product's identity — it's a creation tool. If Explore is too prominent, judges may misread the product's purpose.

**Mitigation:** Simplify Explore to trending grid + genre rail. Remove social-platform language. Frame it as "inspiration and discovery" rather than "community."

---

## 8. Final Scope Guidance

After applying these recommendations, the product should feel like:

**A focused, premium music creation platform** with:
- A deep, impressive Studio workflow (the star)
- A live Coach practice experience (the second star)
- Persistent, inspectable projects (Track Details as proof)
- A functional creative archive (Library)
- Real desktop file export (Exports)
- A listening layer that makes the platform feel alive (simplified Radio)
- An inspiration/discovery layer (simplified Explore)
- Clean integration and settings (consolidated Settings)
- Spotify as a useful reference source (bounded integration)

**Not:**
- A social music platform
- A streaming service competitor
- A settings-heavy configuration tool
- A product that tries to impress with feature count instead of feature depth

The discipline is: **go deep on Studio and Coach, go wide enough on everything else to prove the platform, but never let width compete with depth.**
