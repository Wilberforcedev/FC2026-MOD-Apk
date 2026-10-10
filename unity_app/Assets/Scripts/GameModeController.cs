using System;
using UnityEngine;

namespace FC2026
{
    public sealed class GameModeController : MonoBehaviour
    {
        public GameMode CurrentMode { get; private set; } = GameMode.Home;
        public event Action<GameMode> ModeChanged;

        public void OpenHome() => SetMode(GameMode.Home);
        public void OpenKickoff() => SetMode(GameMode.Kickoff);
        public void OpenCareer() => SetMode(GameMode.Career);
        public void OpenChampionsCup() => SetMode(GameMode.ChampionsCup);
        public void OpenPenaltyDuel() => SetMode(GameMode.PenaltyDuel);
        public void OpenPractice() => SetMode(GameMode.Practice);
        public void OpenSquadManagement() => SetMode(GameMode.SquadManagement);

        private void SetMode(GameMode next)
        {
            if (CurrentMode == next) return;
            CurrentMode = next;
            ModeChanged?.Invoke(next);
        }
    }
}
