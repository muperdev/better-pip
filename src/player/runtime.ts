import type { Command, PlayerState } from "../shared/messages";
import { DEFAULT_SETTINGS, type Settings } from "../shared/settings";
import { isAdShowing, watchAdState } from "../youtube/ads";
import { readChapters } from "../youtube/chapters";
import {
  findYoutubeVideo,
  isLivePlayer,
  readVideoTitle,
} from "../youtube/find-player";
import {
  enterPip,
  exitPip,
  getActiveSession,
  isPipActive,
  togglePipSession,
} from "../pip/session";

let settings: Settings = { ...DEFAULT_SETTINGS };
let sleepEndsAt: number | null = null;
let sleepTimer = 0;
let pendingEnter: "user" | "auto" | "keep" | null = null;
let keepAfterLeave = false;
let stopAdWatch: (() => void) | null = null;

export function bootRuntime(): void {
  if (stopAdWatch) {
    return;
  }

  stopAdWatch = watchAdState((showing) => {
    if (!showing) {
      void flushPendingEnter();
    }
  });

  bindMediaSession();
  window.setInterval(bindMediaSession, 2000);
  document.addEventListener("play", bindMediaSession, true);

  document.addEventListener("visibilitychange", () => {
    bindMediaSession();
    if (document.hidden) {
      void handleTabHidden();
      return;
    }

    void handleTabShown();
  });

  document.addEventListener("yt-navigate-finish", () => {
    applyPlaybackPrefs();
    bindMediaSession();
    void recoverPipAfterNavigation();
  });

  applyPlaybackPrefs();
}

export async function handleCommand(command: Command): Promise<PlayerState> {
  switch (command.type) {
    case "get-state":
      break;
    case "toggle-pip":
      await toggleFromUser();
      break;
    case "dismiss-pip":
      keepAfterLeave = false;
      pendingEnter = null;
      exitPip();
      break;
    case "open-player":
      keepAfterLeave = false;
      pendingEnter = null;
      getActiveSession()?.openOnYouTube();
      window.focus();
      break;
    case "play":
      void video()?.play();
      break;
    case "pause":
      video()?.pause();
      break;
    case "toggle-play":
      togglePlay();
      break;
    case "seek":
      seekTo(command.time);
      break;
    case "skip":
      skipBy(command.delta);
      break;
    case "speed":
      setSpeed(command.rate);
      break;
    case "volume":
      setVolume(command.value);
      break;
    case "toggle-mute":
      toggleMute();
      break;
    case "sleep":
      setSleep(command.minutes);
      break;
    case "apply-settings":
      settings = command.settings;
      applyPlaybackPrefs();
      break;
    case "tab-hidden":
      void handleTabHidden();
      break;
    case "tab-shown":
      void handleTabShown();
      break;
  }

  return readState();
}

export function readState(): PlayerState {
  const media = video();
  const duration = media && Number.isFinite(media.duration) ? media.duration : 0;

  return {
    hasVideo: media !== null,
    isPip: isPipActive(),
    isAd: isAdShowing(),
    isLive: isLivePlayer(),
    paused: media?.paused ?? true,
    currentTime: media?.currentTime ?? 0,
    duration,
    volume: media?.volume ?? settings.lastVolume,
    muted: media?.muted ?? false,
    rate: media?.playbackRate ?? settings.defaultSpeed,
    title: readVideoTitle(),
    chapters: readChapters(),
    sleepEndsAt,
    waitingForAd: pendingEnter !== null && isAdShowing(),
    settings,
  };
}

async function toggleFromUser(): Promise<void> {
  if (isPipActive()) {
    keepAfterLeave = false;
    pendingEnter = null;
    exitPip();
    return;
  }

  if (isAdShowing()) {
    pendingEnter = "user";
    return;
  }

  await startPip("user");
}

async function handleTabHidden(): Promise<void> {
  if (!settings.autoPip) {
    return;
  }

  const media = video();
  if (!media || media.paused || isPipActive()) {
    return;
  }

  if (isAdShowing()) {
    pendingEnter = "auto";
    return;
  }

  await startPip("auto");
}

async function handleTabShown(): Promise<void> {
  if (!settings.autoPip) {
    return;
  }

  if (getActiveSession()?.reason === "auto") {
    keepAfterLeave = false;
    exitPip();
  }
}

async function recoverPipAfterNavigation(): Promise<void> {
  applyPlaybackPrefs();
  stopAdWatch?.();
  stopAdWatch = watchAdState((showing) => {
    if (!showing) {
      void flushPendingEnter();
    }
  });

  if (isPipActive()) {
    return;
  }

  if (!keepAfterLeave) {
    return;
  }

  if (isAdShowing()) {
    pendingEnter = pendingEnter ?? "keep";
    return;
  }

  await startPip("keep");
}

async function flushPendingEnter(): Promise<void> {
  if (!pendingEnter || isAdShowing()) {
    return;
  }

  const reason = pendingEnter;
  pendingEnter = null;
  await startPip(reason);
}

function applyPlaybackPrefs(): void {
  const media = video();
  if (!media) {
    return;
  }

  media.playbackRate = settings.defaultSpeed;
  media.volume = settings.lastVolume;
}

function togglePlay(): void {
  const media = video();
  if (!media) {
    return;
  }

  if (media.paused) {
    void media.play();
    return;
  }

  media.pause();
}

function seekTo(time: number): void {
  const media = video();
  if (!media || !Number.isFinite(media.duration)) {
    return;
  }

  media.currentTime = Math.min(media.duration, Math.max(0, time));
}

function skipBy(delta: number): void {
  const media = video();
  if (!media) {
    return;
  }

  seekTo(media.currentTime + delta);
}

function setSpeed(rate: number): void {
  const media = video();
  if (media) {
    media.playbackRate = rate;
  }
}

function setVolume(value: number): void {
  const media = video();
  if (!media) {
    return;
  }

  media.muted = value === 0;
  media.volume = value;
  settings = { ...settings, lastVolume: value };
}

function toggleMute(): void {
  const media = video();
  if (media) {
    media.muted = !media.muted;
  }
}

function setSleep(minutes: number): void {
  window.clearTimeout(sleepTimer);
  if (minutes <= 0) {
    sleepEndsAt = null;
    return;
  }

  sleepEndsAt = Date.now() + minutes * 60_000;
  sleepTimer = window.setTimeout(() => {
    video()?.pause();
    keepAfterLeave = false;
    exitPip();
    sleepEndsAt = null;
  }, minutes * 60_000);
}

async function startPip(reason: "user" | "auto" | "keep"): Promise<boolean> {
  const opened = await enterPip(reason);
  if (opened) {
    keepAfterLeave = true;
  }
  return opened;
}

function bindMediaSession(): void {
  const media = video();
  if (media) {
    media.disablePictureInPicture = false;
  }

  try {
    navigator.mediaSession.setActionHandler(
      "enterpictureinpicture" as MediaSessionAction,
      () => {
        void onChromeAutoEnter();
      },
    );
    navigator.mediaSession.setActionHandler(
      "leavepictureinpicture" as MediaSessionAction,
      () => {
        void handleTabShown();
      },
    );
  } catch {
    // Older Chrome without automatic PiP actions.
  }
}

async function onChromeAutoEnter(): Promise<void> {
  if (!settings.autoPip || isPipActive()) {
    return;
  }

  if (isAdShowing()) {
    pendingEnter = "auto";
    return;
  }

  const media = video();
  if (!media || media.paused) {
    return;
  }

  await startPip("auto");
}

function video(): HTMLVideoElement | null {
  return findYoutubeVideo();
}
