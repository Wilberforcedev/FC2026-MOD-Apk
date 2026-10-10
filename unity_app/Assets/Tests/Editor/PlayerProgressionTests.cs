using NUnit.Framework;
using UnityEngine;

namespace FC2026.Tests
{
    public sealed class PlayerProgressionTests
    {
        private GameObject managerObject;

        [TearDown]
        public void TearDown()
        {
            if (managerObject != null) Object.DestroyImmediate(managerObject);
        }

        [Test]
        public void TrainingGrowsFocusedAttributeAndUpdatesForm()
        {
            managerObject = new GameObject("Progression Test");
            var manager = managerObject.AddComponent<PlayerProgressionManager>();
            var player = new PlayerData { id = "p1", displayName = "Ari Vale", overall = 70, passing = 70 };
            var startingPassing = player.passing;

            for (var i = 0; i < 6; i++) manager.TrainPlayer(player, TrainingFocus.Passing, 3);

            Assert.That(player.passing, Is.GreaterThan(startingPassing));
            Assert.That(manager.FormFor(player), Is.GreaterThan(50));
            Assert.That(manager.MoraleFor(player), Is.LessThanOrEqualTo(65));
        }

        [Test]
        public void MatchResultChangesFormAndMorale()
        {
            managerObject = new GameObject("Progression Test");
            var manager = managerObject.AddComponent<PlayerProgressionManager>();
            var player = new PlayerData { id = "p2", displayName = "Milo Rook", overall = 70 };
            manager.ApplyMatchResult(player, true, true);

            Assert.That(manager.FormFor(player), Is.EqualTo(55));
            Assert.That(manager.MoraleFor(player), Is.EqualTo(71));
            Assert.That(manager.Records[0].matchesStarted, Is.EqualTo(1));
            Assert.That(manager.Records[0].matchesWon, Is.EqualTo(1));
        }
    }
}
