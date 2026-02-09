/**
 * MasterShifu — YouTube tutorial parsing UI module.
 * Posts a YouTube URL to /api/analyze and renders structured step cards.
 * After analysis, builds a system prompt and injects it so Gemini can guide the user.
 */
const MasterShifu = (() => {
  let _steps = [];

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function init() {
    const btn = document.getElementById("analyzeBtn");
    const input = document.getElementById("tutorialUrl");
    if (!btn || !input) return;

    btn.addEventListener("click", analyze);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") analyze();
    });

    const guidedBtn = document.getElementById("startGuidedBtn");
    if (guidedBtn) {
      guidedBtn.addEventListener("click", startGuidedSession);
    }

    // Check if the landing page pre-loaded analysis data
    tryAutoLoad();
  }

  function tryAutoLoad() {
    const stepsJson = sessionStorage.getItem("masterShifu_steps");
    const url = sessionStorage.getItem("masterShifu_url");
    if (!stepsJson || !url) return;

    // Clear immediately so a page refresh doesn't re-trigger
    sessionStorage.removeItem("masterShifu_steps");
    sessionStorage.removeItem("masterShifu_url");

    let steps;
    try {
      steps = JSON.parse(stepsJson);
    } catch {
      return;
    }
    if (!Array.isArray(steps) || !steps.length) return;

    _steps = steps;

    // Populate the URL input
    const input = document.getElementById("tutorialUrl");
    if (input) input.value = url;

    // Render the steps
    const results = document.getElementById("analyzeResults");
    if (results) renderSteps(steps, results);

    // Inject the system prompt
    const prompt = buildSystemPrompt(steps);
    const textarea = document.getElementById("systemInstructions");
    if (textarea) textarea.value = prompt;

    // Show the guided session button
    const guidedBtn = document.getElementById("startGuidedBtn");
    if (guidedBtn) guidedBtn.style.display = "inline-block";

    // Auto-start the guided session after a brief delay
    setTimeout(() => startGuidedSession(), 500);
  }

  async function analyze() {
    const input = document.getElementById("tutorialUrl");
    const results = document.getElementById("analyzeResults");
    const btn = document.getElementById("analyzeBtn");
    const url = (input.value || "").trim();

    if (!url) {
      results.innerHTML = '<p class="analyze-error">Please enter a YouTube URL.</p>';
      return;
    }

    btn.disabled = true;
    btn.textContent = "Analyzing…";
    results.innerHTML = '<p class="analyze-loading">Sending video to Gemini for analysis…</p>';

    // Hide guided session button while analyzing
    const guidedBtn = document.getElementById("startGuidedBtn");
    if (guidedBtn) guidedBtn.style.display = "none";

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        results.innerHTML = `<p class="analyze-error">${escapeHtml(data.error || "Unknown error")}</p>`;
        return;
      }

      _steps = data.steps || [];
      renderSteps(_steps, results);

      // Inject system prompt and show guided session button
      if (_steps.length) {
        const prompt = buildSystemPrompt(_steps);
        const textarea = document.getElementById("systemInstructions");
        if (textarea) textarea.value = prompt;

        if (guidedBtn) guidedBtn.style.display = "inline-block";
      }
    } catch (err) {
      results.innerHTML = `<p class="analyze-error">Request failed: ${escapeHtml(err.message)}</p>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Analyze Tutorial";
    }
  }

  function buildSystemPrompt(steps) {
    const stepsText = steps
      .map((s) => {
        let entry = `### Step ${s.step_number}: ${s.step_name}`;
        if (s.timestamp) entry += ` (${s.timestamp})`;
        entry += `\n${s.description}`;
        if (s.failure_condition) {
          entry += `\n**Failure condition:** ${s.failure_condition}`;
        }
        return entry;
      })
      .join("\n\n");

    return `You are MasterShifu, a proactive AI tutorial companion. You are watching the user through their camera or screen share as they follow a tutorial.

## Your Role
- Guide the user through the tutorial steps below, one at a time
- Watch their video/screen feed to observe their progress
- Proactively offer help when you see them struggling or making mistakes
- Confirm when a step looks complete before moving to the next
- Warn about failure conditions before they happen
- Keep responses concise, friendly, and encouraging

## Tutorial Steps

${stepsText}

## Rules
- Start by greeting the user and confirming they have all requirements (Step 0)
- Only advance to the next step when the current one is visibly complete
- If you notice a failure condition occurring, immediately alert the user
- Reference specific timestamps if the user needs to rewatch a section
- When the user completes all steps, congratulate them
- When a user asks where something is on screen or asks you to highlight/find/locate a UI element, ALWAYS use the locate_element tool. Never try to estimate coordinates yourself with dots_tool — locate_element captures a high-res screenshot and uses precise vision AI.`;
  }

  async function startGuidedSession() {
    const guidedBtn = document.getElementById("startGuidedBtn");
    if (guidedBtn) {
      guidedBtn.disabled = true;
      guidedBtn.textContent = "Connecting…";
    }

    try {
      // connect() is defined globally in script.js
      await connect();

      // Wait briefly for the WebSocket setup to complete
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Auto-start audio so the user can speak to MasterShifu
      await toggleAudio();

      if (guidedBtn) {
        guidedBtn.textContent = "Session Active";
      }
    } catch (err) {
      console.error("Failed to start guided session:", err);
      if (guidedBtn) {
        guidedBtn.disabled = false;
        guidedBtn.textContent = "Start Guided Session";
      }
    }
  }

  function renderSteps(steps, container) {
    if (!steps.length) {
      container.innerHTML = '<p class="analyze-error">No steps were extracted from this video.</p>';
      return;
    }

    const html = steps
      .map(
        (s) => `
      <div class="tutorial-step">
        <div class="step-header">
          <span class="step-number">Step ${escapeHtml(String(s.step_number))}</span>
          <span class="step-name">${escapeHtml(s.step_name)}</span>
          <span class="step-timestamp">${escapeHtml(s.timestamp || "")}</span>
        </div>
        <p class="step-description">${escapeHtml(s.description)}</p>
        ${
          s.failure_condition
            ? `<p class="step-failure"><strong>⚠ Failure condition:</strong> ${escapeHtml(s.failure_condition)}</p>`
            : ""
        }
      </div>`
      )
      .join("");

    container.innerHTML = html;
  }

  function getSteps() {
    return _steps;
  }

  return { init, analyze, renderSteps, getSteps, buildSystemPrompt, startGuidedSession };
})();

document.addEventListener("DOMContentLoaded", MasterShifu.init);
