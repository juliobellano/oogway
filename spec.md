# Specification: MasterShifu - The Proactive AI Tutorial Companion

> "A guide/companion/tutor for a youtube tutorial"

## 1. Overview
MasterShifu is an intelligent instructional assistant that transforms passive video watching into an active, guided experience. Users paste a YouTube tutorial link, and the system parses the video into a structured, step-by-step guide. The application then acts as a real-time proactive companion, using computer vision (via Gemini Live API) to watch the user perform the task, validating their actions, and providing visual guidance (lighting up "dots" on screen) or verbal feedback when necessary.

## 2. Architecture & Tech Stack

### Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS (for layout and utility) + Custom CSS (for "dots" overlay and glassmorphism UI)
- **Key Features**:
  - Camera permission handling & video stream capture.
  - "Dots" Grid System: A visual overlay that lights up to provide spatial guidance (e.g., cutting direction).

### Backend
- **Framework**: FastAPI (Python)
- **Role**:
  - Validates YouTube links.
  - Orchestrates the "Preprocessing" phase (Gemini 3).
  - Manages session state (Current Step, completed steps).
  - Relays interactions between Frontend and Live API.

### AI Infrastructure
- **Preprocessing Model**: **Gemini 3** (or highest available reasoning model).
  - *Task*: Video analysis, temporal segmentation, entity extraction (tools/ingredients).
- **Interactive Model**: **Gemini 2.5 Live API**.
  - *Task*: Real-time multimodal analysis (Audio/Video input), state tracking, proactive guidance, failure detection, and tool calling (Dots).

---

## 3. Phase 1: Preprocessing (The extraction)

Upon receiving a YouTube link, the backend triggers the Parsing Pipeline.

### Input
- YouTube Video URL

### Process
1.  **Validation**: Verify video length and accessibility.
2.  **Extraction**: The AI "watches" the video to extract structured data.

### Prompt Specification (Instructional Video Analyst)
*This prompt is sent to the reasoning model.*

> **Role**: Expert Instructional Video Analyst and Guide Creator.
> **Goal**: Convert a YouTube video into a structured, step-by-step JSON guide.

#### Input Validation Rules
- Verify if the input is a valid tutorial (cooking, DIY, workout, etc.).
- IF NOT a tutorial => Output: `"its not a tutorial video!"`
- IF IT IS a tutorial => Proceed to extraction.

#### Extraction Rules
1.  **Analyze Whole Video**: Identify all items/tools/ingredients first.
2.  **Create "Step 0" (Requirements)**:
    - `timestamp`: "0:00"
    - `description`: Comprehensive list of all required items.
    - `step_name`: "Gather Requirements"
3.  **Sequential Steps (Step 1+)**:
    - One task per step.
    - Detailed, instructive description.
    - Precise timestamp (MM:SS).

### Output Data Structure (JSON)
The output must be a raw JSON array.

```json
[
  {
    "step_number": 0,
    "step_name": "Gather Requirements",
    "timestamp": "0:00",
    "description": "Prepare a black marker...",
    "failure_condition": "1. Using a permanent marker without protection... 2. Missing supplies..."
  },
  {
    "step_number": 1,
    "step_name": "Draw the Eyes",
    "timestamp": "0:11",
    "description": "Draw two small ovals...",
    "failure_condition": "1. Drawing eyes too far apart. 2. Ovals too small..."
  }
]
```

---

## 4. Phase 2: The Live Companion (Interaction)

Once the JSON steps are generated, the user enters the "Guide Mode".

### Logic Flow
1.  **State Initialization**: Frontend loads the steps and sets `Current Step = 0`.
2.  **Live Loop**:
    - The camera feed is streamed to Gemini Live API.
    - A dynamic system prompt is injected, updating with the `Current Step` context.

### Live API System Prompt
> "You are watching a person doing [description of tutorial].
> Here are the reference steps: [JSON Data].
> We are currently in **Step [X]**.
>
> **Your Task**:
> 1. Watch the user's actions via camera.
> 2. Compare against the `description` and `failure_condition` of the current step.
> 3. **Success**: If the user completes the step correctly, return a tool call `next_step()` (or return boolean "true").
> 4. **Failure**: If a `failure_condition` is met, proactively warn the user and suggest corrections.
> 5. **Guidance**: If the user performs an action requiring direction (e.g., cutting), use the `visualize_dots` tool.
> 6. **Silence**: If the user is proceeding correctly but hasn't finished, remain silent."

### Tool Calling: The "dots" System
- **Concept**: A visual language where the screen displays a grid of dots. The AI can "light up" specific dots to convey information spatially.
- **Example Usage**:
  - "Cut the onion in half" -> Lights up dots in a vertical line down the center.
  - "Move your hand to the right" -> Lights up dots on the right side.

---

## 5. User Interface (The Dojo)

### Landing Page
- **Aesthetic**: Minimalist "Upload Terminal".
- **Action**: Paste URL -> "Analyze".
- **Transitions**: Smooth fade-out into the Guide Interface.

### Guide Interface
- **Background**: Camera Feed (or mirrored user video).
- **Overlay**:
  - **Top**: Current Step instruction (Text).
  - **Center**: The "Dots" Grid (Transparent layer for visual tool feedback).
  - **Bottom**: Progress bar / Step indicator.
- **Feedback**:
  - Audio: Voice guidance from Gemini.
  - Visual: Dots lighting up, Success checkmarks.

## 6. Implementation Roadmap

### Step 1: Parsing Pipeline
- [ ] Setup FastAPI backend.
- [ ] Implement YouTube downloader/loader.
- [ ] Integrate Gemini 3 for video-to-JSON extraction.
- [ ] Validate JSON output with schemas.

### Step 2: Frontend State & UI
- [ ] Build the Step State Store (Zustand/Context).
- [ ] Create the "Dots" Grid component (Canvas or DIV grid).
- [ ] Implement Camera streaming.

### Step 3: Live Integration
- [ ] Connect Gemini 2.5 Live API.
- [ ] Implement the dynamic prompt injection (State -> Prompt).
- [ ] Handle tool calls (`next_step`, `visualize_dots`).

### Step 4: Polish & "Juice"
- [ ] Add transitions between steps.
- [ ] Refine the proactive voice personality.
- [ ] optimize latency for the "dots" feedback.
