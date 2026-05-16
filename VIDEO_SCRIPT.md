# 🎬 CivicShield AI — Demo Video Script
### Google Antigravity Hackathon · CIRO Challenge
**3-5 Minute Pitch Video — Full End-to-End Flow**

---

## 🎥 Video Structure Overview

| Segment | Duration | Content |
|---------|----------|---------|
| Hook + Problem | 0:00–0:30 | Crisis in Pakistan, why AI matters |
| System Architecture | 0:30–1:00 | Quick overview of 4 components |
| LIVE DEMO Part 1 | 1:00–2:30 | Mobile → Report → Backend processing |
| LIVE DEMO Part 2 | 2:30–3:30 | Dashboard → Map → Agent traces → What-If |
| Results + Impact | 3:30–4:00 | Metrics, limitations, future |
| CTA | 4:00–4:15 | Try it yourself |

---

## 📝 FULL SCRIPT

---

### [0:00–0:30] — THE HOOK

**[Screen: Show news headlines about Pakistan floods, heatwave, Karachi 2022 floods]**

> "In 2022, Karachi experienced flooding that displaced 33 million people.
>
> Emergency responders were overwhelmed. Information was fragmented.
> No one knew which roads were safe. Resources were deployed too late.
>
> What if a single AI system could see the crisis before it escalates,
> coordinate every rescue unit, and alert every citizen — in seconds?"

**[Show CivicShield AI logo animation]**

> "Introducing CivicShield AI — a real-time crisis intelligence platform
> for Pakistani cities, powered by 8 collaborative AI agents."

---

### [0:30–1:00] — ARCHITECTURE (30 seconds, fast-paced)

**[Show architecture diagram]**

> "CivicShield AI has four components:"

**[Show each component with quick animation]**

> "One — A mobile app for citizens to report emergencies in Urdu, Roman Urdu, or English.
>
> Two — A web dashboard for emergency operators with a live map.
>
> Three — A Node.js backend with an 8-agent AI pipeline powered by Groq's llama-3.3-70b.
>
> Four — A Python ML service running YOLOv8 for image analysis and Whisper for voice transcription.
>
> Every citizen report triggers all 8 agents in 3 seconds or less."

---

### [1:00–1:30] — MOBILE APP DEMO: Submitting a Report

**[Show Android phone with Expo Go — open CivicShield app]**

> "Let's simulate a real emergency. It's Monday evening in Islamabad.
> A citizen near G-10 sector notices flooding."

**[Navigate to Report tab]**

> "They open CivicShield AI and tap Report.
> They select their sector — G-10."

**[Type in the text box]**

> "They type in Roman Urdu: 'G-10 mein aag lag gayi hai' —
> which means: 'There is a fire in G-10.'"

**[Show camera button]**

> "They can also take a photo — which our YOLOv8 model instantly analyzes
> for smoke, fire, or flood water."

**[Tap Submit]**

> "They tap Submit. Watch what happens next."

**[Show the success screen with the 4 agent status cards animating]**

> "In the background, 8 AI agents immediately begin processing this report."

---

### [1:30–2:30] — BACKEND PROCESSING (Show terminal or demo in browser)

