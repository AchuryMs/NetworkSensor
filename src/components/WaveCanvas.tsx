import React, { useRef, useEffect } from 'react';

interface Props {
  txBits: number[];
  rxBits: number[];
  bitErrors: boolean[];
}

const GRID_COLS = 10;
const GRID_ROWS = 4;

export const WaveCanvas: React.FC<Props> = ({ txBits, rxBits, bitErrors }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ txBits, rxBits, bitErrors });
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
      canvas.height = container.clientHeight || 130;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const { txBits, rxBits, bitErrors } = dataRef.current;
      const W = canvas.width;
      const H = canvas.height;

      // Background
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = '#EEEDFE';
      ctx.lineWidth = 1;
      for (let c = 0; c <= GRID_COLS; c++) {
        const x = Math.round((W / GRID_COLS) * c);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        const y = Math.round((H / GRID_ROWS) * r);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Center divider
      ctx.strokeStyle = '#CECBF6';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      ctx.setLineDash([]);

      const numBits = Math.min(txBits.length, 60);
      if (numBits > 0) {
        const bw = W / numBits;
        const amp = H * 0.1;
        const txMid = H * 0.27;
        const rxMid = H * 0.73;

        // Error highlights
        for (let i = 0; i < numBits; i++) {
          if (bitErrors[i]) {
            ctx.fillStyle = 'rgba(226,75,74,0.10)';
            ctx.fillRect(i * bw, 0, bw, H);
          }
        }

        // TX waveform — purple
        ctx.beginPath();
        ctx.strokeStyle = '#7F77DD';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
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

        // RX waveform — teal
        ctx.beginPath();
        ctx.strokeStyle = '#1D9E75';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
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

        // Error tick marks
        for (let i = 0; i < numBits; i++) {
          if (bitErrors[i]) {
            const x = Math.round(i * bw + bw / 2);
            ctx.fillStyle = 'rgba(226,75,74,0.6)';
            ctx.fillRect(x - 1, 0, 2, H);
          }
        }
      }

      // Labels
      ctx.font = '500 11px sans-serif';
      ctx.fillStyle = '#7F77DD';
      ctx.fillText('TX', 6, H * 0.27 - H * 0.1 - 5);
      ctx.fillStyle = '#1D9E75';
      ctx.fillText('RX', 6, H * 0.73 - H * 0.1 - 5);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: 130, position: 'relative', padding: '0 2px' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};
