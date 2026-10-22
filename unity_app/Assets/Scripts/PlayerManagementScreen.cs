using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    /// <summary>
    /// Runtime create/edit player screen. Add to a scene with a SquadManager reference.
    /// Uses Unity IMGUI so it works without additional prefab or package setup.
    /// Custom player changes are saved to Application.persistentDataPath/custom-players.json.
    /// </summary>
    public sealed class PlayerManagementScreen : MonoBehaviour
    {
        [SerializeField] private SquadManager squadManager;
        [SerializeField] private bool visible;
        [SerializeField] private int minimumPanelWidth = 420;
        [SerializeField] private int maximumPanelWidth = 760;

        private readonly List<PlayerData> customPlayers = new();
        private Vector2 playerListScroll;
        private Vector2 formScroll;
        private string search = string.Empty;
        private string playerName = string.Empty;
        private string validationMessage = string.Empty;
        private PlayerPosition position = PlayerPosition.ST;
        private int overall = 70, pace = 70, shooting = 70, passing = 70;
        private int dribbling = 70, defending = 50, physicality = 70;
        private string editingId;
        private bool isEditing;
        private GUIStyle headingStyle, sectionStyle, mutedStyle, cardStyle, buttonStyle;
        private bool stylesReady;

        private string SavePath => Path.Combine(Application.persistentDataPath, "custom-players.json");

        private void Awake()
        {
            if (squadManager == null) squadManager = FindObjectOfType<SquadManager>();
            LoadCustomPlayers();
        }

        public void Open()
        {
            visible = true;
            ResetForm();
        }

        public void Close() => visible = false;

        private void OnGUI()
        {
            if (!visible) return;
            EnsureStyles();

            float width = Mathf.Clamp(Screen.width * 0.92f, minimumPanelWidth, maximumPanelWidth);
            float height = Mathf.Min(Screen.height * 0.9f, 900f);
            Rect panel = new Rect((Screen.width - width) * 0.5f, (Screen.height - height) * 0.5f, width, height);

            DrawPanel(panel);
        }

        private void DrawPanel(Rect panel)
        {
            Color oldColor = GUI.color;
            GUI.color = new Color(0.015f, 0.025f, 0.05f, 0.98f);
            GUI.Box(panel, GUIContent.none);
            GUI.color = oldColor;

            GUILayout.BeginArea(new Rect(panel.x + 18, panel.y + 14, panel.width - 36, panel.height - 28));
            GUILayout.BeginHorizontal();
            GUILayout.Label("PLAYER LAB", headingStyle);
            GUILayout.FlexibleSpace();
            if (GUILayout.Button("CLOSE", GUILayout.Width(74), GUILayout.Height(34))) visible = false;
            GUILayout.EndHorizontal();
            GUILayout.Label("CREATE PLAYERS • EDIT ATTRIBUTES • MANAGE YOUR SQUAD", mutedStyle);
            GUILayout.Space(10);

            if (squadManager == null || squadManager.CurrentTeam == null)
            {
                GUILayout.Label("No active team is connected. Assign SquadManager and initialize a team first.", sectionStyle);
                GUILayout.EndArea();
                return;
            }

            GUILayout.Label("CURRENT CLUB  /  " + squadManager.CurrentTeam.displayName, sectionStyle);
            GUILayout.BeginHorizontal();
            DrawPlayerList(GUILayout.Width(panel.width * 0.40f - 10), panel.height - 155);
            DrawPlayerForm(panel.width * 0.60f - 25, panel.height - 155);
            GUILayout.EndHorizontal();

            if (!string.IsNullOrEmpty(validationMessage))
                GUILayout.Label(validationMessage, mutedStyle, GUILayout.Height(36));

            GUILayout.EndArea();
        }

        private void DrawPlayerList(float width, float height)
        {
            GUILayout.BeginVertical(cardStyle, GUILayout.Width(width), GUILayout.Height(height));
            GUILayout.Label("SQUAD PLAYERS", sectionStyle);
            search = GUILayout.TextField(search ?? string.Empty, GUILayout.Height(34));
            playerListScroll = GUILayout.BeginScrollView(playerListScroll);

            var teamPlayers = squadManager.CurrentTeam.players
                .Where(p => p != null && (string.IsNullOrWhiteSpace(search) ||
                    (p.displayName ?? string.Empty).IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0))
                .OrderBy(p => p.displayName)
                .ToList();

            foreach (PlayerData player in teamPlayers)
            {
                GUILayout.BeginVertical(GUI.skin.box);
                GUILayout.Label((player.displayName ?? "Unnamed player") + "  •  " + player.position, sectionStyle);
                GUILayout.Label("OVR " + player.overall + "   PACE " + player.pace + "   SHO " + player.shooting, mutedStyle);
                if (GUILayout.Button("EDIT PLAYER", GUILayout.Height(30))) LoadForEdit(player);
                GUILayout.EndVertical();
                GUILayout.Space(4);
            }

            GUILayout.EndScrollView();
            GUILayout.Label("Total: " + squadManager.CurrentTeam.players.Count, mutedStyle);
            GUILayout.EndVertical();
        }

        private void DrawPlayerForm(float width, float height)
        {
            GUILayout.BeginVertical(cardStyle, GUILayout.Width(width), GUILayout.Height(height));
            formScroll = GUILayout.BeginScrollView(formScroll);
            GUILayout.Label(isEditing ? "EDIT PLAYER" : "CREATE PLAYER", sectionStyle);
            GUILayout.Label("Player name", mutedStyle);
            playerName = GUILayout.TextField(playerName ?? string.Empty, GUILayout.Height(36));
            GUILayout.Label("Position", mutedStyle);
            position = (PlayerPosition)GUILayout.SelectionGrid((int)position,
                Enum.GetNames(typeof(PlayerPosition)), 2, GUILayout.Height(120));

            overall = DrawRating("Overall", overall);
            pace = DrawRating("Pace", pace);
            shooting = DrawRating("Shooting", shooting);
            passing = DrawRating("Passing", passing);
            dribbling = DrawRating("Dribbling", dribbling);
            defending = DrawRating("Defending", defending);
            physicality = DrawRating("Physicality", physicality);

            GUILayout.Space(8);
            if (GUILayout.Button(isEditing ? "SAVE PLAYER CHANGES" : "CREATE PLAYER", buttonStyle, GUILayout.Height(44)))
                SavePlayer();
            if (isEditing && GUILayout.Button("CANCEL EDIT", GUILayout.Height(34))) ResetForm();
            GUILayout.EndScrollView();
            GUILayout.EndVertical();
        }

        private int DrawRating(string label, int value)
        {
            GUILayout.BeginHorizontal();
            GUILayout.Label(label, GUILayout.Width(88));
            value = Mathf.Clamp((int)GUILayout.HorizontalSlider(value, 1, 99), 1, 99);
            GUILayout.Label(value.ToString("00"), sectionStyle, GUILayout.Width(28));
            GUILayout.EndHorizontal();
            return value;
        }

        private void LoadForEdit(PlayerData player)
        {
            if (player == null) return;
            editingId = player.id;
            isEditing = true;
            playerName = player.displayName;
            position = player.position;
            overall = player.overall;
            pace = player.pace;
            shooting = player.shooting;
            passing = player.passing;
            dribbling = player.dribbling;
            defending = player.defending;
            physicality = player.physicality;
            validationMessage = "Editing " + player.displayName;
        }

        private void SavePlayer()
        {
            string cleanName = (playerName ?? string.Empty).Trim();
            if (cleanName.Length < 2)
            {
                validationMessage = "Enter a player name with at least two characters.";
                return;
            }

            TeamData team = squadManager.CurrentTeam;
            PlayerData player = isEditing
                ? team.players.FirstOrDefault(p => p != null && p.id == editingId)
                : null;

            if (isEditing && player == null)
            {
                validationMessage = "This player is no longer in the current squad. Select a player again.";
                ResetForm();
                return;
            }

            if (!isEditing)
            {
                player = new PlayerData { id = Guid.NewGuid().ToString("N") };
                team.players.Add(player);
                customPlayers.Add(player);
            }

            player.displayName = cleanName;
            player.position = position;
            player.isGoalkeeper = position == PlayerPosition.GK;
            player.overall = overall = Mathf.Clamp(overall, 1, 99);
            player.pace = pace = Mathf.Clamp(pace, 1, 99);
            player.shooting = shooting = Mathf.Clamp(shooting, 1, 99);
            player.passing = passing = Mathf.Clamp(passing, 1, 99);
            player.dribbling = dribbling = Mathf.Clamp(dribbling, 1, 99);
            player.defending = defending = Mathf.Clamp(defending, 1, 99);
            player.physicality = physicality = Mathf.Clamp(physicality, 1, 99);

            if (isEditing)
            {
                int customIndex = customPlayers.FindIndex(p => p != null && p.id == player.id);
                if (customIndex >= 0) customPlayers[customIndex] = player;
            }

            PersistCustomPlayers();
            validationMessage = (isEditing ? "Updated " : "Created ") + player.displayName + " successfully.";
            ResetForm(keepMessage: true);
            SendMessageUpwards("OnPlayersChanged", SendMessageOptions.DontRequireReceiver);
        }

        private void ResetForm(bool keepMessage = false)
        {
            isEditing = false;
            editingId = null;
            playerName = string.Empty;
            position = PlayerPosition.ST;
            overall = 70; pace = 70; shooting = 70; passing = 70;
            dribbling = 70; defending = 50; physicality = 70;
            if (!keepMessage) validationMessage = string.Empty;
        }

        private void LoadCustomPlayers()
        {
            try
            {
                if (!File.Exists(SavePath)) return;
                PlayerDataList wrapper = JsonUtility.FromJson<PlayerDataList>(File.ReadAllText(SavePath));
                if (wrapper?.players == null) return;
                customPlayers.Clear();
                customPlayers.AddRange(wrapper.players.Where(p => p != null));
            }
            catch (Exception ex)
            {
                Debug.LogWarning("Could not load custom players: " + ex.Message);
            }
        }

        private void PersistCustomPlayers()
        {
            try
            {
                string directory = Path.GetDirectoryName(SavePath);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                File.WriteAllText(SavePath, JsonUtility.ToJson(new PlayerDataList { players = customPlayers }, true));
            }
            catch (Exception ex)
            {
                validationMessage = "Player updated in this session, but save failed: " + ex.Message;
                Debug.LogError(validationMessage);
            }
        }

        [Serializable]
        private sealed class PlayerDataList
        {
            public List<PlayerData> players = new();
        }

        private void EnsureStyles()
        {
            if (stylesReady) return;
            headingStyle = new GUIStyle(GUI.skin.label) { fontSize = 24, fontStyle = FontStyle.Bold, normal = { textColor = Color.white } };
            sectionStyle = new GUIStyle(GUI.skin.label) { fontSize = 15, fontStyle = FontStyle.Bold, normal = { textColor = new Color(0.15f, 0.9f, 0.98f) } };
            mutedStyle = new GUIStyle(GUI.skin.label) { fontSize = 11, wordWrap = true, normal = { textColor = new Color(0.7f, 0.76f, 0.84f) } };
            cardStyle = new GUIStyle(GUI.skin.box) { padding = new RectOffset(10, 10, 10, 10), normal = { background = GUI.skin.box.normal.background } };
            buttonStyle = new GUIStyle(GUI.skin.button) { fontSize = 13, fontStyle = FontStyle.Bold };
            stylesReady = true;
        }
    }
}
