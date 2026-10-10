using System;
using System.Collections.Generic;
using UnityEngine;

namespace FC2026
{
    public sealed class FootballWorldValidationReport
    {
        public readonly List<string> Errors = new();
        public readonly List<string> Warnings = new();
        public bool IsValid => Errors.Count == 0;

        public void Error(string message) => Errors.Add(message);
        public void Warning(string message) => Warnings.Add(message);
        public override string ToString() => $"{Errors.Count} error(s), {Warnings.Count} warning(s)";
    }

    public sealed class FootballWorldCatalogBundle
    {
        public PlayerCatalogJson Players = new();
        public ClubCatalogJson Clubs = new();
        public LeagueCatalogJson Leagues = new();
        public CompetitionCatalogJson Competitions = new();
        public FootballWorldValidationReport Report = new();
    }

    public static class FootballWorldCatalogParser
    {
        public static FootballWorldCatalogBundle Parse(TextAsset players, TextAsset clubs, TextAsset leagues, TextAsset competitions)
        {
            var bundle = new FootballWorldCatalogBundle();
            bundle.Players = ParseFile(players, "players.json", bundle.Report, new PlayerCatalogJson());
            bundle.Clubs = ParseFile(clubs, "clubs.json", bundle.Report, new ClubCatalogJson());
            bundle.Leagues = ParseFile(leagues, "leagues.json", bundle.Report, new LeagueCatalogJson());
            bundle.Competitions = ParseFile(competitions, "competitions.json", bundle.Report, new CompetitionCatalogJson());
            return bundle;
        }

        private static T ParseFile<T>(TextAsset asset, string fileName, FootballWorldValidationReport report, T empty) where T : class
        {
            if (asset == null) { report.Error($"Missing catalog: {fileName}"); return empty; }
            if (string.IsNullOrWhiteSpace(asset.text)) { report.Error($"Catalog is empty: {fileName}"); return empty; }
            try
            {
                var parsed = JsonUtility.FromJson<T>(asset.text);
                if (parsed == null) { report.Error($"Catalog produced no data: {fileName}"); return empty; }
                return parsed;
            }
            catch (Exception exception)
            {
                report.Error($"Invalid JSON in {fileName}: {exception.Message}");
                return empty;
            }
        }
    }
}
