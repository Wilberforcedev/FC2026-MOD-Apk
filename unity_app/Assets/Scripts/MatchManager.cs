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
        [SerializeField, Min(0f)] private float halfTimeBreakSeconds = 1.5f;
        private float halfTimeElapsed;
        private bool halfTimeAnnounced;

        public void StartMatch(MatchConfig config)
        {
            Config = config;
            MatchSeconds = 0f;
            HomeScore = 0;
            AwayScore = 0;
            halfTimeElapsed = 0f;
            halfTimeAnnounced = false;
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
            if (Config == null || State == MatchState.Menu || State == MatchState.Paused || State == MatchState.FullTime) return;
            if (State == MatchState.HalfTime)
            {
                halfTimeElapsed += Time.deltaTime;
                if (halfTimeElapsed >= halfTimeBreakSeconds) SetState(MatchState.Playing);
                return;
            }
            if (State != MatchState.Playing) return;
            MatchSeconds += Time.deltaTime;
            float halfSeconds = Mathf.Max(1f, Config.halfLengthMinutes * 60f);
            if (!halfTimeAnnounced && MatchSeconds >= halfSeconds)
            {
                halfTimeAnnounced = true;
                halfTimeElapsed = 0f;
                SetState(MatchState.HalfTime);
                return;
            }
            if (MatchSeconds >= halfSeconds * 2f) SetState(MatchState.FullTime);
        }

        private void SetState(MatchState next)
        {
            State = next;
            StateChanged?.Invoke(next);
        }
    }
}
