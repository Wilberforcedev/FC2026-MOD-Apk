import { Team } from '../types/soccer';

export interface SimulatedKnockoutResult {
  homeScore: number;
  awayScore: number;
  winner: Team;
  decidedBy: 'normal-time' | 'extra-time' | 'penalties';
}

function expectedGoals(team: Team, opponent: Team, homeAdvantage: number): number {
  const ratingGap = team.overallRating - opponent.overallRating;
  const ratingEffect = ratingGap / 18;
  return Math.max(0.35, 1.25 + ratingEffect + homeAdvantage);
}

function poisson(lambda: number): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let product = 1;

  do {
    k += 1;
    product *= Math.random();
  } while (product > limit);

  return k - 1;
}

function penaltyWinner(homeTeam: Team, awayTeam: Team): Team {
  const homeWeight = Math.max(1, homeTeam.overallRating);
  const awayWeight = Math.max(1, awayTeam.overallRating);
  const homeChance = homeWeight / (homeWeight + awayWeight);
  return Math.random() < homeChance ? homeTeam : awayTeam;
}

export function simulateKnockoutMatch(homeTeam: Team, awayTeam: Team): SimulatedKnockoutResult {
  let homeScore = poisson(expectedGoals(homeTeam, awayTeam, 0.12));
  let awayScore = poisson(expectedGoals(awayTeam, homeTeam, 0));

  if (homeScore !== awayScore) {
    return {
      homeScore,
      awayScore,
      winner: homeScore > awayScore ? homeTeam : awayTeam,
      decidedBy: 'normal-time',
    };
  }

  // Extra time is lower scoring than a full match but still influenced by team strength.
  homeScore += poisson(expectedGoals(homeTeam, awayTeam, 0.05) * 0.33);
  awayScore += poisson(expectedGoals(awayTeam, homeTeam, 0) * 0.33);

  if (homeScore !== awayScore) {
    return {
      homeScore,
      awayScore,
      winner: homeScore > awayScore ? homeTeam : awayTeam,
      decidedBy: 'extra-time',
    };
  }

  return {
    homeScore,
    awayScore,
    winner: penaltyWinner(homeTeam, awayTeam),
    decidedBy: 'penalties',
  };
}
