using System;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    /// <summary>
    /// Lightweight runtime manager-career control surface. This is intentionally IMGUI-based
    /// so it needs no scene prefab; the main mobile hub opens it through CareerModeCoordinator.
    /// </summary>
    public sealed class CareerModeControlScreen : MonoBehaviour
    {
        [SerializeField] private CareerModeCoordinator coordinator;
        [SerializeField] private bool visible;
        [SerializeField] private string managerName = "AERO Manager";
        [SerializeField] private int leagueIndex;
        [SerializeField] private int clubIndex;
        [SerializeField] private int selectedRosterIndex;
        [SerializeField] private int selectedScoutingIndex;
        [SerializeField] private int selectedScoutRegion;
        private Vector2 scroll;
        private string status = "SELECT A CLUB TO BEGIN YOUR CAREER.";

        public void Configure(CareerModeCoordinator value) => coordinator = value;
        public void Open() { visible = true; ResolveSelection(); }
        public void Close() => visible = false;

        private void ResolveSelection()
        {
            if (coordinator?.Database == null) return;
            var leagues = coordinator.Database.leagues;
            if (leagues.Count == 0) return;
            leagueIndex = Mathf.Clamp(leagueIndex, 0, leagues.Count - 1);
            var league = leagues[leagueIndex];
            var clubs = coordinator.Database.ClubsForLeague(league.id);
            clubIndex = Mathf.Clamp(clubIndex, 0, Math.Max(0, clubs.Count - 1));
        }

        private void OnGUI()
        {
            if (!visible) return;
            coordinator ??= FindFirstObjectByType<CareerModeCoordinator>();
            GUI.depth = -1000;
            float width = Mathf.Min(Screen.width * .94f, 760f);
            float height = Mathf.Min(Screen.height * .92f, 960f);
            var panel = new Rect((Screen.width - width) * .5f, (Screen.height - height) * .5f, width, height);
            var oldColor = GUI.color;
            GUI.color = new Color(.018f, .03f, .055f, .985f);
            GUI.Box(panel, GUIContent.none);
            GUI.color = oldColor;

            GUILayout.BeginArea(new Rect(panel.x + 18, panel.y + 14, panel.width - 36, panel.height - 28));
            GUILayout.BeginHorizontal();
            GUILayout.Label("AERO CAREER CONTROL CENTER", HeaderStyle());
            GUILayout.FlexibleSpace();
            if (GUILayout.Button("CLOSE", GUILayout.Width(76), GUILayout.Height(38))) visible = false;
            GUILayout.EndHorizontal();
            GUILayout.Label("ONE SAVE  /  COMPLETE SEASONS  /  BUILD A CLUB THAT LASTS", MutedStyle());
            GUILayout.Space(10);

            if (coordinator == null || coordinator.Database == null || coordinator.SaveManager == null)
            {
                GUILayout.Label("Football database is not ready. Confirm the Football World catalog is loaded in the Unity scene.", HeaderStyle());
                GUILayout.EndArea();
                return;
            }

            scroll = GUILayout.BeginScrollView(scroll);
            var manager = coordinator.SaveManager;
            if (manager.HasCareer)
            {
                var save = manager.Career;
                GUILayout.Label("CAREER PROFILE", SectionStyle());
                GUILayout.Label(save.managerName + "  /  " + save.clubName, HeaderStyle());
                GUILayout.Label("SEASON " + save.season + "   •   MATCHWEEK " + save.matchweek + "   •   " +
                    (manager.TransferWindowOpen ? "TRANSFER WINDOW OPEN" : "TRANSFER WINDOW CLOSED"), MutedStyle());
                GUILayout.Label("BUDGET  €" + save.transferBudget.ToString("N0") + "   •   WAGES  €" +
                    save.currentWeeklyWages.ToString("N0") + " / €" + save.weeklyWageBudget.ToString("N0") +
                    "   •   BOARD " + save.boardConfidence + "%   •   REPUTATION " + save.managerReputation, MutedStyle());
                GUILayout.Label("RECORD  " + save.wins + "W / " + save.draws + "D / " + save.losses + "L   •   PTS " +
                    save.leaguePoints + "   •   PLAYED " + save.matchesPlayed, MutedStyle());
                if (!string.IsNullOrWhiteSpace(save.lastSeasonOutcome)) GUILayout.Label("LAST SEASON  /  " + save.lastSeasonOutcome, SectionStyle());

                GUILayout.BeginHorizontal();
                if (GUILayout.Button("SAVE NOW", GUILayout.Height(46))) { coordinator.SaveNow(); status = "CAREER AND RUNTIME SYSTEMS SAVED."; }
                if (GUILayout.Button("PLAY NEXT FIXTURE", GUILayout.Height(46)))
                    status = coordinator.StartNextCareerFixture() ? "CAREER FIXTURE STARTED." : "NO AVAILABLE CAREER FIXTURE OR MATCH ENGINE.";
                GUILayout.EndHorizontal();
                GUILayout.BeginHorizontal();
                if (GUILayout.Button("TRAIN SQUAD", GUILayout.Height(42)))
                    status = coordinator.TrainSquad() ? "BALANCED TRAINING APPLIED." : "START A CAREER AND LOAD A SQUAD FIRST.";
                if (GUILayout.Button("ADVANCE WEEK", GUILayout.Height(42)))
                    status = coordinator.AdvanceWeek() ? "SCOUTING AND PLAYER FORM ADVANCED." : "WEEK COULD NOT ADVANCE.";
                GUILayout.EndHorizontal();
                GUILayout.BeginHorizontal();
                if (GUILayout.Button("END SEASON / PROMOTION", GUILayout.Height(42)))
                    status = coordinator.EndSeason() ? "SEASON CLOSED. CONTRACTS, OBJECTIVES AND THE NEXT SCHEDULE HAVE BEEN UPDATED." : "FINISH ALL LEAGUE FIXTURES BEFORE ENDING THE SEASON.";
                if (GUILayout.Button("LOAD SAVE", GUILayout.Height(42)))
                    status = coordinator.LoadCareer() ? "CAREER SAVE RESTORED." : "NO VALID CAREER SAVE WAS FOUND.";
                GUILayout.EndHorizontal();

                GUILayout.Space(8);
                GUILayout.Label("BOARD OBJECTIVES", SectionStyle());
                foreach (var objective in save.objectives)
                    GUILayout.Label((objective.completed ? "[DONE] " : "[  ] ") + objective.title + "  •  " +
                        objective.progress + "/" + objective.target + "  •  REWARD €" + objective.reward.ToString("N0"), MutedStyle());
                GUILayout.Label("ACTIVE CONTRACTS  /  " + save.contracts.Count, SectionStyle());
                foreach (var contract in save.contracts.Take(8))
                    GUILayout.Label(contract.playerName + "  •  " + contract.remainingYears + " years left  •  €" +
                        contract.weeklyWage.ToString("N0") + "/week", MutedStyle());

                var roster = coordinator.Squad?.CurrentTeam?.players?.Where(player => player != null).ToList();
                if (roster != null && roster.Count > 0)
                {
                    selectedRosterIndex = Mathf.Clamp(selectedRosterIndex, 0, roster.Count - 1);
                    var sellPlayer = roster[selectedRosterIndex];
                    GUILayout.Label("TRANSFER MARKET  /  SELL A SQUAD PLAYER", SectionStyle());
                    GUILayout.BeginHorizontal();
                    if (GUILayout.Button("◀", GUILayout.Width(48), GUILayout.Height(40))) selectedRosterIndex = (selectedRosterIndex + roster.Count - 1) % roster.Count;
                    GUILayout.BeginVertical();
                    GUILayout.Label(sellPlayer.displayName + "  •  " + sellPlayer.position + "  •  OVR " + sellPlayer.overall, HeaderStyle());
                    GUILayout.Label("Est. fee €" + (sellPlayer.overall * sellPlayer.overall * 1200).ToString("N0"), MutedStyle());
                    GUILayout.EndVertical();
                    if (GUILayout.Button("▶", GUILayout.Width(48), GUILayout.Height(40))) selectedRosterIndex = (selectedRosterIndex + 1) % roster.Count;
                    GUILayout.EndHorizontal();
                    if (GUILayout.Button("SELL PLAYER  /  TRANSFER WINDOW REQUIRED", GUILayout.Height(42)))
                    {
                        var existingContract = save.contracts.FirstOrDefault(item => item.playerId == sellPlayer.id);
                        int weeklyWage = existingContract != null ? existingContract.weeklyWage : Mathf.Max(0, sellPlayer.overall * 700);
                        int estimatedFee = sellPlayer.overall * sellPlayer.overall * 1200;
                        status = coordinator.SellPlayer(sellPlayer.id, estimatedFee, weeklyWage)
                            ? sellPlayer.displayName + " SOLD. FEE ADDED TO THE CAREER BUDGET."
                            : "SALE FAILED. CHECK TRANSFER WINDOW AND PLAYER STATUS.";
                    }
                }

                var scoutables = coordinator.Database.players.Where(player => player != null && !string.IsNullOrWhiteSpace(player.id)).ToList();
                if (scoutables.Count > 0)
                {
                    selectedScoutingIndex = Mathf.Clamp(selectedScoutingIndex, 0, scoutables.Count - 1);
                    var target = scoutables[selectedScoutingIndex];
                    GUILayout.Label("SCOUTING NETWORK  /  " + (coordinator.Scouting?.NetworkLevel ?? 1), SectionStyle());
                    GUILayout.BeginHorizontal();
                    if (GUILayout.Button("◀ TARGET", GUILayout.Width(112), GUILayout.Height(40))) selectedScoutingIndex = (selectedScoutingIndex + scoutables.Count - 1) % scoutables.Count;
                    GUILayout.BeginVertical();
                    GUILayout.Label(target.displayName + "  •  OVR " + target.overall + "  •  " + target.position, HeaderStyle());
                    GUILayout.Label("REGION: " + (ScoutRegion)Mathf.Clamp(selectedScoutRegion, 0, Enum.GetValues(typeof(ScoutRegion)).Length - 1), MutedStyle());
                    GUILayout.EndVertical();
                    if (GUILayout.Button("NEXT ▶", GUILayout.Width(90), GUILayout.Height(40))) selectedScoutingIndex = (selectedScoutingIndex + 1) % scoutables.Count;
                    GUILayout.EndHorizontal();
                    GUILayout.BeginHorizontal();
                    if (GUILayout.Button("CHANGE REGION", GUILayout.Height(40))) selectedScoutRegion = (selectedScoutRegion + 1) % Enum.GetValues(typeof(ScoutRegion)).Length;
                    if (GUILayout.Button("ASSIGN SCOUT  /  2 WEEKS", GUILayout.Height(40)))
                    {
                        var scoutPlayer = new PlayerData { id = target.id, displayName = target.displayName, overall = target.overall };
                        status = coordinator.AssignScout(scoutPlayer, (ScoutRegion)selectedScoutRegion, 2)
                            ? "SCOUT ASSIGNED. ADVANCE THE WEEK TO COMPLETE THE REPORT."
                            : "SCOUTING FAILED. CHECK BUDGET OR EXISTING ASSIGNMENT.";
                    }
                    GUILayout.EndHorizontal();
                    if (coordinator.Scouting != null)
                    {
                        foreach (var assignment in coordinator.Scouting.Assignments.Take(3))
                            GUILayout.Label("SCOUTING  /  " + assignment.playerId + "  •  " + assignment.weeksRemaining + " week(s) left", MutedStyle());
                        foreach (var report in coordinator.Scouting.Reports.Take(3))
                            GUILayout.Label("REPORT  /  " + report.playerId + "  •  OVR " + report.estimatedOverall + "  •  POT " + report.estimatedPotential + "  •  " + report.recommendation, MutedStyle());
                    }
                }
            }
            else
            {
                GUILayout.Label("START A NEW MANAGER CAREER", SectionStyle());
                GUILayout.Label("Manager name", MutedStyle());
                managerName = GUILayout.TextField(managerName ?? "AERO Manager", GUILayout.Height(40));
                var leagues = coordinator.Database.leagues;
                if (leagues == null || leagues.Count == 0)
                {
                    GUILayout.Label("No leagues were loaded. Validate the Football World catalog before starting a career.", SectionStyle());
                    GUILayout.EndScrollView();
                    GUILayout.EndArea();
                    return;
                }
                leagueIndex = Mathf.Clamp(leagueIndex, 0, leagues.Count - 1);
                GUILayout.BeginHorizontal();
                if (GUILayout.Button("◀ LEAGUE", GUILayout.Height(42))) leagueIndex = (leagueIndex - 1 + leagues.Count) % leagues.Count;
                GUILayout.Label(leagues[leagueIndex].displayName, HeaderStyle());
                if (GUILayout.Button("LEAGUE ▶", GUILayout.Height(42))) leagueIndex = (leagueIndex + 1) % leagues.Count;
                GUILayout.EndHorizontal();
                var selectedLeague = leagues.Count == 0 ? null : leagues[leagueIndex];
                var clubs = selectedLeague == null ? null : coordinator.Database.ClubsForLeague(selectedLeague.id);
                if (clubs != null && clubs.Count > 0)
                {
                    clubIndex = Mathf.Clamp(clubIndex, 0, clubs.Count - 1);
                    GUILayout.BeginHorizontal();
                    if (GUILayout.Button("◀ CLUB", GUILayout.Height(46))) clubIndex = (clubIndex - 1 + clubs.Count) % clubs.Count;
                    GUILayout.BeginVertical();
                    GUILayout.Label(clubs[clubIndex].displayName, HeaderStyle());
                    GUILayout.Label(clubs[clubIndex].country + "  •  " + clubs[clubIndex].stadiumName, MutedStyle());
                    GUILayout.EndVertical();
                    if (GUILayout.Button("CLUB ▶", GUILayout.Height(46))) clubIndex = (clubIndex + 1) % clubs.Count;
                    GUILayout.EndHorizontal();
                    if (GUILayout.Button("START CAREER WITH THIS CLUB", GUILayout.Height(54)))
                        status = coordinator.StartNewCareer(managerName, clubs[clubIndex].id) ? "CAREER CREATED AND SAVED." : "CAREER COULD NOT START. CHECK DATABASE REFERENCES.";
                }
                if (GUILayout.Button("LOAD EXISTING CAREER SAVE", GUILayout.Height(46)))
                    status = coordinator.LoadCareer() ? "CAREER SAVE RESTORED." : "NO VALID CAREER SAVE WAS FOUND.";
            }

            GUILayout.Space(10);
            GUILayout.Label(status, SectionStyle());
            GUILayout.EndScrollView();
            GUILayout.EndArea();
        }

        private static GUIStyle HeaderStyle() => new GUIStyle(GUI.skin.label)
        { fontSize = 17, fontStyle = FontStyle.Bold, normal = { textColor = new Color(.94f, .97f, 1f) }, wordWrap = true };
        private static GUIStyle SectionStyle() => new GUIStyle(GUI.skin.label)
        { fontSize = 13, fontStyle = FontStyle.Bold, normal = { textColor = new Color(.1f, .85f, 1f) }, wordWrap = true };
        private static GUIStyle MutedStyle() => new GUIStyle(GUI.skin.label)
        { fontSize = 11, normal = { textColor = new Color(.68f, .75f, .83f) }, wordWrap = true };
    }
}