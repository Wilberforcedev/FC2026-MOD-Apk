import { TEAMS } from '../data/teams';
import { createInitialTransferMarket } from '../data/transferMarket';
import { CareerState } from '../types/soccer';
import { createDoubleRoundRobinFixtures, createInitialLeagueTable } from './careerFixtures';
import { getInitialNewsFeed, generateMatchdayNews } from './careerNewsService';
import { initializeScoutingNetwork, advanceScoutingMatchday } from './scoutingService';
import { loadVersioned, removeSaved, saveVersioned } from './storageService';

const CAREER_STORAGE_KEY = 'fc26_career_save';

function looksLikeCareerState(value: CareerState | null): value is CareerState {
  return Boolean(
    value &&
      typeof value.userTeamId === 'string' &&
      Array.isArray(value.table) &&
      Array.isArray(value.fixtures) &&
      Array.isArray(value.transferMarket),
  );
}

export function initializeCareer(userTeamId: string): CareerState {
  const userTeam = TEAMS.find(team => team.id === userTeamId) || TEAMS[0];
  const allTeams = [...TEAMS];
  const fixtures = createDoubleRoundRobinFixtures(allTeams);
  const { news, injuries } = getInitialNewsFeed(userTeam.id);

  const careerState: CareerState = {
    userTeamId: userTeam.id,
    seasonYear: 2026,
    currentMatchday: 1,
    totalMatchdays: (allTeams.length - 1) * 2,
    budget: userTeam.budget || 85,
    table: createInitialLeagueTable(allTeams),
    fixtures,
    transferMarket: createInitialTransferMarket(),
    youthAcademy: [],
    newsFeed: news,
    activeInjuries: injuries,
    scoutingNetwork: initializeScoutingNetwork(),
  };

  saveCareer(careerState);
  return careerState;
}

export function saveCareer(state: CareerState): void {
  saveVersioned(CAREER_STORAGE_KEY, state);
}

export function loadCareer(): CareerState | null {
  const parsed = loadVersioned<CareerState>(CAREER_STORAGE_KEY);
  if (!looksLikeCareerState(parsed)) return null;

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

  if (!Array.isArray(parsed.transferMarket) || parsed.transferMarket.length === 0) {
    parsed.transferMarket = createInitialTransferMarket();
    updated = true;
  }

  // Re-save legacy raw saves into the versioned envelope after migration.
  if (updated) saveCareer(parsed);

  return parsed;
}

export function clearCareer(): void {
  removeSaved(CAREER_STORAGE_KEY);
}

export function processMatchdayResults(
  state: CareerState,
  userHomeScore: number,
  userAwayScore: number,
): CareerState {
  const currentFixtures = state.fixtures.filter(fixture => fixture.matchday === state.currentMatchday);
  const updatedFixtures = state.fixtures.map(fixture => ({ ...fixture }));
  const updatedTable = state.table.map(row => ({ ...row }));

  let prizeMoney = 0;

  for (const fixture of currentFixtures) {
    let homeScore = 0;
    let awayScore = 0;

    const isUserFixture =
      fixture.homeTeamId === state.userTeamId || fixture.awayTeamId === state.userTeamId;

    if (isUserFixture) {
      if (fixture.homeTeamId === state.userTeamId) {
        homeScore = userHomeScore;
        awayScore = userAwayScore;
        if (homeScore > awayScore) prizeMoney += 2.0;
        else if (homeScore === awayScore) prizeMoney += 0.8;
      } else {
        homeScore = userAwayScore;
        awayScore = userHomeScore;
        if (awayScore > homeScore) prizeMoney += 2.0;
        else if (awayScore === homeScore) prizeMoney += 0.8;
      }
    } else {
      const homeTeam = TEAMS.find(team => team.id === fixture.homeTeamId);
      const awayTeam = TEAMS.find(team => team.id === fixture.awayTeamId);
      const homeRating = homeTeam?.overallRating || homeTeam?.rating || 82;
      const awayRating = awayTeam?.overallRating || awayTeam?.rating || 82;
      const ratingDiff = (homeRating - awayRating) / 10;

      homeScore = Math.max(0, Math.floor(Math.random() * 3.5 + ratingDiff * 0.8));
      awayScore = Math.max(0, Math.floor(Math.random() * 2.8 - ratingDiff * 0.4));
    }

    const fixtureIndex = updatedFixtures.findIndex(item => item.id === fixture.id);
    if (fixtureIndex >= 0) {
      updatedFixtures[fixtureIndex] = {
        ...updatedFixtures[fixtureIndex],
        homeScore,
        awayScore,
        isPlayed: true,
      };
    }

    const homeRow = updatedTable.find(row => row.teamId === fixture.homeTeamId);
    if (homeRow) {
      homeRow.played += 1;
      homeRow.gf += homeScore;
      homeRow.ga += awayScore;
      homeRow.gd = homeRow.gf - homeRow.ga;

      if (homeScore > awayScore) {
        homeRow.won += 1;
        homeRow.points += 3;
      } else if (homeScore === awayScore) {
        homeRow.drawn += 1;
        homeRow.points += 1;
      } else {
        homeRow.lost += 1;
      }
    }

    const awayRow = updatedTable.find(row => row.teamId === fixture.awayTeamId);
    if (awayRow) {
      awayRow.played += 1;
      awayRow.gf += awayScore;
      awayRow.ga += homeScore;
      awayRow.gd = awayRow.gf - awayRow.ga;

      if (awayScore > homeScore) {
        awayRow.won += 1;
        awayRow.points += 3;
      } else if (awayScore === homeScore) {
        awayRow.drawn += 1;
        awayRow.points += 1;
      } else {
        awayRow.lost += 1;
      }
    }
  }

  updatedTable.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  const { newNews, updatedInjuries } = generateMatchdayNews(state, state.currentMatchday);
  const existingNews = state.newsFeed || [];
  const mergedNews = [...newNews, ...existingNews];
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
