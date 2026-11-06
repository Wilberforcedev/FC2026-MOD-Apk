using NUnit.Framework;
using UnityEngine;

namespace FC2026.Tests
{
    public sealed class FootballWorldRuntimeCatalogTests
    {
        [Test]
        public void ResourcesCatalogsLoadExpectedWorldAndReferences()
        {
            var players = Resources.Load<TextAsset>("FootballWorld/players");
            var clubs = Resources.Load<TextAsset>("FootballWorld/clubs");
            var leagues = Resources.Load<TextAsset>("FootballWorld/leagues");
            var competitions = Resources.Load<TextAsset>("FootballWorld/competitions");
            Assert.That(players, Is.Not.Null, "Run the editor catalog sync; players.json must be in Resources/FootballWorld.");
            Assert.That(clubs, Is.Not.Null);
            Assert.That(leagues, Is.Not.Null);
            Assert.That(competitions, Is.Not.Null);

            var bundle = FootballWorldCatalogParser.Parse(players, clubs, leagues, competitions);
            Assert.That(bundle.Report.IsValid, Is.True, bundle.Report.ToString());
            Assert.That(bundle.Leagues.leagues, Has.Count.EqualTo(25));
            Assert.That(bundle.Clubs.clubs, Has.Count.EqualTo(300));
            Assert.That(bundle.Players.players, Has.Count.EqualTo(7500));
            Assert.That(bundle.Competitions.competitions, Has.Count.EqualTo(26));

            var database = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            try
            {
                database.ReplaceCatalogs(bundle.Players.players, bundle.Clubs.clubs, bundle.Leagues.leagues, bundle.Competitions.competitions);
                Assert.That(database.Validate().IsValid, Is.True, database.Validate().ToString());
                var league = database.FindLeague("england-premier-league");
                Assert.That(league, Is.Not.Null);
                Assert.That(FootballWorldTeamFactory.CreateLeagueTeams(database, league.id), Has.Count.EqualTo(12));
            }
            finally { Object.DestroyImmediate(database); }
        }
    }
}