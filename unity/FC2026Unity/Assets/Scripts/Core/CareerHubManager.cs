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

            var safeArea = Screen.safeArea;
            var safeTop = Screen.height - safeArea.yMax;
            var panelWidth = Mathf.Min(safeArea.width - 32f, 960f);
            var panelHeight = Mathf.Min(safeArea.height - 24f, 660f);
            var panel = new Rect(
                safeArea.xMin + (safeArea.width - panelWidth) * 0.5f,
                safeTop + (safeArea.height - panelHeight) * 0.5f,
                panelWidth, panelHeight);
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

            if (panel.width > panel.height)
            {
                DrawCareerHomeLandscape(panel);
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
                var fixture = CareerLeagueSystem.GetFixtureForClub(save.managedClubId, save.matchweek);
                var opponentId = fixture == null
                    ? string.Empty
                    : fixture.HomeClubId == save.managedClubId ? fixture.AwayClubId : fixture.HomeClubId;
                var venue = fixture == null
                    ? "FIXTURE UNAVAILABLE"
                    : fixture.HomeClubId == save.managedClubId ? "HOME v" : "AWAY at";
                GUI.Label(new Rect(x, y, width, 96f),
                    $"Season {save.season}  •  Matchweek {save.matchweek}/{CareerLeagueSystem.MatchweeksPerSeason}\n" +
                    $"{ClubDisplayName(save.managedClubId)}  •  {venue} {CareerLeagueSystem.GetClubName(opponentId)}\n" +
                    $"Budget: {save.transferBudget:N0}  •  Played {save.played}   W {save.wins}   D {save.draws}   L {save.losses}",
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
                StartOrResumeCareer();

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



        private void DrawCareerHomeLandscape(Rect panel)
        {
            var inset = Mathf.Clamp(panel.width * 0.025f, 14f, 24f);
            var headerHeight = Mathf.Clamp(panel.height * 0.14f, 40f, 54f);
            GUI.Label(new Rect(panel.x + inset, panel.y + 8f,
                panel.width - inset * 2f, headerHeight),
                "FC 2026  |  CAREER MODE", titleStyle);

            var gap = Mathf.Clamp(panel.width * 0.018f, 8f, 14f);
            var cardY = panel.y + headerHeight + 8f;
            var cardHeight = panel.yMax - cardY - 14f;
            var cardWidth = (panel.width - inset * 2f - gap) * 0.5f;
            var leftCard = new Rect(panel.x + inset, cardY, cardWidth, cardHeight);
            var rightCard = new Rect(leftCard.xMax + gap, cardY, cardWidth, cardHeight);
            GUI.Box(leftCard, string.Empty);
            GUI.Box(rightCard, string.Empty);

            var pad = 12f;
            GUI.Label(new Rect(leftCard.x + pad, leftCard.y + 6f,
                leftCard.width - pad * 2f, 30f), "CHOOSE YOUR CLUB", bodyStyle);
            var clubGap = 6f;
            var clubButtonHeight = Mathf.Clamp(cardHeight * 0.19f, 38f, 52f);
            var clubButtonWidth = (leftCard.width - pad * 2f - clubGap) * 0.5f;
            var clubY = leftCard.y + 42f;
            var canChooseClub = save == null;
            GUI.enabled = canChooseClub;
            for (var i = 0; i < ClubNames.Length; i++)
            {
                var column = i % 2;
                var row = i / 2;
                var rect = new Rect(leftCard.x + pad + column * (clubButtonWidth + clubGap),
                    clubY + row * (clubButtonHeight + clubGap),
                    clubButtonWidth, clubButtonHeight);
                var label = (selectedClub == i ? "✓  " : string.Empty) + ClubNames[i];
                if (GUI.Button(rect, label, buttonStyle))
                {
                    selectedClub = i;
                    notice = "Selected " + ClubNames[i] + ".";
                }
            }
            GUI.enabled = true;

            var selectionY = clubY + 2f * (clubButtonHeight + clubGap) + 2f;
            var selectedLabel = save != null
                ? "MANAGED CLUB"
                : "SELECTED CLUB";
            var clubLabel = save != null
                ? ClubDisplayName(save.managedClubId)
                : ClubNames[Mathf.Clamp(selectedClub, 0, ClubNames.Length - 1)];
            GUI.Label(new Rect(leftCard.x + pad, selectionY,
                leftCard.width - pad * 2f, 28f), selectedLabel, labelSmallStyle);
            GUI.Label(new Rect(leftCard.x + pad, selectionY + 24f,
                leftCard.width - pad * 2f, 32f), clubLabel, bodyStyle);

            GUI.Label(new Rect(rightCard.x + pad, rightCard.y + 6f,
                rightCard.width - pad * 2f, 30f), "CAREER OVERVIEW", bodyStyle);
            var infoY = rightCard.y + 40f;
            var infoHeight = Mathf.Clamp(cardHeight * 0.27f, 58f, 78f);
            GUI.Box(new Rect(rightCard.x + pad, infoY,
                rightCard.width - pad * 2f, infoHeight), string.Empty);
            if (save != null)
            {
                var fixture = CareerLeagueSystem.GetFixtureForClub(save.managedClubId, save.matchweek);
                var opponentId = fixture == null
                    ? string.Empty
                    : fixture.HomeClubId == save.managedClubId ? fixture.AwayClubId : fixture.HomeClubId;
                var venue = fixture == null
                    ? "FIXTURE UNAVAILABLE"
                    : fixture.HomeClubId == save.managedClubId ? "HOME v" : "AWAY at";
                GUI.Label(new Rect(rightCard.x + pad + 6f, infoY + 3f,
                    rightCard.width - pad * 2f - 12f, infoHeight - 6f),
                    $"SEASON {save.season}  •  WEEK {save.matchweek}/{CareerLeagueSystem.MatchweeksPerSeason}\n" +
                    $"{venue} {CareerLeagueSystem.GetClubName(opponentId)}\n" +
                    $"BUDGET {save.transferBudget:N0}  •  P {save.played}  W {save.wins}  D {save.draws}  L {save.losses}",
                    labelSmallStyle);
            }
            else
            {
                GUI.Label(new Rect(rightCard.x + pad + 8f, infoY + 6f,
                    rightCard.width - pad * 2f - 16f, infoHeight - 12f),
                    "Start a career to manage your club and season.", bodyStyle);
            }

            var actionHeight = Mathf.Clamp(cardHeight * 0.17f, 38f, 50f);
            var actionY = infoY + infoHeight + 7f;
            if (GUI.Button(new Rect(rightCard.x + pad, actionY,
                rightCard.width - pad * 2f, actionHeight),
                save == null ? "START CAREER" : "RESUME CAREER", buttonStyle))
                StartOrResumeCareer();

            actionY += actionHeight + 5f;
            var actionGap = 6f;
            var actionWidth = (rightCard.width - pad * 2f - actionGap) * 0.5f;
            GUI.enabled = save != null;
            if (GUI.Button(new Rect(rightCard.x + pad, actionY,
                actionWidth, actionHeight), "PLAY NEXT MATCH", buttonStyle))
            {
                enabled = false;
                var manager = GetComponent<MatchManager3D>();
                if (manager == null)
                    gameObject.AddComponent<MatchManager3D>();
            }
            if (GUI.Button(new Rect(rightCard.x + pad + actionWidth + actionGap, actionY,
                actionWidth, actionHeight), "SQUAD & TACTICS", buttonStyle))
                showSquadManagement = true;
            GUI.enabled = true;

            actionY += actionHeight + 5f;
            var tableHeight = Mathf.Clamp(actionHeight * 0.86f, 34f, 44f);
            if (GUI.Button(new Rect(rightCard.x + pad, actionY,
                rightCard.width - pad * 2f, tableHeight), "VIEW LEAGUE TABLE", buttonStyle))
                showLeagueTable = true;

            var noticeY = actionY + tableHeight + 2f;
            GUI.Label(new Rect(rightCard.x + pad, noticeY,
                rightCard.width - pad * 2f, Mathf.Max(24f, rightCard.yMax - noticeY - 4f)),
                notice, labelSmallStyle);
        }

        private void DrawSquadManagementLandscape(Rect panel)
        {
            var inset = Mathf.Clamp(panel.width * 0.025f, 14f, 24f);
            var headerHeight = Mathf.Clamp(panel.height * 0.14f, 40f, 54f);
            GUI.Label(new Rect(panel.x + inset, panel.y + 8f,
                panel.width - inset * 2f, headerHeight), "SQUAD & TACTICS", titleStyle);

            var gap = Mathf.Clamp(panel.width * 0.018f, 8f, 14f);
            var footerButtonHeight = Mathf.Clamp(panel.height * 0.14f, 38f, 50f);
            var footerY = panel.yMax - footerButtonHeight - 14f;
            var cardY = panel.y + headerHeight + 8f;
            var cardHeight = footerY - cardY - 10f;
            var cardWidth = (panel.width - inset * 2f - gap) * 0.5f;
            var formationCard = new Rect(panel.x + inset, cardY, cardWidth, cardHeight);
            var tacticsCard = new Rect(formationCard.xMax + gap, cardY, cardWidth, cardHeight);
            GUI.Box(formationCard, string.Empty);
            GUI.Box(tacticsCard, string.Empty);

            var pad = 12f;
            GUI.Label(new Rect(formationCard.x + pad, formationCard.y + 6f,
                formationCard.width - pad * 2f, 28f), "FORMATION", bodyStyle);
            GUI.Label(new Rect(tacticsCard.x + pad, tacticsCard.y + 6f,
                tacticsCard.width - pad * 2f, 28f), "TEAM MENTALITY", bodyStyle);

            var formationCount = CareerFormationSystem.FormationIds.Length;
            var formationColumns = Mathf.Min(formationCount, 2);
            var formationGap = 6f;
            var formationWidth = (formationCard.width - pad * 2f - formationGap) * 0.5f;
            var formationHeight = Mathf.Clamp(cardHeight * 0.24f, 38f, 50f);
            var formationY = formationCard.y + 40f;
            for (var i = 0; i < formationCount; i++)
            {
                var id = CareerFormationSystem.FormationIds[i];
                var selected = save.formationId == id;
                var rect = new Rect(formationCard.x + pad + (i % formationColumns) * (formationWidth + formationGap),
                    formationY + (i / formationColumns) * (formationHeight + formationGap),
                    formationWidth, formationHeight);
                if (GUI.Button(rect, (selected ? "✓ " : string.Empty) + id, buttonStyle))
                {
                    save.formationId = id;
                    CareerSaveSystem.Save(save);
                    notice = "Formation saved: " + id;
                }
            }

            var styleCount = CareerFormationSystem.TacticalStyles.Length;
            var styleColumns = Mathf.Min(styleCount, 2);
            var styleWidth = (tacticsCard.width - pad * 2f - formationGap) * 0.5f;
            var styleHeight = Mathf.Clamp(cardHeight * 0.24f, 38f, 50f);
            var styleY = tacticsCard.y + 40f;
            for (var i = 0; i < styleCount; i++)
            {
                var style = CareerFormationSystem.TacticalStyles[i];
                var selected = save.tacticalStyle == style;
                var rect = new Rect(tacticsCard.x + pad + (i % styleColumns) * (styleWidth + formationGap),
                    styleY + (i / styleColumns) * (styleHeight + formationGap),
                    styleWidth, styleHeight);
                if (GUI.Button(rect, (selected ? "✓ " : string.Empty) + style, buttonStyle))
                {
                    save.tacticalStyle = style;
                    CareerSaveSystem.Save(save);
                    notice = "Team mentality saved: " + style;
                }
            }

            GUI.Label(new Rect(formationCard.x + pad, formationCard.yMax - 34f,
                formationCard.width - pad * 2f, 28f),
                "Settings apply to your next match.", labelSmallStyle);
            GUI.Label(new Rect(tacticsCard.x + pad, tacticsCard.yMax - 34f,
                tacticsCard.width - pad * 2f, 28f), notice, labelSmallStyle);

            var footerGap = 8f;
            var backWidth = (panel.width - inset * 2f - footerGap) * 0.32f;
            if (GUI.Button(new Rect(panel.x + inset, footerY,
                backWidth, footerButtonHeight), "BACK", buttonStyle))
                showSquadManagement = false;
            if (GUI.Button(new Rect(panel.x + inset + backWidth + footerGap, footerY,
                panel.width - inset * 2f - backWidth - footerGap, footerButtonHeight),
                "VIEW LEAGUE TABLE", buttonStyle))
                showLeagueTable = true;
        }

        private void StartOrResumeCareer()
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

        private void DrawSquadManagement(Rect panel)
        {
            if (panel.width > panel.height)
            {
                DrawSquadManagementLandscape(panel);
                return;
            }

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
            var formationCount = CareerFormationSystem.FormationIds.Length;
            var buttonWidth = (width - gap * (formationCount - 1)) / formationCount;
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

        public void RefreshCareer(bool matchResultSaved)
        {
            save = CareerSaveSystem.Load();
            if (save != null)
            {
                selectedClub = FindClubIndex(save.managedClubId);
                notice = matchResultSaved
                    ? "Match result saved. Career updated."
                    : "Match ended without recording a result.";
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
