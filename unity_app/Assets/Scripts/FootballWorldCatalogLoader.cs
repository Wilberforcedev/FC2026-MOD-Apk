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
        [SerializeField] private bool logValidationWarnings = true;

        public FootballWorldDatabase Database => database;
        public FootballWorldValidationReport LastReport { get; private set; }
        public bool LastLoadSucceeded { get; private set; }

        private void Awake() => LoadIntoDatabase();

        public FootballWorldDatabase LoadIntoDatabase()
        {
            database ??= ScriptableObject.CreateInstance<FootballWorldDatabase>();
            var bundle = FootballWorldCatalogParser.Parse(playersJson, clubsJson, leaguesJson, competitionsJson);
            LastReport = bundle.Report;
            if (LastReport.IsValid)
            {
                database.ReplaceCatalogs(bundle.Players.players, bundle.Clubs.clubs, bundle.Leagues.leagues, bundle.Competitions.competitions);
                LastReport = database.Validate();
            }
            LastLoadSucceeded = LastReport.IsValid;
            LogReport(LastReport);
            return database;
        }

        private void LogReport(FootballWorldValidationReport report)
        {
            foreach (var error in report.Errors) Debug.LogError($"[Football World] {error}", this);
            if (!logValidationWarnings) return;
            foreach (var warning in report.Warnings) Debug.LogWarning($"[Football World] {warning}", this);
        }
    }
}
