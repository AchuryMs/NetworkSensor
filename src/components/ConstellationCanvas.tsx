import React, { useRef, useEffect } from 'react';
import { getConstellationPoints, ModulationType } from '../utils/modulation';
import { ReceivedPoint } from '../hooks/useSimulation';

interface Props {
  modulation: ModulationType;
  rxPoints: ReceivedPoint[];
}

export const ConstellationCanvas: React.FC<Props> = ({ modulation, rxPoints }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ modulation, rxPoints });
  const rafRef = useRef(0);

  useEffect(() => {
    dataRef.current = { modulation, rxPoints };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth || 200;
      canvas.height = container.clientHeight || 200;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const { modulation, rxPoints } = dataRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const scale = Math.min(W, H) * 0.35;
      const PAD = 24;

      ctx.fillStyle = '#070707';
      ctx.fillRect(0, 0, W, H);

      const drawW = W - PAD * 2;
      const drawH = H - PAD * 2;
      const gridStep = Math.min(drawW, drawH) / 6;
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 1;
      for (let x = cx % gridStep; x < W; x += gridStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = cy % gridStep; y < H; y += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, cy); ctx.lineTo(W - PAD, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, PAD); ctx.lineTo(cx, H - PAD); ctx.stroke();

      ctx.fillStyle = '#1e1e1e';
      ctx.font = '9px Share Tech Mono';
      ctx.fillText('I', W - PAD - 10, cy - 4);
      ctx.fillText('Q', cx + 4, PAD + 10);

      const ideal = getConstellationPoints(modulation);
      for (const p of rxPoints) {
        const px = cx + p.i * scale;
        const py = cy - p.q * scale;
        if (px < 0 || px > W || py < 0 || py > H) continue;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.error
          ? 'rgba(255,59,48,0.5)'
          : 'rgba(255,179,0,0.45)';
        ctx.fill();
      }

      for (const p of ideal) {
        const px = cx + p.i * scale;
        const py = cy - p.q * scale;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00FF41';
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#00FF41';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#007a1f';
        ctx.font = '8px Share Tech Mono';
        ctx.fillText(p.bits, px + 6, py - 4);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};
