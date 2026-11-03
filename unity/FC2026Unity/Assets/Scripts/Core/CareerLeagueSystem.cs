using System;
using System.Linq;
using FC2026.World;

namespace FC2026.Core
{
    /// <summary>
    /// League rules for the worldwide career. Standings only cover the managed
    /// league; other fixtures in that league are simulated deterministically so
    /// every club plays once per matchweek.
    /// </summary>
    public static class CareerLeagueSystem
    {
        private const int SeasonBudgetReward = 2500000;

        public static WorldLeague GetManagedLeague(CareerSaveData save)
        {
            return save == null ? null : WorldDatabase.GetLeague(save.leagueId);
        }

        public static WorldClub GetManagedClub(CareerSaveData save)
        {
            return save == null ? null : WorldDatabase.GetClub(save.managedClubId);
        }

        public static int MatchweekCount(CareerSaveData save)
        {
            return save == null ? 0 : WorldDatabase.MatchweekCount(save.leagueId);
        }

        public static string GetLeagueName(CareerSaveData save)
        {
            var league = GetManagedLeague(save);
            return league != null ? league.Name : "League";
        }

        public static string GetCountryName(CareerSaveData save)
        {
            var league = GetManagedLeague(save);
            if (league == null)
                return string.Empty;
            var country = WorldDatabase.GetCountry(league.CountryId);
            return country != null ? country.Name : string.Empty;
        }

        public static string GetClubName(string clubId)
        {
            var club = WorldDatabase.GetClub(clubId);
            return club != null ? club.Name : "Unknown Club";
        }

        public static WorldFixture GetUserFixture(CareerSaveData save)
        {
            if (save == null)
                return default;
            return WorldDatabase.GetFixtureForClub(save.leagueId, save.managedClubId, save.matchweek);
        }

        public static string GetOpponentClubId(CareerSaveData save)
        {
            var fixture = GetUserFixture(save);
            if (!fixture.IsValid)
                return string.Empty;
            return fixture.HomeClubId == save.managedClubId ? fixture.AwayClubId : fixture.HomeClubId;
        }

        public static bool IsClubInLeague(string leagueId, string clubId)
        {
            var club = WorldDatabase.GetClub(clubId);
            return club != null && club.LeagueId == leagueId;
        }

        public static void EnsureStandings(CareerSaveData save)
        {
            if (save == null)
                return;

            var league = WorldDatabase.GetLeague(save.leagueId);
            if (league == null)
            {
                save.leagueId = WorldDatabase.DefaultLeagueId;
                league = WorldDatabase.GetLeague(save.leagueId);
            }
            if (league == null)
            {
                save.standings = Array.Empty<CareerClubStanding>();
                return;
            }

            var clubs = WorldDatabase.GetLeagueClubs(league.Id);
            if (clubs.Length == 0)
            {
                save.standings = Array.Empty<CareerClubStanding>();
                return;
            }

            save.matchweek = Clamp(save.matchweek, 1, WorldDatabase.MatchweeksPerSeason);
            var existing = save.standings ?? Array.Empty<CareerClubStanding>();
            var standings = new CareerClubStanding[clubs.Length];
            for (var i = 0; i < clubs.Length; i++)
            {
                var clubId = clubs[i].Id;
                CareerClubStanding row = null;
                for (var j = 0; j < existing.Length; j++)
                {
                    if (existing[j] != null && existing[j].clubId == clubId)
                    {
                        row = existing[j];
                        break;
                    }
                }
                standings[i] = row ?? new CareerClubStanding { clubId = clubId };
            }

            save.standings = standings;
            if (!IsClubInLeague(league.Id, save.managedClubId))
                save.managedClubId = clubs[0].Id;
        }

        public static bool ApplyResult(CareerSaveData save, string homeClubId, string awayClubId,
            int homeGoals, int awayGoals)
        {
            if (save == null || homeGoals < 0 || awayGoals < 0 || homeClubId == awayClubId)
                return false;

            var homeClub = WorldDatabase.GetClub(homeClubId);
            var awayClub = WorldDatabase.GetClub(awayClubId);
            if (homeClub == null || awayClub == null ||
                homeClub.LeagueId != save.leagueId || awayClub.LeagueId != save.leagueId)
                return false;

            EnsureStandings(save);
            return TryApplyResult(save, homeClubId, awayClubId, homeGoals, awayGoals);
        }

