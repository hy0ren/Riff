# Knight 0: Demo Narrative and Judge-Facing Flow

**Status:** Canonical — final demo strategy document

This document defines the demo narrative, presentation order, emphasis hierarchy, and judge-facing flow for Riff Radio. It is designed to make the product feel coherent, technically impressive, musically meaningful, and memorable in a Google AI hackathon setting while demonstrating genuine long-term product value.

---

## 1. Product Pitch

**One sentence:**

> Riff Radio is a desktop AI music creation platform where you combine multiple musical inputs — hums, melodies, chord progressions, lyrics, and Spotify references — and the AI interprets them together to generate a full, structured song you can refine, inspect, practice, and export.

**Extended (10 seconds):**

> Most AI music tools take a text prompt and produce a disposable clip. Riff Radio is different — it's a real desktop creative tool where you bring multiple kinds of musical input, the AI interprets them into a structured blueprint, Lyria generates a full song, and that song becomes a persistent project you can refine, practice with a live voice coach, and export. It's not a prompt box — it's a music creation platform powered by Google AI.

---

## 2. The Story Judges Should Understand

The judges should walk away understanding five things:

1. **Multi-input is the differentiator.** Users don't type a prompt. They combine hums, chord progressions, lyrics, riffs, and Spotify references. The AI interprets all of them together.

2. **Songs are persistent projects, not disposable clips.** Every generated song has versions, a blueprint, metadata, structure, and export value. Track Details proves this.

3. **Coach is a real second product.** Users can practice the songs they created with live spoken feedback from the AI — rhythm, pitch, chords, note accuracy. This is Live API in its most natural use case.

4. **The whole platform is one coherent product.** Studio creates, Track Details inspects, Coach practices, Library organizes, Radio discovers, Exports packages. It all connects.

5. **Google AI is the engine, not the feature.** Lyria generates music. Gemini interprets inputs and structures intelligence. Live API powers real-time coaching. They cooperate through the product, not as separate API demos.

---

## 3. Ideal Demo Order

The demo should follow a narrative arc: **inspiration → creation → proof → performance → platform**.

### Act 1: The Creative Spark (2-3 minutes)

**Scene: Home → Create → Studio**

1. Open the app. The Home page shows recent projects, a "Start Creating" CTA, suggested stations, and a Coach promo. The app looks alive — not a blank slate.

2. Click "Start Creating." Show the Create page with its multi-input source grid: Hum, Melody, Riff, Chord Progression, Notes, Sheet Music, Lyrics, Remix Source, Spotify Reference, Cover Reference.

3. **This is the key moment.** Select 2-3 source types. For maximum impact, choose:
   - A hum or melody (shows audio input)
   - Lyrics (shows text input)
   - A Spotify reference (shows real-world integration)

4. Click "Continue to Studio." This transitions to the Studio's three-column layout.

### Act 2: The Studio — Where Music Gets Made (3-4 minutes)

**Scene: Studio (source panel, generation workspace, blueprint editor)**

5. Show the left panel: the assembled sources with enable/disable toggles and influence weights. Point out that the AI has already interpreted these inputs into signals (tempo, key, mood, genre).

6. Show the right panel: the Blueprint editor, where interpreted signals have pre-filled fields. Point out the origin indicators ("inferred" vs "user") and the ability to override any field.

7. **Demonstrate the commitment model.** The user reviews the blueprint, possibly adjusts a field (e.g., changes the genre or BPM), and commits.

8. **Generate.** Hit the generate button. Show the generation state (animation/loading). When the result appears, play it.

9. **This is the first "wow" moment.** A real, full-length song generated from the user's multi-input context by Lyria.

10. Briefly show version history — the ability to generate variations, refine with a prompt, or try alternate mixes.

### Act 3: The Persistent Project — Proof of Seriousness (1-2 minutes)

**Scene: Track Details**

11. Navigate to Track Details. Show the four tabs: Overview, Chords, Melody, Lyrics.

12. Point out that the song has been analyzed — chord progressions extracted, lyrics displayed, arrangement summarized, structure mapped with timestamps.

13. Show the version switcher. Show that multiple versions exist as a version history.

14. Show the Exports tab on Track Details (or briefly navigate to the Exports page). Show that the song can be exported as WAV, stems, chord sheets, lyric PDFs.

