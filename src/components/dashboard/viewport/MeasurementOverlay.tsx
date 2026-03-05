import { useEffect, useRef, useState, useCallback } from 'react';
import type { CalibrationData } from './CalibrationOverlay';

export interface Measurement {
  id: string;
  pointA: { x: number; y: number };
  pointB: { x: number; y: number };
  meters: number;
  label: string;
  visible: boolean;
}

interface Props {
  active: boolean;
  transform: { scale: number; x: number; y: number };
  calibration: CalibrationData;
  measurements: Measurement[];
  onMeasurementAdded: (m: Measurement) => void;
}

export const MeasurementOverlay = ({
  active,
  transform,
  calibration,
  measurements,
  onMeasurementAdded,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pointA, setPointA] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const screenToNorm = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const nx = ((sx - cx - transform.x) / transform.scale + cx) / w;
      const ny = ((sy - cy - transform.y) / transform.scale + cy) / h;
      return {
        x: Math.max(0, Math.min(1, nx)),
        y: Math.max(0, Math.min(1, ny)),
      };
    },
    [transform],
  );

  const normToCanvas = useCallback(
    (pt: { x: number; y: number }, w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      return {
        x: (pt.x * w - cx) * transform.scale + cx + transform.x,
        y: (pt.y * h - cy) * transform.scale + cy + transform.y,
      };
    },
    [transform],
  );

  const normDist = (
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const toMeters = useCallback(
    (a: { x: number; y: number }, b: { x: number; y: number }) => {
      return normDist(a, b) / calibration.pixelsPerMeter;
    },
    [calibration],
  );

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = canvas.offsetWidth);
    const h = (canvas.height = canvas.offsetHeight);
    ctx.clearRect(0, 0, w, h);

    const drawMeasurementLine = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      label: string,
      alpha = 1,
      color = '#38bdf8',
    ) => {
      const pa = normToCanvas(a, w, h);
      const pb = normToCanvas(b, w, h);

      ctx.globalAlpha = alpha;

      // Line
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.stroke();

      // End caps
      const angle = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      const capLen = 6;
      for (const pt of [pa, pb]) {
        ctx.beginPath();
        ctx.moveTo(
          pt.x + Math.cos(angle + Math.PI / 2) * capLen,
          pt.y + Math.sin(angle + Math.PI / 2) * capLen,
        );
        ctx.lineTo(
          pt.x + Math.cos(angle - Math.PI / 2) * capLen,
          pt.y + Math.sin(angle - Math.PI / 2) * capLen,
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label at midpoint
      const mx = (pa.x + pb.x) / 2;
      const my = (pa.y + pb.y) / 2;
      const padding = { x: 5, y: 3 };
      ctx.font = '10px "DM Mono", monospace';
      const textW = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(9,9,11,0.85)';
      ctx.fillRect(
        mx - textW / 2 - padding.x,
        my - 7 - padding.y,
        textW + padding.x * 2,
        14 + padding.y * 2,
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        mx - textW / 2 - padding.x,
        my - 7 - padding.y,
        textW + padding.x * 2,
        14 + padding.y * 2,
      );
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx, my);

      ctx.globalAlpha = 1;
    };

    // Draw all saved measurements
    measurements.forEach((m) => {
      if (!m.visible) return;
      drawMeasurementLine(m.pointA, m.pointB, m.label);
    });

    if (!active) return;

    // Draw calibration reference faintly
    ctx.globalAlpha = 0.2;
    const ca = normToCanvas(calibration.lineStart, w, h);
    const cb = normToCanvas(calibration.lineEnd, w, h);
    ctx.beginPath();
    ctx.moveTo(ca.x, ca.y);
    ctx.lineTo(cb.x, cb.y);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Live line from pointA to mouse
    if (pointA && mousePos) {
      const meters = toMeters(pointA, mousePos);
      drawMeasurementLine(
        pointA,
        mousePos,
        `${meters.toFixed(2)}m`,
        0.7,
        '#f97316',
      );
    }

    // Crosshair
    if (mousePos) {
      const { x, y } = normToCanvas(mousePos, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
    }

    // Point A dot
    if (pointA) {
      const { x, y } = normToCanvas(pointA, w, h);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [
    active,
    measurements,
    pointA,
    mousePos,
    transform,
    normToCanvas,
    calibration,
    toMeters,
  ]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!active) return;
      const pt = screenToNorm(e);
      if (!pointA) {
        setPointA(pt);
      } else {
        const meters = toMeters(pointA, pt);
        const m: Measurement = {
          id: crypto.randomUUID(),
          pointA,
          pointB: pt,
          meters,
          label: `${meters.toFixed(2)}m`,
          visible: true,
        };
        onMeasurementAdded(m);
        setPointA(null);
      }
    },
    [active, pointA, screenToNorm, toMeters, onMeasurementAdded],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!active) return;
      setMousePos(screenToNorm(e));
    },
    [active, screenToNorm],
  );

  // Reset on deactivate is handled by key prop in parent (no setState in effect needed)

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        pointerEvents: active ? 'auto' : 'none',
        cursor: active ? 'crosshair' : 'default',
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos(null)}
    />
  );
};
