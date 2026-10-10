using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using UnityEngine;

namespace FC2026.Tests
{
    public sealed class SeasonCalendarTests
    {
        private GameObject managerObject;
        private FootballWorldDatabase database;

        [TearDown]
        public void TearDown()
        {
            if (managerObject != null) Object.DestroyImmediate(managerObject);
            if (database != null) Object.DestroyImmediate(database);
        }

        [Test]
        public void FourClubLeagueGeneratesDoubleRoundRobinSeason()
        {
            var manager = CreateManager();

            Assert.That(manager.GenerateSeason("league-a", 3), Is.True);
            Assert.That(manager.Fixtures, Has.Count.EqualTo(12));
            Assert.That(manager.Fixtures.Select(item => item.matchweek).Distinct(), Has.Count.EqualTo(6));
            Assert.That(manager.Fixtures.Count(item => item.homeClubId == "club-a"), Is.EqualTo(6));
            Assert.That(manager.Fixtures.Count(item => item.awayClubId == "club-a"), Is.EqualTo(6));
        }

        [Test]
        public void NoClubPlaysTwiceInTheSameMatchweek()
        {
            var manager = CreateManager();
            manager.GenerateSeason("league-a");

            foreach (var week in manager.Fixtures.Select(item => item.matchweek).Distinct())
            {
                var weekFixtures = manager.FixturesForMatchweek(week);
                var clubs = weekFixtures.SelectMany(item => new[] { item.homeClubId, item.awayClubId }).ToList();
                Assert.That(clubs, Is.Unique, $"Duplicate club in matchweek {week}");
            }
        }

        [Test]
        public void ResultUpdatesPointsAndGoalDifference()
        {
            var manager = CreateManager();
            manager.GenerateSeason("league-a");
            var fixture = manager.Fixtures[0];

            Assert.That(manager.RecordResult(fixture.fixtureId, 3, 1), Is.True);
            var home = manager.StandingForClub(fixture.homeClubId);
            var away = manager.StandingForClub(fixture.awayClubId);
            Assert.That(home.points, Is.EqualTo(3));
            Assert.That(home.GoalDifference, Is.EqualTo(2));
            Assert.That(away.points, Is.EqualTo(0));
            Assert.That(manager.RecordResult(fixture.fixtureId, 2, 2), Is.False);
        }

        [Test]
        public void LeagueWithTooFewClubsIsRejected()
        {
            database = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            database.ReplaceCatalogs(new WorldPlayerDefinition[0], new[] { Club("club-a") }, new[] { League("league-a", 1) }, new WorldCompetitionDefinition[0]);
            managerObject = new GameObject("Season Calendar Test");
            var manager = managerObject.AddComponent<SeasonCalendarManager>();
            manager.Configure(database);

            Assert.That(manager.GenerateSeason("league-a"), Is.False);
            Assert.That(manager.Fixtures, Is.Empty);
        }

        private SeasonCalendarManager CreateManager()
        {
            database = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            database.ReplaceCatalogs(new WorldPlayerDefinition[0], new[] { Club("club-a"), Club("club-b"), Club("club-c"), Club("club-d") }, new[] { League("league-a", 4) }, new WorldCompetitionDefinition[0]);
            managerObject = new GameObject("Season Calendar Test");
            var manager = managerObject.AddComponent<SeasonCalendarManager>();
            manager.Configure(database);
            return manager;
        }

        private static WorldClubDefinition Club(string id) => new() { id = id, displayName = id, leagueId = "league-a" };
        private static WorldLeagueDefinition League(string id, int clubCount) => new() { id = id, displayName = id, clubCount = clubCount };
    }
}
