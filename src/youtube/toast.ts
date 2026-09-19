import { el } from "../shared/dom";

let hideTimer = 0;

export function showToast(message: string): void {
  document.querySelector(".bpip-toast")?.remove();

  const toast = el(document, "div", "bpip-toast", message);
  document.documentElement.append(toast);
  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 2800);
}
