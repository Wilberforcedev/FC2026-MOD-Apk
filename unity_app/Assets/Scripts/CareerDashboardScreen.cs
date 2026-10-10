using System;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FC2026
{
    public sealed class CareerDashboardScreen : MonoBehaviour
    {
        [SerializeField] private FC2026UITheme theme;
        [SerializeField] private FootballWorldDatabase database;
        [SerializeField] private SeasonCalendarManager calendar;
        [SerializeField] private CareerManager career;
        [SerializeField] private PlayerProgressionManager progression;
        [SerializeField] private string managedClubId;
        [SerializeField] private Canvas canvas;

        private TMP_Text standingsText;
        private TMP_Text detailsText;
        private TMP_Text statusText;
        private TMP_Text seasonTitle;

        private void Start()
        {
            theme ??= Resources.Load<FC2026UITheme>("FC2026UITheme");
            database ??= FindFirstObjectByType<FootballWorldCatalogLoader>()?.Database;
            calendar ??= FindFirstObjectByType<SeasonCalendarManager>();
            career ??= FindFirstObjectByType<CareerManager>();
            progression ??= FindFirstObjectByType<PlayerProgressionManager>();
            if (calendar != null) calendar.CalendarChanged += Refresh; if (career != null) career.CareerChanged += Refresh;
            BuildScreen(); Refresh();
        }

        private void OnDestroy()
        {
            if (calendar != null) calendar.CalendarChanged -= Refresh; if (career != null) career.CareerChanged -= Refresh;
        }

        public void BuildScreen()
        {
            if (canvas == null) canvas = CreateCanvas();
            foreach (Transform child in canvas.transform) Destroy(child.gameObject);
            var shell = Panel(canvas.transform, "CareerDashboard", Theme(t => t.overlay), Vector2.zero, Vector2.one);
            seasonTitle = Label(shell.transform, "CAREER DASHBOARD", 38, Theme(t => t.heading), TextAlignmentOptions.TopLeft); Anchor(seasonTitle.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(theme.pagePadding, -32), new Vector2(800, 60));
            var subtitle = Label(shell.transform, "SEASON 01  /  MANAGER HUB", 13, Theme(t => t.muted), TextAlignmentOptions.TopLeft); Anchor(subtitle.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(theme.pagePadding, -90), new Vector2(500, 24));

            var tablePanel = Panel(shell.transform, "LeagueTable", Theme(t => t.panelSoft), new Vector2(0, 0), new Vector2(.62f, 1)); Anchor(tablePanel.GetComponent<RectTransform>(), new Vector2(0, 0), new Vector2(.62f, 1), new Vector2(theme.pagePadding, 104), new Vector2(-12, -132));
            var tableHeading = Label(tablePanel.transform, "LEAGUE TABLE", 15, Theme(t => t.focus), TextAlignmentOptions.TopLeft); Anchor(tableHeading.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(22, -44), new Vector2(-22, 0));
            standingsText = Label(tablePanel.transform, "Loading standings...", 16, Theme(t => t.body), TextAlignmentOptions.TopLeft); Anchor(standingsText.rectTransform, Vector2.zero, Vector2.one, new Vector2(22, 22), new Vector2(-22, -56));

            var side = Panel(shell.transform, "CareerSidePanel", Theme(t => t.panel), new Vector2(.64f, 0), new Vector2(1, 1)); Anchor(side.GetComponent<RectTransform>(), new Vector2(.64f, 0), new Vector2(1, 1), new Vector2(8, 104), new Vector2(-theme.pagePadding, -132));
            detailsText = Label(side.transform, "CLUB OBJECTIVES", 16, Theme(t => t.body), TextAlignmentOptions.TopLeft); Anchor(detailsText.rectTransform, Vector2.zero, Vector2.one, new Vector2(24, 24), new Vector2(-24, -24));
            var train = Button(side.transform, "OPEN PLAYER PROGRESSION", Theme(t => t.focus), () => statusText.text = "PLAYER PROGRESSION READY  /  SELECT A PLAYER TRAINING PLAN"); Anchor(train.GetComponent<RectTransform>(), new Vector2(0, 0), new Vector2(1, 0), new Vector2(24, 24), new Vector2(-24, 70));

            var footer = Panel(shell.transform, "DashboardFooter", Theme(t => t.panel), new Vector2(0, 0), new Vector2(1, 0)); Anchor(footer.GetComponent<RectTransform>(), new Vector2(0, 0), new Vector2(1, 0), new Vector2(theme.pagePadding, 22), new Vector2(-theme.pagePadding, 84));
            statusText = Label(footer.transform, "LIVE CAREER DATA", 13, Theme(t => t.muted), TextAlignmentOptions.Left); Anchor(statusText.rectTransform, new Vector2(0, 0), new Vector2(.72f, 1), new Vector2(18, 0), new Vector2(0, 0));
            var refresh = Button(footer.transform, "REFRESH DASHBOARD", Theme(t => t.focus), Refresh); Anchor(refresh.GetComponent<RectTransform>(), new Vector2(1, .5f), new Vector2(1, .5f), new Vector2(-190, 0), new Vector2(-10, 42));
        }

        public void Refresh()
        {
            if (standingsText == null) return;
            if (calendar == null || database == null) { standingsText.text = "NO SEASON CALENDAR ASSIGNED"; return; }
            var table = calendar.Standings;
            if (string.IsNullOrEmpty(managedClubId) && table.Count > 0) managedClubId = table[0].clubId;
            seasonTitle.text = $"CAREER DASHBOARD  /  SEASON {calendar.Season:00}";
            standingsText.text = "POS   CLUB                          P   GD   PTS\n" + string.Join("\n", table.Select((entry, index) => $"{index + 1,2}    {database.FindClub(entry.clubId)?.displayName ?? entry.clubId,-28} {entry.played,2}  {entry.GoalDifference,3}  {entry.points,3}"));
            var managed = table.FirstOrDefault(item => item.clubId == managedClubId);
            var fixture = calendar.NextFixture;
            var home = fixture == null ? "No fixture" : database.FindClub(fixture.homeClubId)?.shortName ?? fixture.homeClubId;
            var away = fixture == null ? "complete" : database.FindClub(fixture.awayClubId)?.shortName ?? fixture.awayClubId;
            var budget = career?.TransferBudget ?? database.FindClub(managedClubId)?.startingBudget ?? 0;
            var rank = managed == null ? table.Count : table.ToList().FindIndex(item => item.clubId == managedClubId) + 1;
            detailsText.text = $"CLUB OBJECTIVES\n\n{database.FindClub(managedClubId)?.displayName ?? "SELECT CLUB"}\n\nFINISH TOP 2        {Progress(rank, 2)}\nWIN 3 MATCHES       {Progress(managed?.wins ?? 0, 3)}\nPOSITIVE GOAL DIFF  {Progress(managed?.GoalDifference ?? 0, 1)}\n\nNEXT FIXTURE\n{home}  vs  {away}\nMATCHWEEK  {fixture?.matchweek ?? 0}\n\nTRANSFER BUDGET\n€{budget / 1000000f:0.0}M\n\nPLAYER DEVELOPMENT\n{(progression == null ? "Assign PlayerProgressionManager" : $"{progression.Records.Count} progression records active")}";
            statusText.text = $"LIVE  /  MATCHWEEK {fixture?.matchweek ?? calendar.Fixtures.Count}  /  {table.Count} CLUBS";
        }

        private static string Progress(int value, int target) => target == 1 ? (value > 0 ? "COMPLETE" : "IN PROGRESS") : $"{Mathf.Clamp(value, 0, target)}/{target}";
        private Canvas CreateCanvas() { var obj = new GameObject("Career Dashboard Canvas"); var result = obj.AddComponent<Canvas>(); result.renderMode = RenderMode.ScreenSpaceOverlay; var scaler = obj.AddComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1920, 1080); obj.AddComponent<GraphicRaycaster>(); return result; }
        private GameObject Panel(Transform parent, string name, Color color, Vector2 min, Vector2 max) { var obj = new GameObject(name); obj.transform.SetParent(parent, false); var rect = obj.AddComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; obj.AddComponent<Image>().color = color; return obj; }
        private TMP_Text Label(Transform parent, string text, float size, Color color, TextAlignmentOptions alignment) { var obj = new GameObject("Label"); obj.transform.SetParent(parent, false); var label = obj.AddComponent<TextMeshProUGUI>(); label.text = text; label.fontSize = size; label.color = color; label.alignment = alignment; label.enableWordWrapping = true; label.raycastTarget = false; return label; }
        private Button Button(Transform parent, string text, Color accent, UnityEngine.Events.UnityAction action) { var obj = Panel(parent, text, Color.Lerp(Theme(t => t.panelSoft), accent, .22f), Vector2.zero, Vector2.one); var button = obj.AddComponent<Button>(); button.targetGraphic = obj.GetComponent<Image>(); button.onClick.AddListener(action); var label = Label(obj.transform, text, 12, Theme(t => t.heading), TextAlignmentOptions.Center); Anchor(label.rectTransform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero); return button; }
        private Color Theme(Func<FC2026UITheme, Color> selector) => theme != null ? selector(theme) : Color.black;
        private static void Anchor(RectTransform rect, Vector2 min, Vector2 max, Vector2 offsetMin, Vector2 offsetMax) { rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = offsetMin; rect.offsetMax = offsetMax; }
    }
}
