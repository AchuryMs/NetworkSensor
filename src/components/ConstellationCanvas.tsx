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
      canvas.width = container.clientWidth || 180;
      canvas.height = container.clientHeight || 180;
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
      const scale = Math.min(W, H) * 0.32;

      // Background
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = '#EEEDFE';
      ctx.lineWidth = 1;
      const gridStep = scale * 0.8;
      for (let x = cx % gridStep; x < W; x += gridStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = cy % gridStep; y < H; y += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#AFA9EC';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(16, cy); ctx.lineTo(W - 16, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 16); ctx.lineTo(cx, H - 16); ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#888780';
      ctx.font = '10px sans-serif';
      ctx.fillText('I', W - 18, cy - 4);
      ctx.fillText('Q', cx + 4, 20);

      // RX scatter points
      const ideal = getConstellationPoints(modulation);
      for (const p of rxPoints) {
        const px = cx + p.i * scale;
        const py = cy - p.q * scale;
        if (px < 0 || px > W || py < 0 || py > H) continue;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.error
          ? 'rgba(226,75,74,0.50)'
          : 'rgba(29,158,117,0.40)';
        ctx.fill();
      }

      // Ideal points — solid purple circles with white border
      for (const p of ideal) {
        const px = cx + p.i * scale;
        const py = cy - p.q * scale;

        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#534AB7';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bit label
        ctx.fillStyle = '#3C3489';
        ctx.font = '500 9px sans-serif';
        ctx.fillText(p.bits, px + 9, py - 5);
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
    <div ref={containerRef} style={{ width: '100%', height: 170, position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};
