import React from 'react';

type FlagSpec =
  | { kind: 'v'; colors: string[] }
  | { kind: 'h'; colors: string[] }
  | { kind: 'cross'; bg: string; fg: string; nordic?: boolean }
  | { kind: 'saltire'; bg: string; fg: string }
  | { kind: 'halves'; top: string; bottom: string; circle?: string }
  | { kind: 'brazil' }
  | { kind: 'argentina' }
  | { kind: 'portugal' }
  | { kind: 'japan' }
  | { kind: 'southkorea' }
  | { kind: 'turkey' }
  | { kind: 'canada' }
  | { kind: 'portugalGreen' }
  | { kind: 'usa' }
  | { kind: 'star'; bg: string; colors: string[]; orientation: 'v' | 'h'; star: string };

const FLAGS: Record<string, FlagSpec> = {
  France: { kind: 'v', colors: ['#0055A4', '#ffffff', '#EF4135'] },
  Italy: { kind: 'v', colors: ['#008C45', '#ffffff', '#CD212A'] },
  Belgium: { kind: 'v', colors: ['#000000', '#FDDA24', '#EF3340'] },
  Ireland: { kind: 'v', colors: ['#169B62', '#ffffff', '#FF883E'] },
  'Ivory Coast': { kind: 'v', colors: ['#F77F00', '#ffffff', '#009E60'] },
  Nigeria: { kind: 'v', colors: ['#008751', '#ffffff', '#008751'] },
  Mexico: { kind: 'v', colors: ['#006847', '#ffffff', '#CE1126'] },
  Peru: { kind: 'v', colors: ['#D91023', '#ffffff', '#D91023'] },
  Germany: { kind: 'h', colors: ['#000000', '#DD0000', '#FFCE00'] },
  Netherlands: { kind: 'h', colors: ['#AE1C28', '#ffffff', '#21468B'] },
  Hungary: { kind: 'h', colors: ['#CE2939', '#ffffff', '#477050'] },
  Austria: { kind: 'h', colors: ['#ED2939', '#ffffff', '#ED2939'] },
  Colombia: { kind: 'h', colors: ['#FCD116', '#003893', '#CE1126'] },
  Egypt: { kind: 'h', colors: ['#CE1126', '#ffffff', '#000000'] },
  Poland: { kind: 'halves', top: '#ffffff', bottom: '#DC143C' },
  Ukraine: { kind: 'halves', top: '#0057B7', bottom: '#FFD700' },
  Spain: { kind: 'h', colors: ['#AA151B', '#F1BF00', '#AA151B'] },
  'South Korea': { kind: 'southkorea' },
  Japan: { kind: 'japan' },
  England: { kind: 'cross', bg: '#ffffff', fg: '#CE1124' },
  Switzerland: { kind: 'cross', bg: '#D52B1E', fg: '#ffffff' },
  Denmark: { kind: 'cross', bg: '#C60C30', fg: '#ffffff', nordic: true },
  Norway: { kind: 'cross', bg: '#BA0C2F', fg: '#ffffff', nordic: true },
  Sweden: { kind: 'cross', bg: '#006AA7', fg: '#FECC00', nordic: true },
  Scotland: { kind: 'saltire', bg: '#0065BD', fg: '#ffffff' },
  Wales: { kind: 'halves', top: '#ffffff', bottom: '#00AB39' },
  Brazil: { kind: 'brazil' },
  Argentina: { kind: 'argentina' },
  Uruguay: { kind: 'argentina' },
  Portugal: { kind: 'portugal' },
  Turkey: { kind: 'turkey' },
  Canada: { kind: 'canada' },
  USA: { kind: 'usa' },
  Senegal: { kind: 'star', bg: '#00853F', colors: ['#00853F', '#FDEF42', '#E31B23'], orientation: 'v', star: '#FDEF42' },
  Ghana: { kind: 'star', bg: '#CE1126', colors: ['#CE1126', '#FCD116', '#006B3F'], orientation: 'h', star: '#000000' },
  Cameroon: { kind: 'star', bg: '#007A5E', colors: ['#007A5E', '#CE1126', '#FCD116'], orientation: 'v', star: '#FCD116' },
  Morocco: { kind: 'star', bg: '#C1272D', colors: ['#C1272D'], orientation: 'v', star: '#006233' },
  Algeria: { kind: 'star', bg: '#006233', colors: ['#006233', '#ffffff'], orientation: 'v', star: '#D21034' },
  Croatia: { kind: 'h', colors: ['#FF0000', '#ffffff', '#171796'] },
  USA2: { kind: 'usa' },
  Serbia: { kind: 'h', colors: ['#C6363C', '#0C4076', '#ffffff'] },
  Czechia: { kind: 'halves', top: '#ffffff', bottom: '#D7141A', circle: '#11457E' },
};

