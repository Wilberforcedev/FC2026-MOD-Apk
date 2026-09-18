import { TEAMS } from '../data/teams';
import { CareerState, LeagueTableRow, SeasonFixture, Team, Player, CareerNewsItem, PlayerInjury } from '../types/soccer';
import { getInitialNewsFeed, generateMatchdayNews } from './careerNewsService';
import { initializeScoutingNetwork, advanceScoutingMatchday } from './scoutingService';

const CAREER_STORAGE_KEY = 'fc26_career_save';

export function initializeCareer(userTeamId: string): CareerState {
  const userTeam = TEAMS.find(t => t.id === userTeamId) || TEAMS[0];
  const allTeams = [...TEAMS];

  // 1. Initial League Table
  const table: LeagueTableRow[] = allTeams.map(t => ({
    teamId: t.id,
    teamName: t.name,
    badgeBg: t.badgeBg,
    badgeBorder: t.badgeBorder,
    badgeTextColor: t.badgeTextColor,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  }));

  // 2. Generate double round-robin fixtures
  const fixtures: SeasonFixture[] = [];
  const teamIds = allTeams.map(t => t.id);
  const n = teamIds.length;
  let fixtureIdCounter = 1;

  // Round 1 to n-1
  for (let round = 0; round < (n - 1) * 2; round++) {
    const matchday = round + 1;
    for (let i = 0; i < n / 2; i++) {
      const homeIdx = (round + i) % (n - 1);
      let awayIdx = (n - 1 - i + round) % (n - 1);
      if (i === 0) {
        awayIdx = n - 1;
      }
      
      const homeTeam = round % 2 === 0 ? teamIds[homeIdx] : teamIds[awayIdx];
      const awayTeam = round % 2 === 0 ? teamIds[awayIdx] : teamIds[homeIdx];

      fixtures.push({
        id: `fix_${fixtureIdCounter++}`,
        matchday,
        homeTeamId: homeTeam,
        awayTeamId: awayTeam,
        isPlayed: false,
      });
    }
  }

  // 3. Scouting & Transfer Market list (High-profile players across world football)
  const transferMarket: Player[] = [
    {
      id: 'tm_1',
      name: 'Kylian Mbappé',
      shortName: 'Mbappé',
      number: 9,
      position: 'ST',
      rating: 91,
      stats: { pace: 97, shooting: 90, passing: 80, dribbling: 92, defending: 36, physicality: 78, physical: 78 },
      playStyles: ['Speed Dribbler', 'Power Header'],
      marketValue: 120,
      likeness: { skinTone: '#b57b54', hairStyle: 'buzz', hairColor: '#1a110b', bootColor: '#facc15' },
    },
    {
      id: 'tm_2',
      name: 'Vinícius Júnior',
      shortName: 'Vinícius',
      number: 7,
      position: 'LW',
      rating: 90,
      stats: { pace: 95, shooting: 84, passing: 81, dribbling: 91, defending: 32, physicality: 69, physical: 69 },
      playStyles: ['Speed Dribbler', 'Trickster'],
      marketValue: 105,
      likeness: { skinTone: '#66432b', hairStyle: 'fade', hairColor: '#1a110b', bootColor: '#22c55e' },
    },
    {
      id: 'tm_3',
      name: 'Jude Bellingham',
      shortName: 'Bellingham',
      number: 5,
      position: 'CAM',
      rating: 90,
      stats: { pace: 80, shooting: 87, passing: 84, dribbling: 88, defending: 78, physicality: 83, physical: 83 },
      playStyles: ['Relentless', 'Finesse Shot'],
      marketValue: 98,
      likeness: { skinTone: '#a26f49', hairStyle: 'fade', hairColor: '#1c130c', bootColor: '#ffffff' },
    },
    {
      id: 'tm_4',
      name: 'Florian Wirtz',
      shortName: 'Wirtz',
      number: 10,
      position: 'CAM',
      rating: 88,
      stats: { pace: 82, shooting: 81, passing: 87, dribbling: 89, defending: 54, physicality: 70, physical: 70 },
      playStyles: ['Tiki Taka', 'Finesse Shot'],
      marketValue: 80,
      likeness: { skinTone: '#f3cbb4', hairStyle: 'short', hairColor: '#53341b', bootColor: '#ef4444' },
    },
    {
      id: 'tm_5',
      name: 'William Saliba',
      shortName: 'Saliba',
      number: 2,
      position: 'CB',
      rating: 87,
      stats: { pace: 82, shooting: 40, passing: 72, dribbling: 74, defending: 88, physicality: 84, physical: 84 },
      playStyles: ['Anchor', 'Block'],
      marketValue: 72,
      likeness: { skinTone: '#6e472a', hairStyle: 'buzz', hairColor: '#140c06', bootColor: '#06b6d4' },
    },
  ];

  const { news, injuries } = getInitialNewsFeed(userTeam.id);

  const careerState: CareerState = {
    userTeamId: userTeam.id,
    seasonYear: 2026,
    currentMatchday: 1,
    totalMatchdays: (n - 1) * 2,
    budget: userTeam.budget || 85,
    table,
    fixtures,
    transferMarket,
    youthAcademy: [],
    newsFeed: news,
    activeInjuries: injuries,
    scoutingNetwork: initializeScoutingNetwork(),
  };

  saveCareer(careerState);
  return careerState;
}