15. **Key message:** "This isn't a clip you download once. It's a project with versions, metadata, and real export value."

### Act 4: Coach — The Live Performance Moment (2-3 minutes)

**Scene: Coach / Practice**

16. From Track Details, navigate to Coach. Show that the Coach automatically loads the song context — BPM, key, chords, lyrics, structure.

17. Show the three-column layout: Practice Context (left), Live Performance Stage (center), Coach Transcript (right).

18. Show the practice configuration: section selection, mode (vocal, guitar, piano), focus area (rhythm, pitch, chords).

19. **Start a session.** The connection indicator shows "Connecting..." then transitions to "Listening." The frequency visualizer activates. The microphone is live.

20. **Perform something.** Hum, sing, or play. The Coach responds with live spoken feedback. Text appears in the transcript panel. The visualizer shows real-time audio input.

21. **This is the second "wow" moment.** Real-time AI coaching on a song the user created inside the same app. Live API at its best.

22. Pause or stop the session. Show the session summary being saved.

### Act 5: The Platform — Everything Connects (1-2 minutes)

**Scene: Quick flythroughs**

23. **Library:** Show the project collection. Multiple projects, favorites, status indicators. The song just created is here.

24. **Radio:** Show a station playing. Point out that stations can be seeded by genre, mood, or imported Spotify playlists.

25. **Explore / Community:** Show trending tracks, remix chains, creator spotlights. The platform feels alive.

26. **Settings > Integrations:** Show Spotify connected. Show audio device configuration.

27. **Key message:** "This is a full platform — creation, practice, listening, discovery, and export. It all works together."

### Closing: The Pitch (30 seconds)

28. Return to Studio or Track Details. The user's song is right there, persistent and inspectable.

29. **Final statement:** "Riff Radio turns musical ideas into real songs. You bring the spark — a hum, some lyrics, a reference track — and the AI interprets, generates, and helps you refine and practice. It's not a prompt box. It's a creative platform powered by Google AI."

---

## 4. Emphasis Hierarchy

### Deep walkthrough (most time)

| Feature | Time | Why |
|---|---|---|
| **Studio / multi-input generation** | 3-4 min | This is the product. The multi-input source system and Lyria generation are the killer features. |
| **Coach / Practice** | 2-3 min | The second flagship. Live API in its most compelling real-time use case. |
| **Create → Studio flow** | 2-3 min | Shows the complete creation journey from idea to song. |

### Moderate walkthrough (1-2 minutes each)

| Feature | Time | Why |
|---|---|---|
| **Track Details** | 1-2 min | Proves persistence and seriousness. Shows that songs are real projects. |
| **Home** | 30-60 sec | Sets the stage. Shows the app feels alive on launch. |

### Brief proof (30-60 seconds each)

| Feature | Time | Why |
|---|---|---|
| **Library** | 30 sec | Proves the platform has continuity and a creative archive. |
| **Exports** | 30 sec | Proves desktop seriousness (real WAV files, reveal-in-folder). |
| **Radio** | 30 sec | Proves listening and discovery layers exist. |
| **Explore / Community** | 30 sec | Proves platform feel. |
| **Settings / Integrations** | 15 sec | Shows Spotify connected, audio configured. |

---

## 5. Opening / Midpoint / Closing Moments

### Best opening moment

Open the app to the Home page. It's alive — recent projects, suggestions, a clear "Start Creating" CTA. Then immediately click into Create and show the multi-input source grid. The opening message is: "You don't just type a prompt here. You bring real musical ingredients."

### Best midpoint "wow" moment

Playing the generated song for the first time in Studio. The user assembled multiple inputs. The AI interpreted them into a blueprint. Lyria generated a full song. Hit play. The music plays. That's the peak.

### Best closing moment

Returning to the created song after the Coach session. The song exists as a persistent project with versions, metadata, and a practice history. Say: "This song started as a hum and some lyrics fifteen minutes ago. Now it's a project with versions, chord analysis, a live practice session, and an export-ready WAV. That's what Riff Radio does."

---

## 6. How Google AI Should Be Presented

### Not this: "We used Lyria, Gemini, Live API, and Spotify"

### This: "The product runs on Google AI, and each capability has a specific job"

