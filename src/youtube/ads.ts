import { findPlayerHost } from "./find-player";

export function isAdShowing(): boolean {
  const host = findPlayerHost();
  return (
    host?.classList.contains("ad-showing") === true ||
    host?.classList.contains("ad-interrupting") === true
  );
}

export function watchAdState(onChange: (showing: boolean) => void): () => void {
  const host = findPlayerHost();
  if (!host) {
    return () => undefined;
  }

  let current = isAdShowing();
  const observer = new MutationObserver(() => {
    const next = isAdShowing();
    if (next === current) {
      return;
    }

    current = next;
    onChange(next);
  });

  observer.observe(host, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
