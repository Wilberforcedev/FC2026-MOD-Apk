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

function svgDataUri(label: string, primary: string, secondary = '#ffffff'): string {
  const safeLabel = label.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase() || 'FC';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${primary}"/>
        <stop offset="1" stop-color="#111827"/>
      </linearGradient>
    </defs>
    <path d="M64 5 112 22v39c0 30-19 51-48 62C35 112 16 91 16 61V22L64 5Z" fill="url(#g)" stroke="${secondary}" stroke-width="6"/>
    <circle cx="64" cy="56" r="30" fill="none" stroke="${secondary}" stroke-width="4" opacity=".85"/>
    <text x="64" y="66" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="800" fill="${secondary}">${safeLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const LEAGUES: Record<string, LeagueInfo> = {
  PL: {
    id: 'PL', name: 'Premier League', shortName: 'PL', country: 'England',
    emblemUrl: svgDataUri('PL', '#38003c'), accentColor: '#38003c',
  },
  PD: {
    id: 'PD', name: 'La Liga EA SPORTS', shortName: 'LALIGA', country: 'Spain',
    emblemUrl: svgDataUri('LL', '#ff4b44'), accentColor: '#ff4b44',
  },
  BL1: {
    id: 'BL1', name: 'Bundesliga', shortName: 'BL1', country: 'Germany',
    emblemUrl: svgDataUri('BL', '#d20515'), accentColor: '#d20515',
  },
  CL: {
    id: 'CL', name: 'UEFA Champions League', shortName: 'UCL', country: 'Europe',
    emblemUrl: svgDataUri('UCL', '#001489'), accentColor: '#001489',
  },
  SA: {
    id: 'SA', name: 'Serie A', shortName: 'SERIE A', country: 'Italy',
    emblemUrl: svgDataUri('SA', '#008fd7'), accentColor: '#008fd7',
  },
  FL1: {
    id: 'FL1', name: 'Ligue 1 McDonald’s', shortName: 'L1', country: 'France',
    emblemUrl: svgDataUri('L1', '#768000'), accentColor: '#dae025',
  },
  INT: {
    id: 'INT', name: 'International FIFA', shortName: 'FIFA', country: 'World',
    emblemUrl: svgDataUri('INT', '#0284c7'), accentColor: '#0284c7',
  },
};

export const OFFICIAL_CLUB_EMBLEMS: Record<string, { emblemUrl: string; leagueId: string }> = {
  madrid: { emblemUrl: svgDataUri('RMA', '#f8fafc', '#1e3a8a'), leagueId: 'PD' },
  mancity: { emblemUrl: svgDataUri('MCI', '#6cabdd', '#ffffff'), leagueId: 'PL' },
  barca: { emblemUrl: svgDataUri('BAR', '#a50044', '#004d98'), leagueId: 'PD' },
  barcelona: { emblemUrl: svgDataUri('BAR', '#a50044', '#004d98'), leagueId: 'PD' },
  arsenal: { emblemUrl: svgDataUri('ARS', '#ef0107'), leagueId: 'PL' },
  bayern: { emblemUrl: svgDataUri('FCB', '#dc052d'), leagueId: 'BL1' },
  liverpool: { emblemUrl: svgDataUri('LIV', '#c8102e'), leagueId: 'PL' },
  argentina: { emblemUrl: svgDataUri('ARG', '#75aadb'), leagueId: 'INT' },
  france: { emblemUrl: svgDataUri('FRA', '#002654'), leagueId: 'INT' },
  psg: { emblemUrl: svgDataUri('PSG', '#004170'), leagueId: 'FL1' },
  chelsea: { emblemUrl: svgDataUri('CHE', '#034694'), leagueId: 'PL' },
  inter: { emblemUrl: svgDataUri('INT', '#0068a8'), leagueId: 'SA' },
  dortmund: { emblemUrl: svgDataUri('BVB', '#fdeb00', '#111111'), leagueId: 'BL1' },
  atletico: { emblemUrl: svgDataUri('ATM', '#cb3524'), leagueId: 'PD' },
  juventus: { emblemUrl: svgDataUri('JUV', '#111111'), leagueId: 'SA' },
};

const DEFAULT_CLUB_EMBLEM = svgDataUri('FC', '#334155');

export function getClubEmblemUrl(teamId: string): string {
  const norm = teamId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (OFFICIAL_CLUB_EMBLEMS[norm]) return OFFICIAL_CLUB_EMBLEMS[norm].emblemUrl;

  for (const [key, value] of Object.entries(OFFICIAL_CLUB_EMBLEMS)) {
    if (norm.includes(key) || key.includes(norm)) return value.emblemUrl;
  }

  return DEFAULT_CLUB_EMBLEM;
}

export function getClubLeague(teamId: string): LeagueInfo {
  const norm = teamId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const entry = OFFICIAL_CLUB_EMBLEMS[norm];
  if (entry && LEAGUES[entry.leagueId]) return LEAGUES[entry.leagueId];
  if (norm.includes('arg') || norm.includes('fra')) return LEAGUES.INT;
  if (norm.includes('man') || norm.includes('ars') || norm.includes('liv') || norm.includes('che')) return LEAGUES.PL;
  if (norm.includes('madrid') || norm.includes('bar') || norm.includes('atl')) return LEAGUES.PD;
  if (norm.includes('bay') || norm.includes('dort')) return LEAGUES.BL1;
  return LEAGUES.CL;
}
