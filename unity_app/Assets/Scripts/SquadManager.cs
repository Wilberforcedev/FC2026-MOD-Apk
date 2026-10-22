using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    public sealed class SquadManager : MonoBehaviour
    {
        public TeamData CurrentTeam { get; private set; }
        public IReadOnlyList<PlayerData> StartingEleven => startingEleven;
        public int TeamChemistry => Mathf.Clamp(88 + startingEleven.Count(p => p != null) / 2, 0, 100);
        public event Action SquadChanged;

        [SerializeField] private List<PlayerData> startingEleven = new();

        public void Initialize(TeamData team)
        {
            CurrentTeam = team;
            startingEleven = team != null ? team.players.Where(player => player != null).Take(11).ToList() : new List<PlayerData>();
            SquadChanged?.Invoke();
        }

        /// <summary>Notify roster mutations without discarding the user's current starting eleven.</summary>
        public void NotifyRosterChanged()
        {
            if (CurrentTeam == null) { startingEleven.Clear(); SquadChanged?.Invoke(); return; }
            startingEleven = startingEleven.Where(player => player != null && CurrentTeam.players.Any(item => item != null && item.id == player.id)).ToList();
            foreach (var player in CurrentTeam.players.Where(player => player != null))
            {
                if (startingEleven.Count >= 11) break;
                if (startingEleven.All(item => item.id != player.id)) startingEleven.Add(player);
            }
            SquadChanged?.Invoke();
        }

        public void SetPlayer(int slot, PlayerData player)
        {
            if (slot < 0 || slot >= 11) return;
            while (startingEleven.Count < 11) startingEleven.Add(null);
            startingEleven[slot] = player;
            SquadChanged?.Invoke();
        }

        public void SwapPlayers(int firstSlot, int secondSlot)
        {
            if (firstSlot < 0 || secondSlot < 0 || firstSlot >= 11 || secondSlot >= 11) return;
            (startingEleven[firstSlot], startingEleven[secondSlot]) = (startingEleven[secondSlot], startingEleven[firstSlot]);
            SquadChanged?.Invoke();
        }

        public PlayerData FindBest(PlayerPosition position) => CurrentTeam?.players
            .Where(p => p.position == position)
            .OrderByDescending(p => p.overall)
            .FirstOrDefault();
    }
}
