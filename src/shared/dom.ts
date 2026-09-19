export function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

export function svgIcon(
  doc: Document,
  path: string,
  viewBox = "0 0 24 24",
): SVGSVGElement {
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const node = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  node.setAttribute("d", path);
  node.setAttribute("fill", "currentColor");
  svg.append(node);
  return svg;
}

export function button(
  doc: Document,
  className: string,
  label: string,
  path: string,
): HTMLButtonElement {
  const node = el(doc, "button", className);
  node.type = "button";
  node.title = label;
  node.setAttribute("aria-label", label);
  node.append(svgIcon(doc, path));
  return node;
}
