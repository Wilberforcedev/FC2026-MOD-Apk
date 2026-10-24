using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Lightweight offline career hub for the procedural Unity 3D prototype.
    /// It lets players choose a club, create/resume a save, and launch a match.
    /// Match completion updates the saved season record and returns the player to this hub.
    /// </summary>
    public sealed class CareerHubManager : MonoBehaviour
    {
        private static readonly string[] ClubIds =
        {
            "kampala_city", "villa", "express", "bright_stars"
        };

        private static readonly string[] ClubNames =
        {
            "Kampala City", "Villa FC", "Express FC", "Bright Stars"
        };

        private CareerSaveData save;
        private int selectedClub;
        private GUIStyle titleStyle;
        private GUIStyle bodyStyle;
        private GUIStyle buttonStyle;
        private string notice = "Choose a club to begin your career.";
        private bool showLeagueTable;
        private bool showSquadManagement;

        private void Awake()
        {
            save = CareerSaveSystem.Load();
            if (save != null)
            {
                selectedClub = FindClubIndex(save.managedClubId);
                notice = "Career loaded. Select Resume to continue.";
            }
        }

        private void OnGUI()
        {
            if (save != null && MatchIsRunning())
                return;

            titleStyle ??= new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.height / 16, 28, 54),
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = Color.white }
            };
            bodyStyle ??= new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.height / 38, 16, 26),
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                normal = { textColor = new Color(0.82f, 0.91f, 0.97f) }
            };
            buttonStyle ??= new GUIStyle(GUI.skin.button)
            {
                fontSize = Mathf.Clamp(Screen.height / 42, 16, 25),
                fontStyle = FontStyle.Bold,
                wordWrap = true
            };

            var panelWidth = Mathf.Min(Screen.width - 32f, 760f);
            var panelHeight = Mathf.Min(Screen.height - 32f, 660f);
            var panel = new Rect((Screen.width - panelWidth) / 2f,
                (Screen.height - panelHeight) / 2f, panelWidth, panelHeight);
            GUI.Box(panel, string.Empty);

            if (showLeagueTable)
            {
                DrawLeagueTable(panel);
                return;
            }
            if (showSquadManagement)
            {
                DrawSquadManagement(panel);
                return;
            }

            var x = panel.x + 24f;
            var width = panel.width - 48f;
            var y = panel.y + 18f;
            GUI.Label(new Rect(x, y, width, 64f), "FC 2026  |  CAREER MODE", titleStyle);
            y += 72f;
            GUI.Label(new Rect(x, y, width, 44f), "Choose your club", bodyStyle);
            y += 48f;

            var gap = 8f;
            var buttonWidth = (width - gap) / 2f;
            var buttonHeight = Mathf.Clamp(panel.height * 0.105f, 52f, 76f);
            for (var i = 0; i < ClubNames.Length; i++)
            {
                var column = i % 2;
                var row = i / 2;
                var rect = new Rect(x + column * (buttonWidth + gap),
                    y + row * (buttonHeight + gap), buttonWidth, buttonHeight);
                var label = (selectedClub == i ? "✓  " : string.Empty) + ClubNames[i];
                if (GUI.Button(rect, label, buttonStyle))
                {
                    selectedClub = i;
                    notice = "Selected " + ClubNames[i] + ".";
                }
            }

            y += 2f * (buttonHeight + gap) + 8f;
            if (save != null)
            {
                GUI.Label(new Rect(x, y, width, 96f),
                    $"Season {save.season}  •  Matchweek {save.matchweek}\n" +
                    $"{ClubDisplayName(save.managedClubId)}  •  Budget: {save.transferBudget:N0}\n" +
                    $"Played {save.played}   W {save.wins}   D {save.draws}   L {save.losses}",
                    bodyStyle);
                y += 100f;
            }
            else
            {
                GUI.Label(new Rect(x, y, width, 48f),
                    "Start a new save to manage your club and season.", bodyStyle);
                y += 52f;
            }

            var actionHeight = Mathf.Clamp(panel.height * 0.105f, 54f, 76f);
            if (GUI.Button(new Rect(x, y, width, actionHeight),
                save == null ? "START CAREER" : "RESUME CAREER", buttonStyle))
            {
                if (save == null)
                {
                    save = new CareerSaveData
                    {
                        managedClubId = ClubIds[selectedClub],
                        season = 1,
                        matchweek = 1,
                        transferBudget = 15000000
                    };
                    if (!CareerSaveSystem.Save(save))
                    {
                        save = null;
                        notice = "Could not save career. Please try again.";
                    }
                    else
                    {
                        notice = "Career created and saved on this device.";
                    }
                }
                else
                {
                    notice = "Career save loaded.";
                }
            }

            y += actionHeight + 8f;
            var actionGap = 8f;
            var actionWidth = (width - actionGap) / 2f;
            GUI.enabled = save != null;
            if (GUI.Button(new Rect(x, y, actionWidth, actionHeight),
                "PLAY NEXT MATCH", buttonStyle))
            {
                enabled = false;
                var manager = GetComponent<MatchManager3D>();
                if (manager == null)
                    gameObject.AddComponent<MatchManager3D>();
            }
            if (GUI.Button(new Rect(x + actionWidth + actionGap, y, actionWidth, actionHeight),
                "SQUAD & TACTICS", buttonStyle))
                showSquadManagement = true;
            GUI.enabled = true;

            y += actionHeight + 6f;
            GUI.Label(new Rect(x, y, width, 42f), notice, bodyStyle);
        }



        private void DrawSquadManagement(Rect panel)
        {
            var x = panel.x + 24f;
            var width = panel.width - 48f;
            var heading = new GUIStyle(titleStyle)
            {
                fontSize = Mathf.Clamp(Screen.height / 19, 24, 42)
            };
            GUI.Label(new Rect(x, panel.y + 20f, width, 58f), "SQUAD & TACTICS", heading);
            GUI.Label(new Rect(x, panel.y + 86f, width, 42f),
                "Choose your formation", bodyStyle);

            var gap = 8f;
            var buttonWidth = (width - gap * 2f) / 3f;
            var buttonHeight = Mathf.Clamp(panel.height * 0.12f, 56f, 78f);
            var formationY = panel.y + 134f;
            for (var i = 0; i < CareerFormationSystem.FormationIds.Length; i++)
            {
                var id = CareerFormationSystem.FormationIds[i];
                var selected = save.formationId == id;
                var label = (selected ? "✓ " : string.Empty) + id;
                if (GUI.Button(new Rect(x + i * (buttonWidth + gap), formationY,
                    buttonWidth, buttonHeight), label, buttonStyle))
                {
                    save.formationId = id;
                    CareerSaveSystem.Save(save);
                    notice = "Formation saved: " + id;
                }
            }

            GUI.Label(new Rect(x, formationY + buttonHeight + 22f, width, 42f),
                "Choose your team mentality", bodyStyle);
            var tacticsY = formationY + buttonHeight + 68f;
            for (var i = 0; i < CareerFormationSystem.TacticalStyles.Length; i++)
            {
                var style = CareerFormationSystem.TacticalStyles[i];
                var selected = save.tacticalStyle == style;
                var label = (selected ? "✓ " : string.Empty) + style;
                if (GUI.Button(new Rect(x + i * (buttonWidth + gap), tacticsY,
                    buttonWidth, buttonHeight), label, buttonStyle))
                {
                    save.tacticalStyle = style;
                    CareerSaveSystem.Save(save);
                    notice = "Team mentality saved: " + style;
                }
            }

            GUI.Label(new Rect(x, tacticsY + buttonHeight + 14f, width, 54f),
                "Changes are saved to your career and used in your next match.", bodyStyle);
            var footerY = panel.y + panel.height - buttonHeight - 18f;
            if (GUI.Button(new Rect(x, footerY, buttonWidth, buttonHeight),
                "BACK", buttonStyle))
                showSquadManagement = false;
            if (GUI.Button(new Rect(x + buttonWidth + gap, footerY,
                buttonWidth * 2f + gap, buttonHeight), "VIEW LEAGUE TABLE", buttonStyle))
                showLeagueTable = true;
        }

        private void DrawLeagueTable(Rect panel)
        {
            var x = panel.x + 22f;
            var width = panel.width - 44f;
            var title = new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.height / 17, 24, 44),
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = Color.white }
            };
            var cell = new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.height / 52, 12, 20),
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = new Color(0.9f, 0.95f, 1f) }
            };
            GUI.Label(new Rect(x, panel.y + 18f, width, 58f),
                $"SEASON {save.season}  •  LEAGUE TABLE", title);

            var rowY = panel.y + 92f;
            var rowHeight = Mathf.Clamp(panel.height * 0.09f, 34f, 54f);
            var columns = new[] { 0f, 0.08f, 0.42f, 0.52f, 0.62f, 0.72f, 0.82f, 0.91f, 1f };
            var headers = new[] { "#", "CLUB", "P", "W", "D", "L", "GD", "PTS" };
            for (var i = 0; i < headers.Length; i++)
            {
                var left = x + width * columns[i];
                var right = x + width * columns[i + 1];
                GUI.Label(new Rect(left, rowY, right - left, rowHeight), headers[i], cell);
            }

            rowY += rowHeight;
            var ranked = CareerLeagueSystem.GetRankedStandings(save);
            for (var i = 0; i < ranked.Length; i++)
            {
                var standing = ranked[i];
                var values = new[]
                {
                    (i + 1).ToString(), CareerLeagueSystem.GetClubName(standing.clubId),
                    standing.played.ToString(), standing.wins.ToString(),
                    standing.draws.ToString(), standing.losses.ToString(),
                    standing.GoalDifference.ToString("+0;-0;0"), standing.Points.ToString()
                };
                for (var column = 0; column < values.Length; column++)
                {
                    var left = x + width * columns[column];
                    var right = x + width * columns[column + 1];
                    GUI.Label(new Rect(left, rowY, right - left, rowHeight), values[column], cell);
                }
                rowY += rowHeight;
            }

            var buttonHeight = Mathf.Clamp(panel.height * 0.1f, 48f, 68f);
            if (GUI.Button(new Rect(x, panel.y + panel.height - buttonHeight - 20f,
                width, buttonHeight), "BACK TO CAREER", buttonStyle))
                showLeagueTable = false;
        }

        public void RefreshCareer()
        {
            save = CareerSaveSystem.Load();
            if (save != null)
            {
                selectedClub = FindClubIndex(save.managedClubId);
                notice = "Match result saved. Career updated.";
            }
            else notice = "Match ended. Start a career to save progress.";
        }

        private bool MatchIsRunning()
        {
            return GetComponent<MatchManager3D>() != null && !enabled;
        }

        private static int FindClubIndex(string clubId)
        {
            for (var i = 0; i < ClubIds.Length; i++)
                if (ClubIds[i] == clubId)
                    return i;
            return 0;
        }

        private static string ClubDisplayName(string clubId)
        {
            return ClubNames[FindClubIndex(clubId)];
        }
    }
}
