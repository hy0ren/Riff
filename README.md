# Riff — The AI-Native Music Studio

Riff is a professional, AI-powered music creation and study platform designed for composers and modern student musicians. It transforms musical fragments—hums, riffs, lyrics, or external references—into structured **Blueprints** and full-song audio generations with **cloud-scale persistence**.

Built on **Google's Gemini and Lyria** models and powered by **Firebase**, Riff combines the power of state-of-the-art generative AI with the reliability of cross-device synchronization and professional-grade session management.

---

## 🏗️ Core Subsystems

Riff is organized into three primary pillars, accessible via the main navigation:

### 🎸 Studio
The creative heart of the platform. Here, bits of inspiration become **Blueprints**—structured JSON definitions of a song’s DNA.
- **AI-Native Blueprinting**: Collaborate with a persistent AI co-author to iterate on section structure, chord choices, and lyrical themes.
- **Interpretation Engine**: Multimodal ingestion of audio fragments (hums, riffs) and sheet music into editable structures.

### 🎓 Coach
The performance companion. Every creation in Riff automatically generates a practice-ready "Learn Pack."
- **Section Guides**: Automated breakdowns of songs with chord cues, memory aids, and lyrical markers.
- **Practice Focus**: Dynamic feedback and study recommendations provided by the Coach AI.

### 📚 Library
Your centralized vault for musical intelligence.
- **Cloud-Persistence**: Projects, sources, and blueprints are synced across devices via Firestore.
- **Export Management**: Organized access to higher-fidelity audio generations, vocal-only stems, and MIDI layouts.

---

## ✨ Specialized Features

### 🧠 Multimodal Ingestion
Riff takes input from any source you provide:
- **Audio (Hums/Riffs)**: Analyzes melodic contour, BPM, and rhythmic feel.
- **Lyrics/Text**: Infers mood and structural intent from prose or verse.
- **Data (Spotify)**: Import playlists and track metadata to seed new project blueprints for remixes or study.

### 🌊 Lyria-Powered Studio
Uses Google’s top-tier Lyria model for high-fidelity music synthesis:
- **Full Renders**: High-quality audio outputs based on your Studio Blueprint.
- **Style Consistency**: Ensures vocal performances and instrumental beds remain consistent across sections.

---

## 🛠️ Technical Stack

- **Core**: React 19 + TypeScript + Vite.
- **Cloud & Auth**: Firebase Authentication (Google OAuth) + Cloud Firestore.
- **AI Layer**: Google Gemini 1.5/2.0 + Google Lyria generative audio.
- **State**: Zustand for responsive, reactive frontend state.
- **Environment**: Managed via VITE_ environment variables for local security.

---

## 🚀 Local Setup

### Prerequisites
1.  [Node.js](https://nodejs.org/) (v18+)
2.  Google AI Studio API Key ([Get one here](https://aistudio.google.com/apikey))
3.  A Firebase project ([Create one in the console](https://console.firebase.google.com/))
4.  Spotify Developer credentials for track imports.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/hy0ren/Riff.git
    cd Riff
    ```

2.  **Set up environment variables**:
    Create a `.env` file in the root directory and populate it with the 13+ required keys:
    ```env
    # Google AI (Gemini & Lyria)
    VITE_GOOGLE_API_KEY=your_key_here
    VITE_GEMINI_MODEL=gemini-3-flash-preview
    VITE_LYRIA_MODEL=lyria-3-pro-preview

    # Spotify (OAuth Client ID)
    VITE_SPOTIFY_CLIENT_ID=your_client_id_here
    VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/spotify-callback

    # Firebase (Web App Config)
    VITE_FIREBASE_API_KEY=your_firebase_api_key_here
    VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your-project-id
    VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
    ```

3.  **Install dependencies**:
    ```bash
    npm install
    ```

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
