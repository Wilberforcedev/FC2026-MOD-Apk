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

        [Test]
        public void ContractsInitializeWithWagesAndTwoYearTerms()
        {
            managerObject = new GameObject("Career Contract Test");
            var career = managerObject.AddComponent<CareerManager>();
            var player = new PlayerData { id = "c1", displayName = "Ari Vale", overall = 80 };
            career.InitializeContracts(new TeamData { players = new System.Collections.Generic.List<PlayerData> { player } });

            var contract = career.ContractFor(player);
            Assert.That(contract, Is.Not.Null);
            Assert.That(contract.weeklyWage, Is.EqualTo(8000));
            Assert.That(contract.weeksRemaining, Is.EqualTo(104));
            Assert.That(career.WeeklyPayroll, Is.EqualTo(8000));
        }

        [Test]
        public void RenewalImprovesMoraleAndResetsContract()
        {
            managerObject = new GameObject("Career Contract Test");
            var career = managerObject.AddComponent<CareerManager>();
            var player = new PlayerData { id = "c2", overall = 70 };
            career.InitializeContracts(new TeamData { players = new System.Collections.Generic.List<PlayerData> { player } });
            var contract = career.ContractFor(player);
            contract.weeksRemaining = 2;
            contract.morale = 50;

            Assert.That(career.RenewContract(player, 8000, 156), Is.True);
            Assert.That(contract.weeksRemaining, Is.EqualTo(156));
            Assert.That(contract.morale, Is.EqualTo(58));
            Assert.That(contract.transferRequested, Is.False);
        }

        [Test]
        public void PlayingTimeAffectsMoraleAndLowMoraleTriggersTransferRequest()
        {
            managerObject = new GameObject("Career Contract Test");
            var career = managerObject.AddComponent<CareerManager>();
            var player = new PlayerData { id = "c3", overall = 70 };
            career.InitializeContracts(new TeamData { players = new System.Collections.Generic.List<PlayerData> { player } });
            var contract = career.ContractFor(player);
            contract.morale = 30;

            career.RecordPlayingTime(player, false);
            Assert.That(contract.appearances, Is.EqualTo(1));
            Assert.That(contract.transferRequested, Is.True);
            career.RecordPlayingTime(player, true);
            Assert.That(contract.starts, Is.EqualTo(1));
        }

        [Test]
        public void ExpiringContractTriggersTransferRequestAndLeavesPayroll()
        {
            managerObject = new GameObject("Career Contract Test");
            var career = managerObject.AddComponent<CareerManager>();
            var player = new PlayerData { id = "c4", overall = 75 };
            career.InitializeContracts(new TeamData { players = new System.Collections.Generic.List<PlayerData> { player } });
            var contract = career.ContractFor(player);
            contract.weeksRemaining = 1;

            career.AdvanceContractWeek();

            Assert.That(contract.expired, Is.True);
            Assert.That(contract.transferRequested, Is.True);
            Assert.That(career.WeeklyPayroll, Is.EqualTo(0));
            Assert.That(career.ExpiredContracts, Is.EqualTo(1));
        }
    }
}
