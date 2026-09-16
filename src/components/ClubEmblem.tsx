/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getClubEmblemUrl } from '../data/emblems';

interface ClubEmblemProps {
  teamId?: string;
  teamName?: string;
  shortName?: string;
  customUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  fallbackIcon?: string;
  glow?: boolean;
}

const SIZE_MAP = {
  xs: 'w-4 h-4 text-[10px]',
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const IMG_SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
  '2xl': 'w-20 h-20',
};

export const ClubEmblem: React.FC<ClubEmblemProps> = ({
  teamId = '',
  teamName = '',
  shortName = '',
  customUrl,
  size = 'md',
  className = '',
  fallbackIcon,
  glow = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const emblemUrl = customUrl || (teamId ? getClubEmblemUrl(teamId) : '');
  const displayShort = shortName || teamName.slice(0, 3).toUpperCase() || 'FC';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${SIZE_MAP[size]} ${
        glow ? 'drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]' : ''
      } ${className}`}
    >
      {emblemUrl && !hasError ? (
        <img
          src={emblemUrl}
          alt={`${teamName || teamId} crest`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`object-contain ${IMG_SIZE_MAP[size]} transition-all duration-300 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
      ) : null}

      {/* Fallback Vector Shield if offline or image loading */}
      {(!emblemUrl || hasError || !isLoaded) && (
        <div
          className={`absolute inset-0 rounded-full flex items-center justify-center font-['Chakra_Petch'] font-black border border-white/20 bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-inner ${
            isLoaded && !hasError ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {fallbackIcon ? (
            <span className="leading-none">{fallbackIcon}</span>
          ) : (
            <span className="leading-none tracking-tighter scale-90">{displayShort}</span>
          )}
        </div>
      )}
    </div>
  );
};
