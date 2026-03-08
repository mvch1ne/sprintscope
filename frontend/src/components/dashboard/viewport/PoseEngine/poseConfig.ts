// ─── rtmlib Wholebody3d — 133 Keypoints ──────────────────────────────────────
// Indices follow the MMPose Wholebody convention:
//   0–16   body (COCO 17)
//   17–22  feet (big toe, small toe, heel × 2)
//   23–90  face (68 landmarks)
//   91–112 left hand (21)
//   113–132 right hand (21)

export interface LandmarkDef {
  index: number;
  name: string;
  region: 'face' | 'upper' | 'core' | 'lower' | 'hand';
  defaultOff?: boolean;
}

export const LANDMARKS: LandmarkDef[] = [
  // ── Body (0-16) ────────────────────────────────────────────────────────────
  { index: 0, name: 'Nose', region: 'face' },
  { index: 1, name: 'Left Eye', region: 'face', defaultOff: true },
  { index: 2, name: 'Right Eye', region: 'face', defaultOff: true },
  { index: 3, name: 'Left Ear', region: 'face', defaultOff: true },
  { index: 4, name: 'Right Ear', region: 'face', defaultOff: true },
  { index: 5, name: 'Left Shoulder', region: 'upper' },
  { index: 6, name: 'Right Shoulder', region: 'upper' },
  { index: 7, name: 'Left Elbow', region: 'upper' },
  { index: 8, name: 'Right Elbow', region: 'upper' },
  { index: 9, name: 'Left Wrist', region: 'upper' },
  { index: 10, name: 'Right Wrist', region: 'upper' },
  { index: 11, name: 'Left Hip', region: 'core' },
  { index: 12, name: 'Right Hip', region: 'core' },
  { index: 13, name: 'Left Knee', region: 'lower' },
  { index: 14, name: 'Right Knee', region: 'lower' },
  { index: 15, name: 'Left Ankle', region: 'lower' },
  { index: 16, name: 'Right Ankle', region: 'lower' },

  // ── Feet (17-22) ──────────────────────────────────────────────────────────
  { index: 17, name: 'Left Big Toe', region: 'lower' },
  { index: 18, name: 'Left Small Toe', region: 'lower', defaultOff: true },
  { index: 19, name: 'Left Heel', region: 'lower' },
  { index: 20, name: 'Right Big Toe', region: 'lower' },
  { index: 21, name: 'Right Small Toe', region: 'lower', defaultOff: true },
  { index: 22, name: 'Right Heel', region: 'lower' },

  // ── Left hand (91-112) — all off by default ───────────────────────────────
  { index: 91, name: 'L Wrist', region: 'hand', defaultOff: true },
  { index: 92, name: 'L Thumb CMC', region: 'hand', defaultOff: true },
  { index: 93, name: 'L Thumb MCP', region: 'hand', defaultOff: true },
  { index: 94, name: 'L Thumb IP', region: 'hand', defaultOff: true },
  { index: 95, name: 'L Thumb Tip', region: 'hand', defaultOff: true },
  { index: 96, name: 'L Index MCP', region: 'hand', defaultOff: true },
  { index: 97, name: 'L Index PIP', region: 'hand', defaultOff: true },
  { index: 98, name: 'L Index DIP', region: 'hand', defaultOff: true },
  { index: 99, name: 'L Index Tip', region: 'hand', defaultOff: true },
  { index: 100, name: 'L Middle MCP', region: 'hand', defaultOff: true },
  { index: 101, name: 'L Middle PIP', region: 'hand', defaultOff: true },
  { index: 102, name: 'L Middle DIP', region: 'hand', defaultOff: true },
  { index: 103, name: 'L Middle Tip', region: 'hand', defaultOff: true },
  { index: 104, name: 'L Ring MCP', region: 'hand', defaultOff: true },
  { index: 105, name: 'L Ring PIP', region: 'hand', defaultOff: true },
  { index: 106, name: 'L Ring DIP', region: 'hand', defaultOff: true },
  { index: 107, name: 'L Ring Tip', region: 'hand', defaultOff: true },
  { index: 108, name: 'L Pinky MCP', region: 'hand', defaultOff: true },
  { index: 109, name: 'L Pinky PIP', region: 'hand', defaultOff: true },
  { index: 110, name: 'L Pinky DIP', region: 'hand', defaultOff: true },
  { index: 111, name: 'L Pinky Tip', region: 'hand', defaultOff: true },
  { index: 112, name: 'L Palm', region: 'hand', defaultOff: true },

  // ── Right hand (113-132) — all off by default ─────────────────────────────
  { index: 113, name: 'R Wrist', region: 'hand', defaultOff: true },
  { index: 114, name: 'R Thumb CMC', region: 'hand', defaultOff: true },
  { index: 115, name: 'R Thumb MCP', region: 'hand', defaultOff: true },
  { index: 116, name: 'R Thumb IP', region: 'hand', defaultOff: true },
  { index: 117, name: 'R Thumb Tip', region: 'hand', defaultOff: true },
  { index: 118, name: 'R Index MCP', region: 'hand', defaultOff: true },
  { index: 119, name: 'R Index PIP', region: 'hand', defaultOff: true },
  { index: 120, name: 'R Index DIP', region: 'hand', defaultOff: true },
  { index: 121, name: 'R Index Tip', region: 'hand', defaultOff: true },
  { index: 122, name: 'R Middle MCP', region: 'hand', defaultOff: true },
  { index: 123, name: 'R Middle PIP', region: 'hand', defaultOff: true },
  { index: 124, name: 'R Middle DIP', region: 'hand', defaultOff: true },
  { index: 125, name: 'R Middle Tip', region: 'hand', defaultOff: true },
  { index: 126, name: 'R Ring MCP', region: 'hand', defaultOff: true },
  { index: 127, name: 'R Ring PIP', region: 'hand', defaultOff: true },
  { index: 128, name: 'R Ring DIP', region: 'hand', defaultOff: true },
  { index: 129, name: 'R Ring Tip', region: 'hand', defaultOff: true },
  { index: 130, name: 'R Pinky MCP', region: 'hand', defaultOff: true },
  { index: 131, name: 'R Pinky PIP', region: 'hand', defaultOff: true },
  { index: 132, name: 'R Pinky DIP', region: 'hand', defaultOff: true },
  { index: 133, name: 'R Pinky Tip', region: 'hand', defaultOff: true },
];

export const CONNECTIONS: [number, number][] = [
  // Torso
  [5, 6],
  [5, 11],
  [6, 12],
  [11, 12],
  // Arms
  [5, 7],
  [7, 9],
  [6, 8],
  [8, 10],
  // Legs
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  // Feet
  [15, 19],
  [19, 17],
  [16, 22],
  [22, 20],
];

export const REGION_COLORS: Record<LandmarkDef['region'], string> = {
  face: '#a78bfa',
  upper: '#38bdf8',
  core: '#fb923c',
  lower: '#4ade80',
  hand: '#f472b6',
};

export const buildDefaultVisibility = (): Record<number, boolean> => {
  const map: Record<number, boolean> = {};
  for (const lm of LANDMARKS) map[lm.index] = !lm.defaultOff;
  return map;
};
