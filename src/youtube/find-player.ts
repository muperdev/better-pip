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
  return findReadyVideo() ?? findAnyVideo();
}

export function waitForYoutubeVideo(timeoutMs = 2500): Promise<HTMLVideoElement | null> {
  const ready = findReadyVideo();
  if (ready) {
    return Promise.resolve(ready);
  }

  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const poll = (): void => {
      const video = findReadyVideo();
      if (video) {
        resolve(video);
        return;
      }

      if (Date.now() >= deadline) {
        resolve(findAnyVideo());
        return;
      }

      window.setTimeout(poll, 80);
    };

    poll();
  });
}

function findReadyVideo(): HTMLVideoElement | null {
  return findVideo((video) => video.readyState > 0);
}

function findAnyVideo(): HTMLVideoElement | null {
  return findVideo(() => true);
}

function findVideo(match: (video: HTMLVideoElement) => boolean): HTMLVideoElement | null {
  for (const selector of VIDEO_SELECTORS) {
    const video = document.querySelector<HTMLVideoElement>(selector);
    if (video && match(video)) {
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
