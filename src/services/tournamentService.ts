import { Team, TournamentMatch } from '../types/soccer';
import { loadVersioned, removeSaved, saveVersioned } from './storageService';
import { resolveKnockoutFromScore, simulateKnockoutMatch } from './tournamentSimulation';

const TOURNAMENT_STORAGE_KEY = 'fc26_tournament';

export interface TournamentProgress {
  matches: TournamentMatch[];
  championTeam?: Team;
}

function completedCpuMatch(id: string, roundName: string, homeTeam: Team, awayTeam: Team, round: TournamentMatch['round']): TournamentMatch {
  const result = simulateKnockoutMatch(homeTeam, awayTeam);
  return {
    id,
    round,
    roundName,
    homeTeam,
    awayTeam,
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    isCompleted: true,
    isPlayerMatch: false,
    winner: result.winner,
  };
}

export function initializeTournament(playerTeam: Team, teams: Team[]): TournamentMatch[] {
  const otherTeams = teams.filter(team => team.id !== playerTeam.id);
  const shuffled = [...otherTeams].sort(() => 0.5 - Math.random());

  if (shuffled.length < 7) {
    throw new Error('Tournament requires at least eight teams.');
  }

  const q1: TournamentMatch = {
    id: 'q1',
    round: 'quarter',
    roundName: 'Quarter-Final 1',
    homeTeam: playerTeam,
    awayTeam: shuffled[0],
    homeScore: 0,
    awayScore: 0,
    isCompleted: false,
    isPlayerMatch: true,
  };

  return [
    q1,
    completedCpuMatch('q2', 'Quarter-Final 2', shuffled[1], shuffled[2], 'quarter'),
    completedCpuMatch('q3', 'Quarter-Final 3', shuffled[3], shuffled[4], 'quarter'),
    completedCpuMatch('q4', 'Quarter-Final 4', shuffled[5], shuffled[6], 'quarter'),
  ];
}

export function saveTournament(matches: TournamentMatch[]): void {
  saveVersioned(TOURNAMENT_STORAGE_KEY, matches);
}

export function loadTournament(): TournamentMatch[] | null {
  return loadVersioned<TournamentMatch[]>(TOURNAMENT_STORAGE_KEY);
}

export function clearTournament(): void {
  removeSaved(TOURNAMENT_STORAGE_KEY);
}

function buildSemiFinals(matches: TournamentMatch[], userTeamId: string): TournamentMatch[] {
  const q1Winner = matches.find(match => match.id === 'q1')?.winner;
  const q2Winner = matches.find(match => match.id === 'q2')?.winner;
  const q3Winner = matches.find(match => match.id === 'q3')?.winner;
  const q4Winner = matches.find(match => match.id === 'q4')?.winner;

  if (!q1Winner || !q2Winner || !q3Winner || !q4Winner) return [];

  const s1IsPlayer = q1Winner.id === userTeamId || q2Winner.id === userTeamId;
  const s2IsPlayer = q3Winner.id === userTeamId || q4Winner.id === userTeamId;

  const s1: TournamentMatch = s1IsPlayer
    ? {
        id: 's1',
        round: 'semi',
        roundName: 'Semi-Final 1',
        homeTeam: q1Winner,
        awayTeam: q2Winner,
        homeScore: 0,
        awayScore: 0,
        isCompleted: false,
        isPlayerMatch: true,
      }
    : completedCpuMatch('s1', 'Semi-Final 1', q1Winner, q2Winner, 'semi');

  const s2: TournamentMatch = s2IsPlayer
    ? {
        id: 's2',
        round: 'semi',
        roundName: 'Semi-Final 2',
        homeTeam: q3Winner,
        awayTeam: q4Winner,
        homeScore: 0,
        awayScore: 0,
        isCompleted: false,
        isPlayerMatch: true,
      }
    : completedCpuMatch('s2', 'Semi-Final 2', q3Winner, q4Winner, 'semi');

  return [s1, s2];
}

function buildFinal(matches: TournamentMatch[], userTeamId: string): TournamentProgress {
  const s1Winner = matches.find(match => match.id === 's1')?.winner;
  const s2Winner = matches.find(match => match.id === 's2')?.winner;

  if (!s1Winner || !s2Winner) return { matches };

  const isPlayerMatch = s1Winner.id === userTeamId || s2Winner.id === userTeamId;

  if (isPlayerMatch) {
    return {
      matches: [
        ...matches,
        {
          id: 'fin',
          round: 'final',
          roundName: 'Grand Final',
          homeTeam: s1Winner,
          awayTeam: s2Winner,
          homeScore: 0,
          awayScore: 0,
          isCompleted: false,
          isPlayerMatch: true,
        },
      ],
    };
  }

  const final = completedCpuMatch('fin', 'Grand Final', s1Winner, s2Winner, 'final');
  return { matches: [...matches, final], championTeam: final.winner };
}

export function completeTournamentMatch(
  matches: TournamentMatch[],
  activeMatch: TournamentMatch,
  homeScore: number,
  awayScore: number,
  userTeamId: string,
): TournamentProgress {
  const result = resolveKnockoutFromScore(
    activeMatch.homeTeam,
    activeMatch.awayTeam,
    homeScore,
    awayScore,
  );

  let updated = matches.map(match =>
    match.id === activeMatch.id
      ? {
          ...match,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          winner: result.winner,
          isCompleted: true,
        }
      : match,
  );

  if (activeMatch.round === 'quarter') {
    const semis = buildSemiFinals(updated, userTeamId);
    updated = [...updated, ...semis];

    const playerSemi = semis.find(match => match.isPlayerMatch && !match.isCompleted);
    if (!playerSemi) return buildFinal(updated, userTeamId);

    return { matches: updated };
  }

  if (activeMatch.round === 'semi') {
    const otherSemi = updated.find(match => match.round === 'semi' && !match.isCompleted && !match.isPlayerMatch);
    if (otherSemi) {
      const simulated = completedCpuMatch(
        otherSemi.id,
        otherSemi.roundName,
        otherSemi.homeTeam,
        otherSemi.awayTeam,
        'semi',
      );
      updated = updated.map(match => (match.id === otherSemi.id ? simulated : match));
    }

    return buildFinal(updated, userTeamId);
  }

  return { matches: updated, championTeam: result.winner };
}
