// ─── rtmlib BodyWithFeet — 26 Keypoints ──────────────────────────────────────

export interface LandmarkDef {
  index: number;
  name: string;
  region: 'face' | 'upper' | 'core' | 'lower';
  defaultOff?: boolean;
}

export const LANDMARKS: LandmarkDef[] = [
  // Face — only nose on by default for a sprinter
  { index: 0, name: 'Nose', region: 'face' },
  { index: 1, name: 'Left Eye', region: 'face', defaultOff: true },
  { index: 2, name: 'Right Eye', region: 'face', defaultOff: true },
  { index: 3, name: 'Left Ear', region: 'face', defaultOff: true },
  { index: 4, name: 'Right Ear', region: 'face', defaultOff: true },
  // Upper body — all on
  { index: 5, name: 'Left Shoulder', region: 'upper' },
  { index: 6, name: 'Right Shoulder', region: 'upper' },
  { index: 7, name: 'Left Elbow', region: 'upper' },
  { index: 8, name: 'Right Elbow', region: 'upper' },
  { index: 9, name: 'Left Wrist', region: 'upper' },
  { index: 10, name: 'Right Wrist', region: 'upper' },
  // Core — hips always on
  { index: 11, name: 'Left Hip', region: 'core' },
  { index: 12, name: 'Right Hip', region: 'core' },
  // Lower — knees + ankles on, small toes off
  { index: 13, name: 'Left Knee', region: 'lower' },
  { index: 14, name: 'Right Knee', region: 'lower' },
  { index: 15, name: 'Left Ankle', region: 'lower' },
  { index: 16, name: 'Right Ankle', region: 'lower' },
  // Feet — big toe + heel on (ground contact), small toe off
  { index: 17, name: 'Left Big Toe', region: 'lower', defaultOff: true },
  { index: 18, name: 'Left Small Toe', region: 'lower', defaultOff: true },
  { index: 19, name: 'Left Heel', region: 'lower', defaultOff: true },
  { index: 20, name: 'Right Big Toe', region: 'lower', defaultOff: true },
  { index: 21, name: 'Right Small Toe', region: 'lower', defaultOff: true },
  { index: 22, name: 'Right Heel', region: 'lower', defaultOff: true },
  // Extra face — all off
  { index: 23, name: 'Left Eye Center', region: 'face', defaultOff: true },
  { index: 24, name: 'Right Eye Center', region: 'face', defaultOff: true },
  { index: 25, name: 'Mouth Center', region: 'face', defaultOff: true },
];

export const CONNECTIONS: [number, number][] = [
  // Spine / torso
  [5, 6], // shoulder to shoulder
  [5, 11],
  [6, 12], // shoulders to hips
  [11, 12], // hip to hip

  // Arms
  [5, 7],
  [7, 9], // left arm
  [6, 8],
  [8, 10], // right arm

  // Legs
  [11, 13],
  [13, 15], // left leg
  [12, 14],
  [14, 16], // right leg

  // Feet
  [15, 19],
  [19, 17], // left: ankle→heel→big toe
  [16, 22],
  [22, 20], // right: ankle→heel→big toe
];

// No face connections — noise for sprint analysis

export const REGION_COLORS: Record<LandmarkDef['region'], string> = {
  face: '#a78bfa',
  upper: '#38bdf8',
  core: '#fb923c',
  lower: '#4ade80',
};

export const buildDefaultVisibility = (): Record<number, boolean> => {
  const map: Record<number, boolean> = {};
  for (const lm of LANDMARKS) map[lm.index] = !lm.defaultOff;
  return map;
};
