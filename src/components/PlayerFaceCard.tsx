/**
 * PlayerFaceCard Component
 * Renders an authentic EA FC-style Ultimate Team Face Card with dynamic SVG avatar likeness,
 * customizable card tiers (Gold Rare, TOTS, TOTW, Future Stars, Icon), player ratings, and attributes.
 */

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

// Visual theme configurations for different card editions
const CARD_THEMES: Record<
  FaceCardTheme,
  {
    bg: string;
    border: string;
    ratingColor: string;
    labelColor: string;
    statsColor: string;
    bannerBg: string;
    accentGlow: string;
  }
> = {
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
    bg: 'bg-gradient-to-b from-[#18181b] via-[#09090b] to-[#000000]',
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

/**
 * Procedural SVG Avatar Portrait Generator
 * Generates custom human face based on player's likeness parameters
 */
export const PlayerFaceAvatar: React.FC<{
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  facialHair?: FacialHair;
  jerseyColor?: string;
  size?: number;
}> = ({
  skinTone = '#d49b6a',
  hairStyle = 'short',
  hairColor = '#1f2937',
  facialHair = 'none',
  jerseyColor = '#0284c7',
  size = 120,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <radialGradient id="faceShade" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </radialGradient>
      </defs>

      {/* Jersey Shoulders / Collar */}
      <path
        d="M 15 95 C 20 72, 35 68, 50 68 C 65 68, 80 72, 85 95 Z"
        fill={jerseyColor}
      />
      {/* Jersey Inner V-Neck */}
      <polygon points="40,68 60,68 50,82" fill={skinTone} />
      <path
        d="M 38 68 L 50 82 L 62 68"
        stroke="#ffffff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Neck */}
      <rect x="42" y="52" width="16" height="18" fill={skinTone} rx="2" />
      <rect x="42" y="52" width="16" height="18" fill="url(#faceShade)" rx="2" />

      {/* Ears */}
      <circle cx="28" cy="45" r="5" fill={skinTone} />
      <circle cx="72" cy="45" r="5" fill={skinTone} />

      {/* Head Base */}
      <path
        d="M 30 35 C 30 20, 70 20, 70 35 C 70 54, 62 62, 50 62 C 38 62, 30 54, 30 35 Z"
        fill={skinTone}
      />
      <path
        d="M 30 35 C 30 20, 70 20, 70 35 C 70 54, 62 62, 50 62 C 38 62, 30 54, 30 35 Z"
        fill="url(#faceShade)"
      />

      {/* Eyebrows */}
      <path
        d="M 36 34 Q 42 32 46 34"
        stroke={hairColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 54 34 Q 58 32 64 34"
        stroke={hairColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Eyes */}
      <ellipse cx="41" cy="38" rx="3.5" ry="2.2" fill="#ffffff" />
      <circle cx="41.5" cy="38" r="1.6" fill="#1e293b" />
      <circle cx="42" cy="37.5" r="0.5" fill="#ffffff" />

      <ellipse cx="59" cy="38" rx="3.5" ry="2.2" fill="#ffffff" />
      <circle cx="58.5" cy="38" r="1.6" fill="#1e293b" />
      <circle cx="58" cy="37.5" r="0.5" fill="#ffffff" />

      {/* Nose */}
      <path
        d="M 50 38 L 48.5 46 L 52 46"
        stroke="#000000"
        strokeWidth="1.2"
        strokeOpacity="0.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mouth / Smile */}
      <path
        d="M 44 52 Q 50 56 56 52"
        stroke="#000000"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Facial Hair */}
      {facialHair === 'stubble' && (
        <path
          d="M 38 48 C 42 58, 58 58, 62 48"
          stroke={hairColor}
          strokeWidth="3"
          strokeDasharray="1 2"
          strokeOpacity="0.5"
          fill="none"
        />
      )}
      {facialHair === 'goatee' && (
        <path
          d="M 45 50 Q 50 51 55 50 Q 50 59 45 50 Z"
          fill={hairColor}
          fillOpacity="0.75"
        />
      )}
      {facialHair === 'beard' && (
        <path
          d="M 33 44 C 33 60, 42 63, 50 63 C 58 63, 67 60, 67 44 C 64 54, 58 56, 50 56 C 42 56, 36 54, 33 44 Z"
          fill={hairColor}
          fillOpacity="0.85"
        />
      )}

      {/* Hair Styles */}
      {hairStyle === 'buzz' && (
        <path
          d="M 29 33 C 29 18, 71 18, 71 33 C 71 28, 65 24, 50 24 C 35 24, 29 28, 29 33 Z"
          fill={hairColor}
          fillOpacity="0.7"
        />
      )}

      {hairStyle === 'short' && (
        <path
          d="M 28 32 C 28 15, 72 15, 72 32 C 68 26, 60 25, 50 26 C 40 25, 32 26, 28 32 Z"
          fill={hairColor}
        />
      )}

      {hairStyle === 'fade' && (
        <g>
          {/* Shaved sides */}
          <path d="M 28 36 C 28 26, 33 24, 35 24 L 32 36 Z" fill={hairColor} fillOpacity="0.4" />
          <path d="M 72 36 C 72 26, 67 24, 65 24 L 68 36 Z" fill={hairColor} fillOpacity="0.4" />
          {/* Voluminous top */}
          <path
            d="M 32 26 C 32 12, 68 12, 68 26 C 62 21, 56 20, 50 21 C 44 20, 38 21, 32 26 Z"
            fill={hairColor}
          />
        </g>
      )}

      {hairStyle === 'curly' && (
        <g fill={hairColor}>
          <circle cx="34" cy="22" r="5.5" />
          <circle cx="43" cy="18" r="6" />
          <circle cx="52" cy="17" r="6" />
          <circle cx="61" cy="18" r="6" />
          <circle cx="68" cy="23" r="5.5" />
          <circle cx="30" cy="28" r="4.5" />
          <circle cx="70" cy="28" r="4.5" />
        </g>
      )}

      {hairStyle === 'dreads' && (
        <g fill={hairColor} stroke="#111827" strokeWidth="0.5">
          <rect x="30" y="18" width="4.5" height="18" rx="2" transform="rotate(-15 30 18)" />
          <rect x="38" y="16" width="4.5" height="20" rx="2" transform="rotate(-6 38 16)" />
          <rect x="47" y="15" width="4.5" height="22" rx="2" />
          <rect x="56" y="16" width="4.5" height="20" rx="2" transform="rotate(6 56 16)" />
          <rect x="64" y="18" width="4.5" height="18" rx="2" transform="rotate(15 64 18)" />
        </g>
      )}

      {hairStyle === 'slick' && (
        <path
          d="M 28 32 C 28 14, 72 14, 72 32 C 70 20, 60 17, 50 18 C 40 17, 30 20, 28 32 Z"
          fill={hairColor}
        />
      )}

      {hairStyle === 'afro' && (
        <circle cx="50" cy="30" r="23" fill={hairColor} />
      )}

      {hairStyle === 'mohawk' && (
        <path
          d="M 44 26 C 44 8, 56 8, 56 26 Z"
          fill={hairColor}
        />
      )}
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
  // Determine card theme (fallback to gold)
  const themeKey = player.likeness?.faceCardTheme || 'gold';
  const theme = CARD_THEMES[themeKey] || CARD_THEMES.gold;

  // Size scaling configurations
  const sizeClasses = {
    xs: 'w-24 h-36 p-1.5 text-[9px] rounded-xl',
    sm: 'w-32 h-48 p-2 text-[10px] rounded-2xl',
    md: 'w-44 h-64 p-3 text-xs rounded-2xl',
    lg: 'w-56 h-80 p-4 text-sm rounded-3xl',
    xl: 'w-64 h-92 p-5 text-sm rounded-3xl',
  };

  const avatarSizes = {
    xs: 50,
    sm: 70,
    md: 96,
    lg: 125,
    xl: 145,
  };

  const jerseyColor = team?.kit?.primary || '#0284c7';

  return (
    <div
      onClick={onClick}
      className={`relative select-none border-2 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
        theme.bg
      } ${theme.border} ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : ''
      } ${className}`}
    >
      {/* Background Energy Glow & Radial Sheen */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr ${theme.accentGlow} pointer-events-none`}
      />
      {/* Textured Card Sheen Lines */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

      {/* TOP BAR: Rating, Position, Club Badge */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col leading-none">
          <span
            className={`font-['Chakra_Petch'] font-black tracking-tighter ${
              theme.ratingColor
            } ${
              size === 'xs'
                ? 'text-base'
                : size === 'sm'
                ? 'text-xl'
                : size === 'md'
                ? 'text-2xl'
                : 'text-3xl'
            }`}
          >
            {player.rating}
          </span>
          <span
            className={`font-mono font-bold uppercase tracking-wider ${
              theme.labelColor
            } ${size === 'xs' ? 'text-[8px]' : 'text-[10px]'}`}
          >
            {player.position}
          </span>
          {player.preferredFoot && size !== 'xs' && (
            <span className={`text-[8px] font-mono opacity-75 ${theme.labelColor}`}>
              {player.preferredFoot === 'Left' ? 'L-FT' : 'R-FT'}
            </span>
          )}
        </div>

        {/* Club Emblem / Badge */}
        {team ? (
          <ClubEmblem teamId={team.id} shortName={team.shortName} size={size === 'xs' ? 'xs' : 'sm'} />
        ) : (
          <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
            ⚽
          </div>
        )}
      </div>

      {/* CENTER: Player Face Avatar Portrait */}
      <div className="relative z-10 my-auto flex items-center justify-center">
        <PlayerFaceAvatar
          skinTone={player.likeness?.skinTone || '#d49b6a'}
          hairStyle={player.likeness?.hairStyle || 'short'}
          hairColor={player.likeness?.hairColor || '#1f2937'}
          facialHair={player.likeness?.facialHair || 'none'}
          jerseyColor={jerseyColor}
          size={avatarSizes[size]}
        />

        {/* Signature PlayStyle icon floating indicator */}
        {player.playStyles && player.playStyles.length > 0 && size !== 'xs' && (
          <div
            className="absolute bottom-0 right-1 p-1 rounded-full bg-black/60 border border-white/20 text-cyan-300 shadow"
            title={`PlayStyle: ${player.playStyles[0]}`}
          >
            <Sparkles className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* BOTTOM: Player Name Banner & Stats Grid */}
      <div className="relative z-10 w-full">
        {/* Name Banner */}
        <div
          className={`w-full py-0.5 px-1 rounded-lg border text-center font-['Chakra_Petch'] font-black uppercase tracking-wider truncate mb-1 shadow-sm backdrop-blur-sm ${theme.bannerBg}`}
        >
          {player.shortName || player.name.split(' ').pop()}
        </div>

        {/* Core Stats Hexagon / Grid */}
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

const StatPill: React.FC<{ label: string; value: number; colorClass: string }> = ({
  label,
  value,
  colorClass,
}) => (
  <div className="flex flex-col items-center leading-tight">
    <span className={`text-[10px] md:text-xs font-black font-['Chakra_Petch'] ${colorClass}`}>
      {value}
    </span>
    <span className="text-[7px] md:text-[8px] opacity-75 uppercase tracking-tighter">
      {label}
    </span>
  </div>
);