const CODES: Record<string, string> = {
  Brazil: 'BRA', Argentina: 'ARG', France: 'FRA', England: 'ENG', Spain: 'ESP', Portugal: 'POR',
  Germany: 'GER', Netherlands: 'NED', Italy: 'ITA', Belgium: 'BEL', Croatia: 'CRO', Uruguay: 'URU',
  Colombia: 'COL', Norway: 'NOR', Sweden: 'SWE', Denmark: 'DEN', Switzerland: 'SUI', Austria: 'AUT',
  Poland: 'POL', Turkey: 'TUR', Ghana: 'GHA', Senegal: 'SEN', Nigeria: 'NGA', Morocco: 'MAR',
  'Ivory Coast': 'CIV', Algeria: 'ALG', Cameroon: 'CMR', Egypt: 'EGY', Japan: 'JPN',
  'South Korea': 'KOR', Mexico: 'MEX', USA: 'USA', Canada: 'CAN', Serbia: 'SRB', Czechia: 'CZE',
  Scotland: 'SCO', Wales: 'WAL', Ireland: 'IRL', Ukraine: 'UKR', Hungary: 'HUN', Peru: 'PER',
};

interface NationFlagProps {
  nation?: string;
  size?: number;
  className?: string;
}

export const NationFlag: React.FC<NationFlagProps> = ({ nation, size = 14, className = '' }) => {
  const clipId = React.useId().replace(/:/g, '');
  const width = size;
  const height = Math.round(size * 0.68);
  const spec = nation ? FLAGS[nation] : undefined;
  const code = nation ? CODES[nation] || nation.slice(0, 3).toUpperCase() : '—';

  const stripes = (colors: string[], vertical: boolean) => (
    colors.map((color, idx) => (
      <rect
        key={`${color}-${idx}`}
        x={vertical ? (width / colors.length) * idx : 0}
        y={vertical ? 0 : (height / colors.length) * idx}
        width={vertical ? width / colors.length : width}
        height={vertical ? height : height / colors.length}
        fill={color}
      />
    ))
  );

  const content = () => {
    if (!spec) {
      return (
        <>
          <rect width={width} height={height} fill="#1e293b" />
          <text x={width / 2} y={height / 2 + 2.4} textAnchor="middle" fontSize={height * 0.55} fontWeight="900" fill="#cbd5e1">
            {code}
          </text>
        </>
      );
    }
    switch (spec.kind) {
      case 'v':
        return stripes(spec.colors, true);
      case 'h':
        return stripes(spec.colors, false);
      case 'halves':
        return (
          <>
            <rect width={width} height={height / 2} fill={spec.top} />
            <rect y={height / 2} width={width} height={height / 2} fill={spec.bottom} />
            {spec.circle && <circle cx={width * 0.32} cy={height / 2} r={height * 0.22} fill={spec.circle} />}
          </>
        );
      case 'cross':
        return (
          <>
            <rect width={width} height={height} fill={spec.bg} />
            {spec.nordic ? (
              <>
                <rect x={width * 0.28} y={0} width={width * 0.18} height={height} fill={spec.fg} />
                <rect x={0} y={height * 0.4} width={width} height={height * 0.22} fill={spec.fg} />
              </>
            ) : (
              <>
                <rect x={width * 0.42} y={0} width={width * 0.2} height={height} fill={spec.fg} />
                <rect x={0} y={height * 0.38} width={width} height={height * 0.26} fill={spec.fg} />
              </>
            )}
          </>
        );
      case 'saltire':
        return (
          <>
            <rect width={width} height={height} fill={spec.bg} />
            <path d={`M0 0 L${width} ${height} M${width} 0 L0 ${height}`} stroke={spec.fg} strokeWidth={height * 0.22} />
          </>
        );
      case 'brazil':
        return (
          <>
            <rect width={width} height={height} fill="#009C3B" />
            <path d={`M${width * 0.06} ${height / 2} L${width / 2} ${height * 0.08} L${width * 0.94} ${height / 2} L${width / 2} ${height * 0.92} Z`} fill="#FFDF00" />
            <circle cx={width / 2} cy={height / 2} r={height * 0.22} fill="#002776" />
          </>
        );
      case 'argentina':
        return (
          <>
            <rect width={width} height={height} fill="#74ACDF" />
            <rect y={height / 3} width={width} height={height / 3} fill="#ffffff" />
            <circle cx={width / 2} cy={height / 2} r={height * 0.13} fill="#F6B40E" />
          </>
        );
      case 'portugal':
        return (
          <>
            <rect width={width * 0.4} height={height} fill="#046A38" />
            <rect x={width * 0.4} width={width * 0.6} height={height} fill="#DA291C" />
            <circle cx={width * 0.4} cy={height / 2} r={height * 0.22} fill="#FFE900" />
          </>
        );
      case 'japan':
        return (
          <>
            <rect width={width} height={height} fill="#ffffff" />
            <circle cx={width / 2} cy={height / 2} r={height * 0.29} fill="#BC002D" />
          </>
        );
      case 'southkorea':
        return (
          <>
            <rect width={width} height={height} fill="#ffffff" />
            <circle cx={width / 2} cy={height / 2} r={height * 0.24} fill="#CD2E3A" />
            <path d={`M${width / 2 - height * 0.24} ${height / 2} a${height * 0.24} ${height * 0.24} 0 0 0 ${height * 0.48} 0 z`} fill="#0047A0" />
          </>
        );
      case 'turkey':
        return (
          <>
            <rect width={width} height={height} fill="#E30A17" />
            <circle cx={width * 0.42} cy={height / 2} r={height * 0.26} fill="#ffffff" />
            <circle cx={width * 0.48} cy={height / 2} r={height * 0.21} fill="#E30A17" />
            <circle cx={width * 0.68} cy={height / 2} r={height * 0.09} fill="#ffffff" />
          </>
        );
      case 'canada':
        return (
          <>
            <rect width={width * 0.25} height={height} fill="#D80621" />
            <rect x={width * 0.75} width={width * 0.25} height={height} fill="#D80621" />
            <rect x={width * 0.25} width={width * 0.5} height={height} fill="#ffffff" />
            <path d={`M${width / 2} ${height * 0.25} l${height * 0.14} ${height * 0.28} l-${height * 0.2} 0 l${height * 0.06} ${height * 0.24} l-${height * 0.14} 0 z`} fill="#D80621" />
          </>
        );
      case 'usa':
        return (
          <>
            <rect width={width} height={height} fill="#ffffff" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} y={(height / 13) * (i * 2)} width={width} height={height / 13} fill="#B22234" />
            ))}
            <rect width={width * 0.42} height={height * 0.54} fill="#3C3B6E" />
          </>
        );
      case 'star':
        return (
          <>
            {spec.orientation === 'v' ? stripes(spec.colors, true) : stripes(spec.colors, false)}
            <circle cx={width / 2} cy={height / 2} r={height * 0.2} fill={spec.star} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`rounded-[2px] ring-1 ring-black/30 shadow-sm ${className}`}
      aria-label={nation ? `${nation} flag` : 'No nation'}
      role="img"
    >
      <g clipPath={`url(#flag-${clipId})`}>
        {content()}
      </g>
      <clipPath id={`flag-${clipId}`}>
        <rect width={width} height={height} rx="2" />
      </clipPath>
    </svg>
  );
};
