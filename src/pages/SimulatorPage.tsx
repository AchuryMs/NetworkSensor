import React, { useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';

import { ModulationType } from '../utils/modulation';
import { NetworkSource, useSignalMetrics } from '../hooks/useSignalMetrics';
import { useSimulation } from '../hooks/useSimulation';
import { ControlPanel } from '../components/ControlPanel';
import { WaveCanvas } from '../components/WaveCanvas';
import { ConstellationCanvas } from '../components/ConstellationCanvas';
import { BERCanvas } from '../components/BERCanvas';
import { MetricsPanel } from '../components/MetricsPanel';
import { EduPanel } from '../components/EduPanel';

type SimMode = 'continuous' | 'single' | 'stopped';

function getChannelInfo(snrDb: number): { label: string; color: string; bg: string } {
  if (snrDb > 15) return { label: 'Canal limpio',    color: '#085041', bg: '#E1F5EE' };
  if (snrDb >= 8)  return { label: 'Ruido moderado', color: '#633806', bg: '#FAEEDA' };
  return                  { label: 'Canal degradado', color: '#791F1F', bg: '#FCEBEB' };
}

/* ── tiny helpers ── */
const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
    <span style={{ fontSize: 11, color: '#5F5E5A' }}>{label}</span>
  </div>
);

/* chip icons as simple SVG so no external dependency is needed */
const icons: Record<string, React.ReactNode> = {
  wave: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 12 Q5 6 8 12 Q11 18 14 12 Q17 6 20 12 Q21 15 22 12"/>
    </svg>
  ),
  circles: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  chart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="6" cy="18" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="18" cy="6" r="2"/>
      <line x1="7.5" y1="16.5" x2="10.5" y2="11.5"/><line x1="13.5" y1="8.5" x2="16.5" y2="7.5"/>
    </svg>
  ),
  signal: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 20 L6 20 L6 14 L2 14 Z"/><path d="M9 20 L13 20 L13 9 L9 9 Z"/>
      <path d="M16 20 L20 20 L20 4 L16 4 Z"/>
    </svg>
  ),
  book: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  gear: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

