Warning: truncated output (original token count: 12499)
Total output lines: 1025

using System;
using System.Linq;
using FC2026.World;
using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Offline career hub for the procedural world. Players browse six
    /// confederations, pick any national top division and club, then run a
    /// season. Only the managed league table is saved; clubs, squads and
    /// fixtures come from the deterministic world database.
    /// </summary>
    public sealed class CareerHubManager : MonoBehaviour
    {
        private static readonly string[] Confederations = { "UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC" };
        private const int InitialBudget = 15000000;
        private const float DisabledRowAlpha = 0.4f;

        private CareerSaveData save;
        private GUIStyle titleStyle;
        private GUIStyle headingStyle;
        private GUIStyle bodyStyle;
        private GUIStyle smallStyle;
        private GUIStyle buttonStyle;
        private GUIStyle primaryButtonStyle;
        private GUIStyle accentButtonStyle;
        private GUIStyle dangerButtonStyle;
        private GUIStyle highlightStyle;
        private GUIStyle rowStyle;
        private GUIStyle selectedRowStyle;
        private GUIStyle panelStyle;
        private GUIStyle tableHeaderStyle;
        private GUIStyle tableHeaderNameStyle;
        private GUIStyle tableNameStyle;
        private GUIStyle dashboardEyebrowStyle;
        private GUIStyle dashboardTitleStyle;
        private GUIStyle dashboardBodyStyle;
        private GUIStyle dashboardActionStyle;
        private GUIStyle dashboardTopBarStyle;
        private GUIStyle tileCyanStyle;
        private GUIStyle tileBlueStyle;
        private GUIStyle tileRedStyle;
        private GUIStyle tileGoldStyle;
        private GUIStyle tileGreenStyle;
        private GUIStyle tileSlateStyle;
        private Texture2D tableHeaderTexture;
        private Texture2D tableRowTexture;
        private Texture2D tableAltRowTexture;
        private Texture2D tableHighlightTexture;
        private string notice = "Browse the world and choose a club to begin.";
        private bool showLeagueTable;
        private bool showSquadManagement;
        private bool showTransfers;
        private bool transfersShowSquad;
        private TransferTarget[] marketCache;
        private string selectedTransferPlayerId = string.Empty;
        private string pendingTransferPlayerId = string.Empty;
        private string pendingTransferAction = string.Empty;
        private bool showClubBrowser;
        private bool confirmNewCareer;
        private string browserConfederation = "UEFA";
        private string browserCountryId = string.Empty;
        private string pendingClubId = string.Empty;
        private Vector2 squadScroll;
        private Vector2 transferScroll;
        private Vector2 countryScroll;
        private Vector2 clubScroll;
        private Vector2 leagueTableScroll;

        private void Awake()
        {
            save = CareerSaveSystem.Load();
            if (save != null)
                notice = "Career loaded. Resume or browse for a new club.";
        }

        private void OnGUI()
        {
            if (save != null && MatchIsRunning())
                return;

            InitStyles();

            var panelWidth = Mathf.Min(Screen.width - 24f, 1360f);
            var panelHeight = Mathf.Min(Screen.height - 24f, 820f);
            var panel = new Rect((Screen.width - panelWidth) / 2f,
                (Screen.height - panelHeight) / 2f, panelWidth, panelHeight);
            GUI.Box(panel, string.Empty, panelStyle);

            if (confirmNewCareer)
            {
                DrawNewCareerConfirmation(panel);
                return;
            }
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
            if (showTransfers)
            {
                DrawTransfers(panel);
                return;
            }
            if (showClubBrowser || save == null)
            {
                DrawClubBrowser(panel);
                return;
            }

            DrawDashboardTiles(panel);
        }

        private void InitStyles()
        {
            titleStyle ??= new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.height / 18, 26, 50),
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = Color.white }
            };
            headingStyle ??= new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.height / 24, 20, 34),
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                normal = { textColor = Color.white }
            };
            bodyStyle ??= new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.height / 38, 15, 25),
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                normal = { textColor = new Color(0.82f, 0.91f, 0.97f) }
            };
            smallStyle ??= new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.height / 52, 12, 20),
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                normal = { textColor = new Color(0.75f, 0.85f, 0.93f) }
            };
            var buttonFontSize = Mathf.Clamp(Screen.height / 42, 15, 24);
            buttonStyle ??= HubTheme.SecondaryButton(buttonFontSize);
            primaryButtonStyle ??= HubTheme.PrimaryButton(buttonFontSize);
            accentButtonStyle ??= HubTheme.AccentButton(buttonFontSize);
            dangerButtonStyle ??= HubTheme.DangerButton(buttonFontSize);
            highlightStyle ??= new GUIStyle(smallStyle)
            {
                fontStyle = FontStyle.Bold,
                normal = { textColor = HubTheme.GoldTextColor }
            };
            tableHeaderStyle ??= new GUIStyle(smallStyle)
            {
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white }
            };
            tableNameStyle ??= new GUIStyle(smallStyle)
            {
                alignment = TextAnchor.MiddleLeft,
                padding = new RectOffset(10, 4, 0, 0)
            };
            tableHeaderNameStyle ??= new GUIStyle(tableNameStyle)
            {
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white }
            };
            var rowFontSize = Mathf.Clamp(Screen.height / 56, 12, 20);
            rowStyle ??= HubTheme.Row(rowFontSize, false);
            selectedRowStyle ??= HubTheme.Row(rowFontSize, true);
            panelStyle ??= HubTheme.Panel();
            tableHeaderTexture ??= HubTheme.SolidTexture(HubTheme.TableHeaderColor);
            tableRowTexture ??= HubTheme.SolidTexture(HubTheme.TableRowColor);
            tableAltRowTexture ??= HubTheme.SolidTexture(HubTheme.TableAltRowColor);
            tableHighlightTexture ??= HubTheme.SolidTexture(HubTheme.HighlightColor);

            dashboardEyebrowStyle ??= new GUIStyle(smallStyle)
            {
                alignment = TextAnchor.UpperLeft,
                fontSize = Mathf.Clamp(Screen.height / 76, 10, 15),
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0.53f, 0.9f, 0.98f) }
            };
            dashboardTitleStyle ??= new GUIStyle(headingStyle)
            {
                alignment = TextAnchor.UpperLeft,
                fontSize = Mathf.Clamp(Screen.height / 34, 18, 32),
                wordWrap = true
            };
            dashboardBodyStyle ??= new GUIStyle(bodyStyle)
            {
                alignment = TextAnchor.UpperLeft,
                fontSize = Mathf.Clamp(Screen.height / 62, 12, 19),
                normal = { textColor = new Color(0.84f, 0.88f, 0.92f) }
            };
            dashboardActionStyle ??= new GUIStyle(smallStyle)
            {
                alignment = TextAnchor.MiddleRight,
                fontSize = Mathf.Clamp(Screen.height / 70, 10, 15),
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0.7f, 0.95f, 1f) }
            };
            dashboardTopBarStyle ??= HubTheme.BuildButton(12,
                new Color32(0x10, 0x17, 0x21, 0xFF),
                new Color32(0x10, 0x17, 0x21, 0xFF),
                new Color32(0x10, 0x17, 0x21, 0xFF), Color.white);
            tileCyanStyle ??= CreateDashboardTileStyle(new Color32(0x0D, 0x68, 0x82, 0xFF));
            tileBlueStyle ??= CreateDashboardTileStyle(new Color32(0x1D, 0x4E, 0x79, 0xFF));
            tileRedStyle ??= CreateDashboardTileStyle(new Color32(0x8C, 0x2B, 0x35, 0xFF));
            tileGoldStyle ??= CreateDashboardTileStyle(new Color32(0x81, 0x5D, 0x1C, 0xFF));
            tileGreenStyle ??= CreateDashboardTileStyle(new Color32(0x1B, 0x65, 0x45, 0xFF));
            tileSlateStyle ??= CreateDashboardTileStyle(new Color32(0x25, 0x32, 0x40, 0xFF));
        }

        private GUIStyle CreateDashboardTileStyle(Color color)
        {
            var style = HubTheme.BuildButton(14, color,
                Color.Lerp(color, Color.white, 0.12f),
                Color.Lerp(color, Color.black, 0.18f), Color.white);
            style.alignment = TextAnchor.UpperLeft;
            style.padding = new RectOffset(14, 14, 12, 10);
            style.wordWrap = true;
            return style;
        }

        private void DrawDashboardTiles(Rect panel)
        {
            var club = CareerLeagueSystem.GetManagedClub(save);
            var league = CareerLeagueSystem.GetManagedLeague(save);
            var country = league == null ? null : WorldDatabase.GetCountry(league.CountryId);
            if (club == null || league == null)
            {
                notice = "This save points at a club that no longer exists.";
                showClubBrowser = true;
                return;
            }

            var table = CareerLeagueSystem.GetRankedStandings(save);
            var position = 0;
            CareerClubStanding standing = null;
            for (var i = 0; i < table.Length; i++)
                if (table[i].clubId == save.managedClubId)
                {
                    position = i + 1;
                    standing = table[i];
                    break;
                }

            var fixture = CareerLeagueSystem.GetNextFixture(save);
            var opponent = fixture.IsValid ? WorldDatabase.GetClub(fixture.OpponentClubId) : null;
            var next = opponent == null ? "No fixture scheduled" :
                $"{(fixture.UserIsHome ? "VS" : "AT")}  {opponent.Name}\n{(fixture.Kind == CareerFixtureKind.Cup ? CareerCupSystem.ShortRoundName(fixture.Round) : "LEAGUE")}";
            var cup = save.cupRound > 0 ? CareerCupSystem.ShortRoundName(save.cupRound) :
                !string.IsNullOrEmpty(save.cupChampionId) && save.cupChampionId == save.managedClubId ? "CHAMPIONS" : "ELIMINATED";

            var headerHeight = Mathf.Clamp(panel.height * 0.085f, 42f, 64f);
            var header = new Rect(panel.x + 10f, panel.y + 10f, panel.width - 20f, headerHeight);
            GUI.Box(header, GUIContent.none, dashboardTopBarStyle);
            var pad = Mathf.Clamp(headerHeight * 0.18f, 8f, 14f);
            GUI.Label(new Rect(header.x + pad, header.y + 1f, headerHeight * 1.5f, header.height - 2f), "FC 2026", titleStyle);
            GUI.Label(new Rect(header.x + headerHeight * 1.65f, header.y + 3f, header.width * 0.28f, header.height - 6f),
                "CAREER HUB  /  " + (country?.Name ?? club.CountryId).ToUpperInvariant(), dashboardEyebrowStyle);
            var budgetWidth = Mathf.Min(header.width * 0.27f, 280f);
            GUI.Label(new Rect(header.xMax - budgetWidth - pad, header.y + 3f, budgetWidth, header.height - 6f),
                $"TRANSFER BUDGET   {save.transferBudget:N0}", dashboardActionStyle);

            var area = new Rect(panel.x + 14f, header.yMax + 10f, panel.width - 28f, panel.yMax - header.yMax - 22f);
            var gap = Mathf.Clamp(panel.width * 0.008f, 6f, 12f);
            var play = new Action(() =>
            {
                enabled = false;
                if (GetComponent<MatchManager3D>() == null)
                    gameObject.AddComponent<MatchManager3D>();
            });
            var browse = new Action(() => { browserCountryId = string.Empty; showClubBrowser = true; });
            var compact = panel.height < 470f;

            if (compact)
            {
                var heroH = area.height * 0.59f;
                var actionH = area.height - heroH - gap;
                var heroW = area.width * 0.62f;
                DrawDashboardTile(new Rect(area.x, area.y, heroW, heroH), "CAREER  •  SEASON " + save.season.ToString("00"),
                    club.Name, $"{league.Name}  •  WEEK {save.matchweek}/{WorldDatabase.MatchweeksPerSeason}\nPOSITION {position}/{table.Length}  •  {(standing == null ? 0 : standing.Points)} PTS",
                    "PLAY MATCH  ›", tileCyanStyle, new Color(0.15f, 0.88f, 0.98f), play);
                DrawDashboardTile(new Rect(area.x + heroW + gap, area.y, area.width - heroW - gap, heroH),
                    "NEXT FIXTURE", next, $"{(fixture.UserIsHome ? "HOME" : "AWAY")}  •  {(standing == null ? 0 : standing.played)} PLAYED",
                    "OPEN FIXTURE  ›", tileBlueStyle, new Color(0.35f, 0.72f, 1f), play);
                var w = (area.width - gap * 3f) / 4f;
                var y = area.y + heroH + gap;
                DrawDashboardTile(new Rect(area.x, y, w, actionH), "TEAM", "SQUAD", save.formationId, "OPEN  ›", tileGreenStyle, new Color(0.36f, 0.92f, 0.54f), () => showSquadManagement = true);
                DrawDashboardTile(new Rect(area.x + w + gap, y, w, actionH), "COMPETITION", "TABLE", "League standings", "OPEN  ›", tileBlueStyle, new Color(0.35f, 0.72f, 1f), () => showLeagueTable = true);
                DrawDashboardTile(new Rect(area.x + (w + gap) * 2f, y, w, actionH), "MARKET", "TRANSFERS", $"{save.transferBudget:N0}", "OPEN  ›", tileGoldStyle, new Color(1f, 0.77f, 0.25f), OpenTransfers);
                DrawDashboardTile(new Rect(area.x + (w + gap) * 3f, y, w, actionH), "WORLD", "CLUBS", "Choose a team", "BROWSE  ›", tileSlateStyle, new Color(0.7f, 0.78f, 0.86f), browse);
                return;
            }

            var h1 = area.height * 0.36f;
            var h2 = area.height * 0.31f;
            var h3 = area.height - h1 - h2 - gap * 2f;
            var wide = area.width * 0.46f;
            var small = (area.width - wide - gap * 2f) / 2f;
            DrawDashboardTile(new Rect(area.x, area.y, wide, h1), "CAREER  •  SEASON " + save.season.ToString("00"),
                club.Name, $"{league.Name}  •  {country?.Name ?? club.CountryId}\nWEEK {save.matchweek}/{WorldDatabase.MatchweeksPerSeason}  •  POSITION {position}/{table.Length}",
                "CONTINUE CAREER  ›", tileCyanStyle, new Color(0.15f, 0.88f, 0.98f), play);
            DrawDashboardTile(new Rect(area.x + wide + gap, area.y, small, h1), "NEXT FIXTURE", next,
                opponent == null ? "No upcoming fixture." : $"{(fixture.UserIsHome ? "HOME" : "AWAY")}  •  {(standing == null ? 0 : standing.played)} PLAYED",
                "PLAY MATCH  ›", tileBlueStyle, new Color(0.35f, 0.72f, 1f), play);
            DrawDashboardTile(new Rect(area.x + wide + gap + small + gap, area.y, small, h1), "NATIONAL CUP", cup,
                "Your cup run and season honours.", "CUP CAMPAIGN", tileRedStyle, new Color(1f, 0.33f, 0.38f), null);

            var y2 = area.y + h1 + gap;
            var third = (area.width - gap * 2f) / 3f;
            DrawDashboardTile(new Rect(area.x, y2, third, h2), "LEAGUE TABLE", $"{position}{OrdinalSuffix(position)}  /  {table.Length} CLUBS",
                $"{(standing == null ? 0 : standing.Points)} POINTS  •  {(standing == null ? 0 : standing.played)} PLAYED",
                "OPEN TABLE  ›", tileGreenStyle, new Color(0.36f, 0.92f, 0.54f), () => showLeagueTable = true);
            DrawDashboardTile(new Rect(area.x + third + gap, y2, third, h2), "SQUAD & TACTICS", save.formationId.ToUpperInvariant(),
                $"{CareerTransferSystem.GetSquad(save, club.Id).Length} PLAYERS  •  MANAGE YOUR XI",
                "MANAGE SQUAD  ›", tileBlueStyle, new Color(0.35f, 0.72f, 1f), () => showSquadManagement = true);
            DrawDashboardTile(new Rect(area.x + (third + gap) * 2f, y2, third, h2), "TRANSFERS", "Improve your team",
                $"BUDGET  {save.transferBudget:N0}", "OPEN MARKET  ›", tileGoldStyle, new Color(1f, 0.77f, 0.25f), OpenTransfers);

            var y3 = y2 + h2 + gap;
            var foot = (area.width - gap * 3f) / 4f;
            DrawDashboardTile(new Rect(area.x, y3, foot, h3), "MY CLUB", club.Name, country?.Name ?? club.CountryId,
                "OPEN SQUAD  ›", tileSlateStyle, new Color(0.7f, 0.78f, 0.86f), () => showSquadManagement = true);
            DrawDashboardTile(new Rect(area.x + foot + gap, y3, foot, h3), "HONOURS", save.honours != null && save.honours.Length > 0 ? save.honours[0] : "Your story starts here",
                $"{(save.honours == null ? 0 : save.honours.Length)} TROPHIES WON", "SEASON RECORD",
                tileGoldStyle, new Color(1f, 0.77f, 0.25f), null);
            DrawDashboardTile(new Rect(area.x + (foot + gap) * 2f, y3, foot, h3), "WORLD CLUBS", "Choose your challenge",
                "96 COUNTRIES  •  1,536 CLUBS", "BROWSE WORLD  ›", tileRedStyle, new Color(1f, 0.33f, 0.38f), browse);
            DrawDashboardTile(new Rect(area.x + (foot + gap) * 3f, y3, foot, h3), "SEASON FORM",
                $"W {save.wins}   D {save.draws}   L {save.losses}", $"MATCHWEEK {save.matchweek}  •  {cup}",
                "VIEW TABLE  ›", tileCyanStyle, new Color(0.15f, 0.88f, 0.98f), () => showLeagueTable = true);
        }

        private void DrawDashboardTile(Rect rect, string eyebrow, string title, string body,
            string actionLabel, GUIStyle style, Color accent, Action onClick)
        {
            if (onClick == null)
                GUI.Box(rect, GUIContent.none, style);
            else if (GUI.Button(rect, GUIContent.none, style))
                onClick();

            GUI.color = accent;
            GUI.DrawTexture(new Rect(rect.x, rect.y, rect.width, Mathf.Clamp(rect.height * 0.035f, 3f, 5f)), Texture2D.whiteTexture);
            GUI.color = Color.white;
            var inset = Mathf.Clamp(rect.width * 0.045f, 10f, 22f);
            var labelHeight = Mathf.Clamp(rect.height * 0.2f, 16f, 26f);
            if (rect.height < 112f)
            {
                GUI.Label(new Rect(rect.x + inset, rect.y + inset * 0.65f,
                    rect.width - inset * 2f, labelHeight), eyebrow, dashboardEyebrowStyle);
                GUI.Label(new Rect(rect.x + inset, rect.y + inset * 0.65f + labelHeight,
                    rect.width - inset * 2f, Mathf.Max(22f, rect.height - labelHeight - inset)),
                    title, dashboardTitleStyle);
                return;
            }
            GUI.Label(new Rect(rect.x + inset, rect.y + inset * 0.7f, rect.width - inset * 2f, labelHeight), eyebrow, dashboardEyebrowStyle);
            var titleY = rect.y + inset * 0.7f + labelHeight + 3f;
            var titleHeight = Mathf.Clamp(rect.height * 0.38f, 28f, 66f);
            GUI.Label(new Rect(rect.x + inset, titleY, rect.width - inset * 2f, titleHeight), title, dashboardTitleStyle);
            var bodyY = titleY + titleHeight + 1f;
            var actionHeight = Mathf.Clamp(rect.height * 0.22f, 18f, 30f);
            GUI.Label(new Rect(rect.x + inset, bodyY, rect.widt…2499 tokens truncated…    (squad.Length + 1) * rowHeight + 8f;

            squadScroll = GUI.BeginScrollView(new Rect(x, contentTop, width, viewHeight), squadScroll,
                new Rect(0f, 0f, innerWidth, contentHeight));
            var cy = 0f;

            GUI.Label(new Rect(0f, cy, innerWidth, 22f), "Formation", smallStyle);
            cy += 24f;
            var formationCount = CareerFormationSystem.FormationIds.Length;
            var formationWidth = (innerWidth - gap * (formationCount - 1)) / formationCount;
            for (var i = 0; i < formationCount; i++)
            {
                var id = CareerFormationSystem.FormationIds[i];
                var selected = save.formationId == id;
                var label = (selected ? "* " : string.Empty) + id;
                if (GUI.Button(new Rect(i * (formationWidth + gap), cy, formationWidth, buttonHeight), label,
                    selected ? accentButtonStyle : buttonStyle))
                {
                    save.formationId = id;
                    CareerSaveSystem.Save(save);
                    notice = "Formation saved: " + id;
                }
            }
            cy += buttonHeight + 12f;

            GUI.Label(new Rect(0f, cy, innerWidth, 22f), "Mentality", smallStyle);
            cy += 24f;
            var styleCount = CareerFormationSystem.TacticalStyles.Length;
            var styleWidth = (innerWidth - gap * (styleCount - 1)) / styleCount;
            for (var i = 0; i < styleCount; i++)
            {
                var style = CareerFormationSystem.TacticalStyles[i];
                var selected = save.tacticalStyle == style;
                var label = (selected ? "* " : string.Empty) + style;
                if (GUI.Button(new Rect(i * (styleWidth + gap), cy, styleWidth, buttonHeight), label,
                    selected ? accentButtonStyle : buttonStyle))
                {
                    save.tacticalStyle = style;
                    CareerSaveSystem.Save(save);
                    notice = "Team mentality saved: " + style;
                }
            }
            cy += buttonHeight + 14f;

            GUI.Label(new Rect(0f, cy, innerWidth, 22f), $"SQUAD  •  {squad.Length} PLAYERS", smallStyle);
            cy += 24f;

            var cell = new GUIStyle(smallStyle) { alignment = TextAnchor.MiddleLeft };
            var header = new GUIStyle(cell) { fontStyle = FontStyle.Bold, normal = { textColor = Color.white } };
            var columns = new[] { 0f, 0.07f, 0.55f, 0.65f, 0.73f, 0.81f, 0.9f, 1f };
            var headers = new[] { "#", "NAME", "POS", "OVR", "PAC", "SHO", "PAS" };
            GUI.DrawTexture(new Rect(0f, cy, innerWidth, rowHeight), tableHeaderTexture);
            for (var i = 0; i < headers.Length; i++)
            {
                GUI.Label(new Rect(innerWidth * columns[i], cy,
                    innerWidth * (columns[i + 1] - columns[i]), rowHeight), headers[i], header);
            }
            cy += rowHeight;

            for (var i = 0; i < squad.Length; i++)
            {
                var player = squad[i];
                GUI.DrawTexture(new Rect(0f, cy, innerWidth, rowHeight),
                    i % 2 == 1 ? tableAltRowTexture : tableRowTexture);
                var values = new[]
                {
                    player.ShirtNumber.ToString(), player.Name, PositionLabel(player.Position),
                    player.Overall.ToString(), player.Pace.ToString(), player.Shooting.ToString(),
                    player.Passing.ToString()
                };
                for (var column = 0; column < values.Length; column++)
                {
                    GUI.Label(new Rect(innerWidth * columns[column], cy,
                        innerWidth * (columns[column + 1] - columns[column]), rowHeight),
                        values[column], cell);
                }
                cy += rowHeight;
            }
            GUI.EndScrollView();

            var backWidth = (width - gap) / 2f;
            if (GUI.Button(new Rect(x, footerY, backWidth, footerHeight), "BACK", buttonStyle))
                showSquadManagement = false;
            if (GUI.Button(new Rect(x + backWidth + gap, footerY, backWidth, footerHeight),
                "VIEW LEAGUE TABLE", buttonStyle))
            {
                showSquadManagement = false;
                showLeagueTable = true;
            }
        }

        private void OpenTransfers()
        {
            showTransfers = true;
            transfersShowSquad = false;
            marketCache = null;
            selectedTransferPlayerId = string.Empty;
            pendingTransferPlayerId = string.Empty;
            pendingTransferAction = string.Empty;
            transferScroll = Vector2.zero;
            notice = "Tap a player to sign, then tap again to confirm.";
        }

        private void DrawTransfers(Rect panel)
        {
            var x = panel.x + 22f;
            var width = panel.width - 44f;
            var club = CareerLeagueSystem.GetManagedClub(save);
            var squad = CareerTransferSystem.GetSquad(save, save.managedClubId);

            GUI.Label(new Rect(x, panel.y + 8f, width, 40f), "TRANSFERS", headingStyle);

            var headerY = panel.y + 48f;
            var lineHeight = Mathf.Clamp(panel.height * 0.038f, 20f, 26f);
            GUI.Label(new Rect(x, headerY, width, lineHeight),
                $"Budget {CareerTransferSystem.FormatMoney(save.transferBudget)}  •  Squad {squad.Length}/{CareerTransferSystem.MaxSquadSize}",
                smallStyle);
            GUI.Label(new Rect(x, headerY + lineHeight, width, lineHeight),
                $"Wages {CareerTransferSystem.FormatMoney(CareerTransferSystem.WageBill(save))}/{CareerTransferSystem.FormatMoney(CareerTransferSystem.WageBudget(club))} per week",
                smallStyle);

            var tabY = headerY + lineHeight * 2f + 4f;
            var tabHeight = Mathf.Clamp(panel.height * 0.07f, 34f, 46f);
            var gap = 8f;
            var half = (width - gap) / 2f;
            var marketSelected = !transfersShowSquad;
            if (GUI.Button(new Rect(x, tabY, half, tabHeight),
                (marketSelected ? "* " : string.Empty) + "MARKET",
                marketSelected ? accentButtonStyle : buttonStyle))
            {
                transfersShowSquad = false;
                selectedTransferPlayerId = string.Empty;
                pendingTransferPlayerId = string.Empty;
                pendingTransferAction = string.Empty;
                transferScroll = Vector2.zero;
            }
            if (GUI.Button(new Rect(x + half + gap, tabY, half, tabHeight),
                (transfersShowSquad ? "* " : string.Empty) + "MY SQUAD",
                transfersShowSquad ? accentButtonStyle : buttonStyle))
            {
                transfersShowSquad = true;
                pendingTransferPlayerId = string.Empty;
                pendingTransferAction = string.Empty;
                transferScroll = Vector2.zero;
            }

            var listTop = tabY + tabHeight + 8f;
            var footerHeight = Mathf.Clamp(panel.height * 0.09f, 40f, 58f);
            var footerY = panel.y + panel.height - footerHeight - 12f;
            var noticeHeight = Mathf.Clamp(panel.height * 0.045f, 20f, 28f);
            var actionHeight = transfersShowSquad ? Mathf.Clamp(panel.height * 0.085f, 36f, 50f) : 0f;
            var actionY = footerY - noticeHeight - actionHeight - (actionHeight > 0f ? 6f : 0f);
            var viewHeight = Mathf.Max(40f, actionY - listTop - 6f);

            var rowHeight = Mathf.Clamp(panel.height * 0.055f, 30f, 42f);
            var innerWidth = width - 22f;
            var squadFull = squad.Length >= CareerTransferSystem.MaxSquadSize;
            var wageBill = CareerTransferSystem.WageBill(save);
            var wageCeiling = CareerTransferSystem.WageBudget(club);
            marketCache ??= CareerTransferSystem.GetMarket(save);
            var market = transfersShowSquad ? Array.Empty<TransferTarget>() : marketCache;
            var count = transfersShowSquad ? squad.Length : market.Length;
            transferScroll = GUI.BeginScrollView(new Rect(x, listTop, width, viewHeight), transferScroll,
                new Rect(0f, 0f, innerWidth, count * rowHeight + 4f));

            for (var i = 0; i < count; i++)
            {
                var rect = new Rect(0f, i * rowHeight, innerWidth, rowHeight - 2f);
                if (transfersShowSquad)
                {
                    var player = squad[i];
                    var selected = player.Id == selectedTransferPlayerId;
                    var expiry = CareerTransferSystem.ContractExpiry(save, player.Id);
                    var label = $"{(selected ? "> " : string.Empty)}{player.Name}  •  {PositionLabel(player.Position)} {player.Overall}" +
                                $"  •  S{expiry}  •  {CareerTransferSystem.FormatMoney(CareerTransferSystem.MarketValue(player))}";
                    if (GUI.Button(rect, label, selected ? selectedRowStyle : rowStyle))
                    {
                        selectedTransferPlayerId = player.Id;
                        pendingTransferPlayerId = string.Empty;
                        pendingTransferAction = string.Empty;
                    }
                }
                else
                {
                    var target = market[i];
                    var armed = target.Player.Id == pendingTransferPlayerId && pendingTransferAction == "SIGN";
                    var blocked = squadFull
                                  || target.Price > save.transferBudget
                                  || wageBill + target.Wage > wageCeiling;
                    var clubLabel = string.IsNullOrEmpty(target.ClubId)
                        ? "FREE"
                        : WorldDatabase.GetClub(target.ClubId)?.ShortName ?? "—";
                    var label = armed
                        ? $"CONFIRM SIGN  {target.Player.Name}  •  {CareerTransferSystem.FormatMoney(target.Price)}"
                        : $"{target.Player.Name}  •  {PositionLabel(target.Player.Position)} {target.Player.Overall}" +
                          $"  •  {clubLabel}  •  {CareerTransferSystem.FormatMoney(target.Price)}";
                    var previousColor = GUI.color;
                    if (blocked)
                        GUI.color = new Color(1f, 1f, 1f, DisabledRowAlpha);
                    if (GUI.Button(rect, label, armed ? accentButtonStyle : rowStyle))
                    {
                        if (armed || blocked)
                            ExecuteTransfer("SIGN", target.Player.Id);
                        else
                        {
                            pendingTransferPlayerId = target.Player.Id;
                            pendingTransferAction = "SIGN";
                            notice = "Tap again to confirm the signing of " + target.Player.Name + ".";
                        }
                    }
                    GUI.color = previousColor;
                }
            }
            GUI.EndScrollView();

            if (transfersShowSquad)
                DrawSquadTransferActions(x, width, actionY, actionHeight, squad);

            GUI.Label(new Rect(x, footerY - noticeHeight, width, noticeHeight), notice, smallStyle);
            if (GUI.Button(new Rect(x, footerY, width, footerHeight), "BACK TO CAREER", buttonStyle))
            {
                showTransfers = false;
                pendingTransferPlayerId = string.Empty;
                pendingTransferAction = string.Empty;
            }
        }

        private void DrawSquadTransferActions(float x, float width, float y, float height, WorldPlayer[] squad)
        {
            var player = FindSquadPlayer(squad, selectedTransferPlayerId);
            if (player == null)
            {
                GUI.Label(new Rect(x, y, width, height), "Select a player to manage his contract.", smallStyle);
                return;
            }

            var gap = 6f;
            var buttonWidth = (width - gap * 2f) / 3f;
            var sellArmed = pendingTransferPlayerId == player.Id && pendingTransferAction == "SELL";
            var releaseArmed = pendingTransferPlayerId == player.Id && pendingTransferAction == "RELEASE";

            if (GUI.Button(new Rect(x, y, buttonWidth, height), "RENEW", buttonStyle))
                ExecuteTransfer("RENEW", player.Id);
            if (GUI.Button(new Rect(x + buttonWidth + gap, y, buttonWidth, height),
                sellArmed ? "CONFIRM SELL" : "SELL", sellArmed ? dangerButtonStyle : buttonStyle))
            {
                if (sellArmed)
                    ExecuteTransfer("SELL", player.Id);
                else
                    ArmTransfer("SELL", player.Id, "Tap again to sell " + player.Name + ".");
            }
            if (GUI.Button(new Rect(x + (buttonWidth + gap) * 2f, y, buttonWidth, height),
                releaseArmed ? "CONFIRM FREE" : "RELEASE", releaseArmed ? dangerButtonStyle : buttonStyle))
            {
                if (releaseArmed)
                    ExecuteTransfer("RELEASE", player.Id);
                else
                    ArmTransfer("RELEASE", player.Id, "Tap again to release " + player.Name + " on a free.");
            }
        }

        private void ArmTransfer(string action, string playerId, string message)
        {
            pendingTransferPlayerId = playerId;
            pendingTransferAction = action;
            notice = message;
        }

        private void ExecuteTransfer(string action, string playerId)
        {
            string message;
            bool success;
            switch (action)
            {
                case "SIGN":
                    success = CareerTransferSystem.SignPlayer(save, playerId, out message);
                    break;
                case "SELL":
                    success = CareerTransferSystem.SellPlayer(save, playerId, out message);
                    break;
                case "RELEASE":
                    success = CareerTransferSystem.ReleasePlayer(save, playerId, out message);
                    break;
                case "RENEW":
                    success = CareerTransferSystem.RenewContract(save, playerId, out message);
                    break;
                default:
                    message = "Unknown transfer action.";
                    success = false;
                    break;
            }

            pendingTransferPlayerId = string.Empty;
            pendingTransferAction = string.Empty;
            if (success)
            {
                marketCache = null;
                if (!CareerSaveSystem.Save(save))
                    message += " The change could not be saved.";
                else if (action == "SELL" || action == "RELEASE")
                    selectedTransferPlayerId = string.Empty;
            }

            notice = message;
        }

        private static WorldPlayer FindSquadPlayer(WorldPlayer[] squad, string playerId)
        {
            if (squad == null || string.IsNullOrEmpty(playerId))
                return null;
            foreach (var player in squad)
            {
                if (player != null && player.Id == playerId)
                    return player;
            }
            return null;
        }

        private void DrawLeagueTable(Rect panel)
        {
            var x = panel.x + 22f;
            var width = panel.width - 44f;
            var league = CareerLeagueSystem.GetManagedLeague(save);
            GUI.Label(new Rect(x, panel.y + 10f, width, 42f),
                $"SEASON {save.season}  •  {league?.Name ?? "LEAGUE"}", headingStyle);

            var rowHeight = Mathf.Clamp(panel.height * 0.045f, 20f, 30f);
            var innerWidth = width - 22f;
            var columns = new[] { 0f, 0.07f, 0.48f, 0.57f, 0.66f, 0.75f, 0.84f, 0.92f, 1f };
            var headers = new[] { "#", "CLUB", "P", "W", "D", "L", "GD", "PTS" };
            var headerY = panel.y + 56f;
            GUI.DrawTexture(new Rect(x, headerY, width, rowHeight + 4f), tableHeaderTexture);
            for (var i = 0; i < headers.Length; i++)
            {
                var left = innerWidth * columns[i];
                var right = innerWidth * columns[i + 1];
                GUI.Label(new Rect(x + left, headerY, right - left, rowHeight + 4f), headers[i],
                    i == 1 ? tableHeaderNameStyle : tableHeaderStyle);
            }

            var buttonHeight = Mathf.Clamp(panel.height * 0.09f, 40f, 58f);
            var footerY = panel.y + panel.height - buttonHeight - 12f;
            var viewY = headerY + rowHeight + 8f;
            var viewHeight = footerY - viewY - 6f;
            var ranked = CareerLeagueSystem.GetRankedStandings(save);
            var contentHeight = ranked.Length * rowHeight;

            leagueTableScroll = GUI.BeginScrollView(new Rect(x, viewY, width, viewHeight), leagueTableScroll,
                new Rect(0f, 0f, innerWidth, contentHeight));
            for (var i = 0; i < ranked.Length; i++)
            {
                var standing = ranked[i];
                var isManaged = standing.clubId == save.managedClubId;
                GUI.DrawTexture(new Rect(0f, i * rowHeight, innerWidth, rowHeight),
                    isManaged ? tableHighlightTexture : i % 2 == 1 ? tableAltRowTexture : tableRowTexture);
                var rowStyle = isManaged ? highlightStyle : smallStyle;
                var values = new[]
                {
                    (i + 1).ToString(),
                    (isManaged ? "> " : string.Empty) + CareerLeagueSystem.GetClubName(standing.clubId),
                    standing.played.ToString(), standing.wins.ToString(),
                    standing.draws.ToString(), standing.losses.ToString(),
                    standing.GoalDifference.ToString("+0;-0;0"), standing.Points.ToString()
                };
                for (var column = 0; column < values.Length; column++)
                {
                    var left = innerWidth * columns[column];
                    var right = innerWidth * columns[column + 1];
                    GUI.Label(new Rect(left, i * rowHeight, right - left, rowHeight), values[column],
                        column == 1 ? tableNameStyle : rowStyle);
                }
            }
            GUI.EndScrollView();

            if (GUI.Button(new Rect(x, footerY, width, buttonHeight), "BACK TO CAREER", buttonStyle))
                showLeagueTable = false;
        }

        public void RefreshCareer()
        {
            save = CareerSaveSystem.Load();
            showClubBrowser = false;
            showLeagueTable = false;
            showSquadManagement = false;
            showTransfers = false;
            confirmNewCareer = false;
            marketCache = null;
            pendingTransferPlayerId = string.Empty;
            pendingTransferAction = string.Empty;
            selectedTransferPlayerId = string.Empty;
            notice = save == null
                ? "Match ended. Browse the world to start a career."
                : save.matchweek == 1 && save.season > 1 && !string.IsNullOrEmpty(save.lastSeasonSummary)
                    ? save.lastSeasonSummary
                    : "Match result saved. Career updated.";
        }

        private bool MatchIsRunning()
        {
            return GetComponent<MatchManager3D>() != null && !enabled;
        }

        private static string PositionLabel(PlayerPosition position)
        {
            switch (position)
            {
                case PlayerPosition.Goalkeeper:
                    return "GK";
                case PlayerPosition.Defender:
                    return "DEF";
                case PlayerPosition.Midfielder:
                    return "MID";
                default:
                    return "FWD";
            }
        }
    }
}
