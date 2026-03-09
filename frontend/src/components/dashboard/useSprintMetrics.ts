// Not sure yet but will likely contain something that summarizes...don't know but we'll see
// ─── Sprint Metrics Engine ────────────────────────────────────────────────────
// All computation from raw 2-D keypoint arrays + fps + optional px/m calibration.
// Called from Viewport after pose data is ready; result stored in VideoContext.
//
// Wholebody3d keypoint indices (MMPose / COCO Wholebody):
//   0  Nose       1  L.Eye     2  R.Eye     3  L.Ear     4  R.Ear
//   5  L.Shoulder 6  R.Shoulder 7  L.Elbow  8  R.Elbow
//   9  L.Wrist   10  R.Wrist  11  L.Hip    12  R.Hip
//  13  L.Knee    14  R.Knee   15  L.Ankle  16  R.Ankle
//  17  L.BigToe  18  L.SmallToe 19  L.Heel
//  20  R.BigToe  21  R.SmallToe 22  R.Heel

import { useMemo } from 'react';
import type { Keypoint } from './viewport/PoseEngine/usePoseLandmarker';
import type { CalibrationData } from './viewport/CalibrationAndMeasurements/CalibrationOverlay';
import { angleDeg, segAngleDeg, segInclineDeg, smooth, derivative, buildSeries } from './sprintMath';
import type { P2, JointTimeSeries } from './sprintMath';

export type { P2, JointTimeSeries };

// ── Public types ───────────────────────────────────────────────────────────────

export interface GroundContactEvent {
  id?: string;        // set for manually-placed contacts
  isManual?: boolean;
  foot: 'left' | 'right';
  contactFrame: number; // first frame foot is on ground
  liftFrame: number; // first frame foot leaves ground
  contactTime: number; // seconds
  flightTimeBefore: number; // seconds airborne before this contact
  contactSite: { x: number; y: number }; // heel pixel coords at touchdown
  comAtContact: { x: number; y: number }; // hip-midpoint at touchdown
  comDistance: number; // signed horizontal offset: foot X − CoM X in metres (+ = ahead of CoM, − = behind)
  stepLength: number | null; // step length: to previous contact of either foot (m)
  stepFrequency: number | null; // Hz — 1 / step cycle time
}

export interface CoMSeries {
  /** Horizontal displacement from frame-0 position (metres) */
  x: number[];
  /** Horizontal speed |vx| in m/s */
  speed: number[];
  /** Horizontal acceleration d(speed)/dt in m/s² */
  accel: number[];
  /** Cumulative horizontal distance travelled (metres) */
  distance: number[];
}

export interface SprintMetrics {
  // ── Temporal ────────────────────────────────────────────────────────────────
  groundContacts: GroundContactEvent[];
  avgContactTime: number; // s
  avgFlightTime: number; // s
  avgStepLength: number | null; // m or px
  avgStepFreq: number | null; // Hz
  avgComDistance: number | null; // m or px
  // ── Angular — per joint, every frame ────────────────────────────────────────
  leftHip: JointTimeSeries;
  rightHip: JointTimeSeries;
  leftKnee: JointTimeSeries;
  rightKnee: JointTimeSeries;
  leftAnkle: JointTimeSeries;
  rightAnkle: JointTimeSeries;
  leftShoulder: JointTimeSeries;
  rightShoulder: JointTimeSeries;
  leftElbow: JointTimeSeries;
  rightElbow: JointTimeSeries;
  leftWrist: JointTimeSeries;
  rightWrist: JointTimeSeries;
  torso: JointTimeSeries; // trunk inclination from horizontal (0°=horizontal/leaning fwd, 90°=upright)
  leftThigh: JointTimeSeries; // thigh angle from downward vertical (signed: + = forward, − = behind)
  rightThigh: JointTimeSeries;
  leftShin: JointTimeSeries; // shin inclination from horizontal (0°=horizontal, 90°=vertical shin)
  rightShin: JointTimeSeries;
  // ── CoM trajectory ─────────────────────────────────────────────────────────
  com: { frame: number; x: number; y: number }[];
  comSeries: CoMSeries;
}

// ── Internal helpers ───────────────────────────────────────────────────────────

const SCORE_MIN = 0.35;

