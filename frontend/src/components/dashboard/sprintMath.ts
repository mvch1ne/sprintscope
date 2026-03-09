// ─── Sprint Math — pure, framework-free functions ────────────────────────────
// Extracted from useSprintMetrics so they can be unit-tested without React.

export type P2 = { x: number; y: number };

export interface JointTimeSeries {
  frames: number[];
  angle: number[];
  velocity: number[];
  accel: number[];
}

/** Interior angle at vertex B in the triangle A-B-C, degrees [0, 180].
 *  ar/fw/fh correct for aspect ratio so the angle is in physical space. */
export function angleDeg(a: P2, b: P2, c: P2, ar: number, fw: number, fh: number): number {
  const ax = (a.x - b.x) * ar / fw, ay = (a.y - b.y) / fh;
  const cx = (c.x - b.x) * ar / fw, cy = (c.y - b.y) / fh;
  const dot = ax * cx + ay * cy;
  const mag = Math.hypot(ax, ay) * Math.hypot(cx, cy);
  if (mag < 1e-6) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

/** Angle of segment p1→p2 from the downward vertical, degrees.
 *  Positive = right of vertical. */
export function segAngleDeg(p1: P2, p2: P2, ar: number, fw: number, fh: number): number {
  const dx = (p2.x - p1.x) * ar / fw;
  const dy = (p2.y - p1.y) / fh;
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

/** Unsigned inclination of segment p1→p2 from horizontal, degrees.
 *  0° = horizontal; 90° = perfectly vertical. */
export function segInclineDeg(p1: P2, p2: P2, ar: number, fw: number, fh: number): number {
  const dx = (p2.x - p1.x) * ar / fw;
  const dy = (p2.y - p1.y) / fh;
  return (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
}

export function smooth(arr: number[], w: number): number[] {
  const half = Math.floor(w / 2);
  return arr.map((_, i) => {
    let s = 0, n = 0;
    for (let k = i - half; k <= i + half; k++) {
      if (k >= 0 && k < arr.length) { s += arr[k]; n++; }
    }
    return s / n;
  });
}

/** Central-difference derivative, then smooth. */
export function derivative(arr: number[], fps: number): number[] {
  const n = arr.length;
  const d = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) d[i] = ((arr[i + 1] - arr[i - 1]) * fps) / 2;
  d[0] = d[1];
  d[n - 1] = d[n - 2];
  return smooth(d, 5);
}

export function buildSeries(raw: (number | null)[], fps: number): JointTimeSeries {
  const filled = raw.slice() as number[];
  for (let i = 1; i < filled.length; i++)
    if (filled[i] == null) filled[i] = filled[i - 1] ?? 0;
  for (let i = filled.length - 2; i >= 0; i--)
    if (filled[i] == null) filled[i] = filled[i + 1] ?? 0;

  const angle = smooth(smooth(filled, 3), 3);
  const velocity = derivative(angle, fps);
  const accel = derivative(velocity, fps);
  return { frames: raw.map((_, i) => i), angle, velocity, accel };
}
