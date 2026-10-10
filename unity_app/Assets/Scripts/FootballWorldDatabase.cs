using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    [Serializable]
    public sealed class WorldPlayerDefinition
    {
        public string id;
        public string displayName;
        public string clubId;
        public string position;
        public int overall;
        public int pace;
        public int shooting;
        public int passing;
        public int dribbling;
        public int defending;
        public int physicality;
        public int age;
        public int marketValue;
        public string likenessProfileId;
        public bool isFictional = true;
    }

    [Serializable]
    public sealed class WorldClubDefinition
    {
        public string id;
        public string displayName;
        public string shortName;
        public string leagueId;
        public string country;
        public string stadiumName;
        public string primaryColorHex;
        public string secondaryColorHex;
        public int startingBudget;
        public bool isFictional = true;
    }

    [Serializable]
    public sealed class WorldLeagueDefinition
    {
        public string id;
        public string displayName;
        public string country;
        public int tier;
        public int clubCount;
        public bool promotionEnabled = true;
        public bool isFictional = true;
    }

    [Serializable]
    public sealed class WorldCompetitionDefinition
    {
        public string id;
        public string displayName;
        public string competitionType;
        public string[] eligibleLeagueIds;
        public bool isFictional = true;
    }

    [CreateAssetMenu(fileName = "FootballWorldDatabase", menuName = "FC 2026/Football World Database")]
    public sealed class FootballWorldDatabase : ScriptableObject
    {
        public string databaseVersion = "world-v1";
        public string contentStatus = "Original fictional V1 content";
        public List<WorldPlayerDefinition> players = new();
        public List<WorldClubDefinition> clubs = new();
        public List<WorldLeagueDefinition> leagues = new();
        public List<WorldCompetitionDefinition> competitions = new();

        public WorldPlayerDefinition FindPlayer(string id) => players.FirstOrDefault(item => item.id == id);
        public WorldClubDefinition FindClub(string id) => clubs.FirstOrDefault(item => item.id == id);
        public WorldLeagueDefinition FindLeague(string id) => leagues.FirstOrDefault(item => item.id == id);
        public IReadOnlyList<WorldPlayerDefinition> PlayersForClub(string clubId) => players.Where(item => item.clubId == clubId).ToList();
        public IReadOnlyList<WorldClubDefinition> ClubsForLeague(string leagueId) => clubs.Where(item => item.leagueId == leagueId).ToList();

        public void ReplaceCatalogs(IEnumerable<WorldPlayerDefinition> playerCatalog, IEnumerable<WorldClubDefinition> clubCatalog, IEnumerable<WorldLeagueDefinition> leagueCatalog, IEnumerable<WorldCompetitionDefinition> competitionCatalog)
        {
            players = playerCatalog?.ToList() ?? new List<WorldPlayerDefinition>();
            clubs = clubCatalog?.ToList() ?? new List<WorldClubDefinition>();
            leagues = leagueCatalog?.ToList() ?? new List<WorldLeagueDefinition>();
            competitions = competitionCatalog?.ToList() ?? new List<WorldCompetitionDefinition>();
        }
    }
}
