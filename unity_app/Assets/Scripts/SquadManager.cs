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
            startingEleven = team.players.Take(11).ToList();
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