const Chip: React.FC<{ bg: string; color: string; icon: keyof typeof icons }> = ({ bg, color, icon }) => (
  <div style={{
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    background: bg, color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {icons[icon]}
  </div>
);

/* ── shared style objects ── */
const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '0.5px solid #CECBF6',
  overflow: 'hidden',
};
const cardHdrStyle: React.CSSProperties = {
  padding: '12px 14px 0',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
};
const cardTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#3C3489',
};
const cardSubStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#888780',
  marginLeft: 'auto',
};
const legendStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: '6px 14px 12px',
  flexWrap: 'wrap',
};

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
const SimulatorPage: React.FC = () => {
  const [activeSource, setActiveSource] = useState<NetworkSource>('wifi');
  const [snrOffset, setSnrOffset]       = useState(0);
  const [noiseSigma, setNoiseSigma]     = useState(0.1);
  const [modulation, setModulation]     = useState<ModulationType>('BPSK');
  const [mode, setMode]                 = useState<SimMode>('continuous');

  const deviceMetrics = useSignalMetrics(activeSource);
  const simSnr = useMemo(
    () => deviceMetrics.snrDb + snrOffset,
    [deviceMetrics.snrDb, snrOffset],
  );
  const { state, reset } = useSimulation(simSnr, noiseSigma, modulation, mode);
  const channel = getChannelInfo(simSnr);

  return (
    <IonPage style={{ background: '#F4F1FF' }}>

      {/* ── HEADER ── */}
      <div style={{ background: '#534AB7', paddingTop: 'env(safe-area-inset-top)' }}>

        {/* title + badge */}
        <div style={{
          padding: '14px 16px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 14,
        }}>
          <span style={{ color: '#EEEDFE', fontSize: 14, fontWeight: 500 }}>
            Canal AWGN
          </span>
          <span style={{
            background: channel.bg, color: channel.color,
            fontSize: 11, fontWeight: 500,
            padding: '3px 10px', borderRadius: 20,
          }}>
            {channel.label}
          </span>
        </div>

        {/* SNR hero */}
        <div style={{
          background: '#3C3489', borderRadius: '12px 12px 0 0',
          padding: '14px 0', display: 'flex',
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#AFA9EC', fontSize: 11, marginBottom: 4 }}>SNR dispositivo</div>
            <div style={{ color: '#EEEDFE', fontSize: 24, fontWeight: 500 }}>
              {deviceMetrics.snrDb.toFixed(1)}
              <span style={{ color: '#7F77DD', fontSize: 13, marginLeft: 3 }}>dB</span>
            </div>
          </div>
          <div style={{ width: 1, background: '#534AB7', margin: '4px 0' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#AFA9EC', fontSize: 11, marginBottom: 4 }}>SNR simulado</div>
            <div style={{ color: '#FAC775', fontSize: 24, fontWeight: 500 }}>
              {simSnr.toFixed(1)}
              <span style={{ color: '#EF9F27', fontSize: 13, marginLeft: 3 }}>dB</span>
            </div>
          </div>
        </div>

        {/* WiFi / Celular segment */}
        <div style={{ background: '#fff', padding: '10px 16px' }}>
          <div style={{
            background: '#EEEDFE', borderRadius: 10, padding: 4,
            display: 'flex', gap: 4,
          }}>
            {(['wifi', 'cellular'] as NetworkSource[]).map(src => (
              <button
                key={src}
                onClick={() => setActiveSource(src)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: activeSource === src ? '#534AB7' : 'transparent',
                  color:      activeSource === src ? '#EEEDFE'  : '#534AB7',
                  transition: 'background 0.15s',
                }}
              >
                {src === 'wifi' ? 'WiFi' : 'Celular'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <IonContent style={{ '--background': '#F4F1FF' }}>
        <div style={{ padding: '12px 12px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Parámetros */}
          <ControlPanel
            snrOffset={snrOffset}     onSnrOffset={setSnrOffset}
            noiseSigma={noiseSigma}   onNoiseSigma={setNoiseSigma}
            modulation={modulation}   onModulation={setModulation}
            mode={mode}
            onMode={(m) => {
              if (m === 'single') { setMode('stopped'); setTimeout(() => setMode('single'), 0); }
              else setMode(m);
            }}
            deviceSnr={deviceMetrics.snrDb}
            simSnr={simSnr}
            onReset={reset}
          />

          {/* Forma de onda */}
          <div style={cardStyle}>
            <div style={cardHdrStyle}>
              <Chip bg="#E1F5EE" color="#0F6E56" icon="wave" />
              <span style={cardTitleStyle}>Forma de onda TX / RX</span>
              <span style={cardSubStyle}>80 bits</span>
            </div>
            <WaveCanvas txBits={state.txBits} rxBits={state.rxBits} bitErrors={state.bitErrors} />
            <div style={legendStyle}>
              <LegendItem color="#7F77DD"            label="TX"    />
              <LegendItem color="#1D9E75"            label="RX"    />
              <LegendItem color="rgba(226,75,74,0.5)" label="Error" />
            </div>
          </div>

          {/* Constelación + BER */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ ...cardStyle, flex: 1 }}>
              <div style={cardHdrStyle}>
                <Chip bg="#EEEDFE" color="#534AB7" icon="circles" />
                <span style={{ ...cardTitleStyle, fontSize: 11 }}>Constelación IQ</span>
              </div>
              <ConstellationCanvas modulation={modulation} rxPoints={state.constellationRx} />
              <div style={legendStyle}>
                <LegendItem color="#534AB7"             label="Ideal" />
                <LegendItem color="rgba(29,158,117,0.5)" label="RX"    />
                <LegendItem color="rgba(226,75,74,0.5)"  label="Error" />
              </div>
            </div>

            <div style={{ ...cardStyle, flex: 1 }}>
              <div style={cardHdrStyle}>
                <Chip bg="#FAEEDA" color="#854F0B" icon="chart" />
                <span style={{ ...cardTitleStyle, fontSize: 11 }}>BER vs SNR</span>
              </div>
              <BERCanvas
                modulation={modulation}
                berHistory={state.berHistory}
                currentSnrDb={simSnr}
                currentBer={state.berActual}
              />
              <div style={legendStyle}>
                <LegendItem color="#534AB7" label="BPSK" />
                <LegendItem color="#1D9E75" label="QPSK" />
                <LegendItem color="#EF9F27" label="8PSK" />
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div style={cardStyle}>
            <div style={cardHdrStyle}>
              <Chip bg="#E6F1FB" color="#185FA5" icon="signal" />
              <span style={cardTitleStyle}>Métricas en tiempo real</span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: state.isRunning ? '#1D9E75' : '#E24B4A',
                }} />
                <span style={{ fontSize: 11, color: '#888780' }}>
                  {state.isRunning ? 'En vivo' : 'Detenido'}
                </span>
              </div>
            </div>
            <MetricsPanel
              berActual={state.berActual}
              berTheoretical={state.berTheoretical}
              snrDevice={deviceMetrics.snrDb}
              snrSimulated={simSnr}
              totalBits={state.totalBits}
              errorBits={state.errorBits}
              networkType={deviceMetrics.networkType}
              isRunning={state.isRunning}
            />
          </div>

          {/* Análisis */}
          <div style={cardStyle}>
            <div style={cardHdrStyle}>
              <Chip bg="#EEEDFE" color="#534AB7" icon="book" />
              <span style={cardTitleStyle}>Análisis del canal</span>
            </div>
            <EduPanel
              snrDb={simSnr}
              modulation={modulation}
              berActual={state.berActual}
              berTheoretical={state.berTheoretical}
            />
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default SimulatorPage;