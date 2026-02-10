export {};

declare global {
  interface Window {
    initSessionApp: () => void;
    MasterShifu: {
      init: () => void;
      analyze: () => Promise<void>;
      renderSteps: (steps: unknown[], container: HTMLElement) => void;
      getSteps: () => unknown[];
      buildSystemPrompt: (steps: unknown[]) => string;
      startGuidedSession: () => Promise<void>;
    };
    connect: () => Promise<void>;
    disconnect: () => void;
    toggleAudio: () => Promise<void>;
    toggleVideo: () => Promise<void>;
    toggleScreen: () => Promise<void>;
  }
}
