/**
 * Show Alert Box Tool
 * Displays a browser alert dialog with a custom message
 */
class ShowAlertTool extends FunctionCallDefinition {
  constructor() {
    super(
      "show_alert",
      "Displays an alert dialog box with a message to the user",
      {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The message to display in the alert box"
          },
          title: {
            type: "string",
            description: "Optional title prefix for the alert message"
          }
        }
      },
      ["message"]
    );
  }

  functionToCall(parameters) {
    const message = parameters.message || "Alert!";
    const title = parameters.title;

    // Construct the full alert message
    const fullMessage = title ? `${title}: ${message}` : message;

    // Show the alert
    alert(fullMessage);

    console.log(` Alert shown: ${fullMessage}`);
  }
}
/**
 * Add CSS Style Tool
 * Injects CSS styles into the current page with !important flag
 */
class AddCSSStyleTool extends FunctionCallDefinition {
  constructor() {
    super(
      "add_css_style",
      "Injects CSS styles into the current page with !important flag",
      {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector to target elements (e.g., 'body', '.class', '#id')"
          },
          property: {
            type: "string",
            description: "CSS property to set (e.g., 'background-color', 'font-size', 'display')"
          },
          value: {
            type: "string",
            description: "Value for the CSS property (e.g., 'red', '20px', 'none')"
          },
          styleId: {
            type: "string",
            description: "Optional ID for the style element (for updating existing styles)"
          }
        }
      },
      ["selector", "property", "value"]
    );
  }

  functionToCall(parameters) {
    const { selector, property, value, styleId } = parameters;

    // Create or find the style element
    let styleElement;
    if (styleId) {
      styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
    } else {
      styleElement = document.createElement('style');
      document.head.appendChild(styleElement);
    }

    // Create the CSS rule with !important
    const cssRule = `${selector} { ${property}: ${value} !important; }`;

    // Add the CSS rule to the style element
    if (styleId) {
      // If using an ID, replace the content
      styleElement.textContent = cssRule;
    } else {
      // Otherwise append to any existing content
      styleElement.textContent += cssRule;
    }

    console.log(`🎨 CSS style injected: ${cssRule}`);
    console.log(`   Applied to ${document.querySelectorAll(selector).length} element(s)`);
  }
}

/**
 * Dots Overlay - Renders logical 1920x1080 dot patterns on a full-screen canvas
 */
