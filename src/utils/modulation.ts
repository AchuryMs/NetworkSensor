export type ModulationType = 'BPSK' | 'QPSK' | '8PSK';

export interface ConstellationPoint {
  i: number;
  q: number;
  bits: string;
}

export function getConstellationPoints(mod: ModulationType): ConstellationPoint[] {
  switch (mod) {
    case 'BPSK':
      return [
        { i: -1, q: 0, bits: '0' },
        { i: 1, q: 0, bits: '1' },
      ];
    case 'QPSK': {
      const s = 1 / Math.sqrt(2);
      return [
        { i: s, q: s, bits: '00' },
        { i: -s, q: s, bits: '01' },
        { i: -s, q: -s, bits: '11' },
        { i: s, q: -s, bits: '10' },
      ];
    }
    case '8PSK':
      return Array.from({ length: 8 }, (_, k) => ({
        i: Math.cos((2 * Math.PI * k) / 8),
        q: Math.sin((2 * Math.PI * k) / 8),
        bits: k.toString(2).padStart(3, '0'),
      }));
  }
}

export function getBitsPerSymbol(mod: ModulationType): number {
  switch (mod) {
    case 'BPSK': return 1;
    case 'QPSK': return 2;
    case '8PSK': return 3;
  }
}
