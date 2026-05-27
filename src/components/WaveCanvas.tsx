import React, { useRef, useEffect } from 'react';

interface Props {
  txBits: number[];
  rxBits: number[];
  bitErrors: boolean[];
}

const GRID_COLS = 10;
const GRID_ROWS = 6;
const SWEEP_PX_PER_FRAME = 1.5;

export const WaveCanvas: React.FC<Props> = ({ txBits, rxBits, bitErrors }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ txBits, rxBits, bitErrors });
  const sweepRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    dataRef.current = { txBits, rxBits, bitErrors };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth || 400;
      canvas.height = container.clientHeight || 160;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const { txBits, rxBits, bitErrors } = dataRef.current;
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = '#070707';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 1;
      for (let c = 0; c <= GRID_COLS; c++) {
        const x = Math.round((W / GRID_COLS) * c);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        const y = Math.round((H / GRID_ROWS) * r);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, H * 0.25); ctx.lineTo(W, H * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H * 0.75); ctx.lineTo(W, H * 0.75); ctx.stroke();
      ctx.setLineDash([]);

      const numBits = Math.min(txBits.length, 60);
      if (numBits > 0) {
        const bw = W / numBits;
        const amp = H * 0.09;
        const txMid = H * 0.25;
        const rxMid = H * 0.75;

        ctx.beginPath();
        ctx.strokeStyle = '#00FF41';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00FF41';
        for (let i = 0; i < numBits; i++) {
          const x0 = i * bw;
          const x1 = x0 + bw;
          const y = txBits[i] === 1 ? txMid - amp : txMid + amp;
          if (i === 0) {
            ctx.moveTo(x0, y);
          } else {
            const prevY = txBits[i - 1] === 1 ? txMid - amp : txMid + amp;
            if (prevY !== y) { ctx.lineTo(x0, prevY); ctx.lineTo(x0, y); }
          }
          ctx.lineTo(x1, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.strokeStyle = '#FFB300';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FFB300';
        for (let i = 0; i < numBits; i++) {
          const x0 = i * bw;
          const x1 = x0 + bw;
          const y = rxBits[i] === 1 ? rxMid - amp : rxMid + amp;
          if (i === 0) {
            ctx.moveTo(x0, y);
          } else {
            const prevY = rxBits[i - 1] === 1 ? rxMid - amp : rxMid + amp;
            if (prevY !== y) { ctx.lineTo(x0, prevY); ctx.lineTo(x0, y); }
          }
          ctx.lineTo(x1, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        for (let i = 0; i < numBits; i++) {
          if (bitErrors[i]) {
            const x = Math.round(i * bw + bw / 2);
            ctx.fillStyle = 'rgba(255,59,48,0.35)';
            ctx.fillRect(x - 1, 0, 3, H);
          }
        }
      }

      sweepRef.current = (sweepRef.current + SWEEP_PX_PER_FRAME) % W;
      const sx = sweepRef.current;
      const sweepGrad = ctx.createLinearGradient(sx - 20, 0, sx + 6, 0);
      sweepGrad.addColorStop(0, 'rgba(0,255,65,0)');
      sweepGrad.addColorStop(1, 'rgba(0,255,65,0.08)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(sx - 20, 0, 26, H);

      ctx.font = '9px Share Tech Mono';
      ctx.fillStyle = '#007a1f';
      ctx.fillText('TX', 4, H * 0.25 - H * 0.09 - 4);
      ctx.fillStyle = '#e09e00';
      ctx.fillText('RX', 4, H * 0.75 - H * 0.09 - 4);

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
