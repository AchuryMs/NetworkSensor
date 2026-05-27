import React from 'react';
import { ModulationType } from '../utils/modulation';

type SimMode = 'continuous' | 'single' | 'stopped';

interface Props {
  snrOffset: number;
  onSnrOffset: (v: number) => void;
  noiseSigma: number;
  onNoiseSigma: (v: number) => void;
  modulation: ModulationType;
  onModulation: (m: ModulationType) => void;
  mode: SimMode;
  onMode: (m: SimMode) => void;
  deviceSnr: number;
  simSnr: number;
  onReset: () => void;
}

export const ControlPanel: React.FC<Props> = ({
  snrOffset, onSnrOffset,
  noiseSigma, onNoiseSigma,
  modulation, onModulation,
  mode, onMode,
  onReset,
}) => {
  return (
    <div style={s.card}>
      <div style={s.cardHdr}>
        <div style={{ ...s.chip, background: '#EEEDFE', color: '#534AB7' }}>⚙</div>
        <span style={s.cardTitle}>Parámetros de simulación</span>
      </div>

      {/* SNR offset slider */}
      <div style={s.ctrlItem}>
        <div style={s.ctrlLabel}>
          <span style={s.ctrlName}>Offset SNR</span>
          <span style={s.ctrlVal}>{snrOffset >= 0 ? '+' : ''}{snrOffset} dB</span>
        </div>
        <input
          type="range" min={-20} max={20} step={1} value={snrOffset}
          onChange={e => onSnrOffset(Number(e.target.value))}
          style={s.slider}
        />
      </div>

      {/* Noise sigma slider */}
      <div style={s.ctrlItem}>
        <div style={s.ctrlLabel}>
          <span style={s.ctrlName}>Ruido adicional σ</span>
          <span style={s.ctrlVal}>{noiseSigma.toFixed(2)}</span>
        </div>
        <input
          type="range" min={0.01} max={1.0} step={0.01} value={noiseSigma}
          onChange={e => onNoiseSigma(Number(e.target.value))}
          style={{ ...s.slider, accentColor: '#1D9E75' }}
        />
      </div>

      {/* Modulation select */}
      <div style={s.ctrlItem}>
        <div style={s.ctrlLabel}>
          <span style={s.ctrlName}>Modulación</span>
        </div>
        <div style={s.selectWrap}>
          <select
            value={modulation}
            onChange={e => onModulation(e.target.value as ModulationType)}
            style={s.select}
          >
            <option value="BPSK">BPSK — 1 bit/símbolo</option>
            <option value="QPSK">QPSK — 2 bits/símbolo</option>
            <option value="8PSK">8-PSK — 3 bits/símbolo</option>
          </select>
        </div>
      </div>

      {/* Mode buttons */}
      <div style={s.btnRow}>
        <button
          style={{ ...s.btn, ...(mode === 'continuous' ? s.btnActive : s.btnOutline) }}
          onClick={() => onMode('continuous')}
        >
          ▶ Continua
        </button>
        <button
          style={{ ...s.btn, ...s.btnOutline }}
          onClick={() => onMode('single')}
        >
          ⚡ Disparo
        </button>
        <button
          style={{ ...s.btn, ...(mode === 'stopped' ? s.btnDanger : s.btnDangerOutline) }}
          onClick={() => onMode('stopped')}
        >
          ■ Detener
        </button>
        <button
          style={{ ...s.btn, ...s.btnGray }}
          onClick={onReset}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 14,
    border: '0.5px solid #CECBF6',
    overflow: 'hidden',
  },
  cardHdr: {
    padding: '12px 14px 4px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: '#3C3489',
  },
  ctrlItem: {
    padding: '8px 14px 4px',
  },
  ctrlLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  ctrlName: {
    fontSize: 12,
    color: '#5F5E5A',
  },
  ctrlVal: {
    fontSize: 12,
    fontWeight: 500,
    color: '#534AB7',
  },
  slider: {
    width: '100%',
    accentColor: '#7F77DD',
    cursor: 'pointer',
    height: 4,
  } as React.CSSProperties,
  selectWrap: {
    background: '#F4F1FF',
    border: '0.5px solid #CECBF6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 500,
    color: '#3C3489',
    cursor: 'pointer',
    outline: 'none',
  },
  btnRow: {
    display: 'flex',
    gap: 6,
    padding: '10px 14px 14px',
    flexWrap: 'wrap' as const,
  },
  btn: {
    flex: 1,
    minWidth: 70,
    padding: '8px 4px',
    borderRadius: 9,
    border: 'none',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.1s',
  },
  btnActive: {
    background: '#534AB7',
    color: '#EEEDFE',
  },
  btnOutline: {
    background: '#EEEDFE',
    color: '#534AB7',
  },
  btnDanger: {
    background: '#E24B4A',
    color: '#FCEBEB',
  },
  btnDangerOutline: {
    background: '#FCEBEB',
    color: '#A32D2D',
  },
  btnGray: {
    background: '#F1EFE8',
    color: '#5F5E5A',
  },
};
