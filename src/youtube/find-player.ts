const VIDEO_SELECTORS = [
  "#movie_player video.html5-main-video",
  "#shorts-player video.html5-main-video",
  "ytd-player video.html5-main-video",
  "ytmusic-player video",
  "#player video.html5-main-video",
  "video.video-stream",
  "video",
] as const;

export function findYoutubeVideo(): HTMLVideoElement | null {
  for (const selector of VIDEO_SELECTORS) {
    const video = document.querySelector<HTMLVideoElement>(selector);
    if (video && video.readyState > 0) {
      return video;
    }
  }

  for (const selector of VIDEO_SELECTORS) {
    const video = document.querySelector<HTMLVideoElement>(selector);
    if (video) {
      return video;
    }
  }

  return null;
}

export function findPlayerHost(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>("#movie_player") ??
    document.querySelector<HTMLElement>("#shorts-player") ??
    document.querySelector<HTMLElement>("ytmusic-player")
  );
}

export function findRightControls(): HTMLElement | null {
  const host = findPlayerHost();
  return (
    host?.querySelector<HTMLElement>(".ytp-right-controls") ??
    document.querySelector<HTMLElement>(".ytp-right-controls")
  );
}

export function readVideoTitle(): string {
  const heading = document.querySelector(
    [
      "h1.ytd-watch-metadata yt-formatted-string",
      "h2.ytd-reel-player-overlay-renderer",
      "h2.ytShortsVideoTitleViewModelShortsVideoTitle",
      "yt-formatted-string.title.ytmusic-player-bar",
      ".ytMusicPlayerBarTitle",
    ].join(", "),
  );

  const fromHeading = heading?.textContent?.trim();
  if (fromHeading) {
    return fromHeading;
  }

  return document.title
    .replace(/\s+- YouTube Music$/, "")
    .replace(/\s+- YouTube$/, "")
    .trim();
}

export function isLivePlayer(): boolean {
  const host = findPlayerHost();
  return host?.classList.contains("ytp-live") === true;
}
