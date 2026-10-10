using System;
using UnityEngine;

namespace FC2026
{
    public sealed class MatchManager : MonoBehaviour
    {
        public MatchState State { get; private set; } = MatchState.Menu;
        public MatchConfig Config { get; private set; }
        public float MatchSeconds { get; private set; }
        public int HomeScore { get; private set; }
        public int AwayScore { get; private set; }
        public event Action MatchStarted;
        public event Action MatchPaused;
        public event Action<int, int> ScoreChanged;
        public event Action<MatchState> StateChanged;

        public void StartMatch(MatchConfig config)
        {
            Config = config;
            MatchSeconds = 0f;
            HomeScore = 0;
            AwayScore = 0;
            SetState(MatchState.Playing);
            MatchStarted?.Invoke();
        }

        public void TogglePause()
        {
            if (State == MatchState.Playing) { SetState(MatchState.Paused); MatchPaused?.Invoke(); }
            else if (State == MatchState.Paused) SetState(MatchState.Playing);
        }

        public void RegisterGoal(bool homeTeam)
        {
            if (State != MatchState.Playing) return;
            if (homeTeam) HomeScore++; else AwayScore++;
            ScoreChanged?.Invoke(HomeScore, AwayScore);
        }

        private void Update()
        {
            if (State != MatchState.Playing || Config == null) return;
            MatchSeconds += Time.deltaTime;
            var halfSeconds = Config.halfLengthMinutes * 60f;
            if (MatchSeconds >= halfSeconds && MatchSeconds < halfSeconds + 1f) SetState(MatchState.HalfTime);
            if (MatchSeconds >= halfSeconds * 2f) SetState(MatchState.FullTime);
        }

        private void SetState(MatchState next)
        {
            State = next;
            StateChanged?.Invoke(next);
        }
    }
}
