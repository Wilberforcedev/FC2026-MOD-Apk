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
                home.wins = Math.Max(0, home.wins);
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
