// ─── Pose Overlay Canvas ──────────────────────────────────────────────────────
// Canvas is an exact sibling of the <video> element — same CSS size always.
// Both are inside the transform wrapper, so we never use getBoundingClientRect.
// Keypoints are raw pixel coords from the inference frame.
// We compute the letterbox rect (object-fit: contain) from the canvas size +
// video's natural dimensions, then scale kp pixel coords into that rect.

import { useEffect, useRef, useCallback } from 'react';
import type { Keypoint } from './usePoseLandmarker';
import { LANDMARKS, CONNECTIONS, REGION_COLORS } from './poseConfig';

interface Props {
  keypoints: Keypoint[];
  frameWidth: number; // inference frame pixel width  (from backend)
  frameHeight: number; // inference frame pixel height (from backend)
  videoNatWidth: number; // video.videoWidth  (natural dims for letterbox calc)
  videoNatHeight: number; // video.videoHeight
  visibilityMap: Record<number, boolean>;
  showLabels: boolean;
}

const SCORE_THRESHOLD = 0.43;
const DOT_RADIUS = 4;
const LINE_WIDTH = 1.5;

// Compute the sub-rect the video occupies inside a container of (cw×ch)
// when rendered with object-fit: contain using natural aspect ratio (nw×nh)
function letterboxRect(cw: number, ch: number, nw: number, nh: number) {
  if (!nw || !nh) return { left: 0, top: 0, width: cw, height: ch };
  const scale = Math.min(cw / nw, ch / nh);
  const width = nw * scale;
  const height = nh * scale;
  return { left: (cw - width) / 2, top: (ch - height) / 2, width, height };
}

export const PoseOverlay = ({
  keypoints,
  frameWidth,
  frameHeight,
  videoNatWidth,
  videoNatHeight,
  visibilityMap,
  showLabels,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    if (!cw || !ch) return;
    canvas.width = cw;
    canvas.height = ch;
    ctx.clearRect(0, 0, cw, ch);

    if (!keypoints.length || !frameWidth || !frameHeight) return;

    // Where the video image actually sits inside the canvas
    const lb = letterboxRect(cw, ch, videoNatWidth, videoNatHeight);

    // Keypoints are in inference-frame pixels. The inference frame was captured
    // at frameWidth×frameHeight from the same source, so we scale into the
    // letterbox rect via frameWidth/frameHeight (not natural dims).
    const sx = lb.width / frameWidth;
    const sy = lb.height / frameHeight;

    const toCanvas = (kp: Keypoint) => ({
      x: lb.left + kp.x * sx,
      y: lb.top + kp.y * sy,
    });

    const lmMap = new Map(LANDMARKS.map((l) => [l.index, l]));

    const isVisible = (idx: number): boolean => {
      if (!visibilityMap[idx]) return false;
      const kp = keypoints[idx];
      if (!kp) return false;
      return kp.score >= SCORE_THRESHOLD;
    };

    // Connections
    for (const [a, b] of CONNECTIONS) {
      if (!isVisible(a) || !isVisible(b)) continue;
      const pa = toCanvas(keypoints[a]);
      const pb = toCanvas(keypoints[b]);
      const rA = lmMap.get(a)?.region ?? 'upper';
      const rB = lmMap.get(b)?.region ?? 'upper';
      const color = REGION_COLORS[rA === rB ? rA : rB];
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = color + 'cc';
      ctx.lineWidth = LINE_WIDTH;
      ctx.stroke();
    }

    // Dots
    for (const lmDef of LANDMARKS) {
      if (!isVisible(lmDef.index)) continue;
      const { x, y } = toCanvas(keypoints[lmDef.index]);
      const color = REGION_COLORS[lmDef.region];
      ctx.beginPath();
      ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Hover labels
    if (showLabels && mousePosRef.current) {
      const { x: mx, y: my } = mousePosRef.current;
      let closest: {
        dist: number;
        label: string;
        x: number;
        y: number;
      } | null = null;
      for (const lmDef of LANDMARKS) {
        if (!isVisible(lmDef.index)) continue;
        const { x, y } = toCanvas(keypoints[lmDef.index]);
        const dist = Math.hypot(x - mx, y - my);
        if (dist < 24 && (!closest || dist < closest.dist)) {
          closest = { dist, label: lmDef.name, x, y };
        }
      }
      if (closest) {
        const pad = { x: 6, y: 3 };
        ctx.font = '11px "DM Mono", monospace';
        const tw = ctx.measureText(closest.label).width;
        const bx = closest.x + 12;
        const by = closest.y - 8;
        ctx.fillStyle = 'rgba(9,9,11,0.88)';
        ctx.fillRect(bx - pad.x, by - pad.y, tw + pad.x * 2, 16 + pad.y * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - pad.x, by - pad.y, tw + pad.x * 2, 16 + pad.y * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(closest.label, bx, by + 8);
      }
    }
  }, [
    keypoints,
    frameWidth,
    frameHeight,
    videoNatWidth,
    videoNatHeight,
    visibilityMap,
    showLabels,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    draw();
  };
  const handleMouseLeave = () => {
    mousePosRef.current = null;
    draw();
  };

  return (
    <canvas
      ref={canvasRef}
      // pointer-events-auto so mouse events reach the canvas for hover labels
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ cursor: 'default' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
};
