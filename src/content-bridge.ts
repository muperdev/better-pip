import {
  COMMAND_EVENT,
  STATE_EVENT,
  isCommand,
  isStateEnvelope,
  type Command,
  type PlayerState,
} from "./shared/messages";
import { DEFAULT_SETTINGS, SETTINGS_KEY, parseSettings, type Settings } from "./shared/settings";

if (!globalThis.__betterPipBridge) {
  globalThis.__betterPipBridge = true;
  bootBridge();
}

function bootBridge(): void {
  void loadSettings().then((settings) => {
    void requestFromPage({ type: "apply-settings", settings });
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isCommand(message)) {
      return;
    }

    void requestFromPage(message)
      .then(async (state) => {
        if (message.type === "volume" || message.type === "apply-settings") {
          await saveSettings(state.settings);
        }
        sendResponse(state);
      })
      .catch(() => {
        sendResponse(emptyState());
      });

    return true;
  });
}

async function requestFromPage(command: Command): Promise<PlayerState> {
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      document.removeEventListener(STATE_EVENT, onState);
      resolve(emptyState());
    }, 900);

    const onState = (event: Event): void => {
      if (!(event instanceof CustomEvent) || !isStateEnvelope(event.detail)) {
        return;
      }

      if (event.detail.requestId !== requestId) {
        return;
      }

      window.clearTimeout(timer);
      document.removeEventListener(STATE_EVENT, onState);
      resolve(event.detail.state);
    };

    document.addEventListener(STATE_EVENT, onState);
    document.dispatchEvent(
      new CustomEvent(COMMAND_EVENT, {
        bubbles: true,
        detail: { requestId, command },
      }),
    );
  });
}

async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return parseSettings(stored[SETTINGS_KEY]);
}

async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

function emptyState(): PlayerState {
  return {
    hasVideo: false,
    isPip: false,
    isAd: false,
    isLive: false,
    paused: true,
    currentTime: 0,
    duration: 0,
    volume: DEFAULT_SETTINGS.lastVolume,
    muted: false,
    rate: DEFAULT_SETTINGS.defaultSpeed,
    title: "",
    chapters: [],
    sleepEndsAt: null,
    waitingForAd: false,
    settings: { ...DEFAULT_SETTINGS },
  };
}
