using System;
using System.Linq;

namespace FC2026.Core
{
    [Serializable]
    public sealed class CareerClubStanding
    {
        public string clubId = string.Empty;
        public int played;
        public int wins;
        public int draws;
        public int losses;
        public int goalsFor;
        public int goalsAgainst;

        public int GoalDifference => goalsFor - goalsAgainst;
        public int Points => wins * 3 + draws;

        public void Reset()
        {
            played = wins = draws = losses = goalsFor = goalsAgainst = 0;
        }
    }

    public sealed class CareerFixture
    {
        public string HomeClubId { get; }
        public string AwayClubId { get; }

        public CareerFixture(string homeClubId, string awayClubId)
        {
            HomeClubId = homeClubId;
            AwayClubId = awayClubId;
        }
    }

    /// <summary>
    /// Deterministic league-table calculations for the offline career prototype.
    /// A win is worth three points, a draw one, and ranking breaks ties by goal
    /// difference then goals scored. This class has no Unity scene dependencies.
    /// </summary>
    public static class CareerLeagueSystem
    {
        public static readonly string[] ClubIds =
        {
            "kampala_city", "villa", "express", "bright_stars"
        };

        public static readonly string[] ClubNames =
        {
            "Kampala City", "Villa FC", "Express FC", "Bright Stars"
        };

        public static int MatchweeksPerSeason => (ClubIds.Length - 1) * 2;

        public static CareerFixture[] GetFixturesForMatchweek(int matchweek)
        {
            var roundsPerLeg = ClubIds.Length - 1;
            var wrappedWeek = (Math.Max(1, matchweek) - 1) % MatchweeksPerSeason;
            var roundIndex = wrappedWeek % roundsPerLeg;
            var isReturnLeg = wrappedWeek >= roundsPerLeg;
            var rotatingClubs = ClubIds.ToList();
            var firstLegRounds = new CareerFixture[roundsPerLeg][];

            for (var round = 0; round < roundsPerLeg; round++)
            {
                var fixtures = new CareerFixture[ClubIds.Length / 2];
                for (var pair = 0; pair < fixtures.Length; pair++)
                {
                    var home = rotatingClubs[pair];
                    var away = rotatingClubs[rotatingClubs.Count - 1 - pair];
                    if ((round + pair) % 2 == 1)
                        (home, away) = (away, home);
                    fixtures[pair] = new CareerFixture(home, away);
                }
                firstLegRounds[round] = fixtures;

                var lastClub = rotatingClubs[rotatingClubs.Count - 1];
                rotatingClubs.RemoveAt(rotatingClubs.Count - 1);
                rotatingClubs.Insert(1, lastClub);
            }

            var selectedRound = firstLegRounds[roundIndex];
            if (!isReturnLeg)
                return selectedRound;

            return selectedRound
                .Select(fixture => new CareerFixture(fixture.AwayClubId, fixture.HomeClubId))
                .ToArray();
        }

        public static CareerFixture GetFixtureForClub(string clubId, int matchweek)
        {
            return GetFixturesForMatchweek(matchweek)
                .FirstOrDefault(fixture =>
                    fixture.HomeClubId == clubId || fixture.AwayClubId == clubId);
        }

        public static string GetOpponentClubId(string managedClubId, int matchweek)
        {
            var fixture = GetFixtureForClub(managedClubId, matchweek);
            if (fixture == null)
                return string.Empty;

            return fixture.HomeClubId == managedClubId
                ? fixture.AwayClubId
                : fixture.HomeClubId;
        }

        public static bool ApplyMatchweekResults(CareerSaveData save, int matchweek,
            int actualHomeGoals, int actualAwayGoals)
        {
            if (save == null || actualHomeGoals < 0 || actualAwayGoals < 0)
                return false;

            var fixtures = GetFixturesForMatchweek(matchweek);
            var managedFixture = GetFixtureForClub(save.managedClubId, matchweek);
            if (managedFixture == null)
                return false;

            foreach (var fixture in fixtures)
            {
                int homeGoals;
                int awayGoals;
                if (fixture.HomeClubId == save.managedClubId ||
                    fixture.AwayClubId == save.managedClubId)
                {
                    homeGoals = actualHomeGoals;
                    awayGoals = actualAwayGoals;
                }
                else
                {
                    var homeIndex = Array.IndexOf(ClubIds, fixture.HomeClubId);
                    var awayIndex = Array.IndexOf(ClubIds, fixture.AwayClubId);
                    var seed = unchecked(save.season * 73856093
                        + matchweek * 19349663
                        + homeIndex * 83492791
                        + awayIndex * 297121507);
                    var random = new Random(seed);
                    homeGoals = random.Next(0, 4);
                    awayGoals = random.Next(0, 4);
                }

                if (!ApplyResult(save, fixture.HomeClubId, fixture.AwayClubId,
                    homeGoals, awayGoals))
                    return false;
            }

            return true;
        }

        public static CareerClubStanding[] CreateInitialStandings()
        {
            return ClubIds.Select(id => new CareerClubStanding { clubId = id }).ToArray();
        }

        public static void EnsureStandings(CareerSaveData save)
        {
            if (save == null)
                return;

            var existing = save.standings ?? Array.Empty<CareerClubStanding>();
            save.standings = ClubIds.Select(id =>
            {
                var standing = existing.FirstOrDefault(item => item != null && item.clubId == id);
                return standing ?? new CareerClubStanding { clubId = id };
            }).ToArray();
        }

        public static string GetOpponentClubId(string managedClubId, int matchweek)
        {
            var managedIndex = Array.IndexOf(ClubIds, managedClubId);
            if (managedIndex < 0)
                managedIndex = 0;

            var offset = (Math.Max(1, matchweek) - 1) % (ClubIds.Length - 1) + 1;
            return ClubIds[(managedIndex + offset) % ClubIds.Length];
        }

        public static bool ApplyResult(CareerSaveData save, string homeClubId, string awayClubId,
            int homeGoals, int awayGoals)
        {
            if (save == null || homeGoals < 0 || awayGoals < 0 ||
                homeClubId == awayClubId ||
                Array.IndexOf(ClubIds, homeClubId) < 0 ||
                Array.IndexOf(ClubIds, awayClubId) < 0)
                return false;

            EnsureStandings(save);
            var home = save.standings.First(item => item.clubId == homeClubId);
            var away = save.standings.First(item => item.clubId == awayClubId);

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

        public static CareerClubStanding[] GetRankedStandings(CareerSaveData save)
        {
            EnsureStandings(save);
            if (save == null)
                return Array.Empty<CareerClubStanding>();

            return save.standings
                .OrderByDescending(item => item.Points)
                .ThenByDescending(item => item.GoalDifference)
                .ThenByDescending(item => item.goalsFor)
                .ThenBy(item => Array.IndexOf(ClubIds, item.clubId))
                .ToArray();
        }

        public static void ResetStandings(CareerSaveData save)
        {
            if (save == null)
                return;

            EnsureStandings(save);
            foreach (var standing in save.standings)
                standing.Reset();
        }

        public static string GetClubName(string clubId)
        {
            var index = Array.IndexOf(ClubIds, clubId);
            return index >= 0 ? ClubNames[index] : "Unknown Club";
        }
    }
}
