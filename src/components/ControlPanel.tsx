import React from 'react';
import {
  IonRange,
  IonSelect,
  IonSelectOption,
  IonButton,
} from '@ionic/react';
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

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '8px 12px',
    background: '#111111',
    borderBottom: '1px solid #1e1e1e',
  },
  snrBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    padding: '6px 10px',
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    flexWrap: 'wrap' as const,
  },
  label: {
    color: '#007a1f',
    fontSize: '10px',
    letterSpacing: '0.12em',
    fontFamily: "'Share Tech Mono', monospace",
  },
  valueGreen: {
    color: '#00FF41',
    fontSize: '13px',
    fontFamily: "'Share Tech Mono', monospace",
    textShadow: '0 0 8px #00FF41',
    minWidth: '56px',
  },
  valueAmber: {
    color: '#FFB300',
    fontSize: '13px',
    fontFamily: "'Share Tech Mono', monospace",
    textShadow: '0 0 8px #FFB300',
    minWidth: '56px',
  },
  sep: {
    color: '#1e1e1e',
    fontSize: '14px',
    margin: '0 4px',
  },
  row: {
    marginBottom: '6px',
  },
  rowLabel: {
    color: '#007a1f',
    fontSize: '10px',
    letterSpacing: '0.1em',
    fontFamily: "'Share Tech Mono', monospace",
    marginBottom: '2px',
    display: 'block',
  },
  buttonRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
    flexWrap: 'wrap' as const,
  },
  selectWrap: {
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    padding: '0 4px',
    marginTop: '2px',
  },
};

export const ControlPanel: React.FC<Props> = ({
  snrOffset, onSnrOffset,
  noiseSigma, onNoiseSigma,
  modulation, onModulation,
  mode, onMode,
  deviceSnr, simSnr,
  onReset,
}) => {
  return (
    <div style={s.container}>
      <div style={s.snrBanner}>
        <span style={s.label}>SNR DISPOSITIVO</span>
        <span style={s.valueGreen}>{deviceSnr.toFixed(1)} dB</span>
        <span style={s.sep}>|</span>
        <span style={s.label}>SNR SIMULADO</span>
        <span style={s.valueAmber}>{simSnr.toFixed(1)} dB</span>
      </div>

      <div style={s.row}>
        <span style={s.rowLabel}>
          OFFSET SNR: {snrOffset >= 0 ? '+' : ''}{snrOffset} dB
        </span>
        <IonRange
          min={-20}
          max={20}
          step={1}
          value={snrOffset}
          onIonInput={(e) => onSnrOffset(e.detail.value as number)}
        />
      </div>

      <div style={s.row}>
        <span style={s.rowLabel}>RUIDO ADICIONAL sigma: {noiseSigma.toFixed(2)}</span>
        <IonRange
          min={0.01}
          max={1.0}
          step={0.01}
          value={noiseSigma}
          color="secondary"
          onIonInput={(e) => onNoiseSigma(e.detail.value as number)}
        />
      </div>

      <div style={s.row}>
        <span style={s.rowLabel}>MODULACION</span>
        <div style={s.selectWrap}>
          <IonSelect
            value={modulation}
            onIonChange={(e) => onModulation(e.detail.value as ModulationType)}
            interface="popover"
            style={{ color: '#00FF41', '--placeholder-color': '#007a1f' }}
          >
            <IonSelectOption value="BPSK">BPSK</IonSelectOption>
            <IonSelectOption value="QPSK">QPSK</IonSelectOption>
            <IonSelectOption value="8PSK">8-PSK</IonSelectOption>
          </IonSelect>
        </div>
      </div>

      <div style={s.buttonRow}>
        <IonButton
          size="small"
          fill={mode === 'continuous' ? 'solid' : 'outline'}
          color="primary"
          onClick={() => onMode('continuous')}
          style={{ '--border-radius': '2px' } as React.CSSProperties}
        >
          CONTINUA
        </IonButton>
        <IonButton
          size="small"
          fill="outline"
          color="secondary"
          onClick={() => { onMode('single'); }}
          style={{ '--border-radius': '2px' } as React.CSSProperties}
        >
          DISPARO
        </IonButton>
        <IonButton
          size="small"
          fill={mode === 'stopped' ? 'solid' : 'outline'}
          color="danger"
          onClick={() => onMode('stopped')}
          style={{ '--border-radius': '2px' } as React.CSSProperties}
        >
          DETENER
        </IonButton>
        <IonButton
          size="small"
          fill="outline"
          color="medium"
          onClick={onReset}
          style={{ '--border-radius': '2px' } as React.CSSProperties}
        >
          RESET
        </IonButton>
      </div>
    </div>
  );
};
