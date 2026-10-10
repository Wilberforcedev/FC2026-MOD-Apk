using System;
using System.Collections.Generic;
using UnityEngine;

namespace FC2026
{
    [Serializable] public sealed class PlayerCatalogJson { public List<WorldPlayerDefinition> players = new(); }
    [Serializable] public sealed class ClubCatalogJson { public List<WorldClubDefinition> clubs = new(); }
    [Serializable] public sealed class LeagueCatalogJson { public List<WorldLeagueDefinition> leagues = new(); }
    [Serializable] public sealed class CompetitionCatalogJson { public List<WorldCompetitionDefinition> competitions = new(); }

    public sealed class FootballWorldCatalogLoader : MonoBehaviour
    {
        [Header("Assign JSON files from Assets/Data/FootballWorld")]
        [SerializeField] private TextAsset playersJson;
        [SerializeField] private TextAsset clubsJson;
        [SerializeField] private TextAsset leaguesJson;
        [SerializeField] private TextAsset competitionsJson;
        [SerializeField] private FootballWorldDatabase database;

        public FootballWorldDatabase Database => database;

        private void Awake() => LoadIntoDatabase();

        public FootballWorldDatabase LoadIntoDatabase()
        {
            database ??= ScriptableObject.CreateInstance<FootballWorldDatabase>();
            var players = playersJson == null ? new PlayerCatalogJson() : JsonUtility.FromJson<PlayerCatalogJson>(playersJson.text);
            var clubs = clubsJson == null ? new ClubCatalogJson() : JsonUtility.FromJson<ClubCatalogJson>(clubsJson.text);
            var leagues = leaguesJson == null ? new LeagueCatalogJson() : JsonUtility.FromJson<LeagueCatalogJson>(leaguesJson.text);
            var competitions = competitionsJson == null ? new CompetitionCatalogJson() : JsonUtility.FromJson<CompetitionCatalogJson>(competitionsJson.text);
            database.ReplaceCatalogs(players.players, clubs.clubs, leagues.leagues, competitions.competitions);
            return database;
        }
    }
}
