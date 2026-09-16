/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LEAGUES, LeagueInfo } from '../data/emblems';

interface LeagueEmblemProps {
  leagueId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
};

export const LeagueEmblem: React.FC<LeagueEmblemProps> = ({
  leagueId = 'CL',
  size = 'md',
  showName = false,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const league: LeagueInfo = LEAGUES[leagueId] || LEAGUES.CL;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${SIZE_MAP[size]}`}>
        {!hasError ? (
          <img
            src={league.emblemUrl}
            alt={league.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-contain filter drop-shadow transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : null}

        {/* Fallback Vector Badge if offline */}
        {(!isLoaded || hasError) && (
          <div
            className={`absolute inset-0 rounded-lg bg-slate-900 border border-white/20 flex items-center justify-center text-[10px] font-black font-['Chakra_Petch'] text-cyan-400 ${
              isLoaded && !hasError ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {league.shortName}
          </div>
        )}
      </div>

      {showName && (
        <span className="font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider text-white/90">
          {league.name}
        </span>
      )}
    </div>
  );
};
