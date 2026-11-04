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

            // A cup tie follows the league fixture of the same week, so the
            // calendar only advances once the cup round has been played.
            var cupRound = CareerCupSystem.RoundForWeek(save.matchweek);
            if (cupRound > 0 && save.cupRound == cupRound && CareerCupSystem.GetUserTie(save) != null)
            {
                save.cupPending = true;
            }
            else
            {
                AdvanceCalendar(save);
            }

            return true;
        }

        /// <summary>
        /// The fixture the hub should offer: a pending cup tie first, otherwise
        /// the league fixture for the current matchweek.
        /// </summary>
        public static CareerNextFixture GetNextFixture(CareerSaveData save)
        {
            var next = new CareerNextFixture();
            if (save == null)
                return next;

            if (save.cupPending)
            {
                var tie = CareerCupSystem.GetUserTie(save);
                if (tie != null)
                {
                    next.Kind = CareerFixtureKind.Cup;
                    next.OpponentClubId = tie.OpponentFor(save.managedClubId);
                    next.UserIsHome = tie.HomeClubId == save.managedClubId;
                    next.Round = tie.Round;
                    return next;
                }
                save.cupPending = false;
            }

            var fixture = GetUserFixture(save);
            if (!fixture.IsValid)
                return next;

            next.Kind = CareerFixtureKind.League;
            next.UserIsHome = fixture.HomeClubId == save.managedClubId;
            next.OpponentClubId = next.UserIsHome ? fixture.AwayClubId : fixture.HomeClubId;
            next.Round = save.matchweek;
            return next;
        }

        /// <summary>
        /// Applies a played result. The user's club is always the left/home side
        /// of the match scene, so the goals are oriented to the real fixture venue.
        /// </summary>
        public static bool CompleteNextFixture(CareerSaveData save, int userGoals, int opponentGoals)
        {
            if (save == null || userGoals < 0 || opponentGoals < 0)
                return false;

            if (save.cupPending)
            {
                if (!CareerCupSystem.RecordUserResult(save, userGoals, opponentGoals))
                    return false;
                AdvanceCalendar(save);
                return true;
            }

            return CompleteMatchweek(save, userGoals, opponentGoals);
        }

        public static void AdvanceCalendar(CareerSaveData save)
        {
            if (save == null)
                return;

            save.cupPending = false;
            save.matchweek++;
            if (save.matchweek > WorldDatabase.MatchweeksPerSeason)
                StartNewSeason(save);
        }

        public static void AddHonour(CareerSaveData save, string honour)
        {
            if (save == null || string.IsNullOrEmpty(honour))
                return;

            var existing = save.honours ?? Array.Empty<string>();
            if (existing.Contains(honour))
                return;

            var honours = new string[Math.Min(existing.Length + 1, CareerCupSystem.MaxHonours)];
            honours[0] = honour;
            for (var i = 1; i < honours.Length; i++)
                honours[i] = existing[i - 1];
            save.honours = honours;
        }

        private static void StartNewSeason(CareerSaveData save)
        {
            var ranked = GetRankedStandings(save);
            var championId = ranked.Length > 0 ? ranked[0].clubId : string.Empty;
            var position = 0;
            for (var i = 0; i < ranked.Length; i++)
            {
                if (ranked[i].clubId == save.managedClubId)
                {
                    position = i + 1;
                    break;
                }
            }

            if (championId == save.managedClubId)
                AddHonour(save, $"{GetLeagueName(save)} {save.season}");

            var cupChampionId = CareerCupSystem.ResolveChampion(save);
            if (cupChampionId == save.managedClubId)
                AddHonour(save, $"{CareerCupSystem.CompetitionName(save)} {save.season}");

            var cupResult = string.IsNullOrEmpty(cupChampionId)
                ? "cup unfinished"
                : cupChampionId == save.managedClubId ? "cup winners" : "cup eliminated";
            save.lastSeasonSummary = $"Season {save.season}: league {PositionLabel(position, ranked.Length)}, {cupResult}.";

            CareerTransferSystem.ProcessSeasonChange(save);

            save.season++;
            save.matchweek = 1;
            save.transferBudget += SeasonBudgetReward;
            ResetStandings(save);
            CareerCupSystem.ResetForSeason(save);
        }

        private static string PositionLabel(int position, int total)
        {
            if (position <= 0 || total <= 0)
                return "unranked";

            var suffix = position % 100 is 11 or 12 or 13
                ? "th"
                : (position % 10) switch
                {
                    1 => "st",
                    2 => "nd",
                    3 => "rd",
                    _ => "th"
                };
            return position + suffix;
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