class DotsOverlay {
  constructor() {
    this.logicalWidth = 1920;
    this.logicalHeight = 1080;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.animationToken = 0;
    this.clearTimer = null;

    this.canvas.id = "dots-overlay-canvas";
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.style.position = "fixed";
    this.canvas.style.inset = "0";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "9999";
    this.canvas.style.width = "100vw";
    this.canvas.style.height = "100vh";
    this.canvas.style.opacity = "1";

    document.body.appendChild(this.canvas);
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  static getInstance() {
    if (!DotsOverlay.instance) {
      DotsOverlay.instance = new DotsOverlay();
    }
    return DotsOverlay.instance;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(window.innerWidth * dpr));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr));
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  mapCoordinate(value, maxValue, coordinateSystem) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    if (coordinateSystem === "normalized_1000") {
      const normalized = this.clamp(numericValue, 0, 1000) / 1000;
      return this.clamp(Math.round(normalized * maxValue), 0, maxValue);
    }

    return this.clamp(Math.round(numericValue), 0, maxValue);
  }

  normalizeDots(dots, coordinateSystem = "logical_1920x1080") {
    if (!Array.isArray(dots)) return [];
    const validDots = [];

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i] || {};
      const x = this.mapCoordinate(dot.x, this.logicalWidth - 1, coordinateSystem);
      const y = this.mapCoordinate(
        dot.y,
        this.logicalHeight - 1,
        coordinateSystem
      );
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        continue;
      }
      validDots.push({
        x,
        y,
        size: this.clamp(Number(dot.size) || 1, 0.25, 8),
        brightness: this.clamp(Number(dot.brightness) || 1, 0, 1),
      });
    }

    return validDots;
  }

  boxesToDots(boxes, options = {}) {
    if (!Array.isArray(boxes) || boxes.length === 0) return [];

    const coordinateSystem = options.coordinateSystem || "logical_1920x1080";
    const step = this.clamp(Math.round(Number(options.boxStep) || 10), 1, 60);
    const brightness = this.clamp(Number(options.boxBrightness) || 1, 0, 1);
    const size = this.clamp(Number(options.boxSize) || 1, 0.25, 8);
    const dots = [];

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i] || {};
      let x1, y1, x2, y2;

      if ("x1" in box) {
        // New format from /api/locate: {x1, y1, x2, y2} — use raw values, normalizeDots() converts later
        x1 = Number(box.x1) || 0;
        y1 = Number(box.y1) || 0;
        x2 = Number(box.x2) || 0;
        y2 = Number(box.y2) || 0;
      } else {
        // Legacy format: {x, y, width, height} — use raw values
        x1 = Number(box.x) || 0;
        y1 = Number(box.y) || 0;
        x2 = (Number(box.x) || 0) + (Number(box.width) || 0);
        y2 = (Number(box.y) || 0) + (Number(box.height) || 0);
      }

      // Expand bounding box by 15% from center
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const hw = Math.abs(x2 - x1) / 2 * 1.15;
      const hh = Math.abs(y2 - y1) / 2 * 1.15;
      x1 = cx - hw;
      y1 = cy - hh;
      x2 = cx + hw;
      y2 = cy + hh;

      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const top = Math.min(y1, y2);
      const bottom = Math.max(y1, y2);

      for (let x = left; x <= right; x += step) {
        dots.push({ x, y: top, brightness, size });
        dots.push({ x, y: bottom, brightness, size });
      }

      for (let y = top; y <= bottom; y += step) {
        dots.push({ x: left, y, brightness, size });
        dots.push({ x: right, y, brightness, size });
      }
    }

    return dots;
  }

  drawDots(dots, options = {}) {
    const coordinateSystem = options.coordinateSystem || "logical_1920x1080";
    const normalizedDots = this.normalizeDots(dots, coordinateSystem);
    this.clear();

    if (normalizedDots.length === 0) return 0;

    const color = options.color || "#0b3d91";
    const glowStrength = this.clamp(Number(options.glowStrength) || 8, 0, 40);
    const density = this.clamp(Math.round(Number(options.density) || 2), 1, 5);
    const dpr = window.devicePixelRatio || 1;
    const scaleX = this.canvas.width / this.logicalWidth;
    const scaleY = this.canvas.height / this.logicalHeight;
    const baseRadius = this.clamp(Number(options.radius) || 4, 0.25, 8) * dpr;
    const clusterSpacing = baseRadius * 0.9;

    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = glowStrength * dpr;

    for (let i = 0; i < normalizedDots.length; i++) {
      const dot = normalizedDots[i];
      const px = (dot.x + 0.5) * scaleX;
      const py = (dot.y + 0.5) * scaleY;
      const radius = baseRadius * dot.size;
      const microRadius = Math.max(0.5, radius * 0.45);
      const half = Math.floor(density / 2);

      for (let dx = -half; dx <= half; dx++) {
        for (let dy = -half; dy <= half; dy++) {
          this.ctx.globalAlpha = dot.brightness;
          this.ctx.beginPath();
          this.ctx.arc(
            px + dx * clusterSpacing,
            py + dy * clusterSpacing,
            microRadius,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
      }
    }

    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
    return normalizedDots.length;
  }

  async animateFrames(frames, options = {}, token) {
    for (let index = 0; index < frames.length; index++) {
      if (token !== this.animationToken) return 0;
      const frame = frames[index] || {};
      this.drawDots(frame.dots, { ...options, ...frame });
      const durationMs = Math.max(16, Number(frame.durationMs) || 120);
      await new Promise((resolve) => setTimeout(resolve, durationMs));
    }
    return frames.length;
  }

  async renderPattern(parameters = {}) {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }

    this.animationToken += 1;
    const token = this.animationToken;
    const persistMs = Math.max(0, Number(parameters.persistMs) || 2000);

    if (Array.isArray(parameters.frames) && parameters.frames.length > 0) {
      const adaptedFrames = parameters.frames.map((frame) => {
        const dots = Array.isArray(frame.dots) ? frame.dots : [];
        const boxDots = this.boxesToDots(frame.boxes, {
          ...parameters,
          ...frame,
        });
        return {
          ...frame,
          dots: dots.concat(boxDots),
        };
      });
      await this.animateFrames(adaptedFrames, parameters, token);
    } else {
      const dots = Array.isArray(parameters.dots) ? parameters.dots : [];
      const boxDots = this.boxesToDots(parameters.boxes, parameters);
      this.drawDots(dots.concat(boxDots), parameters);
    }

    if (persistMs > 0) {
      this.clearTimer = setTimeout(() => {
        if (token === this.animationToken) {
          this.clear();
        }
      }, persistMs);
    }

    const dotsCount =
      (Array.isArray(parameters.dots) ? parameters.dots.length : 0) +
      (Array.isArray(parameters.boxes) ? parameters.boxes.length : 0);
    const frameCount = Array.isArray(parameters.frames)
      ? parameters.frames.length
      : 0;

    return {
      logicalResolution: `${this.logicalWidth}x${this.logicalHeight}`,
      dotsCount,
      frameCount,
      persistMs,
    };
  }
}

