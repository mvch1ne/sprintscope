import { describe, it, expect } from 'vitest';
import {
  angleDeg,
  segAngleDeg,
  segInclineDeg,
  smooth,
  derivative,
  buildSeries,
} from '../sprintMath';

// Helpers
const AR = 1, FW = 1, FH = 1; // unit calibration

describe('angleDeg', () => {
  it('returns 90° for a right angle', () => {
    // A=(0,1), B=(0,0), C=(1,0) — right angle at B
    const a = { x: 0, y: 1 }, b = { x: 0, y: 0 }, c = { x: 1, y: 0 };
    expect(angleDeg(a, b, c, AR, FW, FH)).toBeCloseTo(90, 1);
  });

  it('returns 180° for a straight line', () => {
    const a = { x: -1, y: 0 }, b = { x: 0, y: 0 }, c = { x: 1, y: 0 };
    expect(angleDeg(a, b, c, AR, FW, FH)).toBeCloseTo(180, 1);
  });

  it('returns 0° when two arms are coincident', () => {
    const b = { x: 0, y: 0 };
    expect(angleDeg(b, b, b, AR, FW, FH)).toBe(0);
  });

  it('is symmetric: A-B-C equals C-B-A', () => {
    const a = { x: 1, y: 2 }, b = { x: 3, y: 4 }, c = { x: 5, y: 2 };
    expect(angleDeg(a, b, c, AR, FW, FH)).toBeCloseTo(angleDeg(c, b, a, AR, FW, FH), 5);
  });
});

describe('segAngleDeg', () => {
  it('returns 0° for a perfectly vertical segment (top→bottom)', () => {
    // p1 directly above p2 → no horizontal offset → atan2(0, dy) = 0
    expect(segAngleDeg({ x: 0, y: 0 }, { x: 0, y: 1 }, AR, FW, FH)).toBeCloseTo(0, 5);
  });

  it('returns +90° for a segment pointing right', () => {
    expect(segAngleDeg({ x: 0, y: 0 }, { x: 1, y: 0 }, AR, FW, FH)).toBeCloseTo(90, 5);
  });

  it('returns -90° for a segment pointing left', () => {
    expect(segAngleDeg({ x: 1, y: 0 }, { x: 0, y: 0 }, AR, FW, FH)).toBeCloseTo(-90, 5);
  });
});

describe('segInclineDeg', () => {
  it('returns 90° for a perfectly vertical segment', () => {
    expect(segInclineDeg({ x: 0, y: 0 }, { x: 0, y: 1 }, AR, FW, FH)).toBeCloseTo(90, 5);
  });

  it('returns 0° for a horizontal segment', () => {
    expect(segInclineDeg({ x: 0, y: 0 }, { x: 1, y: 0 }, AR, FW, FH)).toBeCloseTo(0, 5);
  });

  it('returns 45° for a 45-degree segment', () => {
    expect(segInclineDeg({ x: 0, y: 0 }, { x: 1, y: 1 }, AR, FW, FH)).toBeCloseTo(45, 5);
  });

  it('is always non-negative (unsigned)', () => {
    const val = segInclineDeg({ x: 1, y: 0 }, { x: 0, y: 1 }, AR, FW, FH);
    expect(val).toBeGreaterThanOrEqual(0);
  });
});

describe('smooth', () => {
  it('returns same length array', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(smooth(arr, 3).length).toBe(5);
  });

  it('window of 1 returns identity', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(smooth(arr, 1)).toEqual(arr);
  });

  it('reduces high-frequency noise', () => {
    // Alternating signal: 0, 10, 0, 10, 0
    const noisy = [0, 10, 0, 10, 0];
    const s = smooth(noisy, 3);
    // Middle values should be closer to 5 than to 0 or 10
    expect(Math.abs(s[2] - 5)).toBeLessThan(5);
  });
});

describe('derivative', () => {
  it('returns same length array', () => {
    expect(derivative([1, 2, 3, 4, 5], 30).length).toBe(5);
  });

  it('approximates the rate of change of a linear signal', () => {
    // f(i) = i → derivative should be ~fps * 1/2 * 2 = fps... actually central diff:
    // d[i] = (arr[i+1] - arr[i-1]) * fps / 2 = 2 * fps / 2 = fps
    const fps = 30;
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // slope = 1 per frame
    const d = derivative(arr, fps);
    // Interior points should be close to fps (30 deg/s if each step = 1°)
    expect(d[5]).toBeCloseTo(fps, 0);
  });
});

describe('buildSeries', () => {
  it('fills nulls and returns correct frame count', () => {
    const raw: (number | null)[] = [null, 10, null, 30, null];
    const series = buildSeries(raw, 30);
    expect(series.frames.length).toBe(5);
    expect(series.angle.length).toBe(5);
    expect(series.velocity.length).toBe(5);
    expect(series.accel.length).toBe(5);
  });

  it('frames are 0-indexed identity', () => {
    const series = buildSeries([1, 2, 3], 30);
    expect(series.frames).toEqual([0, 1, 2]);
  });

  it('handles all-null input without throwing', () => {
    const series = buildSeries([null, null, null, null], 30);
    expect(series.angle.every(v => v === 0)).toBe(true);
  });
});
