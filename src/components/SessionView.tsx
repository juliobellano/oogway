import { useEffect, useRef } from 'react';

interface Step {
  step_number: number;
  step_name: string;
  timestamp?: string;
  description: string;
  failure_condition?: string;
}

interface SessionViewProps {
  steps: Step[];
  videoUrl: string;
}

const SCRIPTS = [
  '/session/geminilive.js',
  '/session/mediaUtils.js',
  '/session/tools.js',
  '/session/script.js',
  '/session/analyze.js',
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.sessionScript = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

export default function SessionView({ steps, videoUrl }: SessionViewProps) {
  const initRef = useRef(false);

  // Render step cards from React (static, no script.js dependency)
  const stepsHtml = steps
    .map(
      (s) => `
    <div class="tutorial-step">
      <div class="step-header">
        <span class="step-number">Step ${escapeHtml(String(s.step_number))}</span>
        <span class="step-name">${escapeHtml(s.step_name)}</span>
        <span class="step-timestamp">${escapeHtml(s.timestamp || '')}</span>
      </div>
      <p class="step-description">${escapeHtml(s.description)}</p>
      ${
        s.failure_condition
          ? `<p class="step-failure"><strong>⚠ Failure condition:</strong> ${escapeHtml(s.failure_condition)}</p>`
          : ''
      }
    </div>`,
    )
    .join('');

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    (async () => {
      // Load scripts sequentially
      for (const src of SCRIPTS) {
        if (cancelled) return;
        await loadScript(src);
      }

      if (cancelled) return;

      // Store data so MasterShifu.tryAutoLoad() picks it up
      sessionStorage.setItem('masterShifu_steps', JSON.stringify(steps));
      sessionStorage.setItem('masterShifu_url', videoUrl);

      // Init the plain-JS app: DOM cache + event listeners
      window.initSessionApp();

      // Init MasterShifu: reads sessionStorage, injects system prompt, auto-connects
      window.MasterShifu.init();
    })();

    return () => {
      cancelled = true;
      // Disconnect gracefully
      try {
        window.disconnect?.();
      } catch {
        /* ignore */
      }
      // Remove injected scripts
      document.querySelectorAll('script[data-session-script]').forEach((el) => el.remove());
    };
  }, [steps, videoUrl]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans">
      {/* Sentinel element so script.js knows React is managing the DOM */}
      <div id="__session_managed_by_react" className="hidden" />

      {/* Top bar */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-border/40 bg-white/80 backdrop-blur-sm">
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-[#71717a] hover:text-[#1a1a1a] transition-colors"
        >
          &larr; Back
        </button>
        <span className="font-serif text-lg font-medium text-[#1a1a1a]">Oogway</span>
        <span id="connectionStatus" className="ml-auto text-xs text-[#71717a]">
          Not connected
        </span>
      </header>

      {/* Main two-column layout */}
      <div className="flex h-[calc(100vh-53px)]">
        {/* Left column: Tutorial steps */}
        <aside className="w-[380px] shrink-0 border-r border-border/40 overflow-y-auto p-4">
          <h2 className="text-sm font-semibold text-[#71717a] uppercase tracking-wider mb-3">
            Tutorial Steps
          </h2>
          <div id="analyzeResults" dangerouslySetInnerHTML={{ __html: stepsHtml }} />
        </aside>

        {/* Right column: Chat + controls */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Video preview */}
          <div className="flex justify-center bg-black/5 border-b border-border/40">
            <video
              id="videoPreview"
              autoPlay
              playsInline
              muted
              hidden
              className="max-h-[220px]"
            />
          </div>

          {/* Media control bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-white/60 text-sm">
            <button id="startAudioBtn" className="px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:bg-[#1a1a1a]/80 transition-colors">
              Start Audio
            </button>
            <button id="startVideoBtn" className="px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-black/5 transition-colors">
              Start Video
            </button>
            <button id="startScreenBtn" className="px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-black/5 transition-colors">
              Share Screen
            </button>
            <div className="ml-auto flex items-center gap-2 text-xs text-[#71717a]">
              <label htmlFor="volume">Vol</label>
              <input type="range" id="volume" min="0" max="100" defaultValue="80" className="w-20 accent-[#1a1a1a]" />
              <span id="volumeValue">80%</span>
            </div>
          </div>

          {/* Chat messages */}
          <div
            id="chatContainer"
            className="session-chat flex-1 overflow-y-auto px-4 py-3"
          >
            <div className="text-[#71717a] text-sm">Connecting to Oogway...</div>
          </div>

          {/* Chat input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border/40 bg-white/60">
            <input
              type="text"
              id="chatInput"
              placeholder="Type a message..."
              autoComplete="off"
              className="flex-1 px-4 py-2 rounded-full border border-border/60 text-sm bg-transparent focus:outline-none focus:border-[#1a1a1a]/40"
            />
            <button id="sendBtn" className="px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#1a1a1a]/80 transition-colors">
              Send
            </button>
          </div>
        </main>
      </div>

      {/* ── Hidden config elements that script.js initDOM() expects ── */}
      <div className="hidden">
        <input id="proxyUrl" defaultValue="ws://localhost:8080" />
        <input id="projectId" defaultValue="" />
        <input id="model" defaultValue="gemini-live-2.5-flash-native-audio" />
        <textarea id="systemInstructions" defaultValue="You are a helpful assistant." />

        {/* Transcription */}
        <input type="checkbox" id="enableInputTranscription" defaultChecked />
        <input type="checkbox" id="enableOutputTranscription" defaultChecked />

        {/* Features */}
        <input type="checkbox" id="enableGrounding" />
        <input type="checkbox" id="enableAffectiveDialog" defaultChecked />
        <input type="checkbox" id="enableProactiveAudio" defaultChecked />

        {/* Tools */}
        <input type="checkbox" id="enableAlertTool" defaultChecked />
        <input type="checkbox" id="enableCssStyleTool" defaultChecked />
        <input type="checkbox" id="enableDotsTool" defaultChecked />
        <input type="checkbox" id="enableLocateTool" defaultChecked />

        {/* Voice & temperature */}
        <select id="voiceSelect" defaultValue="Puck">
          <option value="Puck">Puck</option>
          <option value="Charon">Charon</option>
          <option value="Kore">Kore</option>
          <option value="Fenrir">Fenrir</option>
          <option value="Aoede">Aoede</option>
        </select>
        <input type="range" id="temperature" min="0.1" max="2.0" step="0.1" defaultValue="1.0" />
        <span id="temperatureValue">1.0</span>

        {/* Activity detection */}
        <input type="checkbox" id="disableActivityDetection" />
        <input type="number" id="silenceDuration" defaultValue="500" />
        <input type="number" id="prefixPadding" defaultValue="500" />
        <select id="endSpeechSensitivity" defaultValue="END_SENSITIVITY_UNSPECIFIED">
          <option value="END_SENSITIVITY_UNSPECIFIED">Default</option>
        </select>
        <select id="startSpeechSensitivity" defaultValue="START_SENSITIVITY_UNSPECIFIED">
          <option value="START_SENSITIVITY_UNSPECIFIED">Default</option>
        </select>
        <select id="activityHandling" defaultValue="ACTIVITY_HANDLING_UNSPECIFIED">
          <option value="ACTIVITY_HANDLING_UNSPECIFIED">Default</option>
        </select>

        {/* Connect/disconnect (hidden — auto-managed) */}
        <button id="connectBtn" />
        <button id="disconnectBtn" />

        {/* Proactive check */}
        <button id="toggleProactiveCheckBtn" />
        <textarea id="proactiveRule" />
        <span id="proactiveCheckStatus" />

        {/* Media selectors */}
        <select id="micSelect">
          <option value="">Default Microphone</option>
        </select>
        <select id="cameraSelect">
          <option value="">Default Camera</option>
        </select>

        {/* Debug / setup JSON */}
        <pre id="debugInfo" />
        <details id="setupJsonSection" style={{ display: 'none' }}>
          <pre id="setupJsonDisplay" />
        </details>

        {/* MasterShifu elements */}
        <input id="tutorialUrl" defaultValue="" />
        <button id="analyzeBtn" />
        <button id="startGuidedBtn" />
      </div>
    </div>
  );
}
