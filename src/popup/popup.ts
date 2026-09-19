import { formatTime } from "../shared/format-time";
import { fineScrubRatio, ratioFromClientX } from "../shared/math";
import type { Command, PlayerState } from "../shared/messages";
import { DEFAULT_SETTINGS, SLEEP_MINUTES, SPEEDS, type Settings } from "../shared/settings";

const status = required("status");
const title = required("title");
const timeline = required("timeline");
const played = required("played");
const thumb = required("thumb");
const current = required("current");
const remaining = required("remaining");
const chapters = required("chapters");
const play = required("play", HTMLButtonElement);
const skipBack = required("skip-back", HTMLButtonElement);
const skipForward = required("skip-forward", HTMLButtonElement);
const mute = required("mute", HTMLButtonElement);
const volume = required("volume", HTMLInputElement);
const speeds = required("speeds");
const sleeps = required("sleeps");
const sleepLeft = required("sleep-left");
const togglePip = required("toggle-pip", HTMLButtonElement);
const openPlayer = required("open-player", HTMLButtonElement);
const dismiss = required("dismiss", HTMLButtonElement);
const autoPip = required("auto-pip", HTMLInputElement);
const defaultSpeed = required("default-speed", HTMLSelectElement);
const app = required("app");

let state: PlayerState = emptyState();
let dragging = false;
let dragStartY = 0;
let dragStartRatio = 0;

boot();

function boot(): void {
  for (const rate of SPEEDS) {
    speeds.append(chip(`${rate}x`, () => void send({ type: "speed", rate }), `speed-${rate}`));
    defaultSpeed.append(new Option(`${rate}x`, String(rate)));
  }

  for (const minutes of SLEEP_MINUTES) {
    sleeps.append(
      chip(minutes === 0 ? "Off" : `${minutes}m`, () => void send({ type: "sleep", minutes }), `sleep-${minutes}`),
    );
  }

  play.addEventListener("click", () => void send({ type: "toggle-play" }));
  skipBack.addEventListener("click", () => void send({ type: "skip", delta: -10 }));
  skipForward.addEventListener("click", () => void send({ type: "skip", delta: 10 }));
  mute.addEventListener("click", () => void send({ type: "toggle-mute" }));
  volume.addEventListener("input", () => {
    void send({ type: "volume", value: Number(volume.value) });
  });
  togglePip.addEventListener("click", () => void send({ type: "toggle-pip" }));
  openPlayer.addEventListener("click", () => void send({ type: "open-player" }));
  dismiss.addEventListener("click", () => void send({ type: "dismiss-pip" }));
  autoPip.addEventListener("change", () => void saveSettings({ autoPip: autoPip.checked }));
  defaultSpeed.addEventListener("change", () => {
    void saveSettings({ defaultSpeed: Number(defaultSpeed.value) });
    void send({ type: "speed", rate: Number(defaultSpeed.value) });
  });

  bindTimeline();
  void refresh();
  window.setInterval(() => {
    void refresh();
  }, 400);
}

function bindTimeline(): void {
  const rail = (): DOMRect => timeline.getBoundingClientRect();

  timeline.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || state.isLive || state.duration <= 0) {
      return;
    }

    dragging = true;
    dragStartY = event.clientY;
    dragStartRatio = ratioFromClientX(event.clientX, rail());
    timeline.setPointerCapture(event.pointerId);
    void send({ type: "seek", time: dragStartRatio * state.duration });
  });

  timeline.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }

    const ratio = fineScrubRatio(event.clientX, event.clientY, rail(), dragStartY, dragStartRatio);
    void send({ type: "seek", time: ratio * state.duration });
  });

  timeline.addEventListener("pointerup", () => {
    dragging = false;
  });
}

async function refresh(): Promise<void> {
  const next = await send({ type: "get-state" });
  render(next ?? emptyState());
}

async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const settings = { ...state.settings, ...patch };
  await send({ type: "apply-settings", settings });
}

async function send(command: Command): Promise<PlayerState | null> {
  try {
    const result = await chrome.runtime.sendMessage(command);
    if (isPlayerState(result)) {
      state = result;
      return result;
    }
  } catch {
    return null;
  }

  return null;
}

function render(next: PlayerState): void {
  app.classList.toggle("is-empty", !next.hasVideo);
  title.textContent = next.hasVideo ? next.title || "YouTube" : "No YouTube video";
  status.textContent = statusLabel(next);

  const ratio = next.duration > 0 ? next.currentTime / next.duration : 0;
  played.style.width = `${(ratio * 100).toFixed(2)}%`;
  thumb.style.left = `${(ratio * 100).toFixed(2)}%`;
  current.textContent = formatTime(next.currentTime);
  remaining.textContent = next.isLive ? "LIVE" : formatTime(next.duration);

  play.textContent = next.paused ? "Play" : "Pause";
  mute.textContent = next.muted || next.volume === 0 ? "Unmute" : "Mute";
  volume.value = String(next.muted ? 0 : next.volume);
  togglePip.textContent = next.isPip ? "Close PiP" : "Open PiP";
  autoPip.checked = next.settings.autoPip;
  defaultSpeed.value = String(next.settings.defaultSpeed);

  markChip("speed-", String(next.rate));
  const sleepMinutes = next.sleepEndsAt
    ? nearestSleep(next.sleepEndsAt)
    : 0;
  markChip("sleep-", String(sleepMinutes));
  sleepLeft.textContent = next.sleepEndsAt
    ? `Pauses in ${formatTime((next.sleepEndsAt - Date.now()) / 1000)}`
    : "";

  renderChapters(next);
}

function renderChapters(next: PlayerState): void {
  chapters.replaceChildren();
  for (const chapter of next.chapters.slice(0, 8)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = chapter.title;
    button.addEventListener("click", () => {
      void send({ type: "seek", time: chapter.startTime });
    });
    chapters.append(button);
  }
}

function statusLabel(next: PlayerState): string {
  if (!next.hasVideo) {
    return "Better PiP";
  }
  if (next.waitingForAd) {
    return "Waiting for ad to finish";
  }
  if (next.isAd) {
    return "Ad playing";
  }
  if (next.isPip) {
    return "Playing in picture-in-picture";
  }
  return "Ready";
}

function markChip(prefix: string, value: string): void {
  const root = prefix.startsWith("speed") ? speeds : sleeps;
  for (const node of root.querySelectorAll("button")) {
    node.classList.toggle("is-active", node.dataset.chip === `${prefix}${value}`);
  }
}

function chip(label: string, onClick: () => void, id: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.chip = id;
  button.addEventListener("click", onClick);
  return button;
}

function nearestSleep(endsAt: number): number {
  const minutes = Math.max(0, Math.round((endsAt - Date.now()) / 60000));
  return SLEEP_MINUTES.reduce((best, option) =>
    Math.abs(option - minutes) < Math.abs(best - minutes) ? option : best,
  );
}

function required<T extends HTMLElement>(id: string, ctor?: { new (): T }): T {
  const node = document.getElementById(id);
  if (!node || (ctor && !(node instanceof ctor))) {
    throw new Error(`Missing ${id}`);
  }

  return node as T;
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
    volume: 1,
    muted: false,
    rate: 1,
    title: "",
    chapters: [],
    sleepEndsAt: null,
    waitingForAd: false,
    settings: { ...DEFAULT_SETTINGS },
  };
}

function isPlayerState(value: unknown): value is PlayerState {
  return typeof value === "object" && value !== null && "hasVideo" in value && "settings" in value;
}

void clamp;
