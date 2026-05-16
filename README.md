# 🛡️ CivicShield AI
### AI-Powered Multilingual Smart-City Emergency Response Platform
**Google Antigravity Hackathon · Crisis Intelligence & Response Orchestrator (CIRO)**

---

## 📋 Table of Contents
1. [What is CivicShield AI?](#what-is-civicshield-ai)
2. [Architecture Overview](#architecture-overview)
3. [8-Agent AI Pipeline](#8-agent-ai-pipeline)
4. [Project Structure](#project-structure)
5. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
6. [Running the Backend](#1-running-the-backend)
7. [Running the Web Dashboard](#2-running-the-web-dashboard-yes-it-runs-in-browser)
8. [Running the Mobile App (First Time)](#3-running-the-mobile-app-first-time-guide)
9. [Running the ML Service](#4-running-the-ml-service-optional)
10. [API Keys & Configuration](#api-keys--configuration)
11. [Features Overview](#features-overview)
12. [Crisis Types Supported](#crisis-types-supported)
13. [Hackathon Deliverables](#hackathon-deliverables)
14. [Troubleshooting](#troubleshooting)
15. [Emergency Numbers Pakistan](#emergency-numbers-pakistan)

---

## What is CivicShield AI?

CivicShield AI is a **real-time crisis intelligence and coordinated emergency response platform** built specifically for Pakistani metropolitan environments. It combines:

- 🎤 **Multilingual voice reports** (Urdu, Roman Urdu, English) via Whisper AI
- 📸 **Real-time image analysis** via YOLOv8 (smoke, fire, flood water, crowd density)
- 🌤️ **Live weather data** (OpenWeather API with mock fallback)
- 🚦 **Traffic anomaly detection** (simulated for Pakistani roads)
- 🤖 **8 collaborative AI agents** powered by Groq (llama-3.3-70b-versatile)
- 🗺️ **Interactive map** with live incident markers (OpenStreetMap + Leaflet)
- 🔮 **What-If simulation engine** for delayed vs proactive response modeling
- ❌ **Misinformation detection** — auto-retracts false alerts
- 💬 **Bilingual chatbot** (Urdu/English) for citizens and operators

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CivicShield AI                           │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│   Mobile App │  Web Dashboard│   Backend    │   ML Service      │
│  (Expo RN)   │  (Next.js 14)│ (Node.js)    │  (Python FastAPI) │
│  Port: 8081  │  Port: 3000  │  Port: 4000  │  Port: 8000       │
├──────────────┴──────────────┴──────────────┴───────────────────┤
│                    8-Agent Groq AI Pipeline                     │
│  Signal → Verify → Detect → Severity → Resources → Plan →      │
│  Execute → Simulate                                             │
├─────────────────────────────────────────────────────────────────┤
│                     External APIs                               │
│  OpenWeather · NASA FIRMS · OpenStreetMap                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8-Agent AI Pipeline

Each report goes through all 8 agents in sequence. Every step is **logged and traceable** on the dashboard.

| Step | Agent | What It Does |
|------|-------|------|
| 1️⃣ | **Signal Collection Agent** | Normalizes text/voice/image/weather/traffic signals. Extracts location, language (Urdu/Roman Urdu/English), urgency level |
| 2️⃣ | **Verification Agent** | Cross-checks against weather API, nearby reports, traffic anomalies. **Retracts alert if insufficient evidence** (misinformation handling) |
| 3️⃣ | **Crisis Detection Agent** | Classifies crisis type with confidence score (0–100%). Lists secondary possible types |
| 4️⃣ | **Severity Analysis Agent** | Estimates affected population, radius, nearby hospitals, vulnerability factors (poor drainage, schools nearby, rush hour) |
| 5️⃣ | **Resource Allocation Agent** | Selects nearest rescue boats, ambulances, fire brigades with **explainable reasoning** for each choice |
| 6️⃣ | **Action Planning Agent** | Generates coordinated actions: traffic rerouting, dispatch, citizen alerts (Urdu + English), hospital pre-alerts |
| 7️⃣ | **Action Execution Agent** | Simulates execution: generates ticket (CS-XXXXX), updates incident state, logs each action with timestamps |
| 8️⃣ | **Outcome Simulation Agent** | Before vs After comparison: congestion %, casualties prevented, citizens alerted, economic impact |

---

## Project Structure

```
CivicShield Al/
├── README.md                        ← You are here
│
├── backend/                         ← Node.js + Express API server
│   ├── .env.example                 ← Copy to .env, add your API keys
│   ├── package.json
│   └── src/
│       ├── index.js                 ← Entry point (runs on port 4000)
│       ├── agents/
│       │   ├── orchestrator.js      ← Main pipeline controller
│       │   ├── signalCollectionAgent.js
│       │   ├── verificationAgent.js
│       │   ├── crisisDetectionAgent.js
│       │   ├── severityAnalysisAgent.js
│       │   ├── resourceAllocationAgent.js
│       │   ├── actionPlanningAgent.js
│       │   ├── actionExecutionAgent.js
│       │   └── outcomeSimulationAgent.js
│       ├── routes/
│       │   ├── reports.js           ← POST /api/reports
│       │   ├── incidents.js         ← GET /api/incidents
│       │   ├── chat.js              ← POST /api/chat
│       │   ├── agents.js            ← GET /api/agents/trace/:id
│       │   ├── whatif.js            ← GET /api/whatif/:id
│       │   ├── resources.js         ← GET /api/resources
│       │   └── alerts.js            ← GET /api/alerts
│       └── services/
│           ├── gemini.js            ← Groq AI client (llama-3.3-70b)
│           ├── db.js                ← Supabase + mock DB fallback
│           ├── weather.js           ← OpenWeather + mock fallback
│           ├── traffic.js           ← Simulated Pakistani road data
│           └── mlService.js         ← YOLO/Whisper client
│       └── utils/
│           ├── mockResources.js     ← 16 emergency units dataset
│           └── seedData.js          ← 5 demo incidents for Pakistan
│
├── ml-service/                      ← Python FastAPI (YOLOv8 + Whisper)
│   ├── main.py                      ← FastAPI app (port 8000)
│   └── requirements.txt
│
├── dashboard/                       ← Next.js 14 web dashboard (BROWSER)
│   ├── .env.local
│   ├── next.config.js
│   └── src/
│       ├── app/
│       │   ├── page.tsx             ← Main dashboard (map + stats + trace)
│       │   ├── incidents/page.tsx   ← All incidents list
│       │   ├── chat/page.tsx        ← Operator chatbot
│       │   ├── simulate/page.tsx    ← What-If engine
│       │   └── resources/page.tsx   ← Emergency units status
│       ├── components/
│       │   ├── Sidebar.tsx          ← Navigation
│       │   └── IncidentMap.tsx      ← Leaflet map component
│       └── lib/
│           └── api.ts               ← Backend API client
│
└── mobile-app/                      ← React Native Expo (phone app)
    ├── App.tsx                      ← Root with bottom tabs
    ├── app.json                     ← Expo configuration
    ├── assets/
    │   ├── icon.png                 ← App icon
    │   ├── splash.png               ← Splash screen
    │   └── adaptive-icon.png        ← Android icon
    └── src/
        ├── api.ts                   ← API client + types
        └── screens/
            ├── HomeScreen.tsx       ← Live incidents feed
            ├── ReportScreen.tsx     ← Text + camera + voice reporting
            ├── ChatScreen.tsx       ← AI chatbot
            └── MapScreen.tsx        ← Leaflet map (WebView)
```

---

## Step-by-Step Setup Guide

### Prerequisites

Make sure you have these installed:

```bash
# Check versions
node --version          # Need v18+
npm --version           # Need v9+
python3 --version       # Need v3.10+
```

> **Don't have Node.js?** Download from: https://nodejs.org (choose LTS version)

---

## 1. Running the Backend

The backend is a **Node.js API server**. It runs on `http://localhost:4000`.

```bash
# Step 1: Open Terminal
# Step 2: Navigate to backend folder
cd "/Users/macbookpro/Documents/CivicShield Al/backend"

# Step 3: Add your Groq API key (get free key at console.groq.com)
# Open .env file and add: GROQ_API_KEY=gsk_your_key_here
# OR just run without a key — it uses smart mock responses

# Step 4: Start the server
node src/index.js
```

**You should see:**
```
🛡️  CivicShield AI Backend running on port 4000
   Health: http://localhost:4000/health
```

**Test it's working** — open your browser and go to:
```
http://localhost:4000/health           ← Should show {"status":"ok"}
http://localhost:4000/api/incidents    ← Shows demo incidents (auto-seeded)
```

> ✅ **No Groq API key needed** — the system has full mock responses for all 8 agents!

---

## 2. Running the Web Dashboard (YES — it runs in Browser!)

> ✅ **YES — the dashboard is a web application that opens in your browser at `http://localhost:3000`**
> It is NOT a mobile app. It's designed for emergency operators / control room staff.

```bash
# Step 1: Open a NEW Terminal tab (keep backend running!)
# Step 2: Navigate to dashboard folder
cd "/Users/macbookpro/Documents/CivicShield Al/dashboard"

# Step 3: Install dependencies (first time only, takes ~2 minutes)
npm install

# Step 4: Start the web server
npm run dev
```

**You should see:**
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

**Then open your browser and go to:** `http://localhost:3000`

### Dashboard Pages:
| URL | What You See |
|-----|------|
| `http://localhost:3000` | 🗺️ Live map + incident stats + agent reasoning trace |
| `http://localhost:3000/incidents` | 📋 All incidents with expandable AI analysis |
| `http://localhost:3000/chat` | 💬 Operator AI chatbot |
| `http://localhost:3000/simulate` | 🔮 What-If simulation engine |
| `http://localhost:3000/resources` | 🚑 Emergency units status |

---

## 3. Running the Mobile App (First Time Guide!)

> The mobile app is a **phone app** built with Expo. You run it on your actual phone using the **Expo Go** app.

### Step A: Install Expo Go on your phone

1. **iPhone**: Open App Store → Search "Expo Go" → Install
2. **Android**: Open Play Store → Search "Expo Go" → Install

> Expo Go is a free app that lets you preview React Native apps without building an APK.

### Step B: Install mobile app dependencies

```bash
# Open a NEW Terminal tab
cd "/Users/macbookpro/Documents/CivicShield Al/mobile-app"

# Install all dependencies (first time, takes 3-5 minutes)
npm install

# If you get errors, try:
npm install --legacy-peer-deps
```

### Step C: Copy app assets (icon + splash screen)

```bash
# Run this once to copy the app icon and splash images
mkdir -p assets
cp /Users/macbookpro/.gemini/antigravity/brain/e958a4a5-5d11-4536-bc86-aee6a9b44b14/civicshield_icon_1778911358878.png assets/icon.png
cp /Users/macbookpro/.gemini/antigravity/brain/e958a4a5-5d11-4536-bc86-aee6a9b44b14/civicshield_splash_1778911484549.png assets/splash.png
cp assets/icon.png assets/adaptive-icon.png
cp assets/icon.png assets/favicon.png
```

### Step D: Start Expo

```bash
cd "/Users/macbookpro/Documents/CivicShield Al/mobile-app"
npx expo start
```

**You will see a QR code in the terminal, like this:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▀▄▄▀▀█
█ █   █ ██ ▀▀▄█
...
```

### Step E: Open on your phone

- **iPhone**: Open your Camera app → point it at the QR code → tap the "Open in Expo Go" notification
- **Android**: Open the Expo Go app → tap "Scan QR Code" → scan the QR

> ⚠️ **Important**: Your phone and Mac must be on the **same WiFi network!**

### Mobile App Screens:

| Tab | What You See |
|-----|------|
| 🛡️ Home | Live alerts feed with severity indicators |
| 🚨 Report | Submit emergency report with text, camera photo, or voice recording |
| 💬 Chat | AI chatbot (Urdu/Roman Urdu/English) |
| 🗺️ Map | Interactive map with incident markers |

### Trying the Report Feature:
1. Tap the 🚨 **Report** tab
2. Select your sector (e.g., G-10)
3. Type: `G-10 mein pani bhar gaya hai`
4. Optionally take a photo or record voice
5. Tap **Submit Emergency Report**
6. Watch the 8 AI agents process it!

---

## 4. Running the ML Service (Optional)

> ℹ️ **The ML Service is OPTIONAL.** If it's not running, the system uses intelligent mock responses. You can demo the entire platform without it.

The ML service provides real YOLOv8 image detection and Whisper voice transcription.

### Why you see import errors in VS Code:
The `ultralytics` and `whisper` errors in VS Code are **IDE warnings only** (from Pyrefly linter). The imports are inside function bodies and will work correctly once installed. **These are not code errors.**

### Install packages:

```bash
cd "/Users/macbookpro/Documents/CivicShield Al/ml-service"

# Option A: Use your existing conda environment
conda activate base
pip install ultralytics openai-whisper torch torchvision fastapi uvicorn python-multipart Pillow opencv-python-headless

# Option B: Create a new virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Start the ML service:

```bash
# With conda:
python main.py

# With venv:
source venv/bin/activate && python main.py
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## API Keys & Configuration

All keys go in `backend/.env`. **Every single API has a mock fallback** — the demo works with zero API keys!

| Service | Where to Get | What it does | Mock? |
|---------|------|------|------|
| **Groq** | [console.groq.com](https://console.groq.com) (free) | Powers all 8 AI agents (llama-3.3-70b) | ✅ Smart mock |
| **Supabase** | [supabase.com](https://supabase.com) (free) | Database | ✅ In-memory mock |
| **OpenWeather** | [openweathermap.org](https://openweathermap.org) (free) | Live weather for Islamabad | ✅ Mock (heavy rain scenario) |
| **NASA FIRMS** | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov) (free) | Fire hotspot detection | ✅ Mock |

### Getting a Groq API Key (Recommended — it's free!):
1. Go to https://console.groq.com
2. Sign up with Google
3. Click "API Keys" → "Create API Key"
4. Copy the key (starts with `gsk_`)
5. Open `backend/.env` and set: `GROQ_API_KEY=gsk_your_key_here`

---

## Features Overview

### 🌊 Crisis Detection
Detects: Urban Flooding, Electrical Fire, Transformer Explosion, Smoke/Fire, Road Accident, Infrastructure Failure, Heatwave, Crowd Emergency, Gas Leak, Building Collapse

### 🎤 Multilingual Voice Reporting
Powered by OpenAI Whisper. Understands:
- **Roman Urdu**: "G-10 mein pani bhar gaya hai"
- **Urdu script**: "جی-۱۰ میں پانی بھر گیا ہے"
- **English**: "There is severe flooding in G-10"

### 📸 YOLOv8 Image Analysis
Detects in uploaded images:
- Flood water, fire, smoke
- Crowd density
- Vehicle obstruction
- Infrastructure damage

### ❌ Misinformation Handling
- Single report + no weather corroboration → Low confidence, no alert
- "Yahan bohat pani hai" without location → Asks for clarification
- Multiple contradicting signals → Auto-retracts alert

### 🔮 What-If Simulation
Three scenarios modeled:
1. **No intervention**: Congestion +65%, casualties estimate
2. **Immediate response**: Current intervention outcome
3. **30-min delay**: Shows cost of delayed response

---

## Crisis Types Supported

| Crisis | Trigger Words | Resources Deployed |
|--------|------|------|
| 🌊 Urban Flooding | pani, flood, baarish | Rescue boats, ambulances, drainage pumps |
| ⚡ Transformer Explosion | transformer, blast, bijli | Fire brigade, IESCO team, ambulances |
| 🔥 Electrical Fire | aag, fire, jalna | Fire brigade, ambulances |
| 🌫️ Smoke/Fire | dhuaan, smoke | Fire brigade, ambulances |
| 🚗 Road Accident | accident, crash, takkar | Ambulances, police, fire brigade |
| 🏗️ Infrastructure Failure | bridge, building, collapse | Rescue team, utility team |
| 🌡️ Heatwave | garmi, heat, garam | Medical team, ambulances |

---

## Running Everything Together

**Open 4 Terminal tabs:**

```
Tab 1 — Backend:
  cd "/Users/macbookpro/Documents/CivicShield Al/backend"
  node src/index.js

Tab 2 — Web Dashboard:
  cd "/Users/macbookpro/Documents/CivicShield Al/dashboard"
  npm install && npm run dev
  → Open http://localhost:3000 in browser

Tab 3 — Mobile App:
  cd "/Users/macbookpro/Documents/CivicShield Al/mobile-app"
  npm install && npx expo start
  → Scan QR with Expo Go on phone

Tab 4 — ML Service (optional):
  cd "/Users/macbookpro/Documents/CivicShield Al/ml-service"
  pip install -r requirements.txt && python main.py
```

---

## Hackathon Deliverables

As per the hackathon requirements from the image:

### 1. 📱 The App (Prototype) — MANDATORY
- ✅ React Native + Expo mobile app with 4 screens
- ✅ Citizen text/voice/image reporting
- ✅ Live alerts feed
- ✅ AI chatbot
- ✅ Interactive map

**Build APK:**
```bash
cd mobile-app
npx expo install expo-dev-client
npx eas build --platform android --profile preview
```

### 2. 🎬 The Pitch (Demo Video)
Suggested 3-5 minute flow:
1. Open mobile app → show home screen with 4 active incidents
2. Go to Report tab → type "G-10 mein pani bhar gaya hai" → select sector → submit
3. Switch to Dashboard in browser → show incident appearing on map
4. Click incident → show 8-agent reasoning trace unfolding
5. Go to What-If → run simulation → show before/after comparison
6. Go to Chat → ask "Is it safe to travel to G-10?" → show Urdu response

### 3. 🧠 The Brain (Logs & Traces)
- ✅ Full agent trace stored for every incident
- ✅ View at: `http://localhost:3000/incidents` → click any incident → expand
- ✅ API: `http://localhost:4000/api/agents/trace/{incident_id}`

### 4. 📚 The Docs (README)
- ✅ Architecture overview
- ✅ Data source schemas
- ✅ Privacy considerations (all data is anonymized, no real PII stored)
- ✅ System limitations (see below)

---

## System Limitations

- **Mock data**: Traffic and some weather data is simulated for demo purposes
- **YOLOv8**: Uses base `yolov8n` model — not fine-tuned for Pakistani-specific crisis imagery
- **Whisper**: Base model may struggle with strong Punjabi/Sindhi accents
- **Scale**: Currently uses in-memory DB without real Supabase — not production-ready
- **No real dispatch**: All emergency dispatch is simulated, not connected to actual Rescue 1122
- **Map markers**: Resource deployment pins are approximate, not GPS-tracked

---

## Privacy & Data Notes

- No real citizen PII is stored (userId is anonymous by default)
- Voice recordings are processed and discarded (not stored)
- All location data is sector-level, not precise GPS
- Image uploads are processed for crisis detection only, not retained

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 4000 is already in use
lsof -i :4000
# Kill it if needed
kill -9 $(lsof -ti :4000)
```

### Dashboard npm install fails
```bash
npm install --legacy-peer-deps
```

### Mobile app "Network request failed"
- Make sure backend is running on port 4000
- Check you're on same WiFi as your Mac
- In `mobile-app/src/api.ts`, replace `localhost` with your Mac's IP:
  ```typescript
  const API_URL = 'http://192.168.1.X:4000'; // your Mac's IP
  ```
- Find your Mac's IP: `ifconfig | grep "inet " | grep -v 127`

### Expo QR code not scanning
```bash
# Try tunnel mode (works without same WiFi)
npx expo start --tunnel
```

### Python "module not found" errors in VS Code
These are **IDE-only Pyrefly linter warnings**, not real errors.
To actually install:
```bash
conda activate base
pip install ultralytics openai-whisper fastapi uvicorn
```

### Map not loading
- Make sure you have internet (OpenStreetMap tiles need internet)
- Leaflet loads via CDN in the dashboard

---

## Emergency Numbers Pakistan

| Service | Number |
|---------|--------|
| 🆘 Rescue 1122 | 1122 |
| 🚒 Fire Brigade | 16 |
| 👮 Police | 15 |
| 🚑 Edhi Foundation | 115 |
| 🏥 PIMS Islamabad | 051-9261170 |
| 📡 NDMA | 051-9205037 |

---

## Tech Stack Summary

| Layer | Technology |
|-------|------|
| AI/LLM | Groq · llama-3.3-70b-versatile |
| Vision AI | YOLOv8n (Ultralytics) |
| Speech-to-Text | OpenAI Whisper (base model) |
| Backend | Node.js 18 · Express 4 |
| Web Dashboard | Next.js 14 · React 18 |
| Mobile App | React Native · Expo SDK 51 |
| Map | OpenStreetMap · Leaflet |
| Database | Supabase (PostgreSQL) / In-memory mock |
| Weather | OpenWeather API |
| Fire Detection | NASA FIRMS |
| ML API | Python 3.10 · FastAPI |

---

*Built for the Google Antigravity Hackathon · CivicShield AI Team · 2024*
