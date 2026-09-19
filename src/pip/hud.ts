import { button, el } from "../shared/dom";
import { formatTime } from "../shared/format-time";
import { ICONS } from "../shared/icons";
import { createTimeline, type Timeline } from "./timeline";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const SKIP_SECONDS = 10;

export type HudHandlers = {
  onMinimize: () => void;
  onRestore: () => void;
  onDismiss: () => void;
  onOpenVideo: () => void;
  onScrubChange: (scrubbing: boolean) => void;
};

export type PipHud = {
  root: HTMLDivElement;
  chrome: HTMLDivElement;
  mini: HTMLDivElement;
  slim: HTMLDivElement;
  timeline: Timeline;
  refresh: () => void;
  setTitle: (title: string) => void;
  setLive: (live: boolean) => void;
  destroy: () => void;
};

export function createHud(
  doc: Document,
  video: HTMLVideoElement,
  titleText: string,
  live: boolean,
  handlers: HudHandlers,
): PipHud {
  const root = el(doc, "div", "bpip-hud");
  const top = el(doc, "div", "bpip-top");
  const title = el(doc, "div", "bpip-title", titleText);
  top.append(title);

  const chrome = el(doc, "div", "bpip-chrome");
  const openBtn = el(doc, "button", "bpip-open", "Open");
  openBtn.type = "button";
  openBtn.title = "Open on YouTube";
  const minimizeBtn = button(doc, "bpip-minimize", "Minimize", ICONS.minimize);
  const closeBtn = button(doc, "bpip-close", "Dismiss", ICONS.close);
  openBtn.addEventListener("click", handlers.onOpenVideo);
  minimizeBtn.addEventListener("click", handlers.onMinimize);
  closeBtn.addEventListener("click", handlers.onDismiss);
  chrome.append(openBtn, minimizeBtn, closeBtn);

  const timeline = createTimeline(doc, {
    video,
    live,
    onScrubChange: handlers.onScrubChange,
  });

  const transport = el(doc, "div", "bpip-transport");
  const left = el(doc, "div", "bpip-left");
  const right = el(doc, "div", "bpip-right");

  const playBtn = button(doc, "bpip-play", "Play", ICONS.play);
  const backBtn = button(doc, "bpip-skip-back", "Back 10 seconds", ICONS.skipBack);
  const forwardBtn = button(doc, "bpip-skip-forward", "Forward 10 seconds", ICONS.skipForward);
  const volumeWrap = el(doc, "div", "bpip-volume");
  const muteBtn = button(doc, "bpip-mute", "Mute", ICONS.volume);
  const volume = el(doc, "input");
  volume.type = "range";
  volume.min = "0";
  volume.max = "1";
  volume.step = "0.01";
  volume.value = String(video.muted ? 0 : video.volume);
  volumeWrap.append(muteBtn, volume);

  const time = el(doc, "div", live ? "bpip-live" : "bpip-time", live ? "LIVE" : "0:00 / 0:00");
  const speed = el(doc, "div", "bpip-speed");
  const speedToggle = el(doc, "button", "bpip-speed-toggle", rateLabel(video.playbackRate));
  speedToggle.type = "button";
  speedToggle.title = "Playback speed";
  const speedMenu = el(doc, "div", "bpip-speed-menu");

  for (const rate of SPEEDS) {
    const option = el(doc, "button", undefined, rateLabel(rate));
    option.type = "button";
    option.addEventListener("click", () => {
      video.playbackRate = rate;
      syncSpeedMenu(false);
      refreshSpeed();
    });
    speedMenu.append(option);
  }

  const syncSpeedMenu = (open: boolean): void => {
    speedMenu.classList.toggle("is-open", open);
    root.parentElement?.classList.toggle("is-menu", open);
  };

  speedToggle.addEventListener("click", () => {
    syncSpeedMenu(!speedMenu.classList.contains("is-open"));
  });
  speed.append(speedToggle, speedMenu);

  playBtn.addEventListener("click", () => togglePlay(video));
  backBtn.addEventListener("click", () => skip(video, -SKIP_SECONDS));
  forwardBtn.addEventListener("click", () => skip(video, SKIP_SECONDS));
  muteBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    refreshVolume();
  });
  volume.addEventListener("input", () => {
    video.muted = Number(volume.value) === 0;
    video.volume = Number(volume.value);
    refreshVolume();
  });

  left.append(playBtn, backBtn, forwardBtn, volumeWrap, time);
  right.append(speed);
  transport.append(left, right);

  const bottom = el(doc, "div", "bpip-bottom");
  bottom.append(timeline.root, transport);
  root.append(top, bottom);

  const slim = el(doc, "div", "bpip-slim");
  const slimPlayed = el(doc, "div", "bpip-slim-played");
  slim.append(slimPlayed);

  const mini = el(doc, "div", "bpip-mini");
  const miniProgress = el(doc, "div", "bpip-mini-progress");
  const miniPlay = button(doc, "bpip-mini-play", "Play", ICONS.play);
  const miniTitle = el(doc, "div", "bpip-mini-title", titleText);
  const miniTime = el(doc, "div", "bpip-time", live ? "LIVE" : "0:00");
  const miniOpen = el(doc, "button", "bpip-open", "Open");
  miniOpen.type = "button";
  miniOpen.title = "Open on YouTube";
  const miniRestore = button(doc, "bpip-restore", "Restore", ICONS.restore);
  const miniClose = button(doc, "bpip-mini-close", "Dismiss", ICONS.close);

  miniPlay.addEventListener("click", () => togglePlay(video));
  miniOpen.addEventListener("click", handlers.onOpenVideo);
  miniRestore.addEventListener("click", handlers.onRestore);
  miniClose.addEventListener("click", handlers.onDismiss);
  mini.append(miniProgress, miniPlay, miniTitle, miniTime, miniOpen, miniRestore, miniClose);

  const refreshVolume = (): void => {
    const muted = video.muted || video.volume === 0;
    setButtonIcon(muteBtn, muted ? ICONS.muted : ICONS.volume, muted ? "Unmute" : "Mute");
    volume.value = muted ? "0" : String(video.volume);
  };

  const refreshPlay = (): void => {
    const ended = video.ended;
    const paused = video.paused;
    const icon = ended ? ICONS.replay : paused ? ICONS.play : ICONS.pause;
    const label = ended ? "Replay" : paused ? "Play" : "Pause";
    setButtonIcon(playBtn, icon, label);
    setButtonIcon(miniPlay, icon, label);
  };

  const refreshSpeed = (): void => {
    speedToggle.textContent = rateLabel(video.playbackRate);
    [...speedMenu.children].forEach((child, index) => {
      if (child instanceof HTMLButtonElement) {
        const rate = SPEEDS[index];
        child.classList.toggle("is-active", rate === video.playbackRate);
      }
    });
  };

  const refreshTime = (): void => {
    const current = formatTime(video.currentTime);
    const total = formatTime(video.duration);
    if (!live) {
      time.textContent = `${current} / ${total}`;
      miniTime.textContent = current;
    }

    const ratio =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.currentTime / video.duration
        : 0;
    slimPlayed.style.width = `${(ratio * 100).toFixed(3)}%`;
    miniProgress.style.width = `${(ratio * 100).toFixed(3)}%`;
  };

  const refresh = (): void => {
    refreshPlay();
    refreshVolume();
    refreshSpeed();
    refreshTime();
    timeline.refresh();
  };

  const onMedia = (): void => refresh();
  video.addEventListener("play", onMedia);
  video.addEventListener("pause", onMedia);
  video.addEventListener("ended", onMedia);
  video.addEventListener("timeupdate", onMedia);
  video.addEventListener("volumechange", onMedia);
  video.addEventListener("ratechange", onMedia);
  refresh();

  return {
    root,
    chrome,
    mini,
    slim,
    timeline,
    refresh,
    setTitle: (next) => {
      title.textContent = next;
      miniTitle.textContent = next;
    },
    setLive: (next) => {
      time.className = next ? "bpip-live" : "bpip-time";
      if (next) {
        time.textContent = "LIVE";
        miniTime.textContent = "LIVE";
      }
    },
    destroy: () => {
      video.removeEventListener("play", onMedia);
      video.removeEventListener("pause", onMedia);
      video.removeEventListener("ended", onMedia);
      video.removeEventListener("timeupdate", onMedia);
      video.removeEventListener("volumechange", onMedia);
      video.removeEventListener("ratechange", onMedia);
      timeline.destroy();
    },
  };
}

