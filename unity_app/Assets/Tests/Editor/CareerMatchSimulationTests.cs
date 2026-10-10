using System.Linq;
using NUnit.Framework;
using UnityEngine;

namespace FC2026.Tests
{
    public sealed class CareerMatchSimulationTests
    {
        private GameObject calendarObject;
        private GameObject engineObject;
        private FootballWorldDatabase database;

        [TearDown]
        public void TearDown()
        {
            if (engineObject != null) Object.DestroyImmediate(engineObject);
            if (calendarObject != null) Object.DestroyImmediate(calendarObject);
            if (database != null) Object.DestroyImmediate(database);
        }

        [Test]
        public void MatchSimulationRecordsFullTimeResult()
        {
            database = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            database.ReplaceCatalogs(
                new[] { Player("a-st", "club-a"), Player("b-st", "club-b"), Player("c-st", "club-c"), Player("d-st", "club-d") },
                new[] { Club("club-a"), Club("club-b"), Club("club-c"), Club("club-d") },
                new[] { new WorldLeagueDefinition { id = "league-a", clubCount = 4 } },
                new WorldCompetitionDefinition[0]);
            calendarObject = new GameObject("Season Calendar");
            var calendar = calendarObject.AddComponent<SeasonCalendarManager>();
            calendar.Configure(database);
            Assert.That(calendar.GenerateSeason("league-a"), Is.True);
            engineObject = new GameObject("Match Simulation");
            var engine = engineObject.AddComponent<CareerMatchSimulationEngine>();
            engine.Configure(database, calendar);
            Assert.That(engine.StartNextMatch(), Is.True);

            engine.SkipToFullTime();

            Assert.That(engine.IsComplete, Is.True);
            Assert.That(engine.CurrentMinute, Is.EqualTo(90));
            Assert.That(engine.Events.Last().type, Is.EqualTo(CareerMatchEventType.FullTime));
            Assert.That(calendar.Fixtures[0].isPlayed, Is.True);
        }

        private static WorldClubDefinition Club(string id) => new() { id = id, displayName = id, shortName = id.ToUpperInvariant(), leagueId = "league-a", stadiumName = "Arena" };
        private static WorldPlayerDefinition Player(string id, string clubId) => new() { id = id, displayName = id, clubId = clubId, position = "ST", overall = 80, age = 22, likenessProfileId = $"original-{id}" };
    }
}
