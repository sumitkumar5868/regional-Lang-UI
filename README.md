# RegionalAI — Regional Language Multimodal AI

**RegionalAI** is a multimodal vision and regional language translation application that interprets non-verbal hand gestures and visual input from live webcams, frozen frames, or uploaded photos into 12 authentic regional Indian languages (including Bhojpuri) with spoken audio synthesis.

---

## 🌟 Key Features

- **Live Multimodal AI Vision**: Connects with device webcams or smartphone cameras using a progressive constraint fallback ladder (HD $\to$ standard $\to$ default capture $\to$ device ID switching).
- **12 Indian Regional Languages**: Full support for Hindi, Bhojpuri, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, and Urdu.
- **First-Class Bhojpuri Support**: Custom linguistic mappings (`bho` / Devanagari & Kaithi script) for respectful greetings (*"प्रणाम"*), cultural dialect interpretation, and backend capability verification.
- **Throttled Real-Time AI Loop**: Non-overlapping interval loop (500ms–1500ms, default 1000ms) with concurrency locks to prevent request backpressure.
- **Hardware-Independent Fallbacks**:
  - **Freeze Frame**: Capture high-resolution still images for deliberate inspection.
  - **Photo Upload**: Drag-and-drop or select any local image file.
  - **Quick Test Gestures**: 1-click synthetic gesture frames (*Namaste 🙏, Thumbs Up 👍, Peace ✌️, Open Palm ✋*) for instant testing without webcam hardware.
  - **Iframe Sandboxing Bypass**: Built-in "Open in New Tab" deep link to circumvent browser permission blocks in embedded previews.
- **Audio Synthesis & Audio Card**: Visual waveform activity, volume adjustment, and one-click playback of synthesized regional audio.
- **Dual Persistence Architecture**: Real-time session history stored in Supabase with automatic, zero-configuration fallback to `localStorage`.
- **Diagnostic Health Probing**: Live ping checking on the backend with latency tracking, active service detection, and terminal setup instructions.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 + Vite Frontend                    │
│                                                             │
│   ┌───────────────────────┐       ┌───────────────────────┐ │
│   │   AI Vision Camera    │       │  Interpretation Panel │ │
│   │ • Progressive Streams │       │ • Regional Script     │ │
│   │ • Device Switching    │       │ • English Meaning     │ │
│   │ • Iframe Recovery     │       │ • Confidence Ring     │ │
│   │ • Photo Upload / Test │       │ • Audio Card & Wave   │ │
│   └───────────┬───────────┘       └───────────▲───────────┘ │
└───────────────┼───────────────────────────────┼─────────────┘
                │  POST /predict                │ JSON Prediction
                │  (Base64 Image + Lang Code)   │ Result
                ▼                               │
┌───────────────────────────────────────────────┴─────────────┐
│             FastAPI Backend (Python 3.10+)                  │
│                                                             │
│   • GET  /health     → Service status, latency & features   │
│   • GET  /languages  → Active regional language registry    │
│   • POST /predict    → Multimodal gesture interpretation    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: v3.10 or higher (for the FastAPI service)
- **Package Managers**: `npm` (or `bun` / `pnpm`) and `pip`

---

### 2. Python Backend Setup

In your terminal, navigate to the project root and start the FastAPI service:

```bash
# Install Python backend dependencies
pip install -r requirements.txt

# Start the FastAPI server on port 8000
python backend_server.py
```

The service will start at `http://0.0.0.0:8000`. You can inspect interactive Swagger documentation at:
```
http://localhost:8000/docs
```

---

### 3. Frontend Web App Setup

In another terminal window:

```bash
# Install Node dependencies (if not already installed)
npm install

# Start the Vite development server (port 3000)
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🌐 Supported Regional Languages

| Code | Language | Native Script | Sample Greeting | English Translation |
| :--- | :--- | :--- | :--- | :--- |
| `hi` | Hindi | हिन्दी | नमस्ते | Hello |
| `bho` | Bhojpuri | भोजपुरी | प्रणाम | Hello (Respectful) |
| `bn` | Bengali | বাংলা | নমস্কার | Hello |
| `ta` | Tamil | தமிழ் | வணக்கம் | Hello |
| `te` | Telugu | తెలుగు | నమస్కారం | Hello |
| `mr` | Marathi | मराठी | नमस्कार | Hello |
| `gu` | Gujarati | ગુજરાતી | નમસ્તે | Hello |
| `kn` | Kannada | ಕನ್ನಡ | ನಮಸ್ಕಾರ | Hello |
| `ml` | Malayalam | മലയാളം | നമസ്കാരം | Hello |
| `pa` | Punjabi | ਪੰਜਾਬੀ | ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ | Hello |
| `or` | Odia | ଓଡ଼ିଆ | ନମସ୍କାର | Hello |
| `ur` | Urdu | اردو | آداب | Hello |

---

## 📡 API Reference

### 1. Health Probe
**`GET /health`**
- Returns backend operational status, supported language codes, and active capabilities.
```json
{
  "status": "ok",
  "service": "regional-language-ai",
  "supported_languages": ["hi", "bho", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or", "ur"],
  "features": {
    "gesture_prediction": true,
    "regional_translation": true,
    "bhojpuri_support": true,
    "audio_synthesis": false
  }
}
```

### 2. Supported Languages Registry
**`GET /languages`**
- Returns the list of registered language codes, native script names, and default greeting representations.

### 3. Predict & Translate
**`POST /predict`**
- **Request Body:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "language": "bho"
}
```
- **Response:**
```json
{
  "text": "प्रणाम",
  "translation": "Hello (Respectful)",
  "audio": "",
  "emoji": "👋",
  "gesture": "hello",
  "confidence": 0.95
}
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root to configure custom services (optional):

```env
# URL for the FastAPI backend (defaults to http://localhost:8000)
VITE_BACKEND_URL=http://localhost:8000

# Supabase Persistence (Optional — falls back to localStorage if omitted)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 🛠️ Project Structure

```
.
├── backend_server.py        # FastAPI multimodal AI service
├── requirements.txt         # Python backend dependencies
├── package.json             # Node dependencies and scripts
├── vite.config.ts           # Vite + Tailwind + path aliases
├── index.html               # Main HTML entry point
├── metadata.json            # AI Studio applet permissions and metadata
├── src/
│   ├── App.tsx              # Root application layout & state coordinator
│   ├── components/
│   │   ├── AICamera.tsx        # Camera viewport, frame capture & test gestures
│   │   ├── AudioCard.tsx       # Spoken audio player & waveform visualizer
│   │   ├── ConfidenceRing.tsx  # SVG circular confidence gauge
│   │   ├── Header.tsx          # Nav header, live status & backend diagnostic modal
│   │   ├── HowItWorks.tsx      # System architecture & step-by-step explainer
│   │   ├── LanguageSelector.tsx# 12-language picker with native script badges
│   │   ├── ResultPanel.tsx     # AI interpretation, English translation & status
│   │   └── SessionHistory.tsx  # Persistent session log with delete & clear
│   └── lib/
│       ├── api.ts              # FastAPI client, network timeout & error handlers
│       ├── config.ts           # Dynamic endpoints, latency & interval configs
│       ├── resultsDb.ts        # Supabase client with localStorage resilience
│       ├── sampleGestures.ts   # Synthetic test gesture generators
│       └── useCamera.ts        # Camera lifecycle, stream constraints & recovery
```

---

## 🔍 Troubleshooting Camera Issues

If the camera fails to initialize:
1. **Iframe Sandboxing**: When viewing within an embedded iframe (e.g. AI Studio preview), webcams are frequently blocked by browser security policies. Click the **"Open in Tab"** button to run the application in a standalone browser tab.
2. **Camera In Use**: Close other applications that may have an active lock on your webcam (such as Zoom, Google Meet, or Microsoft Teams).
3. **Browser Permissions**: Ensure camera access is allowed in your browser settings (`chrome://settings/content/camera`).
4. **No Webcam?**: Use the **"Upload Photo"** button or click any of the **Quick Test Gestures** at the bottom of the camera card.

---

## 📜 License

MIT License. Designed for regional language accessibility and inclusive multimodal AI communication.
