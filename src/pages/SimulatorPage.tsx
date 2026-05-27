import React, { useState, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';

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

function getChannelBadge(snrDb: number): { label: string; color: string } {
  if (snrDb > 15) return { label: 'CANAL LIMPIO', color: 'success' };
  if (snrDb >= 8) return { label: 'RUIDO MODERADO', color: 'warning' };
  return { label: 'CANAL DEGRADADO', color: 'danger' };
}

const SimulatorPage: React.FC = () => {
  const [activeSource, setActiveSource] = useState<NetworkSource>('wifi');
  const [snrOffset, setSnrOffset] = useState(0);
  const [noiseSigma, setNoiseSigma] = useState(0.1);
  const [modulation, setModulation] = useState<ModulationType>('BPSK');
  const [mode, setMode] = useState<SimMode>('continuous');

  const deviceMetrics = useSignalMetrics(activeSource);

  const simSnr = useMemo(
    () => deviceMetrics.snrDb + snrOffset,
    [deviceMetrics.snrDb, snrOffset],
  );

  const { state, reset } = useSimulation(simSnr, noiseSigma, modulation, mode);

  const badge = getChannelBadge(simSnr);

  return (
    <IonPage style={{ background: '#070707' }}>
      <IonHeader style={{ '--background': '#0d0d0d', '--border-color': '#1e1e1e' }}>
        <IonToolbar style={{ '--background': '#0d0d0d', '--color': '#00FF41' }}>
          <IonTitle style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#00FF41' }}>
            CANAL AWGN — ANALIZADOR DE SENAL
          </IonTitle>
          <IonBadge
            slot="end"
            color={badge.color}
            style={{ marginRight: '10px', fontSize: '9px', letterSpacing: '0.1em', borderRadius: '2px' }}
          >
            {badge.label}
          </IonBadge>
        </IonToolbar>
        <IonToolbar style={{ '--background': '#0d0d0d', '--min-height': '38px' }}>
          <IonSegment
            value={activeSource}
            onIonChange={(e) => setActiveSource(e.detail.value as NetworkSource)}
            style={{ '--background': '#0d0d0d', maxWidth: '220px', margin: '0 auto' }}
          >
            <IonSegmentButton value="wifi" style={{ '--background-checked': '#00FF41', '--color-checked': '#000000', '--color': '#007a1f', fontSize: '10px', letterSpacing: '0.12em', minHeight: '28px' }}>
              <IonLabel>WIFI</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="cellular" style={{ '--background-checked': '#00FF41', '--color-checked': '#000000', '--color': '#007a1f', fontSize: '10px', letterSpacing: '0.12em', minHeight: '28px' }}>
              <IonLabel>CELULAR</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#070707' }}>

        <ControlPanel
          snrOffset={snrOffset}
          onSnrOffset={setSnrOffset}
          noiseSigma={noiseSigma}
          onNoiseSigma={setNoiseSigma}
          modulation={modulation}
          onModulation={setModulation}
          mode={mode}
          onMode={(m) => {
            if (m === 'single') {
              setMode('stopped');
              setTimeout(() => setMode('single'), 0);
            } else {
              setMode(m);
            }
          }}
          deviceSnr={deviceMetrics.snrDb}
          simSnr={simSnr}
          onReset={reset}
        />

        <IonCard style={{ margin: '6px', background: '#111111', border: '1px solid #1e1e1e', borderRadius: '2px', boxShadow: 'none' }}>
          <IonCardHeader style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e', padding: '6px 12px' }}>
            <IonCardTitle style={{ color: '#007a1f', fontSize: '10px', letterSpacing: '0.15em' }}>
              FORMA DE ONDA TX / RX
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ padding: '0', height: '160px' }}>
            <WaveCanvas
              txBits={state.txBits}
              rxBits={state.rxBits}
              bitErrors={state.bitErrors}
            />
          </IonCardContent>
        </IonCard>

        <div style={{ display: 'flex', gap: '0', margin: '0 6px' }}>
          <IonCard style={{ flex: 1, margin: '0 3px 6px 0', background: '#111111', border: '1px solid #1e1e1e', borderRadius: '2px', boxShadow: 'none' }}>
            <IonCardHeader style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e', padding: '6px 12px' }}>
              <IonCardTitle style={{ color: '#007a1f', fontSize: '10px', letterSpacing: '0.15em' }}>
                CONSTELACION IQ
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent style={{ padding: '0', height: '180px' }}>
              <ConstellationCanvas
                modulation={modulation}
                rxPoints={state.constellationRx}
              />
            </IonCardContent>
          </IonCard>

          <IonCard style={{ flex: 1, margin: '0 0 6px 3px', background: '#111111', border: '1px solid #1e1e1e', borderRadius: '2px', boxShadow: 'none' }}>
            <IonCardHeader style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e', padding: '6px 12px' }}>
              <IonCardTitle style={{ color: '#007a1f', fontSize: '10px', letterSpacing: '0.15em' }}>
                BER vs SNR
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent style={{ padding: '0', height: '180px' }}>
              <BERCanvas
                modulation={modulation}
                berHistory={state.berHistory}
                currentSnrDb={simSnr}
                currentBer={state.berActual}
              />
            </IonCardContent>
          </IonCard>
        </div>

        <IonCard style={{ margin: '0 6px 6px', background: '#111111', border: '1px solid #1e1e1e', borderRadius: '2px', boxShadow: 'none' }}>
          <IonCardHeader style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e', padding: '6px 12px' }}>
            <IonCardTitle style={{ color: '#007a1f', fontSize: '10px', letterSpacing: '0.15em' }}>
              METRICAS EN TIEMPO REAL
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ padding: '0' }}>
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
          </IonCardContent>
        </IonCard>

        <IonCard style={{ margin: '0 6px 16px', background: '#111111', border: '1px solid #1e1e1e', borderRadius: '2px', boxShadow: 'none' }}>
          <IonCardHeader style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e', padding: '6px 12px' }}>
            <IonCardTitle style={{ color: '#007a1f', fontSize: '10px', letterSpacing: '0.15em' }}>
              ANALISIS DEL CANAL
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ padding: '0' }}>
            <EduPanel
              snrDb={simSnr}
              modulation={modulation}
              berActual={state.berActual}
              berTheoretical={state.berTheoretical}
            />
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
};

export default SimulatorPage;