**[Switch to terminal OR browser at http://localhost:4000/api/incidents]**

> "On the backend, here's what happened in under 3 seconds:"

**[Walk through each agent briefly]**

> "Agent 1 — Signal Collection — detected Roman Urdu, extracted location G-10,
> called the weather API — confirmed heavy rainfall — and flagged this as a fire signal.

> Agent 2 — Verification — cross-checked against weather data, traffic anomalies,
> and nearby reports. It did NOT retract this — evidence was sufficient.

> Agent 3 — Crisis Detection — classified this as 'electrical fire' with 91% confidence.

> Agent 4 — Severity Analysis — estimated 12,000 affected residents,
> flagged a school within 400 meters, marked severity as HIGH.

> Agent 5 — Resource Allocation — selected the 3 nearest available units
> with explainable reasoning for each choice.

> Agents 6, 7, 8 — Action Planning, Execution, and Outcome Simulation —
> generated 6 coordinated actions, executed them, and modeled the before/after impact."

---

### [2:30–3:00] — DASHBOARD: Live Map + Agent Trace

**[Switch to browser at http://localhost:3000]**

> "Meanwhile, on the operator dashboard —"

**[Show the map with the new incident appearing and pulsing]**

> "The incident appears on the map instantly. Red pulse = CRITICAL, orange = HIGH.
> We can see G-10 flooding, F-8 transformer explosion, and Karachi heatwave — all live."

**[Click on the new incident]**

> "Clicking an incident shows the full 8-agent reasoning trace.
> Every decision is explainable. No black box."

**[Scroll through the trace — show agent steps]**

> "This is what the hackathon calls 'The Brain' — complete Antigravity agent logs
> with reasoning steps, tool calls, and failure recoveries."

---

### [3:00–3:30] — WHAT-IF SIMULATION

**[Navigate to /simulate]**

> "Now — the most powerful feature — the What-If simulation engine."

**[Select the G-10 flooding incident and run simulation]**

> "What if we had NOT responded immediately?

> With NO intervention — 65% congestion increase, 8 estimated casualties,
> PKR 2.5 crore in damages.

> With IMMEDIATE response — 7 casualties prevented, 12,000 citizens alerted,
> response time cut from 60 minutes to 14 minutes.

> With a 30-minute DELAY — still 5 casualties, PKR 1.7 crore in damages.

> This is the Before and After the hackathon asks for."

---

### [3:30–4:00] — IMPACT + LIMITATIONS

**[Show metrics screen or summary slide]**

> "CivicShield AI supports:
> - 10 crisis types including flooding, fire, heatwave, and road accidents
> - 3 languages: Urdu script, Roman Urdu, and English
> - 16 pre-configured emergency resources across Pakistan
> - Real-time weather and traffic integration
> - Misinformation detection that auto-retracts false alerts"

**[Show limitations slide]**

> "Current limitations:
> - Emergency dispatch is simulated — not connected to real Rescue 1122 systems
> - YOLOv8 uses the base model — not fine-tuned for Pakistani-specific imagery
> - Weather data has a 15-minute cache
> - Database is in-memory for the demo"

---

### [4:00–4:15] — CALL TO ACTION

**[Show GitHub + QR code to demo]**

> "CivicShield AI is open source and ready for integration with Pakistan's
> NDMA and provincial disaster management authorities.
>
> The mobile app runs on any Android or iPhone.
> The backend can scale to production with Supabase + real API keys.
>
> This is CivicShield AI — protecting Pakistani cities with intelligence."

**[Logo fade out]**

---

## 🎬 Recording Tips

### Setup Before Recording:
1. Backend running: `node src/index.js` → confirm `http://10.7.68.22:4000/health` works
2. Dashboard running: `npm run dev` → open `http://localhost:3000`
3. Expo app running on phone: `npx expo start`
4. Pre-seed at least 3 incidents (auto-happens on first `/api/incidents` call)

### Screen Recording:
- **Mac screen** (dashboard + backend terminal): Use QuickTime → New Screen Recording
- **Phone** (mobile app): Use Android's built-in screen recorder (power + volume down) OR mirror to Mac via scrcpy

### Video Editing:
- Show both screens split-screen during the "backend processing" section
- Speed up the terminal logs to 2x
- Add captions for Urdu text
- Background music: instrumental tech/ambient

### Key moments to highlight with zooms/callouts:
1. The 8-agent trace unfolding
2. The What-If before/after comparison
3. The misinformation retraction demo
4. The map with pulsing markers

---

## 📊 Slide Content for Demo Video

### Slide 1 — Problem
- Pakistan: 4th most disaster-prone country in Asia
- 2022 floods: 33M displaced, PKR 3.2 trillion damage
- Current response: fragmented, manual, slow

### Slide 2 — Solution
- CivicShield AI: 8-agent pipeline
- Processes any report in <3 seconds
- Multilingual: Urdu, Roman Urdu, English

### Slide 3 — Architecture
[Diagram: Mobile → Backend → 8 Agents → Dashboard]

### Slide 4 — What-If Results
| Scenario | Casualties | Response Time | Economic Loss |
|----------|-----------|---------------|---------------|
| No Action | 8 | 60 min | PKR 2.5 crore |
| Immediate | 1 | 14 min | PKR 0.8 crore |
| 30-min Delay | 5 | 45 min | PKR 1.7 crore |

### Slide 5 — Limitations & Next Steps
- Connect to real Rescue 1122 API
- Fine-tune YOLOv8 on Pakistani disaster imagery
- Add Sindhi/Punjabi language support
- Deploy to production with NDMA partnership
