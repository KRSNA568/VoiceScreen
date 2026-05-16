# VoiceScreen

AI-powered voice candidate screening. HR uploads a JD, picks 3–5 questions, and a voice agent calls the candidate. After the call, an LLM generates a structured report with scores, flags, and a hire recommendation.

## Stack

- **Backend** — FastAPI · SQLite · httpx · Groq (Llama 3.3 70B) · Bolna (voice agent)
- **Frontend** — React 18 · Vite · Tailwind CSS · React Router

## Project layout

```
voicescreen/
├── backend/    FastAPI app, SQLite DB, Groq + Bolna integrations
└── frontend/   React dashboard (dark + blue theme)
```

## Quick start

### 1. Backend
```bash
cd voicescreen/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in BOLNA_API_KEY, BOLNA_AGENT_ID, GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd voicescreen/frontend
npm install
npm run dev   # http://localhost:5173
```

### 3. Bolna webhook
Configure your Bolna agent's webhook URL (Analytics tab) to:

```
https://<your-public-host>/api/webhook/call-complete
```

For local dev, expose port 8000 with ngrok.

## Features

- **Dashboard** — pipeline stats, recommendation breakdown, recent screenings
- **Roles** — reusable JDs with application counts; one-click "Start Screening" pre-fills the form
- **Pending Candidates** — manual add or Google Form sync (prototype)
- **History** — searchable, filterable list of all screenings
- **Live status** — animated call-state indicator with auto-redirect to report
- **Report** — exec summary · 1–10 scores (communication / relevance / confidence) · per-question breakdown · green/red flags · hire recommendation

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/generate-questions` | Groq generates 10 screening questions from JD |
| POST | `/api/initiate-call` | Saves call record + dials candidate via Bolna |
| GET | `/api/call-status/:id` | Poll current status |
| GET | `/api/report/:id` | Fetch generated report when ready |
| POST | `/api/webhook/call-complete` | Bolna posts transcript → Groq report |
| GET | `/api/calls` | List all screenings |
| GET | `/api/stats` | Dashboard metrics |
| GET / POST / DELETE | `/api/roles` | Manage JDs |
| GET / POST / DELETE | `/api/pending-candidates` | Pending intake list |
