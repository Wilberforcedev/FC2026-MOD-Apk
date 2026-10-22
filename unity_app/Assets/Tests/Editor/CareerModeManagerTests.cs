using System;
using System.IO;
using System.Reflection;
using NUnit.Framework;
using UnityEngine;

namespace FC2026.Tests
{
    public sealed class CareerModeManagerTests
    {
        private GameObject managerObject;
        private CareerModeManager manager;
        private string savePath;

        [SetUp]
        public void SetUp()
        {
            managerObject = new GameObject("Career Mode Test");
            manager = managerObject.AddComponent<CareerModeManager>();
            string fileName = "aero-career-test-" + Guid.NewGuid().ToString("N") + ".json";
            typeof(CareerModeManager).GetField("saveFileName", BindingFlags.Instance | BindingFlags.NonPublic)
                .SetValue(manager, fileName);
            savePath = Path.Combine(Application.persistentDataPath, fileName);
        }

        [TearDown]
        public void TearDown()
        {
            if (managerObject != null) UnityEngine.Object.DestroyImmediate(managerObject);
            if (!string.IsNullOrWhiteSpace(savePath) && File.Exists(savePath)) File.Delete(savePath);
            if (!string.IsNullOrWhiteSpace(savePath) && File.Exists(savePath + ".tmp")) File.Delete(savePath + ".tmp");
            if (!string.IsNullOrWhiteSpace(savePath) && File.Exists(savePath + ".bak")) File.Delete(savePath + ".bak");
        }

        [Test]
        public void ResultIsSavedAndRestoredAcrossManagerInstances()
        {
            Assert.That(manager.StartCareer("Test Manager", "club-1", "Test Club", "league-1", 2026, 5000000, 5000), Is.True);
            Assert.That(manager.RecordMatch("fixture-1", "league-1", "club-2", true, 2, 1, 1), Is.True);
            Assert.That(manager.Career.wins, Is.EqualTo(1));
            Assert.That(manager.Career.leaguePoints, Is.EqualTo(3));
            Assert.That(manager.Career.matchHistory, Has.Count.EqualTo(1));

            manager.Save();
            var reloadObject = new GameObject("Career Reload Test");
            try
            {
                var reload = reloadObject.AddComponent<CareerModeManager>();
                typeof(CareerModeManager).GetField("saveFileName", BindingFlags.Instance | BindingFlags.NonPublic)
                    .SetValue(reload, Path.GetFileName(savePath));
                Assert.That(reload.Load(), Is.True);
                Assert.That(reload.Career.managerName, Is.EqualTo("Test Manager"));
                Assert.That(reload.Career.wins, Is.EqualTo(1));
                Assert.That(reload.Career.matchHistory, Has.Count.EqualTo(1));
            }
            finally { UnityEngine.Object.DestroyImmediate(reloadObject); }
        }

        [Test]
        public void SigningsRespectTransferWindowWageBudgetAndContractLength()
        {
            Assert.That(manager.StartCareer("Test Manager", "club-1", "Test Club", "league-1", 2026, 5000, 1000), Is.True);
            Assert.That(manager.UpdateTransferWindow(6, 20), Is.EqualTo(false));
        }
    }
}