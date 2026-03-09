import { describe, it, expect } from 'vitest';
import { detectContacts } from '../useSprintMetrics';
import type { P2 } from '../sprintMath';

const FPS = 30;

/** Build a sequence of P2 points with y varying per frame */
function makeYSeries(ys: number[]): (P2 | null)[] {
  return ys.map(y => ({ x: 0, y }));
}

describe('detectContacts', () => {
  it('detects a single clear contact window', () => {
    // 30 frames: frames 10–19 the foot is near the ground (high y)
    const ys = Array.from({ length: 30 }, (_, i) => (i >= 10 && i < 20 ? 0.9 : 0.1));
    const heel = makeYSeries(ys);
    const toe  = makeYSeries(ys);
    const com  = makeYSeries(Array(30).fill(0.5));

    const events = detectContacts(heel, toe, FPS, 'left', com, [], null);
    expect(events.length).toBe(1);
    expect(events[0].foot).toBe('left');
    expect(events[0].contactFrame).toBe(10);
    expect(events[0].liftFrame).toBe(20);
    expect(events[0].contactTime).toBeCloseTo(10 / FPS, 5);
  });

  it('ignores contacts shorter than 50 ms', () => {
    // Contact window of only 1 frame = 33 ms < 50 ms
    const ys = Array.from({ length: 30 }, (_, i) => (i === 15 ? 0.9 : 0.1));
    const pts = makeYSeries(ys);
    const com = makeYSeries(Array(30).fill(0.5));
    const events = detectContacts(pts, pts, FPS, 'right', com, [], null);
    expect(events.length).toBe(0);
  });

  it('ignores contacts longer than 600 ms', () => {
    // Contact window of 25 frames at 30fps = 833 ms > 600 ms
    const ys = Array.from({ length: 30 }, (_, i) => (i >= 2 && i < 27 ? 0.9 : 0.1));
    const pts = makeYSeries(ys);
    const com = makeYSeries(Array(30).fill(0.5));
    const events = detectContacts(pts, pts, FPS, 'left', com, [], null);
    expect(events.length).toBe(0);
  });

  it('returns empty when given empty input', () => {
    const events = detectContacts([], [], FPS, 'left', [], [], null);
    expect(events.length).toBe(0);
  });

  it('returns empty when all points are null', () => {
    const nulls: (P2 | null)[] = Array(30).fill(null);
    const events = detectContacts(nulls, nulls, FPS, 'right', nulls, [], null);
    expect(events.length).toBe(0);
  });

  it('assigns stable id = foot-contactFrame', () => {
    const ys = Array.from({ length: 30 }, (_, i) => (i >= 10 && i < 20 ? 0.9 : 0.1));
    const pts = makeYSeries(ys);
    const com = makeYSeries(Array(30).fill(0.5));
    const events = detectContacts(pts, pts, FPS, 'right', com, [], null);
    expect(events[0].id).toBe('right-10');
  });

  it('uses scaleOps to compute comDistance when calibrated', () => {
    const ys = Array.from({ length: 30 }, (_, i) => (i >= 10 && i < 20 ? 0.9 : 0.1));
    const heel = makeYSeries(ys);
    // Offset foot x by 50 pixels from com at frame 10
    const toe   = Array.from({ length: 30 }, (_, i) => ({ x: i >= 10 && i < 20 ? 50 : 0, y: ys[i] }));
    const com   = makeYSeries(Array(30).fill(0.5));

    const scaleOps = {
      h: (dx: number) => Math.abs(dx) / 100,
      hSigned: (dx: number) => dx / 100,
      xy: (dx: number, dy: number) => Math.sqrt(dx * dx + dy * dy) / 100,
    };
    const events = detectContacts(heel, toe, FPS, 'left', com, [], scaleOps);
    expect(events.length).toBeGreaterThan(0);
    // At contact frame 10: toe.x=50, com.x=0 → comDist = 50/100 = 0.5
    expect(events[0].comDistance).toBeCloseTo(0.5, 5);
  });
});
