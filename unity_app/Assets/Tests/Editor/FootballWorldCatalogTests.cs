using System.Linq;
using NUnit.Framework;
using UnityEngine;

namespace FC2026.Tests
{
    public sealed class FootballWorldCatalogTests
    {
        private GameObject loaderObject;
        private FootballWorldDatabase database;

        [TearDown]
        public void TearDown()
        {
            if (loaderObject != null) Object.DestroyImmediate(loaderObject);
            if (database != null) Object.DestroyImmediate(database);
        }

        [Test]
        public void ParserReadsAllWrappedCatalogs()
        {
            var bundle = FootballWorldCatalogParser.Parse(
                Asset("{\"players\":[{\"id\":\"p1\",\"displayName\":\"Ari Vale\",\"clubId\":\"club-a\",\"position\":\"ST\",\"overall\":80,\"age\":22,\"likenessProfileId\":\"original-p1\"}]}"),
                Asset("{\"clubs\":[{\"id\":\"club-a\",\"displayName\":\"Harbor Kings\",\"leagueId\":\"league-a\",\"clubCount\":1}]}"),
                Asset("{\"leagues\":[{\"id\":\"league-a\",\"displayName\":\"Continental Premier\",\"clubCount\":1}]}"),
                Asset("{\"competitions\":[{\"id\":\"cup-a\",\"displayName\":\"Aurelia Cup\",\"eligibleLeagueIds\":[\"league-a\"]}]}"));

            Assert.That(bundle.Report.IsValid, Is.True, bundle.Report.ToString());
            Assert.That(bundle.Players.players, Has.Count.EqualTo(1));
            Assert.That(bundle.Clubs.clubs[0].leagueId, Is.EqualTo("league-a"));
            Assert.That(bundle.Competitions.competitions[0].eligibleLeagueIds[0], Is.EqualTo("league-a"));
        }

        [Test]
        public void ParserReportsMissingAndMalformedCatalogs()
        {
            var bundle = FootballWorldCatalogParser.Parse(null, Asset("{ malformed"), Asset("{}"), Asset("{\"competitions\":[]}"));

            Assert.That(bundle.Report.IsValid, Is.False);
            Assert.That(bundle.Report.Errors.Any(error => error.Contains("Missing catalog: players.json")), Is.True);
            Assert.That(bundle.Report.Errors.Any(error => error.Contains("Invalid JSON in clubs.json")), Is.True);
        }

        [Test]
        public void DatabaseValidationDetectsBrokenReferences()
        {
            database = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            database.ReplaceCatalogs(
                new[] { new WorldPlayerDefinition { id = "player-a", clubId = "missing-club", overall = 80, age = 22, likenessProfileId = "original-player-a" } },
                new[] { new WorldClubDefinition { id = "club-a", leagueId = "missing-league", startingBudget = 1 } },
                new[] { new WorldLeagueDefinition { id = "league-a", clubCount = 1 } },
                new[] { new WorldCompetitionDefinition { id = "cup-a", eligibleLeagueIds = new[] { "missing-league" } } });

            var report = database.Validate();

            Assert.That(report.IsValid, Is.False);
            Assert.That(report.Errors.Any(error => error.Contains("missing club")), Is.True);
            Assert.That(report.Errors.Any(error => error.Contains("missing league")), Is.True);
        }

        [Test]
        public void DatabaseValidationDetectsDuplicateIds()
        {
            database = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            database.ReplaceCatalogs(
                new WorldPlayerDefinition[0],
                new[] { new WorldClubDefinition { id = "club-a" }, new WorldClubDefinition { id = "club-a" } },
                new WorldLeagueDefinition[0],
                new WorldCompetitionDefinition[0]);

            var report = database.Validate();

            Assert.That(report.Errors.Any(error => error.Contains("Duplicate club ID")), Is.True);
        }

        [Test]
        public void LoaderReplacesDatabaseForValidCatalogs()
        {
            loaderObject = new GameObject("Catalog Loader Test");
            var loader = loaderObject.AddComponent<FootballWorldCatalogLoader>();
            database = loader.LoadIntoDatabase(
                Asset("{\"players\":[]}"),
                Asset("{\"clubs\":[]}"),
                Asset("{\"leagues\":[]}"),
                Asset("{\"competitions\":[]}"));

            Assert.That(loader.LastLoadSucceeded, Is.True, loader.LastReport.ToString());
            Assert.That(database.players, Is.Empty);
            Assert.That(database.clubs, Is.Empty);
        }

        [Test]
        public void LoaderPreservesExistingDatabaseAfterInvalidLoad()
        {
            loaderObject = new GameObject("Catalog Loader Test");
            var loader = loaderObject.AddComponent<FootballWorldCatalogLoader>();
            database = loader.LoadIntoDatabase(
                Asset("{\"players\":[{\"id\":\"p1\",\"clubId\":\"c1\",\"overall\":80,\"age\":22,\"likenessProfileId\":\"original-p1\"}]}"),
                Asset("{\"clubs\":[{\"id\":\"c1\",\"leagueId\":\"l1\"}]}"),
                Asset("{\"leagues\":[{\"id\":\"l1\",\"clubCount\":1}]}"),
                Asset("{\"competitions\":[]}"));
            var originalPlayerCount = database.players.Count;

            loader.LoadIntoDatabase(null, Asset("{ malformed"), Asset("{}"), Asset("{\"competitions\":[]}"));

            Assert.That(loader.LastLoadSucceeded, Is.False);
            Assert.That(database.players, Has.Count.EqualTo(originalPlayerCount));
        }

        private static TextAsset Asset(string json) => new(json);
    }
}
