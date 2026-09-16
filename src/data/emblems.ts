/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LeagueInfo {
  id: string;
  name: string;
  shortName: string;
  country: string;
  emblemUrl: string;
  accentColor: string;
}

export const LEAGUES: Record<string, LeagueInfo> = {
  PL: {
    id: 'PL',
    name: 'Premier League',
    shortName: 'PL',
    country: 'England',
    emblemUrl: 'https://crests.football-data.org/PL.png',
    accentColor: '#38003c',
  },
  PD: {
    id: 'PD',
    name: 'La Liga EA SPORTS',
    shortName: 'LALIGA',
    country: 'Spain',
    emblemUrl: 'https://crests.football-data.org/PD.png',
    accentColor: '#ff4b44',
  },
  BL1: {
    id: 'BL1',
    name: 'Bundesliga',
    shortName: 'BL1',
    country: 'Germany',
    emblemUrl: 'https://crests.football-data.org/BL1.png',
    accentColor: '#d20515',
  },
  CL: {
    id: 'CL',
    name: 'UEFA Champions League',
    shortName: 'UCL',
    country: 'Europe',
    emblemUrl: 'https://crests.football-data.org/CL.png',
    accentColor: '#001489',
  },
  SA: {
    id: 'SA',
    name: 'Serie A',
    shortName: 'SERIE A',
    country: 'Italy',
    emblemUrl: 'https://crests.football-data.org/SA.png',
    accentColor: '#008fd7',
  },
  FL1: {
    id: 'FL1',
    name: 'Ligue 1 McDonald’s',
    shortName: 'L1',
    country: 'France',
    emblemUrl: 'https://crests.football-data.org/FL1.png',
    accentColor: '#dae025',
  },
  INT: {
    id: 'INT',
    name: 'International FIFA',
    shortName: 'FIFA',
    country: 'World',
    emblemUrl: 'https://crests.football-data.org/762.png',
    accentColor: '#0284c7',
  },
};

export const OFFICIAL_CLUB_EMBLEMS: Record<string, { emblemUrl: string; leagueId: string }> = {
  // Flagship Teams
  madrid: {
    emblemUrl: 'https://crests.football-data.org/86.png',
    leagueId: 'PD',
  },
  mancity: {
    emblemUrl: 'https://crests.football-data.org/65.png',
    leagueId: 'PL',
  },
  barca: {
    emblemUrl: 'https://crests.football-data.org/81.png',
    leagueId: 'PD',
  },
  barcelona: {
    emblemUrl: 'https://crests.football-data.org/81.png',
    leagueId: 'PD',
  },
  arsenal: {
    emblemUrl: 'https://crests.football-data.org/57.png',
    leagueId: 'PL',
  },
  bayern: {
    emblemUrl: 'https://crests.football-data.org/5.png',
    leagueId: 'BL1',
  },
  liverpool: {
    emblemUrl: 'https://crests.football-data.org/64.png',
    leagueId: 'PL',
  },
  argentina: {
    emblemUrl: 'https://crests.football-data.org/762.png',
    leagueId: 'INT',
  },
  france: {
    emblemUrl: 'https://crests.football-data.org/773.svg',
    leagueId: 'INT',
  },
  // Additional world elite clubs (transfer market, opponent scouting)
  psg: {
    emblemUrl: 'https://crests.football-data.org/524.png',
    leagueId: 'FL1',
  },
  chelsea: {
    emblemUrl: 'https://crests.football-data.org/61.png',
    leagueId: 'PL',
  },
  inter: {
    emblemUrl: 'https://crests.football-data.org/108.png',
    leagueId: 'SA',
  },
  dortmund: {
    emblemUrl: 'https://crests.football-data.org/4.png',
    leagueId: 'BL1',
  },
  atletico: {
    emblemUrl: 'https://crests.football-data.org/78.png',
    leagueId: 'PD',
  },
  juventus: {
    emblemUrl: 'https://crests.football-data.org/109.png',
    leagueId: 'SA',
  },
};

export function getClubEmblemUrl(teamId: string): string {
  const norm = teamId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (OFFICIAL_CLUB_EMBLEMS[norm]) {
    return OFFICIAL_CLUB_EMBLEMS[norm].emblemUrl;
  }
  for (const [k, v] of Object.entries(OFFICIAL_CLUB_EMBLEMS)) {
    if (norm.includes(k) || k.includes(norm)) {
      return v.emblemUrl;
    }
  }
  return 'https://crests.football-data.org/86.png'; // Fallback to classic crest
}

export function getClubLeague(teamId: string): LeagueInfo {
  const norm = teamId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const entry = OFFICIAL_CLUB_EMBLEMS[norm];
  if (entry && LEAGUES[entry.leagueId]) {
    return LEAGUES[entry.leagueId];
  }
  if (norm.includes('arg') || norm.includes('fra')) {
    return LEAGUES.INT;
  }
  if (norm.includes('man') || norm.includes('ars') || norm.includes('liv') || norm.includes('che')) {
    return LEAGUES.PL;
  }
  if (norm.includes('madrid') || norm.includes('bar') || norm.includes('atl')) {
    return LEAGUES.PD;
  }
  if (norm.includes('bay') || norm.includes('dort')) {
    return LEAGUES.BL1;
  }
  return LEAGUES.CL;
}
