import { el } from "../shared/dom";
import { formatTime } from "../shared/format-time";
import { clamp, fineScrubRatio, ratioFromClientX } from "../shared/math";

type TimelineOptions = {
  video: HTMLVideoElement;
  live: boolean;
  onScrubChange: (scrubbing: boolean) => void;
};

export type Timeline = {
  root: HTMLDivElement;
  refresh: () => void;
  seekRatio: (ratio: number) => void;
  destroy: () => void;
};

export function createTimeline(
  doc: Document,
  options: TimelineOptions,
): Timeline {
  const root = el(doc, "div", "bpip-timeline");
  const tooltip = el(doc, "div", "bpip-tooltip", "0:00");
  const rail = el(doc, "div", "bpip-timeline-rail");
  const buffer = el(doc, "div", "bpip-timeline-buffer");
  const played = el(doc, "div", "bpip-timeline-played");
  const thumb = el(doc, "div", "bpip-timeline-thumb");

  rail.append(buffer, played, thumb);
  root.append(tooltip, rail);

  let dragging = false;
  let dragStartY = 0;
  let dragStartRatio = 0;

  if (options.live) {
    root.classList.add("is-live");
  }

  const duration = (): number => {
    const value = options.video.duration;
    return Number.isFinite(value) && value > 0 ? value : 0;
  };

  const applyRatio = (ratio: number): void => {
    const total = duration();
    const safe = clamp(ratio, 0, 1);
    if (total > 0 && !options.live) {
      options.video.currentTime = safe * total;
    }
    paint(safe);
  };

  const paint = (ratio: number): void => {
    const percent = `${(ratio * 100).toFixed(3)}%`;
    played.style.width = percent;
    thumb.style.left = percent;

    const total = duration();
    if (total > 0 && options.video.buffered.length > 0) {
      const end = options.video.buffered.end(options.video.buffered.length - 1);
      buffer.style.width = `${clamp((end / total) * 100, 0, 100).toFixed(3)}%`;
    }

    const hoverTime = formatTime(ratio * total);
    tooltip.textContent = hoverTime;
    tooltip.style.left = percent;
  };

  const refresh = (): void => {
    if (dragging) {
      return;
    }

    const total = duration();
    paint(total > 0 ? options.video.currentTime / total : 0);
  };

  const ratioFromEvent = (event: PointerEvent): number => {
    const box = rail.getBoundingClientRect();
    if (dragging) {
      return fineScrubRatio(
        event.clientX,
        event.clientY,
        box,
        dragStartY,
        dragStartRatio,
      );
    }

    return ratioFromClientX(event.clientX, box);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (options.live || event.button !== 0) {
      return;
    }

    dragging = true;
    root.classList.add("is-dragging");
    options.onScrubChange(true);
    dragStartY = event.clientY;
    dragStartRatio = ratioFromClientX(event.clientX, rail.getBoundingClientRect());
    root.setPointerCapture(event.pointerId);
    applyRatio(dragStartRatio);
  };

  const onPointerMove = (event: PointerEvent): void => {
    const ratio = ratioFromEvent(event);
    tooltip.style.left = `${(ratio * 100).toFixed(3)}%`;
    tooltip.textContent = formatTime(ratio * duration());

    if (dragging) {
      applyRatio(ratio);
    }
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }

    applyRatio(ratioFromEvent(event));
    dragging = false;
    root.classList.remove("is-dragging");
    options.onScrubChange(false);
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerUp);

  const onMedia = (): void => refresh();
  options.video.addEventListener("timeupdate", onMedia);
  options.video.addEventListener("progress", onMedia);
  options.video.addEventListener("seeked", onMedia);
  options.video.addEventListener("loadedmetadata", onMedia);
  refresh();

  return {
    root,
    refresh,
    seekRatio: applyRatio,
    destroy: () => {
      options.video.removeEventListener("timeupdate", onMedia);
      options.video.removeEventListener("progress", onMedia);
      options.video.removeEventListener("seeked", onMedia);
      options.video.removeEventListener("loadedmetadata", onMedia);
    },
  };
}