export function saveCareer(state: CareerState) {
  try {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save career', err);
  }
}

export function loadCareer(): CareerState | null {
  try {
    const raw = localStorage.getItem(CAREER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CareerState;
    // Backwards-compatibility check for existing saves
    let updated = false;
    if (!parsed.newsFeed || parsed.newsFeed.length === 0) {
      const { news, injuries } = getInitialNewsFeed(parsed.userTeamId);
      parsed.newsFeed = news;
      if (!parsed.activeInjuries) parsed.activeInjuries = injuries;
      updated = true;
    }
    if (!parsed.scoutingNetwork) {
      parsed.scoutingNetwork = initializeScoutingNetwork();
      updated = true;
    }
    if (updated) {
      saveCareer(parsed);
    }
    return parsed;
  } catch (err) {
    return null;
  }
}

export function clearCareer() {
  localStorage.removeItem(CAREER_STORAGE_KEY);
}

export function processMatchdayResults(
  state: CareerState,
  userHomeScore: number,
  userAwayScore: number
): CareerState {
  const currentFixtures = state.fixtures.filter(f => f.matchday === state.currentMatchday);
  const updatedFixtures = [...state.fixtures];
  const updatedTable = [...state.table];

  let prizeMoney = 0;

  for (const fix of currentFixtures) {
    let hScore = 0;
    let aScore = 0;

    const isUserFixture = fix.homeTeamId === state.userTeamId || fix.awayTeamId === state.userTeamId;

    if (isUserFixture) {
      if (fix.homeTeamId === state.userTeamId) {
        hScore = userHomeScore;
        aScore = userAwayScore;
        if (hScore > aScore) prizeMoney += 2.0; // €2.0M win bonus
        else if (hScore === aScore) prizeMoney += 0.8;
      } else {
        hScore = userAwayScore;
        aScore = userHomeScore;
        if (aScore > hScore) prizeMoney += 2.0;
        else if (aScore === hScore) prizeMoney += 0.8;
      }
    } else {
      // Simulate realistic AI match between other league teams
      const homeTeam = TEAMS.find(t => t.id === fix.homeTeamId);
      const awayTeam = TEAMS.find(t => t.id === fix.awayTeamId);

      const hRating = homeTeam?.overallRating || homeTeam?.rating || 82;
      const aRating = awayTeam?.overallRating || awayTeam?.rating || 82;
      const ratingDiff = (hRating - aRating) / 10;

      // Realistic goal distribution (Poisson-like)
      hScore = Math.max(0, Math.floor(Math.random() * 3.5 + ratingDiff * 0.8));
      aScore = Math.max(0, Math.floor(Math.random() * 2.8 - ratingDiff * 0.4));
    }

    // Update fixture state
    const fixIndex = updatedFixtures.findIndex(f => f.id === fix.id);
    if (fixIndex >= 0) {
      updatedFixtures[fixIndex] = {
        ...updatedFixtures[fixIndex],
        homeScore: hScore,
        awayScore: aScore,
        isPlayed: true,
      };
    }

    // Update League Table Row for Home Team
    const homeRow = updatedTable.find(r => r.teamId === fix.homeTeamId);
    if (homeRow) {
      homeRow.played++;
      homeRow.gf += hScore;
      homeRow.ga += aScore;
      homeRow.gd = homeRow.gf - homeRow.ga;
      if (hScore > aScore) {
        homeRow.won++;
        homeRow.points += 3;
      } else if (hScore === aScore) {
        homeRow.drawn++;
        homeRow.points += 1;
      } else {
        homeRow.lost++;
      }
    }

    // Update League Table Row for Away Team
    const awayRow = updatedTable.find(r => r.teamId === fix.awayTeamId);
    if (awayRow) {
      awayRow.played++;
      awayRow.gf += aScore;
      awayRow.ga += hScore;
      awayRow.gd = awayRow.gf - awayRow.ga;
      if (aScore > hScore) {
        awayRow.won++;
        awayRow.points += 3;
      } else if (aScore === hScore) {
        awayRow.drawn++;
        awayRow.points += 1;
      } else {
        awayRow.lost++;
      }
    }
  }

  // Sort League Table: Points DESC -> Goal Difference DESC -> Goals For DESC
  updatedTable.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  // Generate dynamic news (transfers & injuries) for the completed matchday
  const { newNews, updatedInjuries } = generateMatchdayNews(state, state.currentMatchday);
  const existingNews = state.newsFeed || [];
  const mergedNews = [...newNews, ...existingNews];

  // Advance any active scouting missions across global regions
  const { updatedCareer: stateWithAdvancedScouts } = advanceScoutingMatchday(state);

  const nextState: CareerState = {
    ...stateWithAdvancedScouts,
    currentMatchday: Math.min(state.totalMatchdays, state.currentMatchday + 1),
    budget: Math.round((state.budget + prizeMoney) * 10) / 10,
    table: updatedTable,
    fixtures: updatedFixtures,
    newsFeed: mergedNews,
    activeInjuries: updatedInjuries,
  };

  saveCareer(nextState);
  return nextState;
}
