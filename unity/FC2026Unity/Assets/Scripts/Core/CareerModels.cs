using System;

namespace FC2026.Core
{
    public static class CareerSchema
    {
        public const int Version = 5;
    }

    public enum CareerFixtureKind
    {
        League,
        Cup
    }

    /// <summary>
    /// The single fixture shown on the hub dashboard. A cup tie follows the
    /// league fixture of the same week, so it is surfaced only once the league
    /// result has been applied.
    /// </summary>
    public sealed class CareerNextFixture
    {
        public CareerFixtureKind Kind;
        public string OpponentClubId = string.Empty;
        public bool UserIsHome;
        public int Round;

        public bool IsValid => !string.IsNullOrEmpty(OpponentClubId);
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

        // National cup. Round 1 is the round of 16; 0 means the user is out or
        // the run is finished. Opponent ids double as the "round played" marker.
        public int cupRound = 1;
        public bool cupPending;
        public string[] cupOpponentIds = new string[4];
        public int[] cupUserGoals = new int[4];
        public int[] cupOpponentGoals = new int[4];
        public int[] cupUserPenalties = new int[4];
        public int[] cupOpponentPenalties = new int[4];
        public string cupChampionId = string.Empty;

        public string[] honours = Array.Empty<string>();
        public string lastSeasonSummary = string.Empty;
    }
}
