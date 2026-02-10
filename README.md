# MasterShifu

MasterShifu is a monolith AI tutorial companion that turns passive YouTube tutorials into a real-time, multimodal guided workflow. In one repository, it covers tutorial ingestion, step extraction, live camera/audio coaching, proactive intervention logic, and UI-based visual guidance.

## What We Are Building

MasterShifu delivers an end-to-end loop:

1. User pastes a YouTube tutorial URL.
2. The app analyzes the tutorial and extracts structured steps.
3. The live session starts with those steps embedded into system guidance.
4. Audio/video streams are sent to Gemini Live.
5. The assistant proactively validates progress, warns on failure conditions, and uses visual tools when needed.

The objective is a guided "do-with-me" experience, not just a chatbot.

## Monolith Architecture

MasterShifu is documented and operated as a single integrated application with four internal layers:

1. UI Layer
- React landing experience (`src/`) for URL intake and session bootstrap.
- Session runtime UI (`public/session/`) for live streaming, configuration, and chat/tool feedback.

2. API Layer
- Internal endpoints for tutorial parsing and visual locate operations:
  - `POST /api/analyze`
  - `POST /api/locate`
- WebSocket proxy path for Gemini Live session connectivity/auth relay.

3. AI Orchestration Layer
- Parsing workflow for tutorial-to-steps transformation.
- Gemini Live multimodal turn handling (audio, video, transcripts, tool calls).
- Proactive checker logic for periodic visual validation without requiring user speech each time.

4. Session/State Layer
- Current-step lifecycle.
- Step completion/failure feedback loop.
- Frontend session bootstrap and handoff (`sessionStorage` from landing to live session).

### Request/Data Flow

1. `src/App.tsx` submits YouTube URL to `POST /api/analyze`.
2. Parsed steps are stored in `sessionStorage` and user is routed to `/session/index.html`.
3. `public/session/analyze.js` injects a dynamic system prompt from extracted steps.
4. `public/session/script.js` establishes Gemini Live setup, starts media streams, and processes turns.
5. Tool calls and proactive checks drive intervention output (audio + visual overlays).

## Tech Stack (Detailed)

### Frontend (Landing + App Shell)
- React 19
- TypeScript
- Vite 7
- Tailwind CSS v4
- Radix/shadcn primitives
- GSAP + custom visual components (DotGrid, Aurora, Prism, etc.)

### Session Runtime (Low-Latency Live Layer)
- Vanilla JavaScript modules in `public/session/`
- `geminilive.js`: Live API protocol and setup/turn messaging
- `mediaUtils.js`: microphone/camera/screen capture + PCM/audio playback worklets
- `script.js`: orchestration, UI state, proactive checker loop
- `tools.js`: client-side tool-call implementations (e.g., dots overlay, locate helpers)
- `analyze.js`: step rendering + system prompt generation

### Backend Responsibilities (Monolith Internal Service)
- Tutorial parsing endpoint (`/api/analyze`)
- Visual element location endpoint (`/api/locate`)
- Gemini Live websocket proxy/auth relay
- Session orchestration and state progression hooks

### AI Stack
- Gemini Live model: `gemini-live-2.5-flash-native-audio`
- Tutorial parsing workflow using higher-reasoning model path (per `spec.md` requirements)
- Multimodal prompting + tool calling for proactive guidance

## Repository Layout

```text
masterShifu/
├── src/                         # React landing app (URL intake, routing handoff)
│   ├── App.tsx
│   ├── main.tsx
│   └── components/
├── public/
│   └── session/                 # Live multimodal runtime (vanilla JS)
│       ├── index.html
│       ├── script.js
│       ├── geminilive.js
│       ├── mediaUtils.js
│       ├── tools.js
│       ├── analyze.js
│       └── audio-processors/
├── spec.md                      # Product + interaction specification
├── package.json                 # Frontend toolchain and scripts
└── vite.config.ts
```

## Core Features

1. Tutorial parsing into structured step objects (name, timestamp, description, failure conditions).
2. Guided live session bootstrap from landing page into session runtime.
3. Dynamic system prompt injection from parsed tutorial steps.
4. Real-time mic/camera/screen streaming to Gemini Live.
5. Assistant response playback + transcript rendering.
6. Tool-call hooks for spatial guidance (dots) and element location.
7. Proactive visual checker loop:
- periodic frame-check turns
- rule-based trigger text
- cooldown handling
- `NO_ACTION` suppression path to avoid noisy output

## API Contracts (Monolith Internal Endpoints)

### `POST /api/analyze`
Analyzes a tutorial URL and returns structured steps.

Request:

```json
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

Success response:

```json
{
  "steps": [
    {
      "step_number": 0,
      "step_name": "Gather Requirements",
      "timestamp": "0:00",
      "description": "...",
      "failure_condition": "..."
    }
  ]
}
```

Error response:

```json
{
  "error": "..."
}
```

### `POST /api/locate`
Locates a requested element or region from an image.

Request:

```json
{
  "query": "submit button",
  "image": "<base64-jpeg>"
}
```

Success response:

```json
{
  "boxes": [
    { "x": 100, "y": 200, "width": 300, "height": 120 }
  ]
}
```

### WebSocket Proxy (Gemini Live)
- Browser client connects to internal WS proxy URL.
- Proxy relays setup/turn/media messages to Gemini Live endpoint.
- Session setup includes model, generation config, proactivity, and realtime input config.

## Runbook

### Prerequisites
- Node.js 20+
- npm
- Access to backend service endpoints and Gemini credentials (for full end-to-end flow)

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Local Demo Path

1. Start monolith services (frontend + internal API/ws layers).
2. Open app landing page.
3. Paste tutorial URL and run analysis.
4. Confirm steps were extracted.
5. Enter live session and start camera/audio.
6. Validate proactive guidance and tool-call behavior.

## Configuration

### Runtime Model/Session Settings
Configured via session UI and setup payload in `public/session/script.js` and `public/session/geminilive.js`:
- project ID
- model ID
- system instructions
- voice
- activity detection tuning
- proactive toggles and checker rule

### Environment and Secrets
- Keep API credentials and tokens in local environment configuration.
- Never hardcode secrets in source files.
- Never commit `.env` or key material.

Recommended policy:
- local `.env` files ignored by git
- rotate any credential if accidentally exposed

## Operational Notes

### Latency/Cost Hotspots
- Continuous audio/video streaming increases usage.
- Proactive checker cadence directly affects token/media throughput.
- High-frequency vision checks increase response pressure and cost.

### Failure Modes
- Missing/invalid tutorial URL
- low-confidence parsing outputs
- media permission failures (mic/camera/screen)
- websocket disconnects or upstream API errors
- delayed/misaligned turn completion under network variance

### Debug Touchpoints
- Browser console logs for session runtime modules
- setup payload display in session UI
- endpoint response payloads for `/api/analyze` and `/api/locate`

## Current Maturity

- Landing app + session runtime are implemented in this repository.
- Monolith endpoint contracts and orchestration responsibilities are defined and integrated at interface level.
- Some backend/service internals may still evolve as hardening continues.

## Roadmap

1. End-to-end hardening of monolith service boundaries.
2. Stronger step-state engine (explicit transitions + confidence tracking).
3. Proactive video evolution (event-driven + hybrid local detectors).
4. Evaluation metrics (step accuracy, intervention precision/recall, latency budgets).
5. Production readiness: observability, retries/backoff, auth and quota controls.
6. Deployment packaging for reproducible local/cloud environments.
