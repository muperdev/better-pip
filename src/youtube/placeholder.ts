import { el } from "../shared/dom";

const PLACEHOLDER_CLASS = "bpip-placeholder";

export function createPlaceholder(onReturn: () => void): HTMLDivElement {
  const root = el(document, "div", PLACEHOLDER_CLASS);
  const copy = el(document, "div", "bpip-placeholder-copy");
  const title = el(
    document,
    "p",
    "bpip-placeholder-title",
    "Playing in picture-in-picture",
  );
  const action = el(document, "button", "bpip-placeholder-return", "Back to player");
  action.type = "button";
  action.addEventListener("click", onReturn);

  copy.append(title, action);
  root.append(copy);
  return root;
}

export function removePlaceholder(from: ParentNode): void {
  from.querySelector(`.${PLACEHOLDER_CLASS}`)?.remove();
}
