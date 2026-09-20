import {
  createPlaceholder,
  removePlaceholder,
} from "../youtube/placeholder";
import { setPlayerToggleActive } from "../youtube/inject-toggle";
import { findYoutubeVideo } from "../youtube/find-player";
import { isAdShowing } from "../youtube/ads";

export type EnterReason = "user" | "auto" | "keep";

export type PipOpenOptions = {
  onUserClose?: () => void;
};

export class PipSession {
  private readonly video: HTMLVideoElement;
  private readonly parent: Element;
  private readonly placeholder: HTMLDivElement;
  private readonly onLeave: () => void;
  readonly reason: EnterReason;
  private destroyed = false;

  private constructor(
    video: HTMLVideoElement,
    parent: Element,
    placeholder: HTMLDivElement,
    onLeave: () => void,
    reason: EnterReason,
  ) {
    this.video = video;
    this.parent = parent;
    this.placeholder = placeholder;
    this.onLeave = onLeave;
    this.reason = reason;
  }

  static async open(
    reason: EnterReason,
    options: PipOpenOptions = {},
  ): Promise<PipSession | null> {
    if (session) {
      return session;
    }

    const alreadyOpen = document.pictureInPictureElement;
    if (alreadyOpen instanceof HTMLVideoElement) {
      return PipSession.attach(alreadyOpen, reason, options.onUserClose);
    }

    const video = findYoutubeVideo();
    if (!video || !document.pictureInPictureEnabled) {
      return null;
    }

    if (reason !== "user" && isAdShowing()) {
      return null;
    }

    video.disablePictureInPicture = false;

    try {
      await video.requestPictureInPicture();
    } catch {
      return null;
    }

    return PipSession.attach(video, reason, options.onUserClose);
  }

  private static attach(
    video: HTMLVideoElement,
    reason: EnterReason,
    onUserClose: (() => void) | undefined,
  ): PipSession | null {
    if (session) {
      return session;
    }

    const parent = video.parentElement;
    if (!parent) {
      return null;
    }

    const sessionRef: { current: PipSession | null } = { current: null };
    const placeholder = createPlaceholder(() => {
      sessionRef.current?.openOnYouTube();
    });
    parent.append(placeholder);

    const onLeave = (): void => {
      if (document.contains(video)) {
        onUserClose?.();
      }
      sessionRef.current?.destroy();
    };
    video.addEventListener("leavepictureinpicture", onLeave);

    const created = new PipSession(video, parent, placeholder, onLeave, reason);
    sessionRef.current = created;
    session = created;
    setPlayerToggleActive(true);
    return created;
  }

  openOnYouTube(): void {
    if (this.parent instanceof HTMLElement) {
      this.parent.scrollIntoView({ block: "center" });
    }
    window.focus();
    this.dismiss();
  }

  dismiss(): void {
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture();
      return;
    }

    this.destroy();
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.video.removeEventListener("leavepictureinpicture", this.onLeave);
    this.placeholder.remove();
    removePlaceholder(this.parent);
    if (session === this) {
      session = null;
    }
    setPlayerToggleActive(false);
  }
}

let session: PipSession | null = null;

export function getActiveSession(): PipSession | null {
  return session;
}

export function isPipActive(): boolean {
  return document.pictureInPictureElement instanceof HTMLVideoElement;
}

export async function enterPip(
  reason: EnterReason,
  options: PipOpenOptions = {},
): Promise<boolean> {
  const next = await PipSession.open(reason, options);
  return next !== null;
}

export function exitPip(): void {
  if (session) {
    session.dismiss();
    return;
  }

  if (document.pictureInPictureElement) {
    void document.exitPictureInPicture();
  }
}
