using System.Collections.Generic;
using UnityEngine;

namespace FC2026
{
    public sealed class GameBootstrap : MonoBehaviour
    {
        public static GameBootstrap Instance { get; private set; }
        public SquadManager Squad { get; private set; }
        public MatchManager Match { get; private set; }
        public GameModeController Modes { get; private set; }
        public TeamData UserTeam { get; private set; }
        public TeamData OpponentTeam { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            Squad = GetComponent<SquadManager>() ?? gameObject.AddComponent<SquadManager>();
            Match = GetComponent<MatchManager>() ?? gameObject.AddComponent<MatchManager>();
            Modes = GetComponent<GameModeController>() ?? gameObject.AddComponent<GameModeController>();
            UserTeam = CreateCityTeam();
            OpponentTeam = CreateArsenalTeam();
            Squad.Initialize(UserTeam);
        }

        public void StartKickoff()
        {
            Modes.OpenKickoff();
            Match.StartMatch(new MatchConfig { homeTeam = UserTeam, awayTeam = OpponentTeam, mode = GameMode.Kickoff });
        }

        private static TeamData CreateCityTeam() => new()
        {
            id = "city",
            displayName = "FC City",
            formation = "4-3-3",
            primaryColor = new Color(0.25f, 0.72f, 0.95f),
            players = new List<PlayerData>
            {
                P("ederson", "Ederson", PlayerPosition.GK, 89, 62, 25, 88), P("cancelo", "Cancelo", PlayerPosition.LB, 86, 89, 65, 86),
                P("dias", "Rúben Dias", PlayerPosition.CB, 88, 71, 42, 82), P("stones", "Stones", PlayerPosition.CB, 85, 72, 52, 81),
                P("walker", "Walker", PlayerPosition.RB, 84, 92, 54, 76), P("rodri", "Rodri", PlayerPosition.CDM, 91, 68, 82, 94),
                P("kdb", "De Bruyne", PlayerPosition.CM, 90, 74, 91, 95), P("bernardo", "Bernardo", PlayerPosition.CAM, 88, 82, 79, 91),
                P("grealish", "Grealish", PlayerPosition.LW, 86, 84, 78, 87), P("haaland", "Haaland", PlayerPosition.ST, 93, 89, 96, 78),
                P("foden", "Foden", PlayerPosition.RW, 88, 91, 86, 88)
            }
        };

        private static TeamData CreateArsenalTeam() => new()
        {
            id = "arsenal", displayName = "North London", formation = "4-3-3", primaryColor = new Color(0.9f, 0.18f, 0.2f),
            players = new List<PlayerData>
            {
                P("raya", "Raya", PlayerPosition.GK, 86, 50, 20, 84), P("white", "White", PlayerPosition.RB, 84, 80, 54, 80),
                P("saliba", "Saliba", PlayerPosition.CB, 89, 84, 44, 78), P("gabriel", "Gabriel", PlayerPosition.CB, 87, 78, 48, 74),
                P("timber", "Timber", PlayerPosition.LB, 83, 83, 56, 79), P("rice", "Rice", PlayerPosition.CDM, 89, 79, 78, 86),
                P("odegaard", "Ødegaard", PlayerPosition.CAM, 90, 77, 84, 92), P("merino", "Merino", PlayerPosition.CM, 84, 75, 78, 83),
                P("saka", "Saka", PlayerPosition.RW, 89, 88, 85, 86), P("havertz", "Havertz", PlayerPosition.ST, 85, 82, 82, 82),
                P("martinelli", "Martinelli", PlayerPosition.LW, 85, 92, 80, 79)
            }
        };

        private static PlayerData P(string id, string name, PlayerPosition position, int overall, int pace, int shooting, int passing) => new()
        {
            id = id, displayName = name, position = position, overall = overall, pace = pace, shooting = shooting, passing = passing,
            dribbling = Mathf.Clamp((pace + passing) / 2, 1, 99), defending = position is PlayerPosition.CB or PlayerPosition.CDM ? 85 : 45,
            physicality = position is PlayerPosition.ST or PlayerPosition.CB ? 82 : 72, isGoalkeeper = position == PlayerPosition.GK
        };
    }
}
