using NUnit.Framework;
using UnityEngine;

namespace FC2026.Tests
{
    public sealed class TransferNetworkTests
    {
        private GameObject managerObject;
        private GameObject careerObject;
        private FootballWorldDatabase database;

        [TearDown]
        public void TearDown()
        {
            if (managerObject != null) Object.DestroyImmediate(managerObject);
            if (careerObject != null) Object.DestroyImmediate(careerObject);
            if (database != null) Object.DestroyImmediate(database);
        }

        [Test]
        public void NegotiationReturnsCounterOfferThenAcceptsCredibleDeal()
        {
            careerObject = new GameObject("Career");
            var career = careerObject.AddComponent<CareerManager>();
            managerObject = new GameObject("Negotiation");
            var manager = managerObject.AddComponent<TransferNegotiationManager>();
            manager.Configure(career, null);
            var listing = Listing(1000000);

            Assert.That(manager.OpenNegotiation(listing), Is.True);
            Assert.That(manager.SubmitOffer(750000, 50000, 3), Is.EqualTo(NegotiationState.CounterOffer));
            Assert.That(manager.SubmitOffer(1000000, 60000, 3), Is.EqualTo(NegotiationState.Accepted));
            Assert.That(manager.CompleteAcceptedTransfer(), Is.True);
            Assert.That(manager.State, Is.EqualTo(NegotiationState.Completed));
        }

        [Test]
        public void ScoutingAssignmentCompletesAfterRequestedWeeks()
        {
            database = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            database.ReplaceCatalogs(new[] { new WorldPlayerDefinition { id = "p1", displayName = "Ari Vale", overall = 80, marketValue = 1000000 } }, new WorldClubDefinition[0], new WorldLeagueDefinition[0], new WorldCompetitionDefinition[0]);
            managerObject = new GameObject("Scouting");
            var scouting = managerObject.AddComponent<ScoutingNetworkManager>();
            scouting.Configure(database, null);
            var player = new PlayerData { id = "p1", displayName = "Ari Vale", overall = 80 };

            Assert.That(scouting.AssignScout(player, ScoutRegion.Europe, 2), Is.True);
            scouting.AdvanceWeek();
            Assert.That(scouting.Reports, Is.Empty);
            scouting.AdvanceWeek();

            Assert.That(scouting.Reports, Has.Count.EqualTo(1));
            Assert.That(scouting.Reports[0].isComplete, Is.True);
            Assert.That(scouting.Reports[0].playerId, Is.EqualTo("p1"));
        }

        private static TransferListing Listing(int fee) => new() { player = new PlayerData { id = "p1", displayName = "Ari Vale", overall = 80 }, currentClub = "Harbor Kings", fee = fee };
    }
}
