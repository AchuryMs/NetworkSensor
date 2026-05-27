export function erfc(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1.0 / (1.0 + 0.3275911 * ax);
  const poly =
    t * (0.254829592 +
      t * (-0.284496736 +
        t * (1.421413741 +
          t * (-1.453152027 +
            t * 1.061405429))));
  const result = poly * Math.exp(-ax * ax);
  return sign >= 0 ? result : 2 - result;
}

export function qFunction(x: number): number {
  return 0.5 * erfc(x / Math.sqrt(2));
}

export function berBPSK(snrLinear: number): number {
  return qFunction(Math.sqrt(2 * Math.max(snrLinear, 1e-9)));
}

export function berQPSK(snrLinear: number): number {
  return qFunction(Math.sqrt(Math.max(snrLinear, 1e-9)));
}

export function ber8PSK(snrLinear: number): number {
  return (2 / 3) * qFunction(Math.sqrt(2 * Math.max(snrLinear, 1e-9)) * Math.sin(Math.PI / 8));
}

export function snrDbToLinear(snrDb: number): number {
  return Math.pow(10, snrDb / 10);
}

export function linearToSnrDb(linear: number): number {
  return 10 * Math.log10(Math.max(linear, 1e-20));
}
