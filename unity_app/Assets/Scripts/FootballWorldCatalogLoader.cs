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
        [Header("Optional explicit overrides; otherwise Resources/FootballWorld is used")]
        [SerializeField] private TextAsset playersJson;
        [SerializeField] private TextAsset clubsJson;
        [SerializeField] private TextAsset leaguesJson;
        [SerializeField] private TextAsset competitionsJson;
        [SerializeField] private FootballWorldDatabase database;
        [SerializeField] private bool logValidationWarnings = true;

        public FootballWorldDatabase Database => database;
        public FootballWorldValidationReport LastReport { get; private set; }
        public bool LastLoadSucceeded { get; private set; }

        private void Awake()
        {
            if (!LastLoadSucceeded) LoadIntoDatabase();
        }

        public FootballWorldDatabase LoadIntoDatabase()
        {
            playersJson ??= Resources.Load<TextAsset>("FootballWorld/players");
            clubsJson ??= Resources.Load<TextAsset>("FootballWorld/clubs");
            leaguesJson ??= Resources.Load<TextAsset>("FootballWorld/leagues");
            competitionsJson ??= Resources.Load<TextAsset>("FootballWorld/competitions");
            return LoadIntoDatabase(playersJson, clubsJson, leaguesJson, competitionsJson);
        }

        public FootballWorldDatabase LoadIntoDatabase(TextAsset players, TextAsset clubs, TextAsset leagues, TextAsset competitions)
        {
            database ??= ScriptableObject.CreateInstance<FootballWorldDatabase>();
            var bundle = FootballWorldCatalogParser.Parse(players, clubs, leagues, competitions);
            LastReport = bundle.Report;
            if (LastReport.IsValid)
            {
                database.ReplaceCatalogs(bundle.Players.players, bundle.Clubs.clubs, bundle.Leagues.leagues, bundle.Competitions.competitions);
                LastReport = database.Validate();
            }
            LastLoadSucceeded = LastReport.IsValid;
            LogReport(LastReport);
            if (LastLoadSucceeded)
                Debug.Log($"[Football World] Loaded {database.leagues.Count} leagues, {database.clubs.Count} clubs, {database.players.Count} players and {database.competitions.Count} competitions.", this);
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