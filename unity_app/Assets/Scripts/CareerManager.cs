using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    [Serializable]
    public class FixtureData
    {
        public TeamData home;
        public TeamData away;
        public bool completed;
        public int homeGoals;
        public int awayGoals;
    }

    [Serializable]
    public class LeagueEntry
    {
        public TeamData team;
        public int played;
        public int points;
        public int goalDifference;
    }

    public sealed class CareerManager : MonoBehaviour
    {
        public int Season { get; private set; } = 1;
        public int Matchweek { get; private set; } = 1;
        public int TransferBudget { get; private set; } = 15000000;
        public IReadOnlyList<FixtureData> Fixtures => fixtures;
        public IReadOnlyList<LeagueEntry> Table => table.OrderByDescending(x => x.points).ThenByDescending(x => x.goalDifference).ToList();
        public event Action CareerChanged;

        [SerializeField] private List<FixtureData> fixtures = new();
        [SerializeField] private List<LeagueEntry> table = new();
        private TeamData userTeam;

        public void Initialize(TeamData managedTeam, IEnumerable<TeamData> clubs)
        {
            userTeam = managedTeam;
            table = clubs.Select(team => new LeagueEntry { team = team }).ToList();
            fixtures.Clear();
            var opponents = clubs.Where(team => team != managedTeam).Take(7).ToList();
            foreach (var opponent in opponents) fixtures.Add(new FixtureData { home = managedTeam, away = opponent });
            CareerChanged?.Invoke();
        }

        public FixtureData NextFixture => fixtures.FirstOrDefault(f => !f.completed);

        public void RecordResult(FixtureData fixture, int homeGoals, int awayGoals)
        {
            if (fixture == null || fixture.completed) return;
            fixture.completed = true;
            fixture.homeGoals = homeGoals;
            fixture.awayGoals = awayGoals;
            var home = table.FirstOrDefault(x => x.team == fixture.home);
            var away = table.FirstOrDefault(x => x.team == fixture.away);
            if (home != null) { home.played++; home.goalDifference += homeGoals - awayGoals; home.points += homeGoals > awayGoals ? 3 : homeGoals == awayGoals ? 1 : 0; }
            if (away != null) { away.played++; away.goalDifference += awayGoals - homeGoals; away.points += awayGoals > homeGoals ? 3 : homeGoals == awayGoals ? 1 : 0; }
            Matchweek++;
            CareerChanged?.Invoke();
        }

        public bool CanAfford(int fee) => fee >= 0 && fee <= TransferBudget;
        public bool SpendTransferBudget(int fee) { if (!CanAfford(fee)) return false; TransferBudget -= fee; CareerChanged?.Invoke(); return true; }
    }
}
