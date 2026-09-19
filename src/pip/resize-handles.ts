import { el } from "../shared/dom";
import { clamp } from "../shared/math";
import {
  resizeViewport,
  sizeFromHeight,
  sizeFromWidth,
} from "./window-size";

const HANDLES = ["n", "s", "e", "w", "nw", "ne", "sw", "se"] as const;

export function attachResizeHandles(
  root: HTMLElement,
  pipWindow: Window,
  video: HTMLVideoElement,
  isLocked: () => boolean,
): void {
  for (const edge of HANDLES) {
    const handle = el(pipWindow.document, "div", `bpip-resize bpip-resize-${edge}`);
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || isLocked()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture(event.pointerId);

      const startWidth = pipWindow.innerWidth;
      const startHeight = pipWindow.innerHeight;
      const startX = event.screenX;
      const startY = event.screenY;
      const fromWest = edge === "w" || edge === "nw" || edge === "sw";
      const fromNorth = edge === "n" || edge === "nw" || edge === "ne";

      const onMove = (move: PointerEvent): void => {
        if (edge === "n" || edge === "s") {
          const delta = move.screenY - startY;
          const height = clamp(startHeight + (fromNorth ? -delta : delta), 140, 800);
          resizeViewport(pipWindow, sizeFromHeight(height, video));
          return;
        }

        const delta = move.screenX - startX;
        const width = clamp(startWidth + (fromWest ? -delta : delta), 240, 1280);
        resizeViewport(pipWindow, sizeFromWidth(width, video));
      };

      const onUp = (): void => {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
      };

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
    });
    root.append(handle);
  }
}
