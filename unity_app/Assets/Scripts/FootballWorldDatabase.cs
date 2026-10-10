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

        public FootballWorldValidationReport Validate()
        {
            var report = new FootballWorldValidationReport();
            ValidateUniqueIds(players.ConvertAll(item => item.id), "player", report);
            ValidateUniqueIds(clubs.ConvertAll(item => item.id), "club", report);
            ValidateUniqueIds(leagues.ConvertAll(item => item.id), "league", report);
            ValidateUniqueIds(competitions.ConvertAll(item => item.id), "competition", report);
            var clubIds = new HashSet<string>(clubs.ConvertAll(item => item.id));
            var leagueIds = new HashSet<string>(leagues.ConvertAll(item => item.id));
            foreach (var player in players)
            {
                if (!clubIds.Contains(player.clubId)) report.Error($"Player '{player.id}' references missing club '{player.clubId}'.");
                if (player.overall < 1 || player.overall > 99) report.Error($"Player '{player.id}' has invalid overall '{player.overall}'.");
                if (player.age < 15 || player.age > 60) report.Warning($"Player '{player.id}' has unusual age '{player.age}'.");
                if (string.IsNullOrWhiteSpace(player.likenessProfileId)) report.Warning($"Player '{player.id}' has no likeness profile ID.");
            }
            foreach (var club in clubs)
            {
                if (!leagueIds.Contains(club.leagueId)) report.Error($"Club '{club.id}' references missing league '{club.leagueId}'.");
                if (club.startingBudget < 0) report.Error($"Club '{club.id}' has a negative starting budget.");
            }
            foreach (var competition in competitions)
                foreach (var leagueId in competition.eligibleLeagueIds ?? Array.Empty<string>())
                    if (!leagueIds.Contains(leagueId)) report.Error($"Competition '{competition.id}' references missing league '{leagueId}'.");
            foreach (var league in leagues)
            {
                var actualCount = clubs.Count(item => item.leagueId == league.id);
                if (actualCount != league.clubCount) report.Warning($"League '{league.id}' declares {league.clubCount} clubs but has {actualCount}.");
            }
            return report;
        }

        private static void ValidateUniqueIds(IEnumerable<string> ids, string type, FootballWorldValidationReport report)
        {
            var seen = new HashSet<string>();
            foreach (var id in ids)
            {
                if (string.IsNullOrWhiteSpace(id)) { report.Error($"A {type} has an empty ID."); continue; }
                if (!seen.Add(id)) report.Error($"Duplicate {type} ID: '{id}'.");
            }
        }
    }
}