function rateLabel(rate: number): string {
  return rate === 1 ? "1x" : `${rate}x`;
}

function togglePlay(video: HTMLVideoElement): void {
  if (video.ended) {
    video.currentTime = 0;
  }

  if (video.paused) {
    void video.play();
    return;
  }

  video.pause();
}

function skip(video: HTMLVideoElement, delta: number): void {
  if (!Number.isFinite(video.duration)) {
    return;
  }

  video.currentTime = Math.min(
    video.duration,
    Math.max(0, video.currentTime + delta),
  );
}

function setButtonIcon(
  target: HTMLButtonElement,
  path: string,
  label: string,
): void {
  const doc = target.ownerDocument;
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const node = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  node.setAttribute("d", path);
  node.setAttribute("fill", "currentColor");
  svg.append(node);
  target.replaceChildren(svg);
  target.title = label;
  target.setAttribute("aria-label", label);
}

export function bindTransportKeys(doc: Document, video: HTMLVideoElement): () => void {
  const onKey = (event: KeyboardEvent): void => {
    if (event.altKey || event.metaKey || event.ctrlKey) {
      return;
    }

    switch (event.key) {
      case " ":
      case "k":
      case "K":
        event.preventDefault();
        togglePlay(video);
        break;
      case "ArrowLeft":
        event.preventDefault();
        skip(video, event.shiftKey ? -2 : -5);
        break;
      case "ArrowRight":
        event.preventDefault();
        skip(video, event.shiftKey ? 2 : 5);
        break;
      case "j":
      case "J":
        skip(video, -SKIP_SECONDS);
        break;
      case "l":
      case "L":
        skip(video, SKIP_SECONDS);
        break;
      case "m":
      case "M":
        video.muted = !video.muted;
        break;
      case "ArrowUp":
        event.preventDefault();
        video.muted = false;
        video.volume = Math.min(1, video.volume + 0.05);
        break;
      case "ArrowDown":
        event.preventDefault();
        video.volume = Math.max(0, video.volume - 0.05);
        break;
      default:
        if (/^[0-9]$/.test(event.key) && Number.isFinite(video.duration)) {
          video.currentTime = (Number(event.key) / 10) * video.duration;
        }
    }
  };

  doc.addEventListener("keydown", onKey);
  return () => doc.removeEventListener("keydown", onKey);
}
