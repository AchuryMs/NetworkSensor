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
  dotColor: string;
  titleColor: string;
} {
  if (snrDb > 15) {
    return {
      title: 'Canal limpio',
      body: 'La relación señal-ruido es alta. Los símbolos llegan casi sin degradación. La probabilidad de error de bit tiende a cero. Sistema operando en condición óptima.',
      dotColor: '#1D9E75',
      titleColor: '#085041',
    };
  }
  if (snrDb >= 8) {
    return {
      title: 'Ruido moderado',
      body: 'El ruido AWGN comienza a solaparse con los símbolos válidos. Algunos bits se corrompen. La tasa de error de bit crece exponencialmente al reducir el SNR.',
      dotColor: '#EF9F27',
      titleColor: '#633806',
    };
  }
  return {
    title: 'Canal degradado',
    body: 'El ruido domina sobre la señal útil. La constelación se colapsa. La comunicación se vuelve inestable. BER se aproxima a 0.5, equivalente a decisión aleatoria.',
    dotColor: '#E24B4A',
    titleColor: '#791F1F',
  };
}

function getBerFormula(mod: ModulationType): { formula: string; detail: string } {
  switch (mod) {
    case 'BPSK':
      return {
        formula: 'Pe = Q( √(2 · Eb/N₀) )',
        detail: 'Modulación binaria de fase. Máximo margen de ruido para 1 bit/símbolo.',
      };
    case 'QPSK':
      return {
        formula: 'Pe = Q( √(Eb/N₀) )',
        detail: '4 fases, 2 bits/símbolo. Misma BER que BPSK con el doble de eficiencia espectral.',
      };
    case '8PSK':
      return {
        formula: 'Pe ≈ (2/3)·Q( √(2·Eb/N₀)·sin(π/8) )',
        detail: '8 fases, 3 bits/símbolo. Mayor eficiencia espectral pero menor margen de ruido.',
      };
  }
}

function formatBer(ber: number): string {
  if (ber <= 0 || ber < 1e-6) return '< 1e-6';
  return ber.toExponential(3);
}

export const EduPanel: React.FC<Props> = ({ snrDb, modulation, berActual, berTheoretical }) => {
  const channel = getChannelStatus(snrDb);
  const { formula, detail } = getBerFormula(modulation);

  return (
    <div style={s.container}>
      {/* Channel status */}
      <div style={s.statusRow}>
        <div style={{ ...s.dot, background: channel.dotColor }} />
        <span style={{ ...s.statusTitle, color: channel.titleColor }}>{channel.title}</span>
      </div>
      <p style={s.body}>{channel.body}</p>

      <div style={s.divider} />

      {/* BER formula */}
      <div style={s.formulaLabel}>Fórmula BER — {modulation}</div>
      <div style={s.formulaBox}>
        <span style={s.formulaText}>{formula}</span>
      </div>
      <p style={s.detail}>{detail}</p>

      <div style={s.divider} />

      {/* BER comparison */}
      <div style={s.berRow}>
        <div style={s.berBlock}>
          <div style={s.berTag}>BER simulado</div>
          <div style={{ ...s.berVal, color: '#3C3489' }}>{formatBer(berActual)}</div>
        </div>
        <div style={s.berBlock}>
          <div style={s.berTag}>BER teórico</div>
          <div style={{ ...s.berVal, color: '#854F0B' }}>{formatBer(berTheoretical)}</div>
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '10px 14px 16px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: 500,
  },
  body: {
    color: '#5F5E5A',
    fontSize: 12,
    lineHeight: 1.65,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    background: '#EEEDFE',
    margin: '10px 0',
  },
  formulaLabel: {
    color: '#7F77DD',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.05em',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  },
  formulaBox: {
    background: '#F4F1FF',
    border: '0.5px solid #CECBF6',
    borderRadius: 8,
    padding: '9px 12px',
    marginBottom: 8,
  },
  formulaText: {
    color: '#3C3489',
    fontSize: 13,
    fontFamily: 'var(--font-mono, monospace)',
    fontWeight: 500,
  },
  detail: {
    color: '#888780',
    fontSize: 11,
    lineHeight: 1.55,
  },
  berRow: {
    display: 'flex',
    gap: 8,
  },
  berBlock: {
    flex: 1,
    background: '#F4F1FF',
    border: '0.5px solid #CECBF6',
    borderRadius: 8,
    padding: '8px 12px',
  },
  berTag: {
    color: '#7F77DD',
    fontSize: 10,
    fontWeight: 500,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  berVal: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'var(--font-mono, monospace)',
  },
};
