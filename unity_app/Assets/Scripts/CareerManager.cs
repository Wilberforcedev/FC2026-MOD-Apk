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

    [Serializable]
    public class PlayerContract
    {
        public PlayerData player;
        public int weeklyWage;
        public int weeksRemaining = 104;
        public int appearances;
        public int starts;
        public int morale = 70;
        public bool transferRequested;
        public bool expired => weeksRemaining <= 0;
    }

    public sealed class CareerManager : MonoBehaviour
    {
        public int Season { get; private set; } = 1;
        public int Matchweek { get; private set; } = 1;
        public int TransferBudget { get; private set; } = 15000000;
        public IReadOnlyList<FixtureData> Fixtures => fixtures;
        public IReadOnlyList<LeagueEntry> Table => table.OrderByDescending(x => x.points).ThenByDescending(x => x.goalDifference).ToList();
        public event Action CareerChanged;
        public IReadOnlyList<PlayerContract> Contracts => contracts;
        public TeamData ManagedTeam => userTeam;
        public int WeeklyPayroll => contracts.Where(x => !x.expired).Sum(x => x.weeklyWage);
        public int ExpiredContracts => contracts.Count(x => x.expired);
        [SerializeField] private List<PlayerContract> contracts = new();

        [SerializeField] private List<FixtureData> fixtures = new();
        [SerializeField] private List<LeagueEntry> table = new();
        private TeamData userTeam;

        public void Initialize(TeamData managedTeam, IEnumerable<TeamData> clubs)
        {
            userTeam = managedTeam;
            InitializeContracts(managedTeam);
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
            AdvanceContractWeek();
            CareerChanged?.Invoke();
        }

        public PlayerContract ContractFor(PlayerData player) => contracts.FirstOrDefault(x => x.player == player);

        public void InitializeContracts(TeamData team)
        {
            contracts.Clear();
            if (team?.players == null) return;
            foreach (var player in team.players)
            {
                if (player == null) continue;
                contracts.Add(new PlayerContract
                {
                    player = player,
                    weeklyWage = Mathf.Max(500, player.overall * 100),
                    weeksRemaining = 104,
                    morale = 70
                });
            }
        }

        public bool RenewContract(PlayerData player, int newWeeklyWage, int weeks = 104)
        {
            var contract = ContractFor(player);
            if (contract == null || newWeeklyWage < contract.weeklyWage || weeks <= 0) return false;
            contract.weeklyWage = newWeeklyWage;
            contract.weeksRemaining = weeks;
            contract.transferRequested = false;
            contract.morale = Mathf.Clamp(contract.morale + 8, 0, 100);
            CareerChanged?.Invoke();
            return true;
        }

        public void RecordPlayingTime(PlayerData player, bool started)
        {
            var contract = ContractFor(player);
            if (contract == null || contract.expired) return;
            contract.appearances++;
            if (started) { contract.starts++; contract.morale = Mathf.Clamp(contract.morale + 2, 0, 100); }
            else contract.morale = Mathf.Clamp(contract.morale - 1, 0, 100);
            if (contract.morale < 30) contract.transferRequested = true;
            CareerChanged?.Invoke();
        }

        public void AdvanceContractWeek()
        {
            foreach (var contract in contracts)
            {
                if (contract.weeksRemaining > 0) contract.weeksRemaining--;
                if (contract.weeksRemaining == 0) contract.transferRequested = true;
            }
            CareerChanged?.Invoke();
        }

        public void CreditTransferBudget(int amount)
        {
            if (amount <= 0) return;
            TransferBudget = Mathf.Min(int.MaxValue, TransferBudget + amount);
            CareerChanged?.Invoke();
        }

        public bool AddPlayerToSquad(PlayerData player, int weeklyWage)
        {
            if (userTeam?.players == null || player == null || userTeam.players.Any(x => x.id == player.id)) return false;
            userTeam.players.Add(player);
            contracts.Add(new PlayerContract { player = player, weeklyWage = Mathf.Max(500, weeklyWage), weeksRemaining = 104, morale = 75 });
            CareerChanged?.Invoke();
            return true;
        }

        public bool RemovePlayerFromSquad(PlayerData player)
        {
            if (userTeam?.players == null || player == null || !userTeam.players.Remove(player)) return false;
            contracts.RemoveAll(x => x.player == player);
            CareerChanged?.Invoke();
            return true;
        }

        public bool CanAfford(int fee) => fee >= 0 && fee <= TransferBudget;
        public bool SpendTransferBudget(int fee) { if (!CanAfford(fee)) return false; TransferBudget -= fee; CareerChanged?.Invoke(); return true; }
    }
}
