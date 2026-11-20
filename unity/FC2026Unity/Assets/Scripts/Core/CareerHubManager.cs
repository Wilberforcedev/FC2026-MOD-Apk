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
        private GUIStyle matchTeamStyle;
        private GUIStyle matchVsStyle;
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
        private Texture2D tableHeaderTexture;
        private Texture2D tableRowTexture;
        private Texture2D tableAltRowTexture;
        private Texture2D tableHighlightTexture;
        private string notice = "Browse the world and choose a club to begin.";
        private bool showLeagueTable;
        private bool showCupCampaign;
        private bool showHonours;
        private bool showSquadManagement;
        private bool showTransfers;
        private bool transfersShowSquad;
        private TransferTarget[] marketCache;
        private string selectedTransferPlayerId = string.Empty;
        private string pendingTransferPlayerId = string.Empty;
        private string pendingTransferAction = string.Empty;
        private bool showHomeScreen = true;
        private bool showSettingsScreen;
        private bool showClubBrowser;
        private bool confirmNewCareer;
        private bool showPlayerDetails;
        private bool showKitRoom;
        private bool showTournamentHub;
        private bool showMatchPreview;
        private WorldPlayer selectedPlayer;
        private int selectedKitSlot;
        private string browserConfederation = "UEFA";
        private string browserCountryId = string.Empty;
        private string pendingClubId = string.Empty;
        private Vector2 squadScroll;
        private Vector2 transferScroll;
        private Vector2 countryScroll;
        private Vector2 clubScroll;
        private Vector2 leagueTableScroll;
        private Vector2 honoursScroll;
        private Vector2 dashboardScroll;
        private Vector2 playerStatsScroll;
        private Vector2 kitScroll;
        private Vector2 competitionScroll;
        private int styleScreenWidth = -1;
        private int styleScreenHeight = -1;

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

            var panel = HubTheme.CenteredPanel(820f, 680f, 16f);
            GUI.Box(panel, string.Empty, panelStyle);

            if (showHomeScreen)
            {
                DrawHomeScreen(panel);
                return;
            }
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
            if (showCupCampaign)
            {
                DrawCupCampaign(panel);
                return;
            }
            if (showHonours)
            {
                DrawHonours(panel);
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
            if (showPlayerDetails)
            {
                DrawPlayerDetails(panel);
                return;
            }
            if (showKitRoom)
            {
                DrawKitRoom(panel);
                return;
            }
            if (showTournamentHub)
            {
                DrawTournamentHub(panel);
                return;
            }
            if (showMatchPreview)
            {
                DrawMatchPreview(panel);
                return;
            }
            if (showSettingsScreen)
            {
                DrawSettingsScreen(panel);
                return;
            }
            if (showClubBrowser || save == null)
            {
                DrawClubBrowser(panel);
                return;
            }

            DrawDashboard(panel);
        }

        private void InitStyles()
        {
            if (styleScreenWidth != Screen.width || styleScreenHeight != Screen.height)
            {
                styleScreenWidth = Screen.width;
                styleScreenHeight = Screen.height;
                titleStyle = headingStyle = bodyStyle = smallStyle = null;
                matchTeamStyle = matchVsStyle = null;
                buttonStyle = primaryButtonStyle = accentButtonStyle = dangerButtonStyle = null;
                highlightStyle = rowStyle = selectedRowStyle = panelStyle = null;
                tableHeaderStyle = tableHeaderNameStyle = tableNameStyle = null;
            }

            titleStyle ??= HubTheme.Label(
                HubTheme.ResponsiveFontSize(18f, 26, 50), HubTheme.TextColor, TextAnchor.MiddleCenter, true, true);
            headingStyle ??= HubTheme.Label(
                HubTheme.ResponsiveFontSize(24f, 20, 34), HubTheme.TextColor, TextAnchor.MiddleCenter, true, true);
            bodyStyle ??= HubTheme.Label(
                HubTheme.ResponsiveFontSize(38f, 15, 25), HubTheme.SecondaryTextColor, TextAnchor.MiddleCenter, false, true);
            smallStyle ??= HubTheme.Label(
                HubTheme.ResponsiveFontSize(52f, 12, 20), HubTheme.SecondaryTextColor, TextAnchor.MiddleCenter, false, true);
            matchTeamStyle ??= HubTheme.Label(
                HubTheme.ResponsiveFontSize(35f, 15, 27), HubTheme.TextColor, TextAnchor.MiddleCenter, true, true);
            matchVsStyle ??= HubTheme.Label(
                HubTheme.ResponsiveFontSize(58f, 14, 20), HubTheme.GoldTextColor, TextAnchor.MiddleCenter, true);
            var buttonFontSize = HubTheme.ResponsiveFontSize(42f, 15, 24);
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
                normal = { textColor = HubTheme.TextColor }
            };
            tableNameStyle ??= new GUIStyle(smallStyle)
            {
                alignment = TextAnchor.MiddleLeft,
                padding = new RectOffset(10, 4, 0, 0)
            };
            tableHeaderNameStyle ??= new GUIStyle(tableNameStyle)
            {
                fontStyle = FontStyle.Bold,
                normal = { textColor = HubTheme.TextColor }
            };
            var rowFontSize = HubTheme.ResponsiveFontSize(56f, 12, 20);
            rowStyle ??= HubTheme.Row(rowFontSize, false);
            selectedRowStyle ??= HubTheme.Row(rowFontSize, true);
            panelStyle ??= HubTheme.Panel();
            tableHeaderTexture ??= HubTheme.SolidTexture(HubTheme.TableHeaderColor);
            tableRowTexture ??= HubTheme.SolidTexture(HubTheme.TableRowColor);
            tableAltRowTexture ??= HubTheme.SolidTexture(HubTheme.TableAltRowColor);
            tableHighlightTexture ??= HubTheme.SolidTexture(HubTheme.HighlightColor);
        }

        private void DrawHomeScreen(Rect panel)
        {
            var x = panel.x + 24f;
            var width = panel.width - 48f;
            var compact = panel.height < 440f;
            var brandY = panel.y + (compact ? 12f : 34f);
            var brandHeight = compact ? 40f : 64f;
            GUI.Label(new Rect(x, brandY, width, brandHeight), "SOCCER 27", titleStyle);
            GUI.Label(new Rect(x, brandY + brandHeight, width, compact ? 22f : 30f),
                "YOUR CLUB. YOUR STORY.", smallStyle);

            var gap = compact ? 7f : 10f;
            var y = panel.y + (compact ? 80f : 150f);
            var heroHeight = compact ? 42f : 64f;
            if (GUI.Button(new Rect(x, y, width, heroHeight), "PLAY MATCH", primaryButtonStyle))
            {
                if (save == null)
                    StartQuickMatch();
                else
                {
                    showHomeScreen = false;
                    showMatchPreview = true;
                }
            }

            y += heroHeight + gap;
            if (GUI.Button(new Rect(x, y, width, heroHeight), "CAREER  •  BUILD YOUR CLUB", accentButtonStyle))
            {
                showHomeScreen = false;
                if (save == null)
                    showClubBrowser = true;
            }

            y += heroHeight + gap + (compact ? 0f : 8f);
            var cardGap = compact ? 7f : 10f;
            var cardWidth = (width - cardGap) * 0.5f;
            var cardHeight = compact ? 36f : 56f;
            if (GUI.Button(new Rect(x, y, cardWidth, cardHeight), "SQUAD", buttonStyle))
                OpenCareerPage(() => showSquadManagement = true, "squad management");
            if (GUI.Button(new Rect(x + cardWidth + cardGap, y, cardWidth, cardHeight), "TOURNAMENTS", buttonStyle))
                OpenCareerPage(() => showTournamentHub = true, "tournaments");

            y += cardHeight + cardGap;
            if (GUI.Button(new Rect(x, y, cardWidth, cardHeight), "KIT ROOM", buttonStyle))
            {
                selectedKitSlot = 0;
                OpenCareerPage(() => showKitRoom = true, "the kit room");
            }
            if (GUI.Button(new Rect(x + cardWidth + cardGap, y, cardWidth, cardHeight), "PLAYER MARKET", buttonStyle))
                OpenCareerPage(OpenTransfers, "the player market");

            var settingsHeight = compact ? 32f : 44f;
            var settingsY = panel.yMax - settingsHeight - (compact ? 12f : 22f);
            if (GUI.Button(new Rect(x, settingsY, width, settingsHeight), "SETTINGS", buttonStyle))
            {
                showHomeScreen = false;
                showSettingsScreen = true;
            }
        }

        private void OpenCareerPage(Action openPage, string pageName)
        {
            showHomeScreen = false;
            if (save == null)
            {
                showClubBrowser = true;
                notice = "Choose a club before opening " + pageName + ".";
                return;
            }

            openPage();
        }

        private void StartQuickMatch()
        {
            showHomeScreen = false;
            enabled = false;
            if (GetComponent<MatchManager3D>() == null)
                gameObject.AddComponent<MatchManager3D>();
        }

        private void DrawSettingsScreen(Rect panel)
        {
            var x = panel.x + 24f;
            var width = panel.width - 48f;
            GUI.Label(new Rect(x, panel.y + 12f, width, 46f), "SETTINGS", headingStyle);

            var y = panel.y + (panel.height < 440f ? 68f : 92f);
            var rowHeight = Mathf.Clamp(panel.height * 0.12f, 44f, 72f);
            var gap = 8f;
            var settings = new[]
            {
                "MATCH CONTROLS",
                "Mobile: left stick to move, right buttons to pass, shoot, tackle and sprint.",
                "Desktop: WASD or arrows to move; Shift to sprint; Space to shoot; E to pass; X to tackle.",
                "MATCH DISPLAY",
                "The match automatically uses landscape orientation on supported mobile devices."
            };
            for (var i = 0; i < settings.Length; i++)
            {
                var emphasis = i == 0 || i == 3;
                var style = emphasis ? accentButtonStyle : buttonStyle;
                var height = emphasis ? rowHeight : Mathf.Max(38f, rowHeight - 8f);
                GUI.Box(new Rect(x, y, width, height), settings[i], style);
                y += height + gap;
            }

            var footerY = panel.yMax - 54f;
            if (GUI.Button(new Rect(x, footerY, width, 44f), "BACK TO SOCCER 27", primaryButtonStyle))
            {
                showSettingsScreen = false;
                showHomeScreen = true;
            }
        }

        private void DrawDashboard(Rect panel)
        {
            var x = panel.x + 24f;
            var width = panel.width - 48f;
            var y = panel.y + 10f;

            var club = CareerLeagueSystem.GetManagedClub(save);
            var league = CareerLeagueSystem.GetManagedLeague(save);
            var country = league == null ? null : WorldDatabase.GetCountry(league.CountryId);
            if (club == null || league == null)
            {
                notice = "This save points at a club that no longer exists.";
                showClubBrowser = true;
                return;
            }

            var ranked = CareerLeagueSystem.GetRankedStandings(save);
            var position = 0;
            for (var i = 0; i < ranked.Length; i++)
            {
                if (ranked[i].clubId == save.managedClubId)
                {
                    position = i + 1;
                    break;
                }
            }
            var next = CareerLeagueSystem.GetNextFixture(save);
            var opponent = next.IsValid ? WorldDatabase.GetClub(next.OpponentClubId) : null;
            var competition = next.Kind == CareerFixtureKind.Cup
                ? $"{CareerCupSystem.CompetitionName(save)} {CareerCupSystem.ShortRoundName(next.Round)}"
                : "League";
            if (panel.height < 460f || width < 470f)
            {
                DrawCompactDashboard(panel, x, width, club, league, country, position, ranked.Length, next, opponent, competition);
                return;
            }
            GUI.Label(new Rect(x, y + 2f, width, 42f), "SOCCER 27  •  DREAM  •  BUILD  •  WIN", headingStyle);
            y += 48f;
            GUI.Label(new Rect(x, y, width, 42f), club.Name.ToUpperInvariant(), titleStyle);
            y += 42f;
            GUI.Label(new Rect(x, y, width, 32f),
                $"{league.Name}  •  {country?.Name ?? club.CountryId}   |   SEASON {save.season}, WEEK {save.matchweek}/{WorldDatabase.MatchweeksPerSeason}   |   POSITION {position}/{ranked.Length}",
                smallStyle);
            y += 40f;
            var gap = 10f;
            var half = (width - gap) / 2f;
            var cardHeight = Mathf.Clamp((panel.yMax - y - 54f) / 3f, 52f, 104f);
            var fixtureLine = opponent == null ? "No fixture scheduled." :
                $"{competition}  •  {(next.UserIsHome ? "vs" : "at")} {opponent.Name}";
            var playLabel = next.Kind == CareerFixtureKind.Cup && next.IsValid ? "PLAY CUP TIE" : "PLAY NEXT MATCH";
            if (GUI.Button(new Rect(x, y, half, cardHeight), $"{playLabel}\n{fixtureLine}", primaryButtonStyle))
                showMatchPreview = true;
            if (GUI.Button(new Rect(x + half + gap, y, half, cardHeight),
                $"CAREER SNAPSHOT\nW {save.wins}   D {save.draws}   L {save.losses}   •   £{save.transferBudget:N0}", accentButtonStyle))
                showLeagueTable = true;
            y += cardHeight + gap;

            var buttonHeight = Mathf.Clamp((panel.yMax - y - 42f) / 2f, 42f, 66f);
            var cardWidth = (width - gap * 2f) / 3f;
            if (GUI.Button(new Rect(x, y, cardWidth, buttonHeight), "SQUAD & TACTICS", buttonStyle)) showSquadManagement = true;
            if (GUI.Button(new Rect(x + cardWidth + gap, y, cardWidth, buttonHeight), "PLAYER MARKET", buttonStyle)) OpenTransfers();
            if (GUI.Button(new Rect(x + (cardWidth + gap) * 2f, y, cardWidth, buttonHeight), "TOURNAMENTS", buttonStyle)) showTournamentHub = true;
            var secondRowY = y + buttonHeight + gap;
            if (GUI.Button(new Rect(x, secondRowY, cardWidth, buttonHeight), "KIT ROOM", buttonStyle))
            {
                selectedKitSlot = 0;
                showKitRoom = true;
            }
            if (GUI.Button(new Rect(x + cardWidth + gap, secondRowY, cardWidth, buttonHeight), "MY CLUB", buttonStyle))
            {
                honoursScroll = Vector2.zero;
                showHonours = true;
            }
            if (GUI.Button(new Rect(x + (cardWidth + gap) * 2f, secondRowY, cardWidth, buttonHeight), "BROWSE WORLD", buttonStyle))
            {
                browserCountryId = string.Empty;
                showClubBrowser = true;
            }
            var footerY = panel.yMax - 36f;
            GUI.Label(new Rect(x, footerY, width, 28f), notice, smallStyle);
        }

        private void DrawCompactDashboard(Rect panel, float x, float width, WorldClub club, WorldLeague league,
            WorldCountry country, int position, int teamCount, CareerNextFixture next, WorldClub opponent, string competition)
        {
            GUI.Label(new Rect(x, panel.y + 8f, width, 38f), club.Name.ToUpperInvariant(), headingStyle);
            GUI.Label(new Rect(x, panel.y + 43f, width, 28f),
                $"{league.Name}  •  {country?.Name ?? club.CountryId}  •  {position}/{teamCount}", smallStyle);
            var viewport = new Rect(x, panel.y + 76f, width, panel.height - 122f);
            var contentWidth = width - 18f;
            var gap = 8f;
            var cardWidth = (contentWidth - gap) / 2f;
            var actionHeight = 52f;
            var fixtureHeight = 74f;
            var contentHeight = fixtureHeight + 10f + 3f * (actionHeight + gap);
            dashboardScroll = GUI.BeginScrollView(viewport, dashboardScroll,
                new Rect(0f, 0f, contentWidth, contentHeight));
            var fixtureText = opponent == null ? "No fixture scheduled" :
                $"{competition}  •  {(next.UserIsHome ? "vs" : "at")} {opponent.Name}";
            var playText = next.Kind == CareerFixtureKind.Cup && next.IsValid ? "PLAY CUP TIE" : "PLAY NEXT MATCH";
            if (GUI.Button(new Rect(0f, 0f, contentWidth, fixtureHeight), $"{playText}\n{fixtureText}", primaryButtonStyle))
                showMatchPreview = true;
            var cardY = fixtureHeight + 10f;
            if (GUI.Button(new Rect(0f, cardY, cardWidth, actionHeight), "SQUAD & TACTICS", buttonStyle)) showSquadManagement = true;
            if (GUI.Button(new Rect(cardWidth + gap, cardY, cardWidth, actionHeight), "PLAYER MARKET", buttonStyle)) OpenTransfers();
            cardY += actionHeight + gap;
            if (GUI.Button(new Rect(0f, cardY, cardWidth, actionHeight), "COMPETITIONS", buttonStyle)) showTournamentHub = true;
            if (GUI.Button(new Rect(cardWidth + gap, cardY, cardWidth, actionHeight), "KIT ROOM", buttonStyle))
            {
                selectedKitSlot = 0;
                showKitRoom = true;
            }
            cardY += actionHeight + gap;
            if (GUI.Button(new Rect(0f, cardY, cardWidth, actionHeight), "MY CLUB", buttonStyle))
            {
                honoursScroll = Vector2.zero;
                showHonours = true;
            }
            if (GUI.Button(new Rect(cardWidth + gap, cardY, cardWidth, actionHeight), "BROWSE WORLD", buttonStyle))
            {
                browserCountryId = string.Empty;
                showClubBrowser = true;
            }
            GUI.EndScrollView();
            GUI.Label(new Rect(x, panel.yMax - 42f, width, 28f), notice, smallStyle);
        }

        private void DrawPlayerDetails(Rect panel)
        {
            var x = panel.x + 24f;
            var width = panel.width - 48f;
            if (selectedPlayer == null)
            {
                showPlayerDetails = false;
                showSquadManagement = true;
                return;
            }
            GUI.Label(new Rect(x, panel.y + 12f, width, 48f), "PLAYER PROFILE", headingStyle);
            var y = panel.y + 86f;
            GUI.Label(new Rect(x, y, width, 52f), $"{selectedPlayer.Name.ToUpperInvariant()}   •   {selectedPlayer.Overall} OVR", titleStyle);
            y += 64f;
            GUI.Label(new Rect(x, y, width, 34f),
                $"{PositionLabel(selectedPlayer.Position)}   •   #{selectedPlayer.ShirtNumber}   •   AGE {selectedPlayer.Age}   •   {selectedPlayer.HeightCm} CM   •   {(selectedPlayer.LeftFooted ? "LEFT" : "RIGHT")} FOOT",
                bodyStyle);
            y += 42f;
            var stats = new[] { $"PACE  {selectedPlayer.Pace}", $"SHOOTING  {selectedPlayer.Shooting}", $"PASSING  {selectedPlayer.Passing}", $"DEFENDING  {selectedPlayer.Defending}", $"PHYSICAL  {selectedPlayer.Physical}" };
            var rowHeight = Mathf.Clamp(panel.height * 0.075f, 34f, 52f);
            var footerY = panel.yMax - 62f;
            var viewportHeight = Mathf.Max(40f, footerY - y - 6f);
            playerStatsScroll = GUI.BeginScrollView(new Rect(x, y, width, viewportHeight), playerStatsScroll,
                new Rect(0f, 0f, width - 18f, stats.Length * (rowHeight + 6f)));
            for (var i = 0; i < stats.Length; i++)
                GUI.Box(new Rect(8f, i * (rowHeight + 6f), width - 34f, rowHeight), stats[i], selectedRowStyle);
            GUI.EndScrollView();
            if (GUI.Button(new Rect(x, footerY, width, 48f), "BACK TO SQUAD", buttonStyle))
            {
                showPlayerDetails = false;
                showSquadManagement = true;
            }
        }

        private void DrawKitRoom(Rect panel)
        {
            var x = panel.x + 24f;
            var width = panel.width - 48f;
            var club = CareerLeagueSystem.GetManagedClub(save);
            GUI.Label(new Rect(x, panel.y + 10f, width, 44f), "KIT ROOM", headingStyle);
            GUI.Label(new Rect(x, panel.y + 54f, width, 32f), club.Name + "  •  preview and save club palettes", smallStyle);
            var gap = 8f;
            var slotW = (width - gap * 3f) / 4f;
            var tabsY = panel.y + 96f;
            for (var i = 0; i < CareerKitSystem.SlotNames.Length; i++)
                if (GUI.Button(new Rect(x + i * (slotW + gap), tabsY, slotW, 48f), CareerKitSystem.SlotNames[i],
                    selectedKitSlot == i ? accentButtonStyle : buttonStyle))
                {
                    selectedKitSlot = i;
                    if (i < 3)
                        CareerKitSystem.SetActiveMatchSlot(club.Id, i);
                }
            var presetsY = tabsY + 84f;
            var activeKit = CareerKitSystem.GetActiveMatchSlot(club.Id);
            GUI.Label(new Rect(x, presetsY - 22f, width, 20f),
                $"MATCH KIT: {CareerKitSystem.SlotNames[activeKit]}  •  KEEPERS USE THEIR OWN PALETTE", smallStyle);
            var footerY = panel.yMax - 60f;
            var listHeight = Mathf.Max(40f, footerY - presetsY - 8f);
            var presetHeight = Mathf.Clamp(panel.height * 0.075f, 34f, 50f);
            kitScroll = GUI.BeginScrollView(new Rect(x, presetsY, width, listHeight), kitScroll,
                new Rect(0f, 0f, width - 18f, CareerKitSystem.PresetNames.Length * (presetHeight + 6f)));
            for (var i = 0; i < CareerKitSystem.PresetNames.Length; i++)
            {
                var row = new Rect(0f, i * (presetHeight + 6f), width - 18f, presetHeight);
                var primary = CareerKitSystem.PreviewPrimary(i, ToColor(club.PrimaryColor));
                var secondary = CareerKitSystem.PreviewSecondary(i, ToColor(club.SecondaryColor));
                var selected = CareerKitSystem.GetPreset(club.Id, selectedKitSlot) == i;
                if (GUI.Button(row, (selected ? "✓   " : string.Empty) + CareerKitSystem.PresetNames[i], selected ? accentButtonStyle : buttonStyle))
                {
                    CareerKitSystem.SetPreset(club.Id, selectedKitSlot, i);
                    notice = CareerKitSystem.SlotNames[selectedKitSlot] + " kit saved.";
                }
                GUI.color = primary;
                GUI.Box(new Rect(row.xMax - 104f, row.y + 5f, 46f, row.height - 10f), GUIContent.none, selectedRowStyle);
                GUI.color = secondary;
                GUI.Box(new Rect(row.xMax - 52f, row.y + 5f, 46f, row.height - 10f), GUIContent.none, selectedRowStyle);
                GUI.color = Color.white;
            }
            GUI.EndScrollView();
            if (GUI.Button(new Rect(x, footerY, width, 46f), "BACK TO CAREER", buttonStyle)) showKitRoom = false;
        }

        private void DrawTournamentHub(Rect panel)
        {
            var x = panel.x + 24f;
            var width = panel.width - 48f;
            GUI.Label(new Rect(x, panel.y + 10f, width, 46f), "COMPETITIONS", headingStyle);
            GUI.Label(new Rect(x, panel.y + 56f, width, 42f), "Your career competitions and club record", smallStyle);
            var gap = 8f;
            var startY = panel.y + 106f;
            var footerY = panel.yMax - 60f;
            var viewHeight = Mathf.Max(40f, footerY - startY - 6f);
            var rowHeight = Mathf.Clamp(panel.height * 0.1f, 48f, 72f);
            competitionScroll = GUI.BeginScrollView(new Rect(x, startY, width, viewHeight), competitionScroll,
                new Rect(0f, 0f, width - 18f, 3f * (rowHeight + gap)));
            if (GUI.Button(new Rect(0f, 0f, width - 18f, rowHeight), $"{CareerLeagueSystem.GetManagedLeague(save)?.Name ?? "LEAGUE"}\nView standings and the next scheduled fixture", buttonStyle)) showLeagueTable = true;
            if (GUI.Button(new Rect(0f, rowHeight + gap, width - 18f, rowHeight), $"{CareerCupSystem.CompetitionName(save)}\n{(save.cupRound > 0 ? CareerCupSystem.RoundName(save.cupRound) : "Season cup campaign")}", buttonStyle)) showCupCampaign = true;
            if (GUI.Button(new Rect(0f, (rowHeight + gap) * 2f, width - 18f, rowHeight), $"CLUB HONOURS  •  {(save.honours == null ? 0 : save.honours.Length)} TROPHIES\nReview titles won in this save", buttonStyle)) { honoursScroll = Vector2.zero; showHonours = true; }
            GUI.EndScrollView();
            if (GUI.Button(new Rect(x, footerY, width, 46f), "BACK TO CAREER", buttonStyle)) showTournamentHub = false;
        }

        private void DrawMatchPreview(Rect panel)
        {
            var x = panel.x + 24f;
            var width = panel.width - 48f;
            var next = CareerLeagueSystem.GetNextFixture(save);
            var userClub = CareerLeagueSystem.GetManagedClub(save);
            var opponent = WorldDatabase.GetClub(next.OpponentClubId);
            GUI.Label(new Rect(x, panel.y + 12f, width, 46f), "MATCH PREVIEW", headingStyle);

            var compact = panel.height < 440f || width < 520f;
            var y = compact ? panel.y + 56f : panel.y + 82f;
            var teamsHeight = compact ? 74f : 92f;
            var teamGap = Mathf.Clamp(width * 0.08f, 22f, 48f);
            var teamWidth = (width - teamGap) * 0.5f;
            GUI.Label(new Rect(x, y, teamWidth, teamsHeight), userClub?.Name ?? "YOUR CLUB", matchTeamStyle);
            GUI.Label(new Rect(x + teamWidth, y, teamGap, teamsHeight), "VS", matchVsStyle);
            GUI.Label(new Rect(x + teamWidth + teamGap, y, teamWidth, teamsHeight),
                opponent?.Name ?? "OPPONENT", matchTeamStyle);
            y += teamsHeight + (compact ? 6f : 12f);

            var competition = next.Kind == CareerFixtureKind.Cup
                ? CareerCupSystem.CompetitionName(save)
                : CareerLeagueSystem.GetManagedLeague(save)?.Name;
            var competitionHeight = compact ? 38f : 42f;
            GUI.Label(new Rect(x, y, width, competitionHeight),
                $"{competition}  •  FIXTURE VENUE: {(next.UserIsHome ? "HOME" : "AWAY")}   •   {save.formationId}", bodyStyle);
            y += competitionHeight + (compact ? 4f : 10f);
            var kitSlot = CareerKitSystem.GetActiveMatchSlot(save.managedClubId);
            var tacticsHeight = compact ? 34f : 46f;
            GUI.Label(new Rect(x, y, width, tacticsHeight),
                $"TACTIC  {save.tacticalStyle}   •   KIT  {CareerKitSystem.SlotNames[kitSlot]} / {CareerKitSystem.PresetNames[CareerKitSystem.GetPreset(save.managedClubId, kitSlot)]}",
                smallStyle);

            var footerY = panel.yMax - (compact ? 56f : 70f);
            var gap = 10f;
            var half = (width - gap) / 2f;
            var buttonHeight = compact ? 44f : 52f;
            if (GUI.Button(new Rect(x, footerY, half, buttonHeight), "BACK", buttonStyle))
                showMatchPreview = false;
            if (GUI.Button(new Rect(x + half + gap, footerY, half, buttonHeight), "KICK OFF", primaryButtonStyle))
            {
                showMatchPreview = false;
                enabled = false;
                if (GetComponent<MatchManager3D>() == null) gameObject.AddComponent<MatchManager3D>();
            }
        }

        private static Color ToColor(WorldColor color)
        {
            return new Color(color.R, color.G, color.B);
        }

        private void DrawClubBrowser(Rect panel)
        {
            var x = panel.x + 22f;
            var width = panel.width - 44f;
            var y = panel.y + 16f;

            GUI.Label(new Rect(x, y, width, 50f), "BROWSE WORLD", headingStyle);
            y += 50f;

            var country = WorldDatabase.GetCountry(browserCountryId);
            var league = country == null ? null : WorldDatabase.GetLeagueForCountry(country.Id);
            var footerHeight = Mathf.Clamp(panel.height * 0.09f, 44f, 60f);
            var footerY = panel.y + panel.height - footerHeight - 14f;

            if (league == null)
            {
                DrawCountryPicker(panel, x, width, ref y, footerY, footerHeight);
                return;
            }

            GUI.Label(new Rect(x, y, width, 36f), $"{country.Name}  •  {league.Name}", bodyStyle);
            y += 42f;

            var clubs = WorldDatabase.GetLeagueClubs(league.Id);
            var gap = 8f;
            var columns = 2;
            var buttonWidth = (width - gap) / columns;
            var buttonHeight = Mathf.Clamp(panel.height * 0.085f, 42f, 62f);
            var contentHeight = Mathf.Ceil(clubs.Length / (float)columns) * (buttonHeight + gap);
            var viewHeight = footerY - y - 8f;
            clubScroll = GUI.BeginScrollView(new Rect(x, y, width, viewHeight), clubScroll,
                new Rect(0f, 0f, width - 22f, contentHeight));
            for (var i = 0; i < clubs.Length; i++)
            {
                var column = i % columns;
                var row = i / columns;
                var rect = new Rect(column * (buttonWidth + gap), row * (buttonHeight + gap),
                    buttonWidth, buttonHeight);
                var label = $"{clubs[i].Name}   ·   STR {clubs[i].Strength}";
                if (GUI.Button(rect, label, buttonStyle))
                {
                    if (save == null)
                        StartCareer(clubs[i].Id);
                    else
                    {
                        pendingClubId = clubs[i].Id;
                        confirmNewCareer = true;
                    }
                }
            }
            GUI.EndScrollView();

            if (GUI.Button(new Rect(x, footerY, footerHeight * 2.4f, footerHeight), "BACK", buttonStyle))
            {
                browserCountryId = string.Empty;
                notice = "Choose another country.";
            }
            if (save == null && GUI.Button(new Rect(x + footerHeight * 2.6f, footerY,
                width - footerHeight * 2.6f, footerHeight), "BACK TO SOCCER 27", buttonStyle))
            {
                showClubBrowser = false;
                showHomeScreen = true;
            }
            if (save != null && GUI.Button(new Rect(x + footerHeight * 2.6f, footerY,
                width - footerHeight * 2.6f, footerHeight), "CANCEL & RESUME CAREER", buttonStyle))
            {
                showClubBrowser = false;
                notice = "Returned to your career.";
            }
        }

        private void DrawCountryPicker(Rect panel, float x, float width, ref float y,
            float footerY, float footerHeight)
        {
            var tabGap = 6f;
            var tabWidth = (width - tabGap * (Confederations.Length - 1)) / Confederations.Length;
            var tabHeight = Mathf.Clamp(panel.height * 0.065f, 32f, 46f);
            for (var i = 0; i < Confederations.Length; i++)
            {
                var confederation = Confederations[i];
                var selected = browserConfederation == confederation;
                var label = (selected ? "* " : string.Empty) + confederation;
                if (GUI.Button(new Rect(x + i * (tabWidth + tabGap), y, tabWidth, tabHeight), label,
                    selected ? accentButtonStyle : buttonStyle))
                {
                    browserConfederation = confederation;
                    countryScroll = Vector2.zero;
                }
            }
            y += tabHeight + 10f;

            var countries = WorldDatabase.GetCountries()
                .Where(item => item.Confederation == browserConfederation)
                .ToArray();
            var gap = 8f;
            var columns = 4;
            var buttonWidth = (width - gap * (columns - 1)) / columns;
            var buttonHeight = Mathf.Clamp(panel.height * 0.06f, 32f, 44f);
            var contentHeight = Mathf.Ceil(countries.Length / (float)columns) * (buttonHeight + gap);
            var viewHeight = footerY - y - 8f;
            countryScroll = GUI.BeginScrollView(new Rect(x, y, width, viewHeight), countryScroll,
                new Rect(0f, 0f, width - 22f, contentHeight));
            for (var i = 0; i < countries.Length; i++)
            {
                var column = i % columns;
                var row = i / columns;
                var rect = new Rect(column * (buttonWidth + gap), row * (buttonHeight + gap),
                    buttonWidth, buttonHeight);
                if (GUI.Button(rect, countries[i].Name, buttonStyle))
                {
                    browserCountryId = countries[i].Id;
                    clubScroll = Vector2.zero;
                    notice = "Choose a club from " + countries[i].Name + ".";
                }
            }
            GUI.EndScrollView();

            GUI.Label(new Rect(x, footerY, save != null ? width * 0.5f : width * 0.5f, footerHeight),
                "96 national top divisions", smallStyle);
            if (save == null && GUI.Button(new Rect(x + width * 0.5f, footerY, width * 0.5f, footerHeight),
                "BACK TO SOCCER 27", buttonStyle))
            {
                showClubBrowser = false;
                showHomeScreen = true;
            }
            if (save != null && GUI.Button(new Rect(x + width * 0.5f, footerY, width * 0.5f, footerHeight),
                "CANCEL & RESUME CAREER", buttonStyle))
            {
                showClubBrowser = false;
                notice = "Returned to your career.";
            }
        }

        private void DrawNewCareerConfirmation(Rect panel)
        {
            var club = WorldDatabase.GetClub(pendingClubId);
            if (club == null)
            {
                confirmNewCareer = false;
                return;
            }

            var x = panel.x + 30f;
            var width = panel.width - 60f;
            var y = panel.y + 40f;
            GUI.Label(new Rect(x, y, width, 50f), "START NEW CAREER?", headingStyle);
            y += 66f;
            var league = WorldDatabase.GetLeague(club.LeagueId);
            var country = league == null ? null : WorldDatabase.GetCountry(league.CountryId);
            var leagueLabel = league == null
                ? club.LeagueId
                : country == null ? league.Name : $"{league.Name}  •  {country.Name}";
            GUI.Label(new Rect(x, y, width, 96f),
                $"{club.Name}\n{leagueLabel}\n\nThis replaces your current career save.", bodyStyle);
            y += 120f;

            var height = Mathf.Clamp(panel.height * 0.1f, 48f, 66f);
            var gap = 10f;
            var half = (width - gap) / 2f;
            if (GUI.Button(new Rect(x, y, half, height), "REPLACE CAREER", dangerButtonStyle))
            {
                confirmNewCareer = false;
                StartCareer(club.Id);
            }
            if (GUI.Button(new Rect(x + half + gap, y, half, height), "CANCEL", buttonStyle))
            {
                confirmNewCareer = false;
                pendingClubId = string.Empty;
            }
        }

        private void StartCareer(string clubId)
        {
            var club = WorldDatabase.GetClub(clubId);
            if (club == null)
            {
                notice = "That club could not be loaded.";
                return;
            }

            var previous = save;
            save = new CareerSaveData
            {
                worldSeed = WorldDatabase.DefaultWorldSeed,
                leagueId = club.LeagueId,
                managedClubId = club.Id,
                season = 1,
                matchweek = 1,
                transferBudget = InitialBudget,
                formationId = CareerFormationSystem.FormationIds[0],
                tacticalStyle = CareerFormationSystem.TacticalStyles[0]
            };

            if (!CareerSaveSystem.Save(save))
            {
                save = previous;
                notice = "Could not save the new career. Please try again.";
                return;
            }

            pendingClubId = string.Empty;
            showHomeScreen = false;
            showClubBrowser = false;
            showSettingsScreen = false;
            confirmNewCareer = false;
            showTransfers = false;
            marketCache = null;
            pendingTransferPlayerId = string.Empty;
            pendingTransferAction = string.Empty;
            selectedTransferPlayerId = string.Empty;
            notice = "Career started: " + club.Name + ".";
        }

        private void DrawSquadManagement(Rect panel)
        {
            var x = panel.x + 24f;
            var width = panel.width - 48f;
            GUI.Label(new Rect(x, panel.y + 10f, width, 42f), "SQUAD & TACTICS", headingStyle);

            var gap = 6f;
            var footerHeight = Mathf.Clamp(panel.height * 0.09f, 40f, 58f);
            var footerY = panel.y + panel.height - footerHeight - 12f;
            var contentTop = panel.y + 56f;
            var viewHeight = footerY - contentTop - 8f;
            var innerWidth = width - 22f;
            var buttonHeight = Mathf.Clamp(panel.height * 0.08f, 34f, 52f);
            var rowHeight = Mathf.Clamp(panel.height * 0.04f, 20f, 28f);
            var squad = CareerTransferSystem.GetSquad(save, save.managedClubId);
            var contentHeight = 24f + buttonHeight + 12f + 24f + buttonHeight + 14f + 24f +
                                (squad.Length + 1) * rowHeight + 8f;

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
                if (GUI.Button(new Rect(0f, cy, innerWidth, rowHeight), GUIContent.none, rowStyle))
                {
                    selectedPlayer = player;
                    showSquadManagement = false;
                    showPlayerDetails = true;
                }
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

        private void DrawCupCampaign(Rect panel)
        {
            var x = panel.x + 22f;
            var width = panel.width - 44f;
            GUI.Label(new Rect(x, panel.y + 10f, width, 42f),
                CareerCupSystem.CompetitionName(save).ToUpperInvariant(), headingStyle);

            var played = CareerCupSystem.PlayedRounds(save);
            var tie = CareerCupSystem.GetUserTie(save);
            var status = save.cupChampionId == save.managedClubId
                ? "CHAMPIONS"
                : save.cupRound > 0
                    ? $"NEXT: {CareerCupSystem.RoundName(save.cupRound)}  •  MATCHWEEK {CareerCupSystem.WeekForRound(save.cupRound)}"
                    : played > 0 ? "CUP RUN COMPLETE" : "NOT QUALIFIED FOR THIS SEASON";
            GUI.Label(new Rect(x, panel.y + 54f, width, 34f), status, bodyStyle);

            var footerHeight = Mathf.Clamp(panel.height * 0.09f, 42f, 60f);
            var footerY = panel.yMax - footerHeight - 12f;
            var rowHeight = Mathf.Clamp(panel.height * 0.085f, 30f, 76f);
            var gap = 6f;
            for (var round = 1; round <= CareerCupSystem.Rounds; round++)
            {
                var index = round - 1;
                var rowY = panel.y + 96f + index * (rowHeight + gap);
                if (rowY + rowHeight > footerY - 4f)
                    break;

                var opponentId = save.cupOpponentIds != null && index < save.cupOpponentIds.Length
                    ? save.cupOpponentIds[index] : string.Empty;
                var opponent = WorldDatabase.GetClub(opponentId);
                string detail;
                if (opponent != null)
                {
                    var score = index < save.cupUserGoals.Length && index < save.cupOpponentGoals.Length
                        ? $"{save.cupUserGoals[index]}  -  {save.cupOpponentGoals[index]}" : "Result unavailable";
                    var penalties = save.cupUserPenalties != null && save.cupOpponentPenalties != null &&
                                    index < save.cupUserPenalties.Length && index < save.cupOpponentPenalties.Length &&
                                    (save.cupUserPenalties[index] > 0 || save.cupOpponentPenalties[index] > 0)
                        ? $"  (PEN {save.cupUserPenalties[index]} - {save.cupOpponentPenalties[index]})" : string.Empty;
                    detail = $"{opponent.Name}   •   {score}{penalties}";
                }
                else if (tie != null && tie.Round == round)
                {
                    var nextOpponent = WorldDatabase.GetClub(tie.OpponentFor(save.managedClubId));
                    detail = nextOpponent == null ? "Fixture pending" : "vs " + nextOpponent.Name;
                }
                else if (save.cupRound == 0 && played > 0 && round > played)
                    detail = "Eliminated before this round";
                else
                    detail = "Not played yet";

                GUI.Box(new Rect(x, rowY, width, rowHeight), GUIContent.none,
                    round <= played ? selectedRowStyle : rowStyle);
                GUI.Label(new Rect(x + 12f, rowY, width * 0.3f, rowHeight),
                    CareerCupSystem.RoundName(round), tableHeaderStyle);
                GUI.Label(new Rect(x + width * 0.32f, rowY, width * 0.66f, rowHeight), detail, tableNameStyle);
            }

            if (GUI.Button(new Rect(x, footerY, width, footerHeight), "BACK TO CAREER", buttonStyle))
                showCupCampaign = false;
        }

        private void DrawHonours(Rect panel)
        {
            var x = panel.x + 22f;
            var width = panel.width - 44f;
            GUI.Label(new Rect(x, panel.y + 10f, width, 42f), "CLUB HONOURS", headingStyle);
            var honours = save.honours ?? Array.Empty<string>();
            var footerHeight = Mathf.Clamp(panel.height * 0.09f, 42f, 60f);
            var footerY = panel.yMax - footerHeight - 12f;
            var rowHeight = Mathf.Clamp(panel.height * 0.075f, 34f, 54f);
            var contentHeight = Mathf.Max(rowHeight, honours.Length * (rowHeight + 6f));
            var viewY = panel.y + 58f;
            var viewHeight = footerY - viewY - 6f;
            var innerWidth = width - 22f;
            honoursScroll = GUI.BeginScrollView(new Rect(x, viewY, width, viewHeight), honoursScroll,
                new Rect(0f, 0f, innerWidth, contentHeight));

            if (honours.Length == 0)
                GUI.Label(new Rect(0f, 0f, innerWidth, rowHeight * 2f),
                    "No trophies recorded yet. Keep playing to build your club history.", bodyStyle);
            else
            {
                for (var i = 0; i < honours.Length; i++)
                {
                    var rowY = i * (rowHeight + 6f);
                    GUI.DrawTexture(new Rect(0f, rowY, innerWidth, rowHeight),
                        i % 2 == 0 ? tableHighlightTexture : tableAltRowTexture);
                    GUI.Label(new Rect(12f, rowY, innerWidth - 24f, rowHeight),
                        $"{i + 1:00}   {honours[i]}", tableNameStyle);
                }
            }
            GUI.EndScrollView();

            if (GUI.Button(new Rect(x, footerY, width, footerHeight), "BACK TO CAREER", buttonStyle))
                showHonours = false;
        }

        public void RefreshCareer(bool matchResultSaved = true)
        {
            save = CareerSaveSystem.Load();
            showHomeScreen = true;
            showSettingsScreen = false;
            showClubBrowser = false;
            showLeagueTable = false;
            showCupCampaign = false;
            showHonours = false;
            showSquadManagement = false;
            showTransfers = false;
            confirmNewCareer = false;
            marketCache = null;
            pendingTransferPlayerId = string.Empty;
            pendingTransferAction = string.Empty;
            selectedTransferPlayerId = string.Empty;
            notice = save == null
                ? "Match ended. Browse the world to start a career."
                : !matchResultSaved
                    ? "Match abandoned. No result was recorded."
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