        /// <summary>
        /// Applies the user's result, simulates the rest of the matchweek,
        /// advances the calendar and rolls the season over when needed.
        /// The user's club is always the left/home side of the match scene.
        /// </summary>
        public static bool CompleteMatchweek(CareerSaveData save, int userGoals, int opponentGoals)
        {
            if (save == null || userGoals < 0 || opponentGoals < 0)
                return false;

            var league = WorldDatabase.GetLeague(save.leagueId);
            if (league == null)
                return false;

            EnsureStandings(save);
            var userFixture = GetUserFixture(save);
            if (!userFixture.IsValid)
                return false;

            var userIsHome = userFixture.HomeClubId == save.managedClubId;
            var fixtureHomeGoals = userIsHome ? userGoals : opponentGoals;
            var fixtureAwayGoals = userIsHome ? opponentGoals : userGoals;

            var fixtures = WorldDatabase.GetFixtures(league.Id);
            var perWeek = WorldDatabase.ClubsPerLeague / 2;
            var start = (save.matchweek - 1) * perWeek;
            var seed = unchecked(save.worldSeed * 397 ^ save.season * 7919 ^ save.matchweek * 104729);

            for (var i = start; i < start + perWeek && i < fixtures.Length; i++)
            {
                var fixture = fixtures[i];
                var isUserFixture = fixture.HomeClubId == userFixture.HomeClubId &&
                                    fixture.AwayClubId == userFixture.AwayClubId;
                int homeGoals;
                int awayGoals;
                if (isUserFixture)
                {
                    homeGoals = fixtureHomeGoals;
                    awayGoals = fixtureAwayGoals;
                }
                else
                {
                    var simulated = WorldSimulation.Simulate(
                        WorldDatabase.GetClub(fixture.HomeClubId),
                        WorldDatabase.GetClub(fixture.AwayClubId),
                        seed);
                    homeGoals = simulated.HomeGoals;
                    awayGoals = simulated.AwayGoals;
                }

                if (!TryApplyResult(save, fixture.HomeClubId, fixture.AwayClubId, homeGoals, awayGoals))
                    return false;
            }

            save.played++;
            if (userGoals > opponentGoals)
                save.wins++;
            else if (userGoals < opponentGoals)
                save.losses++;
            else
                save.draws++;

            save.matchweek++;
            if (save.matchweek > WorldDatabase.MatchweeksPerSeason)
            {
                save.matchweek = 1;
                save.season++;
                save.transferBudget += SeasonBudgetReward;
                ResetStandings(save);
            }

            return true;
        }

        public static CareerClubStanding[] GetRankedStandings(CareerSaveData save)
        {
            EnsureStandings(save);
            if (save == null || save.standings == null)
                return Array.Empty<CareerClubStanding>();

            return save.standings
                .Where(item => item != null)
                .OrderByDescending(item => item.Points)
                .ThenByDescending(item => item.GoalDifference)
                .ThenByDescending(item => item.goalsFor)
                .ThenBy(item => GetClubName(item.clubId), StringComparer.Ordinal)
                .ToArray();
        }

        public static void ResetStandings(CareerSaveData save)
        {
            EnsureStandings(save);
            if (save == null || save.standings == null)
                return;

            foreach (var standing in save.standings)
                standing?.Reset();
        }

        private static bool TryApplyResult(CareerSaveData save, string homeClubId, string awayClubId,
            int homeGoals, int awayGoals)
        {
            var home = FindStanding(save, homeClubId);
            var away = FindStanding(save, awayClubId);
            if (home == null || away == null)
                return false;

            home.played++;
            away.played++;
            home.goalsFor += homeGoals;
            home.goalsAgainst += awayGoals;
            away.goalsFor += awayGoals;
            away.goalsAgainst += homeGoals;

            if (homeGoals > awayGoals)
            {
                home.wins++;
                away.losses++;
            }
            else if (homeGoals < awayGoals)
            {
                away.wins++;
                home.losses++;
            }
            else
            {
                home.draws++;
                away.draws++;
            }

            return true;
        }

        private static CareerClubStanding FindStanding(CareerSaveData save, string clubId)
        {
            if (save.standings == null)
                return null;
            for (var i = 0; i < save.standings.Length; i++)
            {
                var standing = save.standings[i];
                if (standing != null && standing.clubId == clubId)
                    return standing;
            }
            return null;
        }

        private static int Clamp(int value, int minimum, int maximum)
        {
            return value < minimum ? minimum : value > maximum ? maximum : value;
        }
    }
}
