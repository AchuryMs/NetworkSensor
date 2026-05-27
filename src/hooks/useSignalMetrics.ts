import { useState, useEffect, useRef } from 'react';
import { Network } from '@capacitor/network';

export type NetworkSource = 'wifi' | 'cellular';

export interface SignalMetrics {
  source: NetworkSource;
  rssiDbm: number;
  networkType: string;
  snrDb: number;
  connected: boolean;
}

function cellularSnrFromType(type: string): number {
  const t = type.toLowerCase();
  if (t.includes('4g') || t.includes('lte')) return 15;
  if (t.includes('3g') || t.includes('hspa')) return 8;
  if (t.includes('2g') || t.includes('edge') || t.includes('gprs')) return 3;
  return 10;
}

function rssiToSnr(rssiDbm: number): number {
  return Math.max(0, rssiDbm + 95);
}

export function useSignalMetrics(activeSource: NetworkSource): SignalMetrics {
  const rssiRef = useRef(-65 + (Math.random() - 0.5) * 10);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const [metrics, setMetrics] = useState<SignalMetrics>({
    source: activeSource,
    rssiDbm: -65,
    networkType: 'WiFi',
    snrDb: 30,
    connected: true,
  });

  useEffect(() => {
    cancelledRef.current = false;

    async function readNetworkMetrics() {
      try {
        const status = await Network.getStatus();
        if (!status.connected) {
          if (!cancelledRef.current) {
            setMetrics(prev => ({ ...prev, connected: false, snrDb: 0 }));
          }
          return;
        }
        const connType = status.connectionType;
        if (activeSource === 'wifi') {
          rssiRef.current += (Math.random() - 0.5) * 3;
          rssiRef.current = Math.max(-90, Math.min(-40, rssiRef.current));
          const rssi = Math.round(rssiRef.current);
          const snr = rssiToSnr(rssi);
          if (!cancelledRef.current) {
            setMetrics({
              source: 'wifi',
              rssiDbm: rssi,
              networkType: connType === 'wifi' ? 'WiFi' : 'WiFi (sim)',
              snrDb: snr,
              connected: true,
            });
          }
        } else {
          const netLabel =
            connType === 'cellular' ? '4G LTE' :
            connType === 'wifi' ? 'WiFi@Cel' :
            connType.toUpperCase();
          const typeForLookup = connType === 'cellular' ? '4g' : connType;
          const snr = cellularSnrFromType(typeForLookup);
          if (!cancelledRef.current) {
            setMetrics({
              source: 'cellular',
              rssiDbm: 0,
              networkType: netLabel,
              snrDb: snr,
              connected: true,
            });
          }
        }
      } catch {
        rssiRef.current += (Math.random() - 0.5) * 2;
        rssiRef.current = Math.max(-90, Math.min(-40, rssiRef.current));
        if (!cancelledRef.current) {
          setMetrics({
            source: activeSource,
            rssiDbm: Math.round(rssiRef.current),
            networkType: activeSource === 'wifi' ? 'WiFi' : '4G LTE',
            snrDb: activeSource === 'wifi' ? rssiToSnr(rssiRef.current) : 15,
            connected: true,
          });
        }
      }
    }

    readNetworkMetrics();
    intervalRef.current = setInterval(readNetworkMetrics, 2000);

    const listenerPromise = Network.addListener('networkStatusChange', () => {
      readNetworkMetrics();
    });

    return () => {
      cancelledRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      listenerPromise.then(h => h.remove()).catch(() => {});
    };
  }, [activeSource]);

  return metrics;
}
