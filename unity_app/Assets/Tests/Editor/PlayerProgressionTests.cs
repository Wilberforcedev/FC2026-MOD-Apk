using NUnit.Framework;
using UnityEngine;

namespace FC2026.Tests
{
    public sealed class PlayerProgressionTests
    {
        private GameObject managerObject;
        private FootballWorldDatabase worldDatabase;

        [TearDown]
        public void TearDown()
        {
            if (managerObject != null) Object.DestroyImmediate(managerObject);
            if (worldDatabase != null) Object.DestroyImmediate(worldDatabase);
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
        public void MatchdayControllerUpdatesManagedStartersAndAdvancesWeekOnlyOnce()
        {
            managerObject = new GameObject("Career Matchday Test");
            var player = new PlayerData { id = "matchday-1", displayName = "Ari Vale", overall = 70 };
            var team = new TeamData { id = "managed-club", players = new System.Collections.Generic.List<PlayerData> { player } };
            var squad = managerObject.AddComponent<SquadManager>();
            squad.Initialize(team);
            var career = managerObject.AddComponent<CareerManager>();
            career.Initialize(team, new[] { team });
            var progression = managerObject.AddComponent<PlayerProgressionManager>();
            var controller = managerObject.AddComponent<CareerMatchdayController>();
            controller.Configure(null, squad, career, progression, "managed-club");
            var fixture = new SeasonFixture
            {
                fixtureId = "matchday-draw-1",
                homeClubId = "managed-club",
                awayClubId = "opponent"
            };

            Assert.That(controller.ProcessMatchdayResult(fixture, 1, 1), Is.True);
            var record = progression.GetOrCreate(player);
            Assert.That(record.matchesPlayed, Is.EqualTo(1));
            Assert.That(record.matchesStarted, Is.EqualTo(1));
            Assert.That(record.matchesDrawn, Is.EqualTo(1));
            Assert.That(career.ContractFor(player).appearances, Is.EqualTo(1));
            Assert.That(career.ContractFor(player).starts, Is.EqualTo(1));
            Assert.That(career.ContractFor(player).weeksRemaining, Is.EqualTo(103));

            Assert.That(controller.ProcessMatchdayResult(fixture, 1, 1), Is.False);
            Assert.That(record.matchesPlayed, Is.EqualTo(1));
            Assert.That(career.ContractFor(player).weeksRemaining, Is.EqualTo(103));
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

        [Test]
        public void TransferOfferCounterCanBeAcceptedAndPlayerSigned()
        {
            managerObject = new GameObject("Transfer Market Test");
            worldDatabase = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            var career = managerObject.AddComponent<CareerManager>();
            var team = new TeamData { id = "home", players = new System.Collections.Generic.List<PlayerData>() };
            career.Initialize(team, new[] { team });
            worldDatabase.players.Add(new WorldPlayerDefinition
            {
                id = "target-1", displayName = "Sam Striker", clubId = "away",
                position = "ST", overall = 80, pace = 82, shooting = 84,
                passing = 65, dribbling = 78, defending = 30, physicality = 76,
                age = 24, marketValue = 1000000
            });
            var market = managerObject.AddComponent<TransferMarketManager>();
            market.Configure(worldDatabase, career, "home");

            var offer = market.MakeOffer("target-1", 800000);
            Assert.That(offer.status, Is.EqualTo(TransferOfferStatus.Countered));
            Assert.That(market.AcceptCounterOffer(offer), Is.True);
            Assert.That(market.CompleteSigning(offer, 12000), Is.True);
            Assert.That(team.players.Count, Is.EqualTo(1));
            Assert.That(team.players[0].displayName, Is.EqualTo("Sam Striker"));
            Assert.That(career.TransferBudget, Is.EqualTo(13900000));
            Assert.That(offer.status, Is.EqualTo(TransferOfferStatus.Completed));
        }

        [Test]
        public void TransferMarketRejectsUnaffordableSigning()
        {
            managerObject = new GameObject("Transfer Market Test");
            worldDatabase = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            var career = managerObject.AddComponent<CareerManager>();
            var team = new TeamData { id = "home", players = new System.Collections.Generic.List<PlayerData>() };
            career.Initialize(team, new[] { team });
            worldDatabase.players.Add(new WorldPlayerDefinition
            {
                id = "target-2", displayName = "Expensive Midfielder", clubId = "away",
                position = "CM", overall = 85, age = 25, marketValue = 20000000
            });
            var market = managerObject.AddComponent<TransferMarketManager>();
            market.Configure(worldDatabase, career, "home");
            var offer = market.MakeOffer("target-2", 20000000);

            Assert.That(market.CompleteSigning(offer, 15000), Is.False);
            Assert.That(team.players, Is.Empty);
            Assert.That(career.TransferBudget, Is.EqualTo(15000000));
        }

        [Test]
        public void TransferMarketBlocksNegotiationsOutsideConfiguredWindows()
        {
            managerObject = new GameObject("Transfer Window Test");
            worldDatabase = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            worldDatabase.players.Add(new WorldPlayerDefinition
            {
                id = "window-target", displayName = "Window Target", clubId = "away",
                position = "CM", overall = 75, age = 25, marketValue = 500000
            });
            var career = managerObject.AddComponent<CareerManager>();
            var team = new TeamData { id = "home", players = new System.Collections.Generic.List<PlayerData>() };
            career.Initialize(team, new[] { team });
            var window = managerObject.AddComponent<TransferWindowManager>();
            window.SetWindowPeriods(5, 7, 15, 17);
            var market = managerObject.AddComponent<TransferMarketManager>();
            market.Configure(worldDatabase, career, "home", window);

            Assert.That(window.IsWindowOpenFor(6), Is.True);
            Assert.That(window.IsWindowOpenFor(12), Is.False);
            Assert.That(market.IsTransferWindowOpen, Is.False);
            Assert.That(market.MakeOffer("window-target", 500000), Is.Null);
        }

        [Test]
        public void SellingSquadPlayerCreditsTransferBudget()
        {
            managerObject = new GameObject("Transfer Market Test");
            worldDatabase = ScriptableObject.CreateInstance<FootballWorldDatabase>();
            var career = managerObject.AddComponent<CareerManager>();
            var player = new PlayerData { id = "sale-1", displayName = "Reserve Player", overall = 70 };
            var team = new TeamData { id = "home", players = new System.Collections.Generic.List<PlayerData> { player } };
            career.Initialize(team, new[] { team });
            var market = managerObject.AddComponent<TransferMarketManager>();
            market.Configure(worldDatabase, career, "home");

            Assert.That(market.SellPlayer(player, 450000), Is.True);
            Assert.That(team.players, Is.Empty);
            Assert.That(career.ContractFor(player), Is.Null);
            Assert.That(career.TransferBudget, Is.EqualTo(15450000));
        }
    }
}