function pt(keypoints: Keypoint[], idx: number): P2 | null {
  const p = keypoints[idx];
  if (!p || p.score < SCORE_MIN) return null;
  return { x: p.x, y: p.y };
}

// Re-export for consumers that import from here
export { angleDeg, segAngleDeg, segInclineDeg, smooth, derivative, buildSeries };

type ScaleOps = {
  /** Convert a horizontal inference-frame pixel distance → metres (absolute). */
  h: (dx: number) => number;
  /** Convert a signed horizontal pixel offset → metres (preserves sign). */
  hSigned: (dx: number) => number;
  /** Convert a 2-D inference-frame pixel displacement → metres. */
  xy: (dx: number, dy: number) => number;
} | null;

/** Detect ground contact windows for one foot.
 *  Strategy: use whichever of toe/heel is closest to ground (largest Y in screen space).
 *  This captures toe-first contacts common in sprinting where the heel stays elevated.
 *  Threshold = 12% of total vertical travel — works for any camera height/distance. */
export function detectContacts(
  heelPts: (P2 | null)[],
  toePts: (P2 | null)[],
  fps: number,
  foot: 'left' | 'right',
  comPts: (P2 | null)[],
  prev: GroundContactEvent[],
  scaleOps: ScaleOps,
  flipH = false,
): GroundContactEvent[] {
  // Combined foot Y: whichever landmark is closer to ground (larger Y in screen coords)
  const footYs: (number | null)[] = heelPts.map((h, i) => {
    const t = toePts[i];
    if (h && t) return Math.max(h.y, t.y);
    if (h) return h.y;
    if (t) return t.y;
    return null;
  });
  const validYs = footYs.flatMap((y) => (y != null ? [y] : []));
  if (!validYs.length) return [];
  const maxY = Math.max(...validYs);
  const minY = Math.min(...validYs);
  const thr = (maxY - minY) * 0.10; // 10% threshold (was 12%)
  const floor = maxY - thr;

  const raw = footYs.map((y) => y != null && y >= floor);

  // Gap-fill: merge contact windows separated by < 4 frames to avoid split detections
  const onGnd = raw.slice();
  let lastTrue = -1;
  for (let i = 0; i < onGnd.length; i++) {
    if (onGnd[i]) {
      if (lastTrue >= 0 && i - lastTrue < 4) {
        for (let k = lastTrue + 1; k < i; k++) onGnd[k] = true;
      }
      lastTrue = i;
    }
  }

  const events: GroundContactEvent[] = [];
  let start: number | null = null;

  for (let i = 0; i <= onGnd.length; i++) {
    const cur = i < onGnd.length ? onGnd[i] : false;
    if (cur && start === null) {
      start = i;
    } else if (!cur && start !== null) {
      const duration = (i - start) / fps;
      // Reasonable sprint contact: 50–600 ms
      if (duration >= 0.05 && duration <= 0.6) {
        // Contact site: whichever of toe/heel is closest to the ground (larger Y)
        const h = heelPts[start];
        const t = toePts[start];
        const site = h && t ? (h.y > t.y ? h : t) : (h ?? t);
        const com = comPts[start];
        // Only report CoM distance when calibrated.
        const comDist =
          site && com && scaleOps
            ? scaleOps.hSigned((site.x - com.x) * (flipH ? -1 : 1))
            : 0;

        // Step: distance to the previous contact of EITHER foot (foot-to-next-foot)
        const prevEvt = [...prev, ...events].at(-1) ?? null;
        let stepLength: number | null = null;
        let stepFrequency: number | null = null;
        if (prevEvt && site) {
          const dx = Math.abs(site.x - prevEvt.contactSite.x);
          // Only report step length when calibrated — pixel values are meaningless here.
          stepLength = scaleOps ? scaleOps.h(dx) : null;
          const dt = (start - prevEvt.contactFrame) / fps;
          stepFrequency = dt > 0 ? 1 / dt : null;
        }
        const flightTimeBefore = prevEvt
          ? Math.max(0, (start - prevEvt.liftFrame) / fps)
          : 0;

        events.push({
          id: `${foot}-${start}`, // stable id: foot + first-contact-frame
          foot,
          contactFrame: start,
          liftFrame: i,
          contactTime: duration,
          flightTimeBefore,
          contactSite: site ?? { x: 0, y: 0 },
          comAtContact: com ?? { x: 0, y: 0 },
          comDistance: comDist,
          stepLength,
          stepFrequency,
        });
      }
      start = null;
    }
  }
  return events;
}

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useSprintMetrics(
  getKeypoints: (frame: number) => Keypoint[],
  totalFrames: number,
  fps: number,
  calibration: CalibrationData | null,
  /** Inference-frame pixel dimensions — required for correct metre conversion. */
  frameWidth: number,
  frameHeight: number,
  flipH = false,
): SprintMetrics | null {
  return useMemo(() => {
    if (totalFrames < 2 || fps <= 0) return null;
    // Require calibration — without it, all distance-based metrics are meaningless
    // and angular-only data is not yet sufficient to unlock the panel.
    if (!calibration) return null;

    // Build per-frame point series for every landmark we need
    const all = Array.from({ length: totalFrames }, (_, i) => getKeypoints(i));
    const col = (idx: number) => all.map((f) => pt(f, idx));

    const nose = col(0);
    const lSho = col(5);
    const rSho = col(6);
    const lElb = col(7);
    const rElb = col(8);
    const lWri = col(9);
    const rWri = col(10);
    const lHip = col(11);
    const rHip = col(12);
    const lKne = col(13);
    const rKne = col(14);
    const lAnk = col(15);
    const rAnk = col(16);
    const lToe = col(17);
    const lHeel = col(19);
    const rToe = col(20);
    const rHeel = col(22);

    // CoM ≈ hip midpoint
    const com: (P2 | null)[] = lHip.map((l, i) => {
      const r = rHip[i];
      if (!l || !r) return null;
      return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 };
    });

    // Build scale operations only when calibration AND inference-frame dims are known.
    // Keypoints are in inference-frame pixel coords; calibration was computed in
    // normalised (0-1) video space with aspect-ratio correction applied to the
    // horizontal axis. We therefore normalise each component before applying ppm.
    const scaleOps: ScaleOps =
      calibration && frameWidth > 0 && frameHeight > 0
        ? {
            h: (dx: number) =>
              ((Math.abs(dx) / frameWidth) * calibration.aspectRatio) /
              calibration.pixelsPerMeter,
            hSigned: (dx: number) =>
              ((dx / frameWidth) * calibration.aspectRatio) /
              calibration.pixelsPerMeter,
            xy: (dx: number, dy: number) => {
              const nx = (dx / frameWidth) * calibration.aspectRatio;
              const ny = dy / frameHeight;
              return Math.sqrt(nx * nx + ny * ny) / calibration.pixelsPerMeter;
            },
          }
        : null;

    // ── Ground contacts ─────────────────────────────────────────────────────
    const leftC = detectContacts(lHeel, lToe, fps, 'left', com, [], scaleOps, flipH);
    const rightC = detectContacts(rHeel, rToe, fps, 'right', com, leftC, scaleOps, flipH);
    const contacts = [...leftC, ...rightC].sort(
      (a, b) => a.contactFrame - b.contactFrame,
    );

    const contactTimes = contacts.map((e) => e.contactTime);
    const flightTimes = contacts
      .map((e) => e.flightTimeBefore)
      .filter((t) => t > 0);
    const stepLengths = contacts.flatMap((e) =>
      e.stepLength !== null ? [e.stepLength] : [],
    );
    const stepFreqs = contacts.flatMap((e) =>
      e.stepFrequency !== null ? [e.stepFrequency] : [],
    );

    // ── Angular helpers ─────────────────────────────────────────────────────
    // Aspect-ratio params for physical-space angle computation
    const ar = calibration.aspectRatio;
    const fw = Math.max(1, frameWidth);
    const fh = Math.max(1, frameHeight);

    const jA = (a: (P2 | null)[], b: (P2 | null)[], c: (P2 | null)[]) =>
      a.map((pa, i) => {
        const pb = b[i],
          pc = c[i];
        return pa && pb && pc ? angleDeg(pa, pb, pc, ar, fw, fh) : null;
      });

    const sA = (from: (P2 | null)[], to: (P2 | null)[]) =>
      from.map((p1, i) => {
        const p2 = to[i];
        return p1 && p2 ? segAngleDeg(p1, p2, ar, fw, fh) : null;
      });

    /** Inclination from horizontal: 0°=horizontal, 90°=vertical. */
    const iA = (from: (P2 | null)[], to: (P2 | null)[]) =>
      from.map((p1, i) => {
        const p2 = to[i];
        return p1 && p2 ? segInclineDeg(p1, p2, ar, fw, fh) : null;
      });

    // Trunk inclination from horizontal: 90° = perfectly upright, <90° = leaning forward/back.
    // segInclineDeg(com→nose): nose is above hip so |dy| >> |dx| when upright → ~90°.
    const trunkDir = iA(com, nose);

    return {
      groundContacts: contacts,
      avgContactTime: avg(contactTimes),
      avgFlightTime: avg(flightTimes),
      avgStepLength: stepLengths.length ? avg(stepLengths) : null,
      avgStepFreq: stepFreqs.length ? avg(stepFreqs) : null,
      avgComDistance: (() => {
        const ds = contacts.filter((e) => e.comDistance !== 0).map((e) => e.comDistance);
        return ds.length ? avg(ds) : null;
      })(),

      // Lower body — anatomical angles
      leftHip: buildSeries(jA(lKne, lHip, lSho), fps),
      rightHip: buildSeries(jA(rKne, rHip, rSho), fps),
      leftKnee: buildSeries(jA(lHip, lKne, lAnk), fps),
      rightKnee: buildSeries(jA(rHip, rKne, rAnk), fps),
      leftAnkle: buildSeries(jA(lKne, lAnk, lToe), fps),
      rightAnkle: buildSeries(jA(rKne, rAnk, rToe), fps),

      // Upper body
      leftShoulder: buildSeries(jA(lElb, lSho, lHip), fps),
      rightShoulder: buildSeries(jA(rElb, rSho, rHip), fps),
      leftElbow: buildSeries(jA(lSho, lElb, lWri), fps),
      rightElbow: buildSeries(jA(rSho, rElb, rWri), fps),
      leftWrist: buildSeries(jA(lElb, lWri, lToe), fps), // proxy: wrist extension
      rightWrist: buildSeries(jA(rElb, rWri, rToe), fps),

      // Segment angles
      torso: buildSeries(trunkDir, fps),
      leftThigh: buildSeries(sA(lHip, lKne), fps),
      rightThigh: buildSeries(sA(rHip, rKne), fps),
      leftShin: buildSeries(iA(lKne, lAnk), fps),
      rightShin: buildSeries(iA(rKne, rAnk), fps),

      com: com.map((p, i) => ({ frame: i, x: p?.x ?? 0, y: p?.y ?? 0 })),

      comSeries: (() => {
        const rawX = com.map((p) => p?.x ?? null);
        // Forward-fill then backward-fill nulls
        const fillNulls = (arr: (number | null)[]) => {
          const f = arr.slice() as number[];
          for (let i = 1; i < f.length; i++) if (f[i] == null) f[i] = f[i - 1] ?? 0;
          for (let i = f.length - 2; i >= 0; i--) if (f[i] == null) f[i] = f[i + 1] ?? 0;
          return f;
        };
        // position metres = (px_x / frameWidth) * aspectRatio / pixelsPerMeter
        const mScale = frameWidth > 0 && calibration
          ? calibration.aspectRatio / (frameWidth * calibration.pixelsPerMeter)
          : 1;
        const sx_px = smooth(fillNulls(rawX), 5);
        const sx_m = sx_px.map((v) => v * mScale);
        // Relative displacement from frame-0 position
        const x0 = sx_m[0] ?? 0;
        const x = sx_m.map((v) => v - x0);
        // Velocity and speed in m/s
        const vx = derivative(sx_m, fps);
        const speed = vx.map(Math.abs);
        const accel = derivative(speed, fps).map(Math.abs);
        // Cumulative horizontal distance travelled
        const distance: number[] = [0];
        for (let i = 1; i < speed.length; i++)
          distance.push(distance[i - 1] + speed[i] / fps);
        return { x, speed, accel, distance };
      })(),
    };
  }, [getKeypoints, totalFrames, fps, calibration, frameWidth, frameHeight]);
}
