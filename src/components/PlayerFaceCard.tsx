import React from 'react';
import { Player, Team, HairStyle, FacialHair, FaceCardTheme } from '../types/soccer';
import { ClubEmblem } from './ClubEmblem';
import { Sparkles } from 'lucide-react';

interface PlayerFaceCardProps {
  player: Player;
  team?: Team;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showDetails?: boolean;
}

interface FaceProfile {
  faceWidth: number;
  faceLength: number;
  jawWidth: number;
  eyeSpacing: number;
  eyeSize: number;
  noseWidth: number;
  noseLength: number;
  mouthWidth: number;
  lipFullness: number;
  browTilt: number;
  cheekbone: number;
  eyeColor: string;
}

const DEFAULT_PROFILE: FaceProfile = {
  faceWidth: 1,
  faceLength: 1,
  jawWidth: 1,
  eyeSpacing: 1,
  eyeSize: 1,
  noseWidth: 1,
  noseLength: 1,
  mouthWidth: 1,
  lipFullness: 1,
  browTilt: 0,
  cheekbone: 1,
  eyeColor: '#4b2a18',
};

function hashName(name: string): number {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function seededVariation(seed: number, offset: number, range: number): number {
  const value = Math.sin(seed * 0.0001 + offset * 17.13) * 43758.5453;
  const unit = value - Math.floor(value);
  return (unit - 0.5) * range;
}

function getProceduralProfile(player: Player): FaceProfile {
  const key = `${player.id}:${player.name}`.toLowerCase();
  const seed = hashName(key);

  const generated: FaceProfile = {
    faceWidth: 1 + seededVariation(seed, 1, 0.16),
    faceLength: 1 + seededVariation(seed, 2, 0.12),
    jawWidth: 1 + seededVariation(seed, 3, 0.18),
    eyeSpacing: 1 + seededVariation(seed, 4, 0.12),
    eyeSize: 1 + seededVariation(seed, 5, 0.12),
    noseWidth: 1 + seededVariation(seed, 6, 0.18),
    noseLength: 1 + seededVariation(seed, 7, 0.16),
    mouthWidth: 1 + seededVariation(seed, 8, 0.14),
    lipFullness: 1 + seededVariation(seed, 9, 0.22),
    browTilt: seededVariation(seed, 10, 6),
    cheekbone: 1 + seededVariation(seed, 11, 0.14),
    eyeColor: seed % 5 === 0 ? '#5a6b6f' : seed % 7 === 0 ? '#6b5736' : '#4b2a18',
  };

  // Named star presets give the most recognizable players deliberately distinct
  // proportions while retaining the original, fully offline vector-art style.
  if (key.includes('mbapp')) {
    return { ...generated, faceWidth: 0.98, faceLength: 0.96, jawWidth: 0.91, eyeSpacing: 1.03, noseWidth: 1.02, noseLength: 0.94, mouthWidth: 1.04, lipFullness: 1.16, browTilt: -1 };
  }
  if (key.includes('vinícius') || key.includes('vinicius') || key.includes('vini')) {
    return { ...generated, faceWidth: 0.93, faceLength: 1.05, jawWidth: 0.88, eyeSpacing: 1.06, noseWidth: 1.08, noseLength: 1.03, mouthWidth: 1.08, lipFullness: 1.18, browTilt: 1.5 };
  }
  if (key.includes('bellingham')) {
    return { ...generated, faceWidth: 0.95, faceLength: 1.06, jawWidth: 0.96, eyeSpacing: 1, noseWidth: 0.98, noseLength: 1.05, mouthWidth: 1.02, lipFullness: 1.08, browTilt: -1.5 };
  }
  if (key.includes('wirtz')) {
    return { ...generated, faceWidth: 0.9, faceLength: 1.07, jawWidth: 0.87, eyeSpacing: 0.98, noseWidth: 0.89, noseLength: 1.04, mouthWidth: 0.94, lipFullness: 0.94, browTilt: 0.5, eyeColor: '#64748b' };
  }
  if (key.includes('saliba')) {
    return { ...generated, faceWidth: 1.05, faceLength: 1.03, jawWidth: 1.08, eyeSpacing: 1.02, noseWidth: 1.07, noseLength: 1.02, mouthWidth: 1.04, lipFullness: 1.08, browTilt: -1 };
  }
  if (key.includes('haaland')) {
    return { ...generated, faceWidth: 0.94, faceLength: 1.1, jawWidth: 1.02, eyeSpacing: 1.03, noseWidth: 0.92, noseLength: 1.08, mouthWidth: 0.96, lipFullness: 0.9, browTilt: -0.5, eyeColor: '#708090' };
  }
  if (key.includes('messi')) {
    return { ...generated, faceWidth: 1.01, faceLength: 0.98, jawWidth: 0.96, eyeSpacing: 0.98, noseWidth: 1.03, noseLength: 1.03, mouthWidth: 0.98, lipFullness: 0.96, browTilt: -1 };
  }
  if (key.includes('ronaldo')) {
    return { ...generated, faceWidth: 0.96, faceLength: 1.08, jawWidth: 1.05, eyeSpacing: 0.99, noseWidth: 0.96, noseLength: 1.06, mouthWidth: 1, lipFullness: 0.96, browTilt: -2 };
  }
  if (key.includes('salah')) {
    return { ...generated, faceWidth: 1.01, faceLength: 1.01, jawWidth: 0.98, eyeSpacing: 1.03, noseWidth: 1.08, noseLength: 1.03, mouthWidth: 1.02, lipFullness: 1.06, browTilt: 1 };
  }

  return generated;
}

const CARD_THEMES: Record<FaceCardTheme, { bg: string; border: string; ratingColor: string; labelColor: string; statsColor: string; bannerBg: string; accentGlow: string }> = {
  gold: {
    bg: 'bg-gradient-to-b from-[#fce988] via-[#eab308] to-[#92400e]',
    border: 'border-[#fef08a] shadow-[0_0_25px_rgba(234,179,8,0.4)]',
    ratingColor: 'text-amber-950',
    labelColor: 'text-amber-900',
    statsColor: 'text-amber-950',
    bannerBg: 'bg-amber-950/20 border-amber-950/30 text-amber-950',
    accentGlow: 'from-amber-300/40 via-yellow-400/20 to-transparent',
  },
  tots: {
    bg: 'bg-gradient-to-b from-[#0284c7] via-[#1e40af] to-[#0f172a]',
    border: 'border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.5)]',
    ratingColor: 'text-cyan-300',
    labelColor: 'text-cyan-200',
    statsColor: 'text-white',
    bannerBg: 'bg-cyan-950/80 border-cyan-400/40 text-cyan-300',
    accentGlow: 'from-cyan-400/40 via-blue-500/20 to-transparent',
  },
  totw: {
    bg: 'bg-gradient-to-b from-[#18181b] via-[#09090b] to-black',
    border: 'border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.3)]',
    ratingColor: 'text-amber-400',
    labelColor: 'text-amber-300/80',
    statsColor: 'text-amber-100',
    bannerBg: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    accentGlow: 'from-amber-400/20 via-yellow-500/10 to-transparent',
  },
  future_stars: {
    bg: 'bg-gradient-to-b from-[#c026d3] via-[#7e22ce] to-[#0f172a]',
    border: 'border-pink-400 shadow-[0_0_25px_rgba(244,114,182,0.45)]',
    ratingColor: 'text-pink-200',
    labelColor: 'text-pink-300',
    statsColor: 'text-white',
    bannerBg: 'bg-pink-950/60 border-pink-400/40 text-pink-200',
    accentGlow: 'from-pink-500/40 via-purple-500/20 to-transparent',
  },
  icon: {
    bg: 'bg-gradient-to-b from-[#fefce8] via-[#f5f5f4] to-[#d6d3d1]',
    border: 'border-amber-300 shadow-[0_0_25px_rgba(217,119,6,0.3)]',
    ratingColor: 'text-stone-900',
    labelColor: 'text-stone-700',
    statsColor: 'text-stone-950',
    bannerBg: 'bg-amber-900/15 border-amber-800/30 text-stone-900',
    accentGlow: 'from-amber-200/50 via-stone-200/30 to-transparent',
  },
};

export const PlayerFaceAvatar: React.FC<{
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  facialHair?: FacialHair;
  jerseyColor?: string;
  size?: number;
  profile?: Partial<FaceProfile>;
}> = ({
  skinTone = '#d49b6a',
  hairStyle = 'short',
  hairColor = '#1f2937',
  facialHair = 'none',
  jerseyColor = '#0284c7',
  size = 120,
  profile,
}) => {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const id = React.useId().replace(/:/g, '');
  const cx = 50;
  const faceHalf = 20 * p.faceWidth;
  const topY = 22;
  const chinY = 62 * p.faceLength;
  const jawHalf = 11 * p.jawWidth;
  const eyeY = 38;
  const eyeOffset = 8 * p.eyeSpacing;
  const eyeRx = 4.2 * p.eyeSize;
  const eyeRy = 2.25 * p.eyeSize;
  const noseTipY = 47 + (p.noseLength - 1) * 8;
  const noseHalf = 2.3 * p.noseWidth;
  const mouthHalf = 7 * p.mouthWidth;
  const lip = 1.4 * p.lipFullness;

  const facePath = `M ${cx - faceHalf} 34 C ${cx - faceHalf} ${topY}, ${cx + faceHalf} ${topY}, ${cx + faceHalf} 34 C ${cx + faceHalf} 49, ${cx + jawHalf} ${chinY - 1}, ${cx} ${chinY} C ${cx - jawHalf} ${chinY - 1}, ${cx - faceHalf} 49, ${cx - faceHalf} 34 Z`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="drop-shadow-xl">
      <defs>
        <radialGradient id={`skin_${id}`} cx="42%" cy="34%" r="64%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.30" />
          <stop offset="55%" stopColor={skinTone} stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.34" />
        </radialGradient>
        <linearGradient id={`kit_${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.38" />
        </linearGradient>
      </defs>

      <path d="M10 98 C14 77 31 68 50 68 C69 68 86 77 90 98 Z" fill={jerseyColor} />
      <path d="M10 98 C14 77 31 68 50 68 C69 68 86 77 90 98 Z" fill={`url(#kit_${id})`} />
      <path d="M39 68 L50 83 L61 68" fill={skinTone} opacity="0.9" />
      <rect x="42" y="53" width="16" height="19" rx="5" fill={skinTone} />
      <ellipse cx={cx - faceHalf - 1} cy="44" rx="4" ry="7" fill={skinTone} />
      <ellipse cx={cx + faceHalf + 1} cy="44" rx="4" ry="7" fill={skinTone} />

      <path d={facePath} fill={skinTone} />
      <path d={facePath} fill={`url(#skin_${id})`} />

      <ellipse cx={cx - eyeOffset - 1} cy="44" rx={5.1 * p.cheekbone} ry="2.2" fill="#fff" opacity="0.08" />
      <ellipse cx={cx + eyeOffset + 1} cy="44" rx={5.1 * p.cheekbone} ry="2.2" fill="#fff" opacity="0.08" />

      <g>
        <ellipse cx={cx - eyeOffset} cy={eyeY} rx={eyeRx} ry={eyeRy} fill="#f8fafc" />
        <ellipse cx={cx + eyeOffset} cy={eyeY} rx={eyeRx} ry={eyeRy} fill="#f8fafc" />
        <circle cx={cx - eyeOffset} cy={eyeY} r={1.9 * p.eyeSize} fill={p.eyeColor} />
        <circle cx={cx + eyeOffset} cy={eyeY} r={1.9 * p.eyeSize} fill={p.eyeColor} />
        <circle cx={cx - eyeOffset} cy={eyeY} r="0.9" fill="#09090b" />
        <circle cx={cx + eyeOffset} cy={eyeY} r="0.9" fill="#09090b" />
        <circle cx={cx - eyeOffset + 0.5} cy={eyeY - 0.5} r="0.45" fill="#fff" />
        <circle cx={cx + eyeOffset + 0.5} cy={eyeY - 0.5} r="0.45" fill="#fff" />
      </g>

      <path d={`M ${cx - eyeOffset - 5} ${33 + p.browTilt} Q ${cx - eyeOffset} ${30 - p.browTilt} ${cx - eyeOffset + 5} 33`} stroke={hairColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d={`M ${cx + eyeOffset - 5} 33 Q ${cx + eyeOffset} ${30 + p.browTilt} ${cx + eyeOffset + 5} ${33 - p.browTilt}`} stroke={hairColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />

      <path d={`M48 36 Q 47.5 ${noseTipY - 2} 50 ${noseTipY} Q 52.5 ${noseTipY - 2} 52 36`} fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="0.9" />
      <ellipse cx="50" cy={noseTipY} rx={noseHalf} ry="1.65" fill={skinTone} />
      <path d={`M ${50 - noseHalf - 1.2} ${noseTipY + 1} Q ${50 - noseHalf / 2} ${noseTipY} 49 ${noseTipY + 1.3}`} stroke="#111827" strokeOpacity="0.42" strokeWidth="0.8" fill="none" />
      <path d={`M ${50 + noseHalf + 1.2} ${noseTipY + 1} Q ${50 + noseHalf / 2} ${noseTipY} 51 ${noseTipY + 1.3}`} stroke="#111827" strokeOpacity="0.42" strokeWidth="0.8" fill="none" />

      <path d={`M ${50 - mouthHalf} 53 Q 50 ${53 - lip * 0.35} ${50 + mouthHalf} 53 Q 50 ${53 + lip} ${50 - mouthHalf} 53 Z`} fill="#5b2f2f" fillOpacity="0.58" />
      <path d={`M ${50 - mouthHalf} 53 Q 50 54 ${50 + mouthHalf} 53`} stroke="#261616" strokeOpacity="0.65" strokeWidth="0.8" fill="none" />

      {facialHair === 'stubble' && <path d={`M ${cx - faceHalf + 4} 48 C ${cx - 12} 61, ${cx + 12} 61, ${cx + faceHalf - 4} 48`} stroke={hairColor} strokeOpacity="0.4" strokeWidth="2" strokeDasharray="1 2" fill="none" />}
      {facialHair === 'goatee' && <path d="M44 51 Q50 49 56 51 L54 59 Q50 63 46 59 Z" fill={hairColor} opacity="0.82" />}
      {facialHair === 'beard' && <path d={`M ${cx - faceHalf + 2} 45 C ${cx - 17} 59, ${cx - 9} ${chinY + 2}, 50 ${chinY + 3} C ${cx + 9} ${chinY + 2}, ${cx + 17} 59, ${cx + faceHalf - 2} 45 C ${cx + 14} 55, ${cx - 14} 55, ${cx - faceHalf + 2} 45 Z`} fill={hairColor} opacity="0.9" />}

      {hairStyle === 'buzz' && <path d={`M ${cx - faceHalf - 1} 34 C ${cx - faceHalf} 17, ${cx + faceHalf} 17, ${cx + faceHalf + 1} 34 C 66 25, 58 22, 50 22 C42 22,34 25,${cx - faceHalf - 1} 34Z`} fill={hairColor} opacity="0.82" />}
      {hairStyle === 'short' && <path d={`M ${cx - faceHalf - 2} 34 C ${cx - faceHalf} 14, ${cx + faceHalf} 14, ${cx + faceHalf + 2} 34 C68 23,60 20,50 21 C40 20,32 23,${cx - faceHalf - 2} 34Z`} fill={hairColor} />}
      {hairStyle === 'fade' && <g fill={hairColor}><path d="M30 35 C30 24 35 21 38 22 L34 35Z" opacity="0.35"/><path d="M70 35 C70 24 65 21 62 22 L66 35Z" opacity="0.35"/><path d="M34 25 C35 11 65 11 66 25 C61 19 56 18 50 19 C44 18 39 19 34 25Z"/></g>}
      {(hairStyle === 'curly' || hairStyle === 'afro') && <g fill={hairColor}><circle cx="32" cy="24" r="7"/><circle cx="40" cy="18" r="7"/><circle cx="50" cy="16" r="8"/><circle cx="60" cy="18" r="7"/><circle cx="68" cy="24" r="7"/></g>}
      {hairStyle === 'dreads' && <g fill={hairColor}><rect x="30" y="14" width="6" height="25" rx="3" transform="rotate(-16 30 14)"/><rect x="39" y="12" width="6" height="27" rx="3" transform="rotate(-7 39 12)"/><rect x="47" y="11" width="6" height="29" rx="3"/><rect x="57" y="12" width="6" height="27" rx="3" transform="rotate(7 57 12)"/><rect x="66" y="14" width="6" height="25" rx="3" transform="rotate(16 66 14)"/></g>}
      {hairStyle === 'slick' && <path d="M28 34 C29 13 71 13 72 34 C67 21 59 18 50 19 C41 18 33 21 28 34Z" fill={hairColor} />}
      {hairStyle === 'mohawk' && <g fill={hairColor}><path d="M30 35 L39 23 L35 35Z" opacity="0.3"/><path d="M70 35 L61 23 L65 35Z" opacity="0.3"/><path d="M41 27 C42 9 58 9 59 27 C55 22 45 22 41 27Z"/></g>}
    </svg>
  );
};

export const PlayerFaceCard: React.FC<PlayerFaceCardProps> = ({
  player,
  team,
  size = 'md',
  className = '',
  onClick,
  showDetails = true,
}) => {
  const themeKey = player.likeness?.faceCardTheme || 'gold';
  const theme = CARD_THEMES[themeKey] || CARD_THEMES.gold;
  const profile = getProceduralProfile(player);

  const sizeClasses = {
    xs: 'w-24 h-36 p-1.5 text-[9px] rounded-xl',
    sm: 'w-32 h-48 p-2 text-[10px] rounded-2xl',
    md: 'w-44 h-64 p-3 text-xs rounded-2xl',
    lg: 'w-56 h-80 p-4 text-sm rounded-3xl',
    xl: 'w-64 h-[23rem] p-5 text-sm rounded-3xl',
  };
  const avatarSizes = { xs: 50, sm: 70, md: 96, lg: 125, xl: 145 };
  const jerseyColor = team?.kit?.primary || '#0284c7';

  return (
    <div onClick={onClick} className={`relative select-none border-2 flex flex-col justify-between overflow-hidden transition-transform duration-200 ${theme.bg} ${theme.border} ${sizeClasses[size]} ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-tr ${theme.accentGlow} pointer-events-none`} />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tighter ${theme.ratingColor} ${size === 'xs' ? 'text-base' : size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>{player.rating}</span>
          <span className={`font-mono font-bold uppercase tracking-wider ${theme.labelColor} ${size === 'xs' ? 'text-[8px]' : 'text-[10px]'}`}>{player.position}</span>
          {player.preferredFoot && size !== 'xs' && <span className={`text-[8px] font-mono opacity-75 ${theme.labelColor}`}>{player.preferredFoot === 'Left' ? 'L-FT' : 'R-FT'}</span>}
        </div>
        {team ? <ClubEmblem teamId={team.id} shortName={team.shortName} size={size === 'xs' ? 'xs' : 'sm'} /> : <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-[10px]">⚽</div>}
      </div>

      <div className="relative z-10 my-auto flex items-center justify-center">
        <PlayerFaceAvatar
          skinTone={player.likeness?.skinTone || '#d49b6a'}
          hairStyle={player.likeness?.hairStyle || 'short'}
          hairColor={player.likeness?.hairColor || '#1f2937'}
          facialHair={player.likeness?.facialHair || 'none'}
          jerseyColor={jerseyColor}
          size={avatarSizes[size]}
          profile={profile}
        />
        {player.playStyles?.length && size !== 'xs' ? (
          <div className="absolute bottom-0 right-1 p-1 rounded-full bg-black/60 border border-white/20 text-cyan-300 shadow" title={`PlayStyle: ${player.playStyles[0]}`}>
            <Sparkles className="w-3 h-3" />
          </div>
        ) : null}
      </div>

      <div className="relative z-10 w-full">
        <div className={`w-full py-0.5 px-1 rounded-lg border text-center font-black uppercase tracking-wider truncate mb-1 ${theme.bannerBg}`}>
          {player.shortName || player.name.split(' ').pop()}
        </div>
        {showDetails && size !== 'xs' && (
          <div className="grid grid-cols-6 gap-0.5 text-center font-mono">
            <StatPill label="PAC" value={player.stats.pace} colorClass={theme.statsColor} />
            <StatPill label="SHO" value={player.stats.shooting} colorClass={theme.statsColor} />
            <StatPill label="PAS" value={player.stats.passing} colorClass={theme.statsColor} />
            <StatPill label="DRI" value={player.stats.dribbling} colorClass={theme.statsColor} />
            <StatPill label="DEF" value={player.stats.defending} colorClass={theme.statsColor} />
            <StatPill label="PHY" value={player.stats.physicality} colorClass={theme.statsColor} />
          </div>
        )}
      </div>
    </div>
  );
};

const StatPill: React.FC<{ label: string; value: number; colorClass: string }> = ({ label, value, colorClass }) => (
  <div className="flex flex-col items-center leading-tight">
    <span className={`text-[10px] md:text-xs font-black ${colorClass}`}>{value}</span>
    <span className="text-[7px] md:text-[8px] opacity-75 uppercase tracking-tighter">{label}</span>
  </div>
);
