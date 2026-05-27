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
  if (ber <= 0) return '< 1e-6';
  if (ber >= 0.5) return '0.500';
  return ber.toExponential(2);
}

function successPercent(total: number, errors: number): string {
  if (total === 0) return '100.00%';
  return (((total - errors) / total) * 100).toFixed(2) + '%';
}

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

  const highBer = berActual > 0.1;

  return (
    <div style={s.grid}>
      {/* BER actual */}
      <div style={s.cell}>
        <span style={s.label}>BER actual</span>
        <span style={{
          ...s.valPurple,
          ...(highBer ? { color: blink ? '#E24B4A' : '#F09595' } : {}),
        }}>
          {formatBer(berActual)}
        </span>
      </div>

      {/* BER teórico */}
      <div style={s.cell}>
        <span style={s.label}>BER teórico</span>
        <span style={s.valAmber}>{formatBer(berTheoretical)}</span>
      </div>

      {/* SNR dispositivo */}
      <div style={s.cell}>
        <span style={s.label}>SNR dispositivo</span>
        <span style={s.valTeal}>{snrDevice.toFixed(1)} dB</span>
      </div>

      {/* SNR simulado */}
      <div style={s.cell}>
        <span style={s.label}>SNR simulado</span>
        <span style={s.valAmber}>{snrSimulated.toFixed(1)} dB</span>
      </div>

      {/* Bits TX */}
      <div style={s.cell}>
        <span style={s.label}>Bits transmitidos</span>
        <span style={s.valPurple}>{totalBits.toLocaleString()}</span>
      </div>

      {/* Bits con error */}
      <div style={s.cell}>
        <span style={s.label}>Bits con error</span>
        <span style={errorBits > 0 ? s.valRed : s.valTeal}>
          {errorBits.toLocaleString()}
        </span>
      </div>

      {/* Éxito */}
      <div style={s.cell}>
        <span style={s.label}>Éxito TX</span>
        <span style={s.valTeal}>{successPercent(totalBits, errorBits)}</span>
      </div>

      {/* Red */}
      <div style={s.cell}>
        <span style={s.label}>Red detectada</span>
        <span style={s.valPurple}>{networkType}</span>
      </div>

      {/* Estado — full width */}
      <div style={{ ...s.cell, ...s.cellFull }}>
        <span style={s.label}>Estado de simulación</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isRunning ? '#1D9E75' : '#E24B4A',
          }} />
          <span style={isRunning ? s.valTeal : s.valRed}>
            {isRunning ? 'Transmitiendo' : 'Detenido'}
          </span>
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 1,
    background: '#EEEDFE',
  },
  cell: {
    background: '#fff',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cellFull: {
    gridColumn: '1 / -1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#888780',
    fontSize: 10,
    letterSpacing: '0.02em',
  },
  valPurple: {
    color: '#3C3489',
    fontSize: 15,
    fontWeight: 500,
  },
  valTeal: {
    color: '#0F6E56',
    fontSize: 15,
    fontWeight: 500,
  },
  valAmber: {
    color: '#854F0B',
    fontSize: 15,
    fontWeight: 500,
  },
  valRed: {
    color: '#A32D2D',
    fontSize: 15,
    fontWeight: 500,
  },
};
