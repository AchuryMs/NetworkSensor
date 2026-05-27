import { useState, useEffect, useRef, useCallback } from 'react';
import { gaussianNoise } from '../utils/noise';
import { berBPSK, berQPSK, ber8PSK, snrDbToLinear } from '../utils/ber';
import {
  getConstellationPoints,
  getBitsPerSymbol,
  ModulationType,
} from '../utils/modulation';

const BITS_PER_FRAME = 1000;
const SIM_INTERVAL_MS = 150;

export interface ReceivedPoint {
  i: number;
  q: number;
  error: boolean;
}

export interface SimulationState {
  snrSimDb: number;
  berActual: number;
  berTheoretical: number;
  totalBits: number;
  errorBits: number;
  txBits: number[];
  rxBits: number[];
  bitErrors: boolean[];
  constellationRx: ReceivedPoint[];
  berHistory: Array<{ snrDb: number; ber: number }>;
  isRunning: boolean;
}

type SimMode = 'continuous' | 'single' | 'stopped';

const EMPTY_STATE: SimulationState = {
  snrSimDb: 10,
  berActual: 0,
  berTheoretical: 0,
  totalBits: 0,
  errorBits: 0,
  txBits: [],
  rxBits: [],
  bitErrors: [],
  constellationRx: [],
  berHistory: [],
  isRunning: false,
};

export function useSimulation(
  snrBaseDb: number,
  noiseSigma: number,
  modulation: ModulationType,
  mode: SimMode,
): { state: SimulationState; reset: () => void } {
  const [state, setState] = useState<SimulationState>({ ...EMPTY_STATE, snrSimDb: snrBaseDb });

  const totalBitsRef = useRef(0);
  const errorBitsRef = useRef(0);
  const berHistoryRef = useRef<Array<{ snrDb: number; ber: number }>>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const snrRef = useRef(snrBaseDb);
  const sigmaRef = useRef(noiseSigma);
  const modRef = useRef(modulation);
  const modeRef = useRef(mode);

  snrRef.current = snrBaseDb;
  sigmaRef.current = noiseSigma;
  modRef.current = modulation;
  modeRef.current = mode;

  const runFrame = useCallback(() => {
    const snrDb = snrRef.current;
    const sigma = sigmaRef.current;
    const mod = modRef.current;

    const snrLinear = snrDbToLinear(snrDb);
    const noiseStd = (1 / Math.sqrt(2 * Math.max(snrLinear, 0.001))) + sigma * 0.4;

    const bitsPerSym = getBitsPerSymbol(mod);
    const points = getConstellationPoints(mod);
    const numSymbols = Math.floor(BITS_PER_FRAME / bitsPerSym);

    const txBits: number[] = [];
    const rxBits: number[] = [];
    const bitErrors: boolean[] = [];
    const constellationRx: ReceivedPoint[] = [];
    let frameErrors = 0;

    for (let s = 0; s < numSymbols; s++) {
      const symIdx = Math.floor(Math.random() * points.length);
      const tx = points[symIdx];

      const rxI = tx.i + gaussianNoise(0, noiseStd);
      const rxQ = tx.q + gaussianNoise(0, noiseStd);

      let minDist = Infinity;
      let demodIdx = 0;
      for (let p = 0; p < points.length; p++) {
        const d = (rxI - points[p].i) ** 2 + (rxQ - points[p].q) ** 2;
        if (d < minDist) { minDist = d; demodIdx = p; }
      }

      const txStr = tx.bits;
      const rxStr = points[demodIdx].bits;
      for (let b = 0; b < bitsPerSym; b++) {
        const tb = parseInt(txStr[b], 10);
        const rb = parseInt(rxStr[b], 10);
        txBits.push(tb);
        rxBits.push(rb);
        const err = tb !== rb;
        bitErrors.push(err);
        if (err) frameErrors++;
      }

      if (s < 220) {
        constellationRx.push({ i: rxI, q: rxQ, error: symIdx !== demodIdx });
      }
    }

    totalBitsRef.current += txBits.length;
    errorBitsRef.current += frameErrors;

    const berActual = txBits.length > 0 ? frameErrors / txBits.length : 0;
    const snrLin = snrDbToLinear(snrDb);
    let berTheoretical: number;
    switch (mod) {
      case 'BPSK': berTheoretical = berBPSK(snrLin); break;
      case 'QPSK': berTheoretical = berQPSK(snrLin); break;
      case '8PSK': berTheoretical = ber8PSK(snrLin); break;
    }

    berHistoryRef.current = [
      ...berHistoryRef.current.slice(-60),
      { snrDb, ber: berActual },
    ];

    setState({
      snrSimDb: snrDb,
      berActual,
      berTheoretical,
      totalBits: totalBitsRef.current,
      errorBits: errorBitsRef.current,
      txBits: txBits.slice(0, 80),
      rxBits: rxBits.slice(0, 80),
      bitErrors: bitErrors.slice(0, 80),
      constellationRx,
      berHistory: berHistoryRef.current,
      isRunning: modeRef.current !== 'stopped',
    });
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (mode === 'continuous') {
      runFrame();
      intervalRef.current = setInterval(runFrame, SIM_INTERVAL_MS);
    } else if (mode === 'single') {
      runFrame();
    } else {
      setState(prev => ({ ...prev, isRunning: false }));
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, runFrame]);

  const reset = useCallback(() => {
    totalBitsRef.current = 0;
    errorBitsRef.current = 0;
    berHistoryRef.current = [];
    setState(prev => ({ ...prev, totalBits: 0, errorBits: 0, berHistory: [], berActual: 0 }));
  }, []);

  return { state, reset };
}
