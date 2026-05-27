import React from 'react';
import { ModulationType } from '../utils/modulation';

interface Props {
  snrDb: number;
  modulation: ModulationType;
  berActual: number;
  berTheoretical: number;
}

function getChannelStatus(snrDb: number): {
  title: string;
  body: string;
  color: string;
} {
  if (snrDb > 15) {
    return {
      title: 'CANAL LIMPIO',
      body: 'La relacion senal-ruido es alta. Los simbolos llegan casi sin degradacion. La probabilidad de error de bit tiende a cero. Sistema operando en condicion optima.',
      color: '#00FF41',
    };
  }
  if (snrDb >= 8) {
    return {
      title: 'RUIDO MODERADO',
      body: 'El ruido AWGN comienza a solaparse con los simbolos validos. Algunos bits se corrompen. La tasa de error de bit es perceptible y crece exponencialmente al reducir el SNR.',
      color: '#FFB300',
    };
  }
  return {
    title: 'CANAL DEGRADADO',
    body: 'El ruido domina sobre la senal util. La constelacion se colapsa. La comunicacion se vuelve inestable. BER se aproxima a 0.5 (equivalente a decision aleatoria).',
    color: '#FF3B30',
  };
}

function getBerFormula(mod: ModulationType): { formula: string; detail: string } {
  switch (mod) {
    case 'BPSK':
      return {
        formula: 'Pe = Q( sqrt(2 * Eb/N0) )',
        detail: 'BPSK: modulacion binaria de fase. Maximo margen de ruido para 1 bit/simbolo.',
      };
    case 'QPSK':
      return {
        formula: 'Pe = Q( sqrt(Eb/N0) )',
        detail: 'QPSK: 4 fases, 2 bits/simbolo. Misma BER que BPSK con el doble de eficiencia espectral.',
      };
    case '8PSK':
      return {
        formula: 'Pe = (2/3) * Q( sqrt(2*Eb/N0) * sin(pi/8) )',
        detail: '8-PSK: 8 fases, 3 bits/simbolo. Mayor eficiencia espectral pero menor margen de ruido.',
      };
  }
}

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '10px 12px',
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    margin: '0',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  title: {
    fontSize: '11px',
    letterSpacing: '0.18em',
    fontFamily: "'Share Tech Mono', monospace",
    fontWeight: 'bold',
  },
  body: {
    color: '#7a7a7a',
    fontSize: '10px',
    lineHeight: '1.6',
    letterSpacing: '0.04em',
    fontFamily: "'Share Tech Mono', monospace",
    marginBottom: '10px',
  },
  divider: {
    height: '1px',
    background: '#1e1e1e',
    margin: '8px 0',
  },
  formulaLabel: {
    color: '#007a1f',
    fontSize: '9px',
    letterSpacing: '0.15em',
    fontFamily: "'Share Tech Mono', monospace",
    marginBottom: '4px',
  },
  formula: {
    color: '#FFB300',
    fontSize: '11px',
    letterSpacing: '0.06em',
    fontFamily: "'Share Tech Mono', monospace",
    textShadow: '0 0 6px rgba(255,179,0,0.4)',
    marginBottom: '6px',
    padding: '6px 8px',
    background: '#111111',
    border: '1px solid #1e1e1e',
  },
  detail: {
    color: '#555555',
    fontSize: '9px',
    lineHeight: '1.5',
    letterSpacing: '0.04em',
    fontFamily: "'Share Tech Mono', monospace",
  },
};

export const EduPanel: React.FC<Props> = ({ snrDb, modulation, berActual, berTheoretical }) => {
  const channel = getChannelStatus(snrDb);
  const { formula, detail } = getBerFormula(modulation);

  return (
    <div style={s.container}>
      <div style={s.titleRow}>
        <div style={{ ...s.dot, background: channel.color, boxShadow: `0 0 8px ${channel.color}` }} />
        <span style={{ ...s.title, color: channel.color }}>{channel.title}</span>
      </div>
      <p style={s.body}>{channel.body}</p>

      <div style={s.divider} />

      <div style={s.formulaLabel}>FORMULA BER — {modulation}</div>
      <div style={s.formula}>{formula}</div>
      <p style={s.detail}>{detail}</p>

      <div style={s.divider} />

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={s.formulaLabel}>BER SIMULADO</div>
          <div style={{ ...s.formula, color: '#00FF41', textShadow: '0 0 6px rgba(0,255,65,0.4)', fontSize: '10px' }}>
            {berActual > 0 ? berActual.toExponential(3) : '< 10^-6'}
          </div>
        </div>
        <div>
          <div style={s.formulaLabel}>BER TEORICO</div>
          <div style={{ ...s.formula, fontSize: '10px' }}>
            {berTheoretical > 0 ? berTheoretical.toExponential(3) : '< 10^-6'}
          </div>
        </div>
      </div>
    </div>
  );
};
