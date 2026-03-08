import { useEffect, useRef, useState, useCallback } from 'react';

interface TwoPointLine {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
}

interface Props {
  active: boolean;
  transform: { scale: number; x: number; y: number };
  color: string;
  label: string;
  existingLine: TwoPointLine | null;
  onLineSet: (line: TwoPointLine) => void;
  onCancel: () => void;
}

export const StartLineOverlay = ({ active, transform, color, label, existingLine, onLineSet, onCancel }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const screenToNorm = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const w = rect.width, h = rect.height;
    const cx = w / 2, cy = h / 2;
    const nx = ((sx - cx - transform.x) / transform.scale + cx) / w;
    const ny = ((sy - cy - transform.y) / transform.scale + cy) / h;
    return { x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)) };
  }, [transform]);

  const normToCanvas = useCallback((pt: { x: number; y: number }, w: number, h: number) => {
    const cx = w / 2, cy = h / 2;
    return {
      x: (pt.x * w - cx) * transform.scale + cx + transform.x,
      y: (pt.y * h - cy) * transform.scale + cy + transform.y,
    };
  }, [transform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = canvas.offsetWidth);
    const h = (canvas.height = canvas.offsetHeight);
    ctx.clearRect(0, 0, w, h);

    const drawLine = (a: { x: number; y: number }, b: { x: number; y: number }, alpha = 1) => {
      const pa = normToCanvas(a, w, h);
      const pb = normToCanvas(b, w, h);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Endpoint dots
      for (const p of [pa, pb]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // Label
      ctx.font = '10px "DM Mono", monospace';
      const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 - 10 };
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(9,9,11,0.8)';
      ctx.fillRect(mid.x - tw / 2 - 4, mid.y - 7, tw + 8, 14);
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mid.x, mid.y);
    };

    // Draw existing confirmed line
    if (existingLine) {
      drawLine(existingLine.p1, existingLine.p2, active ? 0.4 : 1);
    }

    if (!active) return;

    // Live: first point placed, drawing toward mouse
    if (pendingPoint && mousePos) {
      drawLine(pendingPoint, mousePos, 0.6);
    } else if (pendingPoint) {
      const p = normToCanvas(pendingPoint, w, h);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Crosshair
    if (mousePos) {
      const { x, y } = normToCanvas(mousePos, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); ctx.stroke();
    }
  }, [active, transform, color, label, existingLine, pendingPoint, mousePos, normToCanvas]);

  // Reset when activated
  useEffect(() => {
    if (active) setPendingPoint(null);
  }, [active]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!active) return;
    const pt = screenToNorm(e);
    if (!pendingPoint) {
      setPendingPoint(pt);
    } else {
      onLineSet({ p1: pendingPoint, p2: pt });
      setPendingPoint(null);
    }
  }, [active, pendingPoint, screenToNorm, onLineSet]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!active) return;
    setMousePos(screenToNorm(e));
  }, [active, screenToNorm]);

  // Suppress unused warning
  void onCancel;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: active ? 'auto' : 'none', cursor: active ? 'crosshair' : 'default' }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos(null)}
    />
  );
};
