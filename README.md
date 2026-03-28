# Riff — The AI-Native Music Studio

Riff is a cutting-edge, AI-powered music creation and study platform. It bridges the gap between raw inspiration and polished musical output, transforming fragments of ideas—hums, guitar riffs, lyrics, or Spotify playlists—into structured musical **Blueprints** and full-song audio generations.

Designed for both composers and student musicians, Riff combines Google's flagship generative AI models (**Gemini** and **Lyria**) with a premium, desktop-native user experience.

---

## 🏗️ Core Subsystems

Riff is organized into three primary pillars, accessible via the main navigation:

### 🎸 Studio
The creative engine of Riff. In the Studio, users define **Blueprints**, which are structured specifications for a song. 
- **Blueprints** include lyrics, chord progressions, structure (sections), and tonal settings.
- **AI Refinement**: Collaborate with a persistent AI "Co-author" to iterate on section structure, chord choices, and lyrical themes.

### 🎓 Coach
The practice and learning companion. Riff automatically generates "Learn Packs" for your musical creations.
- **Study Guides**: Section-by-section breakdowns of your song with chord charts and memory cues.
- **Practice Focus**: Targeted drill recommendations based on the complexity of your arrangement.

### 📚 Library
Your centralized vault for musical intelligence.
- **Projects**: Manage multi-version song projects.
- **Source Management**: Organize your raw inputs (audio samples, text, or external references).
- **Exports**: Access generated stems, high-quality audio files, and exported MIDI data.

---

## ✨ Key Features

### 🧠 AI-Driven Interpretation
Riff doesn't just "generate" music—it interprets it. Using Gemini 1.5/2.0 Pro's multimodal capabilities, Riff can ingest:
- **Audio Hums/Riffs**: Analyzes pitch center, BPM, and rhythmic feel.
- **Lyrics/Text**: Infers musical mood and structural intent.
- **Sheet Music**: Extracts harmonic and structural data from notational docs.
- **Spotify Data**: Uses playlist and track metadata to seed new project blueprints.

### 🌊 Lyria Generation
Integrated with Google's Lyria model, Riff produces state-of-the-art generative audio including:
- **Full Song Renders**: High-fidelity audio based on your Studio blueprint.
- **Multi-Track Vocals**: Pro-level vocal performances in the selected vocal style.
- **Stem Separation**: Automatically generates separate tracks for bass, drums, vocals, and harmony.

---

## 🛠️ Technical Stack

- **Frontend**: React 19 + TypeScript + Vite.
- **Styling**: TailwindCSS with a custom, premium color palette and glassmorphism components.
- **Intelligence**: Google Gemini (via `@google/generative-ai`).
- **Generation**: Google Lyria API integration.
- **State Management**: Zustand for reactive, performance-optimized stores.
- **Desktop**: Tauri-ready architecture for native desktop performance.

---

## 🚀 Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A Google AI Studio API Key ([Get one here](https://aistudio.google.com/apikey))
- (Optional) Spotify Developer credentials for playlist imports.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hy0ren/Riff.git
   cd Riff
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_API_KEY=your_gemini_api_key_here
   VITE_GEMINI_MODEL=gemini-3-flash-preview
   VITE_LYRIA_MODEL=lyria-3-pro-preview
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/spotify-callback
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