/**
 * Locate Element Tool
 * Captures a high-res screenshot and uses Gemini 3 Flash to precisely find UI elements.
 */
class LocateElementTool extends FunctionCallDefinition {
  constructor() {
    super(
      "locate_element",
      "Precisely find and highlight a UI element on the user's screen. Captures a high-res screenshot and uses vision AI to locate the element accurately. ALWAYS prefer this over guessing coordinates with dots_tool when the user asks where something is or asks you to find/highlight/locate something on screen.",
      {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "What to find on screen (e.g. 'the Chat text', 'Connect button', 'search bar')"
          },
          color: {
            type: "string",
            description: "CSS color for the highlight dots (default: '#0b3d91')"
          },
          persistMs: {
            type: "number",
            description: "How long to keep the highlight visible in milliseconds (default: 3000)"
          }
        }
      },
      ["query"]
    );
  }

  async functionToCall(parameters) {
    const query = parameters.query;
    const color = parameters.color || "#0b3d91";
    const persistMs = parameters.persistMs || 3000;

    const imageBase64 = capturePreviewFrameBase64();
    if (!imageBase64) {
      return { found: false, error: "No video/screen stream active" };
    }

    const boxes = await requestLocateBoxesFromGemini3(query, imageBase64);
    if (!boxes || boxes.length === 0) {
      return { found: false, count: 0 };
    }

    await DotsOverlay.getInstance().renderPattern({
      coordinateSystem: "normalized_1000",
      boxes,
      density: 2,
      radius: 3,
      boxStep: 6,
      persistMs,
      color,
    });

    return { found: true, count: boxes.length, query };
  }
}

/**
 * Dots Tool
 * Renders dot patterns on an invisible 1920x1080 logical grid.
 */
class DotsTool extends FunctionCallDefinition {
  constructor() {
    super(
      "dots_tool",
      "Lights selected dots on a logical 1920x1080 grid. Use for pixel text or simple animations.",
      {
        type: "object",
        properties: {
          dots: {
            type: "array",
            description:
              "List of dots to light for a static frame. Each dot has x,y and optional brightness,size.",
            items: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate (0-1919)" },
                y: { type: "number", description: "Y coordinate (0-1079)" },
                brightness: {
                  type: "number",
                  description: "Brightness from 0 to 1"
                },
                size: {
                  type: "number",
                  description: "Dot size multiplier"
                }
              },
              required: ["x", "y"]
            }
          },
          boxes: {
            type: "array",
            description:
              "Optional bounding boxes to outline. Use x,y,width,height in either logical or normalized coordinate system.",
            items: {
              type: "object",
              properties: {
                x: { type: "number", description: "Top-left X" },
                y: { type: "number", description: "Top-left Y" },
                width: { type: "number", description: "Box width" },
                height: { type: "number", description: "Box height" }
              },
              required: ["x", "y", "width", "height"]
            }
          },
          frames: {
            type: "array",
            description:
              "Optional animation frames. Each frame has dots[] or boxes[] and optional durationMs.",
            items: {
              type: "object",
              properties: {
                durationMs: {
                  type: "number",
                  description: "Frame duration in milliseconds"
                },
                dots: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" },
                      brightness: { type: "number" },
                      size: { type: "number" }
                    },
                    required: ["x", "y"]
                  }
                },
                boxes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" },
                      width: { type: "number" },
                      height: { type: "number" }
                    },
                    required: ["x", "y", "width", "height"]
                  }
                }
              },
              required: []
            }
          },
          coordinateSystem: {
            type: "string",
            description: "Use 'logical_1920x1080' or 'normalized_1000'",
            enum: ["logical_1920x1080", "normalized_1000"]
          },
          color: {
            type: "string",
            description: "Color for lit dots (CSS color value)"
          },
          radius: {
            type: "number",
            description: "Base dot radius"
          },
          glowStrength: {
            type: "number",
            description: "Glow intensity around dots"
          },
          density: {
            type: "number",
            description: "Cluster density per logical dot (1-5)"
          },
          persistMs: {
            type: "number",
            description: "How long to keep the final pattern before clearing"
          }
        }
      },
      []
    );
  }

  async functionToCall(parameters) {
    const hasFrames = Array.isArray(parameters?.frames) && parameters.frames.length > 0;
    const hasDots = Array.isArray(parameters?.dots) && parameters.dots.length > 0;
    const hasBoxes = Array.isArray(parameters?.boxes) && parameters.boxes.length > 0;

    if (!hasFrames && !hasDots && !hasBoxes) {
      throw new Error("dots_tool expects dots[], boxes[], or frames[].");
    }

    const overlay = DotsOverlay.getInstance();
    return overlay.renderPattern(parameters);
  }
}