| Technology | Natural demo moment | How to frame it |
|---|---|---|
| **Lyria** | Song plays for the first time in Studio | "Lyria generated that from the blueprint we built from the user's inputs." |
| **Gemini** | Blueprint auto-fills from interpreted sources | "Gemini analyzed the hum, the lyrics, and the Spotify reference to figure out the tempo, key, genre, and mood." |
| **Live API** | Coach speaks live feedback during practice | "The Coach is using Live API — that's a real-time WebSocket session with continuous audio streaming in both directions." |
| **Spotify** | Track reference in Create/Studio | "Spotify references are one of many source types. They bring real-world musical context." |

The framing should always be: the **product** does something, powered by a specific Google AI capability. Never: "this page demonstrates Lyria."

---

## 7. How Spotify Should Be Shown

Spotify should appear in exactly three moments:
1. As a source type in Create/Studio (a Spotify track as a reference input alongside hums and lyrics)
2. As connected in Settings > Integrations (briefly, while showing the integration layer)
3. As a possible station seed in Radio (mentioned, not dwelled on)

Spotify should never dominate. It should feel like: "Of course Spotify is here — it's how you bring real-world references into the creation flow." Not: "We built a Spotify integration."

---

## 8. How Supporting Features Should Be Framed

| Feature | Frame as... | Not as... |
|---|---|---|
| **Radio** | "The app also has a listening layer" | A full walkthrough of radio features |
| **Explore** | "And a discovery layer for the community" | A social media platform |
| **Exports** | "Real files on your machine — WAV, stems, chord sheets" | A complex export management system |
| **Settings** | "Everything's configurable — audio, integrations, preferences" | A settings tour |
| **Library** | "Your creative archive — every project, organized" | A file browser |

---

## 9. Demo Mistakes to Avoid

1. **Treating every feature as equally important.** Studio and Coach get the most time. Radio and Explore get 30 seconds each.

2. **Jumping between pages randomly.** Follow the narrative arc: Create → Studio → Track Details → Coach → Library → Radio → Explore → Settings.

3. **Over-explaining architecture.** Judges don't need to know about Zustand stores, WebSocket frames, or blueprint draft origins. They need to see the product work.

4. **Presenting the demo as "look at all these APIs."** Present it as: "Look at this product. It's powered by Google AI."

5. **Spending too much time on settings or exports.** These are proof of seriousness, not the main show. 15-30 seconds each.

6. **Letting Spotify dominate.** Spotify is one source type among many. It gets 10-15 seconds in the creation flow, not its own segment.

7. **Making Coach feel disconnected from Studio.** Show the navigation from Track Details to Coach. Point out that the Coach loaded the song context automatically. "This is the same song we just created."

8. **Stopping to explain errors or loading states.** If something takes a moment to load, fill the time with context. Don't apologize for latency.

9. **Showing an empty app.** The app should have pre-existing projects in the Library and Home page. The demo should feel like walking into a creative workspace that's been used, not a fresh install.

10. **Ending weakly.** End on the created song, not on Settings or Radio. The last thing judges should see is the creative output.

---

## 10. What Judges Should Remember

After the demo, judges should remember three things:

1. **"You can bring multiple musical inputs and the AI figures out the song."** The multi-input creation flow is the differentiator. No other product combines hums, lyrics, chord progressions, and Spotify references into a single generation.

2. **"The songs are real projects, and you can practice them with a live AI coach."** The Coach is the second flagship. Live API powering real-time spoken feedback on user-created music is compelling and concrete.

3. **"It's a real product, not a demo."** Persistent projects, version history, export bundles, a creative archive, audio device management, Spotify integration, radio stations. This is a platform, not a prototype.

---

## 11. Strongest Long-Term Value Framing

If asked "what's the long-term vision?" the answer is:

> Riff Radio is building toward being the creative home for AI-native musicians — people who think in fragments (a melody here, lyrics there, a vibe from a playlist) and want those fragments to become real songs they can refine, practice, share, and export. Studio is the creation engine. Coach is the performance engine. The Library is the archive. Radio is the discovery layer. And it all runs on a desktop-native foundation that treats your music seriously.

This positions the product as ambitious but grounded, with clear product loops and a real technology stack.
