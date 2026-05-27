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
const PAD = { top: 16, right: 16, bottom: 32, left: 44 };

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
      canvas.width = container.clientWidth || 300;
      canvas.height = container.clientHeight || 200;
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

      ctx.fillStyle = '#070707';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 1;
      for (let snr = SNR_MIN; snr <= SNR_MAX; snr += 2) {
        const x = toCanvasX(snr, drawW);
        ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + drawH); ctx.stroke();
      }
      const logLevels = [-1, -2, -3, -4, -5, -6];
      for (const exp of logLevels) {
        const ber = Math.pow(10, exp);
        const y = toCanvasY(ber, drawH);
        ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + drawW, y); ctx.stroke();
      }

      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(PAD.left, PAD.top, drawW, drawH);

      ctx.fillStyle = '#1e1e1e';
      ctx.font = '8px Share Tech Mono';
      ctx.textAlign = 'right';
      for (const exp of logLevels) {
        const ber = Math.pow(10, exp);
        const y = toCanvasY(ber, drawH);
        ctx.fillText(`10^${exp}`, PAD.left - 3, y + 3);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#1e1e1e';
      for (let snr = 0; snr <= SNR_MAX; snr += 4) {
        const x = toCanvasX(snr, drawW);
        ctx.fillText(`${snr}`, x, H - PAD.bottom + 12);
      }

      ctx.fillStyle = '#007a1f';
      ctx.font = '8px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText('SNR (dB)', PAD.left + drawW / 2, H - 2);
      ctx.fillStyle = '#007a1f';
      ctx.save();
      ctx.translate(10, PAD.top + drawH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('BER', 0, 0);
      ctx.restore();

      const STEPS = 200;
      ctx.beginPath();
      ctx.strokeStyle = '#00FF41';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00FF41';
      let started = false;
      for (let i = 0; i <= STEPS; i++) {
        const snrDb = SNR_MIN + (SNR_MAX - SNR_MIN) * (i / STEPS);
        const snrLin = snrDbToLinear(snrDb);
        const ber = berFn(modulation, snrLin);
        if (ber < BER_MIN || ber > BER_MAX) { started = false; continue; }
        const x = toCanvasX(snrDb, drawW);
        const y = toCanvasY(ber, drawH);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (berHistory.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,179,0,0.6)';
        ctx.lineWidth = 1;
        started = false;
        for (const pt of berHistory) {
          if (pt.ber < BER_MIN || pt.ber > BER_MAX) { started = false; continue; }
          const x = toCanvasX(pt.snrDb, drawW);
          const y = toCanvasY(pt.ber, drawH);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (currentBer >= BER_MIN && currentBer <= BER_MAX) {
        const cx = toCanvasX(currentSnrDb, drawW);
        const cy = toCanvasY(currentBer, drawH);
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF3B30';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#FF3B30';
        ctx.fill();
        ctx.shadowBlur = 0;
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
