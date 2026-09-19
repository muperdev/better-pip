export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ratioFromClientX(
  clientX: number,
  rail: DOMRect,
): number {
  if (rail.width <= 0) {
    return 0;
  }

  return clamp((clientX - rail.left) / rail.width, 0, 1);
}

export function fineScrubRatio(
  clientX: number,
  clientY: number,
  rail: DOMRect,
  dragStartY: number,
  dragStartRatio: number,
): number {
  const raw = ratioFromClientX(clientX, rail);
  const pull = Math.max(0, Math.abs(clientY - dragStartY) - 16);
  const precision = clamp(1 - pull / 220, 0.12, 1);

  if (precision === 1) {
    return raw;
  }

  return clamp(dragStartRatio + (raw - dragStartRatio) * precision, 0, 1);
}
