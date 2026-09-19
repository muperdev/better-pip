import type { WindowSize } from "../shared/types";
import { clamp } from "../shared/math";

const STORAGE_KEY = "better-pip:last-size";

export const MINI_SIZE: WindowSize = {
  width: 440,
  height: 110,
};

export function videoAspect(video: HTMLVideoElement): number {
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    return video.videoWidth / video.videoHeight;
  }

  return 16 / 9;
}

export function sizeFromWidth(width: number, video: HTMLVideoElement): WindowSize {
  const aspect = videoAspect(video);
  return {
    width: Math.round(width),
    height: Math.round(width / aspect),
  };
}

export function sizeFromHeight(height: number, video: HTMLVideoElement): WindowSize {
  const aspect = videoAspect(video);
  return {
    width: Math.round(height * aspect),
    height: Math.round(height),
  };
}

export function fitInside(
  availWidth: number,
  availHeight: number,
  video: HTMLVideoElement,
): WindowSize {
  const aspect = videoAspect(video);
  const widthFromHeight = availHeight * aspect;

  if (widthFromHeight <= availWidth) {
    return {
      width: Math.round(widthFromHeight),
      height: Math.round(availHeight),
    };
  }

  return {
    width: Math.round(availWidth),
    height: Math.round(availWidth / aspect),
  };
}

export function readSavedSize(): WindowSize | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("width" in parsed) ||
      !("height" in parsed)
    ) {
      return null;
    }

    const width = Number(parsed.width);
    const height = Number(parsed.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      return null;
    }

    return {
      width: clamp(width, 240, 1280),
      height: clamp(height, 140, 800),
    };
  } catch {
    return null;
  }
}

export function saveSize(size: WindowSize): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
}

export function currentWindowSize(pipWindow: Window): WindowSize {
  return {
    width: pipWindow.innerWidth,
    height: pipWindow.innerHeight,
  };
}

export function sizeFromSaved(saved: WindowSize, video: HTMLVideoElement): WindowSize {
  return sizeFromWidth(saved.width, video);
}

export function resizeViewport(win: Window, size: WindowSize): void {
  const extraWidth = Math.max(0, win.outerWidth - win.innerWidth);
  const extraHeight = Math.max(0, win.outerHeight - win.innerHeight);
  win.resizeTo(size.width + extraWidth, size.height + extraHeight);
}

export function isAspectClose(win: Window, video: HTMLVideoElement): boolean {
  if (win.innerHeight <= 0) {
    return true;
  }

  return Math.abs(win.innerWidth / win.innerHeight - videoAspect(video)) < 0.015;
}
