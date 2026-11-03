using System;

namespace FC2026.Core
{
    public static class CareerSchema
    {
        public const int Version = 4;
    }

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
    /// Data-only career snapshot. Keep this independent from Unity so the world
    /// and league rules can be compiled and tested outside the editor.
    /// </summary>
    [Serializable]
    public sealed class CareerSaveData
    {
        public int schemaVersion = CareerSchema.Version;
        public int worldSeed = FC2026.World.WorldDatabase.DefaultWorldSeed;
        public string leagueId = string.Empty;
        public string managedClubId = string.Empty;
        public CareerClubStanding[] standings = Array.Empty<CareerClubStanding>();
        public int season = 1;
        public int matchweek = 1;
        public string formationId = "4-3-3";
        public string tacticalStyle = "Balanced";
        public int transferBudget = 15000000;
        public int played;
        public int wins;
        public int draws;
        public int losses;
    }
}
