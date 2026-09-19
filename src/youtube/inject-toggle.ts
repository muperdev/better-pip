import { button, el, svgIcon } from "../shared/dom";
import { ICONS } from "../shared/icons";
import { findPlayerHost, findRightControls } from "./find-player";

const BAR_CLASS = "bpip-player-toggle";
const OVERLAY_CLASS = "bpip-overlay-toggle";

export function setPlayerToggleActive(active: boolean): void {
  document
    .querySelectorAll(`.${BAR_CLASS}, .${OVERLAY_CLASS}`)
    .forEach((node) => {
      node.classList.toggle("is-active", active);
    });
}

export function injectPlayerToggle(onToggle: () => void): void {
  injectBarButton(onToggle);
  injectOverlayButton(onToggle);
}

export function watchPlayerToggle(onToggle: () => void): void {
  const sync = (): void => injectPlayerToggle(onToggle);
  sync();
  document.addEventListener("yt-navigate-finish", sync);

  let scheduled = 0;
  const observer = new MutationObserver(() => {
    if (scheduled !== 0) {
      return;
    }

    scheduled = window.setTimeout(() => {
      scheduled = 0;
      sync();
    }, 250);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function injectBarButton(onToggle: () => void): void {
  const controls = findRightControls();
  if (!controls || controls.querySelector(`.${BAR_CLASS}`)) {
    return;
  }

  const toggle = button(document, `ytp-button ${BAR_CLASS}`, "Better PiP", ICONS.pip);
  bindToggle(toggle, onToggle);

  const nativePip = controls.querySelector(".ytp-pip-button");
  if (nativePip) {
    nativePip.before(toggle);
    return;
  }

  controls.prepend(toggle);
}

function injectOverlayButton(onToggle: () => void): void {
  const host = findPlayerHost();
  if (!host || host.querySelector(`.${OVERLAY_CLASS}`)) {
    return;
  }

  const toggle = el(document, "button", OVERLAY_CLASS);
  toggle.type = "button";
  toggle.title = "Better PiP";
  toggle.setAttribute("aria-label", "Better PiP");
  toggle.append(svgIcon(document, ICONS.pip), el(document, "span", undefined, "Better PiP"));
  bindToggle(toggle, onToggle);
  host.append(toggle);
}

function bindToggle(node: HTMLElement, onToggle: () => void): void {
  node.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggle();
  });
}
