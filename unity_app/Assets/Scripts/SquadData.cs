using System;
using System.Collections.Generic;
using UnityEngine;

namespace FC2026
{
    public enum PlayerPosition { GK, LB, CB, RB, CDM, CM, CAM, LW, RW, ST }
    public enum GameMode { Home, Kickoff, Career, ChampionsCup, PenaltyDuel, Practice, SquadManagement }
    public enum MatchState { Menu, PreMatch, Playing, HalfTime, FullTime, Paused }

    [Serializable]
    public class PlayerData
    {
        public string id;
        public string displayName;
        public PlayerPosition position;
        [Range(1, 99)] public int overall = 80;
        [Range(1, 99)] public int pace = 75;
        [Range(1, 99)] public int shooting = 70;
        [Range(1, 99)] public int passing = 75;
        [Range(1, 99)] public int dribbling = 75;
        [Range(1, 99)] public int defending = 50;
        [Range(1, 99)] public int physicality = 70;
        public bool isGoalkeeper;
    }

    [Serializable]
    public class TeamData
    {
        public string id;
        public string displayName;
        public Color primaryColor = new(0.2f, 0.65f, 0.9f);
        public Color secondaryColor = Color.white;
        public string formation = "4-3-3";
        public List<PlayerData> players = new();
    }

    [Serializable]
    public class FormationSlot
    {
        public PlayerPosition position;
        [Range(0f, 1f)] public float normalizedX;
        [Range(0f, 1f)] public float normalizedY;
        public int playerIndex;
    }

    [Serializable]
    public class MatchConfig
    {
        public TeamData homeTeam;
        public TeamData awayTeam;
        public GameMode mode;
        public float halfLengthMinutes = 3f;
        public bool extraTime;
    }
}
