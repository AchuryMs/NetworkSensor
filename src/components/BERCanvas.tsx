import React, { useRef, useEffect } from 'react';
import { berBPSK, berQPSK, ber8PSK, snrDbToLinear } from '../utils/ber';
import { ModulationType } from '../utils/modulation';

interface Props {
  modulation: ModulationType;
  berHistory: Array<{ snrDb: number; ber: number }>;
  currentSnrDb: number;
  currentBer: number;
}

const BER_MIN = 1e-6;
const BER_MAX = 0.6;
const SNR_MIN = 0;
const SNR_MAX = 20;
const PAD = { top: 12, right: 10, bottom: 28, left: 34 };

// Purple, Teal, Amber
const CURVE_COLORS: Record<ModulationType, string[]> = {
  BPSK: ['#7F77DD', '#1D9E75', '#EF9F27'],
  QPSK: ['#7F77DD', '#1D9E75', '#EF9F27'],
  '8PSK': ['#7F77DD', '#1D9E75', '#EF9F27'],
};
const CURVE_DASHES: number[][] = [[], [5, 3], [2, 3]];

function berFn(mod: ModulationType, snrLin: number): number {
  switch (mod) {
    case 'BPSK': return berBPSK(snrLin);
    case 'QPSK': return berQPSK(snrLin);
    case '8PSK': return ber8PSK(snrLin);
  }
}

function toCanvasX(snrDb: number, drawW: number): number {
  return PAD.left + drawW * ((snrDb - SNR_MIN) / (SNR_MAX - SNR_MIN));
}

function toCanvasY(ber: number, drawH: number): number {
  const clamped = Math.max(BER_MIN, Math.min(BER_MAX, ber));
  const logBer = Math.log10(clamped);
  const logMax = Math.log10(BER_MAX);
  const logMin = Math.log10(BER_MIN);
  return PAD.top + drawH * ((logMax - logBer) / (logMax - logMin));
}

export const BERCanvas: React.FC<Props> = ({
  modulation, berHistory, currentSnrDb, currentBer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ modulation, berHistory, currentSnrDb, currentBer });
  const rafRef = useRef(0);

  useEffect(() => {
    dataRef.current = { modulation, berHistory, currentSnrDb, currentBer };
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
      const { modulation, berHistory, currentSnrDb, currentBer } = dataRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const drawW = W - PAD.left - PAD.right;
      const drawH = H - PAD.top - PAD.bottom;

      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = '#EEEDFE';
      ctx.lineWidth = 1;
      for (let snr = SNR_MIN; snr <= SNR_MAX; snr += 5) {
        const x = toCanvasX(snr, drawW);
        ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + drawH); ctx.stroke();
      }
      const logLevels = [-1, -2, -3, -4, -5, -6];
      for (const exp of logLevels) {
        const ber = Math.pow(10, exp);
        const y = toCanvasY(ber, drawH);
        ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + drawW, y); ctx.stroke();
      }

      // Axis border
      ctx.strokeStyle = '#CECBF6';
      ctx.lineWidth = 1;
      ctx.strokeRect(PAD.left, PAD.top, drawW, drawH);

      // Y labels
      ctx.fillStyle = '#888780';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'right';
      for (const exp of logLevels) {
        if (exp % 2 === 0) {
          const ber = Math.pow(10, exp);
          const y = toCanvasY(ber, drawH);
          ctx.fillText(`1e${exp}`, PAD.left - 3, y + 3);
        }
      }

      // X labels
      ctx.textAlign = 'center';
      ctx.fillStyle = '#888780';
      for (let snr = 0; snr <= SNR_MAX; snr += 5) {
        const x = toCanvasX(snr, drawW);
        ctx.fillText(`${snr}`, x, H - PAD.bottom + 11);
      }

      // Axis titles
      ctx.fillStyle = '#AFA9EC';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SNR (dB)', PAD.left + drawW / 2, H - 2);
      ctx.save();
      ctx.translate(10, PAD.top + drawH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('BER', 0, 0);
      ctx.restore();

      // Draw all three curves
      const mods: ModulationType[] = ['BPSK', 'QPSK', '8PSK'];
      const colors = ['#534AB7', '#1D9E75', '#EF9F27'];

      mods.forEach((mod, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = colors[idx];
        ctx.lineWidth = idx === 0 ? 2 : 1.5;
        ctx.setLineDash(CURVE_DASHES[idx]);
        let started = false;
        for (let i = 0; i <= 200; i++) {
          const snrDb = SNR_MIN + (SNR_MAX - SNR_MIN) * (i / 200);
          const snrLin = snrDbToLinear(snrDb);
          const ber = berFn(mod, snrLin);
          if (ber < BER_MIN || ber > BER_MAX) { started = false; continue; }
          const x = toCanvasX(snrDb, drawW);
          const y = toCanvasY(ber, drawH);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // BER history trail
      if (berHistory.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(127,119,221,0.4)';
        ctx.lineWidth = 1;
        let started = false;
        for (const pt of berHistory) {
          if (pt.ber < BER_MIN || pt.ber > BER_MAX) { started = false; continue; }
          const x = toCanvasX(pt.snrDb, drawW);
          const y = toCanvasY(pt.ber, drawH);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Current operating point
      if (currentBer >= BER_MIN && currentBer <= BER_MAX) {
        const cx = toCanvasX(currentSnrDb, drawW);
        const cy = toCanvasY(currentBer, drawH);
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#E24B4A';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
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
