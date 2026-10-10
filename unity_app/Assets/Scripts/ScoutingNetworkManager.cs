using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    public enum ScoutRegion { Domestic, Europe, Americas, Africa, Asia }

    [Serializable]
    public sealed class ScoutAssignment
    {
        public string assignmentId;
        public string playerId;
        public ScoutRegion region;
        public int weeksRemaining;
        public int budgetCost;
    }

    [Serializable]
    public sealed class ScoutReport
    {
        public string playerId;
        public ScoutRegion region;
        [Range(0, 100)] public int confidence;
        public int estimatedOverall;
        public int estimatedPotential;
        public int estimatedFee;
        public string recommendation;
        public bool isComplete;
    }

    public sealed class ScoutingNetworkManager : MonoBehaviour
    {
        [SerializeField] private CareerManager career;
        [SerializeField] private FootballWorldDatabase database;
        [SerializeField] private int weeklyScoutingBudget = 250000;
        [SerializeField] private int networkLevel = 1;
        [SerializeField] private List<ScoutAssignment> assignments = new();
        [SerializeField] private List<ScoutReport> reports = new();

        public IReadOnlyList<ScoutAssignment> Assignments => assignments;
        public IReadOnlyList<ScoutReport> Reports => reports;
        public int NetworkLevel => networkLevel;
        public int WeeklyScoutingBudget => weeklyScoutingBudget;
        public event Action<ScoutReport> ReportCompleted;
        public event Action NetworkChanged;

        private void Awake() => database ??= FindFirstObjectByType<FootballWorldCatalogLoader>()?.Database;

        public void Configure(FootballWorldDatabase worldDatabase, CareerManager careerManager)
        {
            database = worldDatabase;
            career = careerManager;
        }

        public bool AssignScout(PlayerData player, ScoutRegion region, int weeks = 2)
        {
            if (player == null || assignments.Any(item => item.playerId == player.id)) return false;
            var cost = Mathf.Max(50000, weeklyScoutingBudget / Mathf.Max(1, networkLevel) * Mathf.Clamp(weeks, 1, 6));
            if (career != null && !career.CanAfford(cost)) return false;
            assignments.Add(new ScoutAssignment { assignmentId = $"scout-{player.id}-{DateTime.UtcNow.Ticks}", playerId = player.id, region = region, weeksRemaining = Mathf.Clamp(weeks, 1, 6), budgetCost = cost });
            if (career != null) career.SpendTransferBudget(cost);
            NetworkChanged?.Invoke();
            return true;
        }

        public void AdvanceWeek()
        {
            foreach (var assignment in assignments.ToList())
            {
                assignment.weeksRemaining--;
                if (assignment.weeksRemaining > 0) continue;
                var report = BuildReport(assignment);
                reports.RemoveAll(item => item.playerId == report.playerId);
                reports.Add(report);
                assignments.Remove(assignment);
                ReportCompleted?.Invoke(report);
            }
            NetworkChanged?.Invoke();
        }

        public ScoutReport ReportFor(string playerId) => reports.FirstOrDefault(item => item.playerId == playerId);

        public void UpgradeNetwork()
        {
            networkLevel = Mathf.Clamp(networkLevel + 1, 1, 5);
            weeklyScoutingBudget += 100000;
            NetworkChanged?.Invoke();
        }

        private ScoutReport BuildReport(ScoutAssignment assignment)
        {
            var player = database?.players.FirstOrDefault(item => item.id == assignment.playerId);
            var seed = StableHash(assignment.playerId + assignment.region);
            var confidence = Mathf.Clamp(48 + networkLevel * 8 + assignment.region.GetHashCode() % 9, 35, 95);
            var potentialVariance = Mathf.Abs(seed % 8) - 3;
            var estimatedPotential = Mathf.Clamp((player?.overall ?? 70) + 8 + potentialVariance, 1, 99);
            var estimatedOverall = Mathf.Clamp((player?.overall ?? 70) + (seed % 5) - 2, 1, 99);
            var recommendation = estimatedPotential >= 85 ? "HIGH UPSIDE  /  PRIORITY TARGET" : estimatedOverall >= 80 ? "FIRST-TEAM QUALITY  /  MONITOR" : "SQUAD DEPTH  /  SCOUT FURTHER";
            return new ScoutReport { playerId = assignment.playerId, region = assignment.region, confidence = confidence, estimatedOverall = estimatedOverall, estimatedPotential = estimatedPotential, estimatedFee = player?.marketValue ?? 0, recommendation = recommendation, isComplete = true };
        }

        private static int StableHash(string value)
        {
            unchecked { var hash = 17; foreach (var character in value ?? string.Empty) hash = hash * 31 + character; return hash; }
        }
    }
}
