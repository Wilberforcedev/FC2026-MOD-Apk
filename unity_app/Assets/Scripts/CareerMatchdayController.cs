using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    /// <summary>
    /// Bridges completed season fixtures to the manager's squad, contracts and player development.
    /// Attach this component to the career scene or configure it from the match scene.
    /// </summary>
    public sealed class CareerMatchdayController : MonoBehaviour
    {
        [SerializeField] private CareerMatchSimulationEngine matchEngine;
        [SerializeField] private SquadManager squad;
        [SerializeField] private CareerManager career;
        [SerializeField] private PlayerProgressionManager progression;
        [SerializeField] private string managedClubId;

        private readonly HashSet<string> processedFixtures = new();

        public void Configure(CareerMatchSimulationEngine engine, SquadManager squadManager,
            CareerManager careerManager, PlayerProgressionManager progressionManager, string clubId)
        {
            UnbindEngine();
            matchEngine = engine;
            squad = squadManager;
            career = careerManager;
            progression = progressionManager;
            managedClubId = clubId;
            BindEngine();
        }

        private void Awake()
        {
            matchEngine ??= FindFirstObjectByType<CareerMatchSimulationEngine>();
            squad ??= FindFirstObjectByType<SquadManager>();
            career ??= FindFirstObjectByType<CareerManager>();
            progression ??= FindFirstObjectByType<PlayerProgressionManager>();
            if (string.IsNullOrEmpty(managedClubId))
                managedClubId = squad?.CurrentTeam?.id;
        }

        private void OnEnable() => BindEngine();
        private void OnDisable() => UnbindEngine();

        private void BindEngine()
        {
            if (matchEngine != null)
            {
                matchEngine.MatchCompleted -= HandleMatchCompleted;
                matchEngine.MatchCompleted += HandleMatchCompleted;
            }
        }

        private void UnbindEngine()
        {
            if (matchEngine != null) matchEngine.MatchCompleted -= HandleMatchCompleted;
        }

        private void HandleMatchCompleted(SeasonFixture fixture)
        {
            if (matchEngine == null) return;
            ProcessMatchdayResult(fixture, matchEngine.HomeScore, matchEngine.AwayScore);
        }

        public bool ProcessMatchdayResult(SeasonFixture fixture, int homeGoals, int awayGoals)
        {
            if (fixture == null || string.IsNullOrWhiteSpace(fixture.fixtureId) ||
                processedFixtures.Contains(fixture.fixtureId) || homeGoals < 0 || awayGoals < 0 ||
                squad?.CurrentTeam?.players == null || career == null || progression == null)
                return false;

            if (string.IsNullOrEmpty(managedClubId))
                managedClubId = squad.CurrentTeam.id;
            var managedAtHome = fixture.homeClubId == managedClubId;
            var managedAway = fixture.awayClubId == managedClubId;
            if (!managedAtHome && !managedAway) return false;

            var managedGoals = managedAtHome ? homeGoals : awayGoals;
            var opponentGoals = managedAtHome ? awayGoals : homeGoals;
            var won = managedGoals > opponentGoals;
            var drawn = managedGoals == opponentGoals;
            var starters = new HashSet<PlayerData>((squad.StartingEleven ?? new List<PlayerData>()).Where(player => player != null));

            foreach (var player in squad.CurrentTeam.players.Where(player => player != null))
            {
                var started = starters.Contains(player);
                if (!started) continue;
                career.RecordPlayingTime(player, true);
                progression.ApplyMatchdayResult(player, true, won, drawn);
            }

            // A completed managed-club fixture represents one career week.
            career.AdvanceContractWeek();
            progression.AdvanceWeek();
            processedFixtures.Add(fixture.fixtureId);
            return true;
        }
    }
}
