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
        public void TrainingBuildsFatigueAndRecoveryRestoresAvailability()
        {
            managerObject = new GameObject("Progression Test");
            var manager = managerObject.AddComponent<PlayerProgressionManager>();
            var player = new PlayerData { id = "p3", displayName = "Kai North", overall = 70 };
            var record = manager.GetOrCreate(player);

            Assert.That(manager.TrainPlayer(player, TrainingFocus.Pace, 3), Is.True);
            Assert.That(record.fatigue, Is.EqualTo(30));
            Assert.That(manager.RecoverPlayer(player), Is.True);
            Assert.That(record.fatigue, Is.EqualTo(0));
            Assert.That(record.recoverySessions, Is.EqualTo(1));
        }

        [Test]
        public void HighFatigueBlocksTrainingUntilRecovery()
        {
            managerObject = new GameObject("Progression Test");
            var manager = managerObject.AddComponent<PlayerProgressionManager>();
            var player = new PlayerData { id = "p4", displayName = "Noah Reed", overall = 70 };
            var record = manager.GetOrCreate(player);
            record.fatigue = 90;

            Assert.That(manager.TrainPlayer(player, TrainingFocus.Passing, 2), Is.False);
            Assert.That(manager.RecoverPlayer(player), Is.True);
            Assert.That(manager.TrainPlayer(player, TrainingFocus.Passing, 2), Is.True);
        }

        [Test]
        public void WeeklyAdvanceReducesFatigue()
        {
            managerObject = new GameObject("Progression Test");
            var manager = managerObject.AddComponent<PlayerProgressionManager>();
            var player = new PlayerData { id = "p5", displayName = "Eli Stone", overall = 70 };
            var record = manager.GetOrCreate(player);
            record.fatigue = 75;

            manager.AdvanceWeek();

            Assert.That(record.fatigue, Is.EqualTo(35));
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
