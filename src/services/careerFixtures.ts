import { LeagueTableRow, SeasonFixture, Team } from '../types/soccer';

export function createInitialLeagueTable(teams: Team[]): LeagueTableRow[] {
  return teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    badgeBg: team.badgeBg,
    badgeBorder: team.badgeBorder,
    badgeTextColor: team.badgeTextColor,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  }));
}

export function createDoubleRoundRobinFixtures(teams: Team[]): SeasonFixture[] {
  const teamIds = teams.map(team => team.id);
  const n = teamIds.length;
  const fixtures: SeasonFixture[] = [];

  if (n < 2 || n % 2 !== 0) {
    throw new Error('Career fixture generator requires an even number of teams.');
  }

  let fixtureIdCounter = 1;

  for (let round = 0; round < (n - 1) * 2; round += 1) {
    const matchday = round + 1;

    for (let i = 0; i < n / 2; i += 1) {
      const homeIdx = (round + i) % (n - 1);
      let awayIdx = (n - 1 - i + round) % (n - 1);

      if (i === 0) awayIdx = n - 1;

      const homeTeamId = round % 2 === 0 ? teamIds[homeIdx] : teamIds[awayIdx];
      const awayTeamId = round % 2 === 0 ? teamIds[awayIdx] : teamIds[homeIdx];

      fixtures.push({
        id: `fix_${fixtureIdCounter++}`,
        matchday,
        homeTeamId,
        awayTeamId,
        isPlayed: false,
      });
    }
  }

  return fixtures;
}
