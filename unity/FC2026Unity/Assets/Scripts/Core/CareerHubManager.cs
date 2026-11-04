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

            var panelWidth = Mathf.Min(Screen.width - 32f, 820f);
            var panelHeight = Mathf.Min(Screen.height - 32f, 680f);
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

            DrawDashboard(panel);
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

            var compact = panel.height < 430f;
            var lineHeight = Mathf.Clamp(panel.height * 0.075f, 22f, 32f);
            if (!compact)
            {
                GUI.Label(new Rect(x, y, width, 40f), "FC 2026  |  CAREER", headingStyle);
                y += 42f;
            }

            var titleHeight = Mathf.Clamp(panel.height * 0.13f, 34f, 58f);
            GUI.Label(new Rect(x, y, width, titleHeight), club.Name, titleStyle);
            y += titleHeight;
            GUI.Label(new Rect(x, y, width, lineHeight),
                $"{league.Name}  •  {country?.Name ?? club.CountryId}", bodyStyle);
            y += lineHeight;

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
            GUI.Label(new Rect(x, y, width, lineHeight),
                $"Season {save.season}  •  Week {save.matchweek}/{WorldDatabase.MatchweeksPerSeason}  •  Position {position}/{ranked.Length}",
                smallStyle);
            y += lineHeight;

            var next = CareerLeagueSystem.GetNextFixture(save);
            var opponent = next.IsValid ? WorldDatabase.GetClub(next.OpponentClubId) : null;
            var competition = next.Kind == CareerFixtureKind.Cup
                ? $"{CareerCupSystem.CompetitionName(save)} {CareerCupSystem.ShortRoundName(next.Round)}"
                : "League";
            var fixtureLine = opponent == null
                ? "No fixture scheduled."
                : $"Next: {competition}  •  {(next.UserIsHome ? "vs" : "at")} {opponent.Name}";
            GUI.Label(new Rect(x, y, width, lineHeight), fixtureLine, smallStyle);
            y += lineHeight;

            if (panel.height >= 520f)
            {
                var cupState = save.cupRound > 0
                    ? "Cup " + CareerCupSystem.ShortRoundName(save.cupRound)
                    : !string.IsNullOrEmpty(save.cupChampionId) && save.cupChampionId == save.managedClubId
                        ? "Cup WON"
                        : "Cup out";
                var trophyState = save.honours != null && save.honours.Length > 0
                    ? $"Trophies {save.honours.Length}  •  {save.honours[0]}"
                    : "No trophies yet";
                GUI.Label(new Rect(x, y, width, lineHeight), $"{cupState}  •  {trophyState}", smallStyle);
                y += lineHeight;
            }

            GUI.Label(new Rect(x, y, width, lineHeight),
                $"W {save.wins}   D {save.draws}   L {save.losses}  •  Budget {save.transferBudget:N0}",
                smallStyle);
            y += lineHeight + 6f;

            var gap = 8f;
            var half = (width - gap) / 2f;
            var playHeight = Mathf.Clamp(panel.height * 0.115f, 38f, 60f);
            var playLabel = next.Kind == CareerFixtureKind.Cup && next.IsValid ? "PLAY CUP TIE" : "PLAY NEXT MATCH";
            if (GUI.Button(new Rect(x, y, width, playHeight), playLabel, primaryButtonStyle))
            {
                enabled = false;
                if (GetComponent<MatchManager3D>() == null)
                    gameObject.AddComponent<MatchManager3D>();
            }
            y += playHeight + 8f;

            var actionHeight = Mathf.Clamp(panel.height * 0.12f, 40f, 58f);
            if (compact)
            {
                var quarter = (width - gap * 3f) / 4f;
                if (GUI.Button(new Rect(x, y, quarter, actionHeight), "SQUAD", buttonStyle))
                    showSquadManagement = true;
                if (GUI.Button(new Rect(x + quarter + gap, y, quarter, actionHeight), "TABLE", buttonStyle))
                    showLeagueTable = true;
                if (GUI.Button(new Rect(x + (quarter + gap) * 2f, y, quarter, actionHeight), "TRANSFERS", buttonStyle))
                    OpenTransfers();
                if (GUI.Button(new Rect(x + (quarter + gap) * 3f, y, quarter, actionHeight), "BROWSE", buttonStyle))
                {
                    browserCountryId = string.Empty;
                    showClubBrowser = true;
                }
                y += actionHeight + 8f;
            }
            else
            {
                if (GUI.Button(new Rect(x, y, half, actionHeight), "SQUAD & TACTICS", buttonStyle))
                    showSquadManagement = true;
                if (GUI.Button(new Rect(x + half + gap, y, half, actionHeight), "LEAGUE TABLE", buttonStyle))
                    showLeagueTable = true;
                y += actionHeight + 8f;
                if (GUI.Button(new Rect(x, y, half, actionHeight), "TRANSFERS & CONTRACTS", buttonStyle))
                    OpenTransfers();
                if (GUI.Button(new Rect(x + half + gap, y, half, actionHeight), "BROWSE CLUBS", buttonStyle))
                {
                    browserCountryId = string.Empty;
                    showClubBrowser = true;
                }
                y += actionHeight + 8f;
            }

            GUI.Label(new Rect(x, y, width, Mathf.Max(24f, panel.y + panel.height - y - 10f)), notice, smallStyle);
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

            GUI.Label(new Rect(x, footerY, save != null ? width * 0.5f : width, footerHeight),
                "Top divisions only  •  96 countries", smallStyle);
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
            showClubBrowser = false;
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
