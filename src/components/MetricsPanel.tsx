import React, { useState, useEffect } from 'react';

interface Props {
  berActual: number;
  berTheoretical: number;
  snrDevice: number;
  snrSimulated: number;
  totalBits: number;
  errorBits: number;
  networkType: string;
  isRunning: boolean;
}

function formatBer(ber: number): string {
  if (ber <= 0) return '< 10^-6';
  if (ber >= 0.5) return '0.500000';
  return ber.toExponential(3);
}

function successPercent(total: number, errors: number): string {
  if (total === 0) return '100.000%';
  return (((total - errors) / total) * 100).toFixed(3) + '%';
}

const s: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1px',
    background: '#1e1e1e',
    border: '1px solid #1e1e1e',
    margin: '0',
  },
  cell: {
    background: '#111111',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  cellLabel: {
    color: '#007a1f',
    fontSize: '9px',
    letterSpacing: '0.12em',
    fontFamily: "'Share Tech Mono', monospace",
  },
  cellValue: {
    color: '#00FF41',
    fontSize: '14px',
    letterSpacing: '0.05em',
    fontFamily: "'Share Tech Mono', monospace",
    textShadow: '0 0 8px rgba(0,255,65,0.5)',
  },
  cellValueAmber: {
    color: '#FFB300',
    fontSize: '14px',
    letterSpacing: '0.05em',
    fontFamily: "'Share Tech Mono', monospace",
    textShadow: '0 0 8px rgba(255,179,0,0.5)',
  },
  cellValueRed: {
    color: '#FF3B30',
    fontSize: '14px',
    letterSpacing: '0.05em',
    fontFamily: "'Share Tech Mono', monospace",
    textShadow: '0 0 10px rgba(255,59,48,0.7)',
  },
};

export const MetricsPanel: React.FC<Props> = ({
  berActual, berTheoretical, snrDevice, snrSimulated,
  totalBits, errorBits, networkType, isRunning,
}) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (berActual > 0.1) {
      const t = setInterval(() => setBlink(b => !b), 500);
      return () => clearInterval(t);
    }
    setBlink(false);
  }, [berActual]);

  const berStyle = berActual > 0.1
    ? { ...s.cellValue, color: blink ? '#FF3B30' : '#ff6b63', textShadow: '0 0 12px rgba(255,59,48,0.8)' }
    : s.cellValue;

  return (
    <div style={s.grid}>
      <div style={s.cell}>
        <span style={s.cellLabel}>BER ACTUAL</span>
        <span style={berStyle}>{formatBer(berActual)}</span>
      </div>
      <div style={s.cell}>
        <span style={s.cellLabel}>BER TEORICO</span>
        <span style={s.cellValueAmber}>{formatBer(berTheoretical)}</span>
      </div>
      <div style={s.cell}>
        <span style={s.cellLabel}>SNR DISPOSITIVO</span>
        <span style={s.cellValue}>{snrDevice.toFixed(1)} dB</span>
      </div>
      <div style={s.cell}>
        <span style={s.cellLabel}>SNR SIMULADO</span>
        <span style={s.cellValueAmber}>{snrSimulated.toFixed(1)} dB</span>
      </div>
      <div style={s.cell}>
        <span style={s.cellLabel}>BITS TX TOTAL</span>
        <span style={s.cellValue}>{totalBits.toLocaleString()}</span>
      </div>
      <div style={s.cell}>
        <span style={s.cellLabel}>BITS CON ERROR</span>
        <span style={errorBits > 0 ? s.cellValueRed : s.cellValue}>
          {errorBits.toLocaleString()}
        </span>
      </div>
      <div style={s.cell}>
        <span style={s.cellLabel}>EXITO TX</span>
        <span style={s.cellValue}>{successPercent(totalBits, errorBits)}</span>
      </div>
      <div style={s.cell}>
        <span style={s.cellLabel}>RED DETECTADA</span>
        <span style={s.cellValue}>{networkType}</span>
      </div>
      <div style={{ ...s.cell, gridColumn: '1 / -1' }}>
        <span style={s.cellLabel}>ESTADO SIMULACION</span>
        <span style={isRunning ? s.cellValue : { ...s.cellValue, color: '#FF3B30' }}>
          {isRunning ? 'TRANSMITIENDO' : 'DETENIDO'}
        </span>
      </div>
    </div>
  );
};
