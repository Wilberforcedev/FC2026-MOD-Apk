using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FC2026
{
    public sealed class CareerMatchLiveScreen : MonoBehaviour
    {
        [SerializeField] private FC2026UITheme theme;
        [SerializeField] private CareerMatchSimulationEngine engine;
        [SerializeField] private Canvas canvas;

        private TMP_Text title;
        private TMP_Text score;
        private TMP_Text clock;
        private TMP_Text status;
        private TMP_Text commentary;
        private TMP_Text form;
        private Button pauseButton;
        private Button startButton;

        private void Start()
        {
            theme ??= Resources.Load<FC2026UITheme>("FC2026UITheme");
            engine ??= FindFirstObjectByType<CareerMatchSimulationEngine>();
            if (engine != null) { engine.EventAdded += AddCommentary; engine.StateChanged += Refresh; engine.MatchCompleted += HandleComplete; }
            BuildScreen();
            Refresh();
        }

        private void OnDestroy()
        {
            if (engine == null) return;
            engine.EventAdded -= AddCommentary; engine.StateChanged -= Refresh; engine.MatchCompleted -= HandleComplete;
        }

        private void Update() => RefreshScoreboard();

        public void BuildScreen()
        {
            if (canvas == null) canvas = CreateCanvas();
            foreach (Transform child in canvas.transform) Destroy(child.gameObject);
            var shell = Panel(canvas.transform, "CareerLiveMatch", Theme(t => t.overlay), Vector2.zero, Vector2.one);
            title = Label(shell.transform, "CAREER MODE  /  LIVE MATCH", 27, Theme(t => t.heading), TextAlignmentOptions.TopLeft); Anchor(title.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(theme.pagePadding, -32), new Vector2(600, 48));
            status = Label(shell.transform, "READY FOR NEXT FIXTURE", 12, Theme(t => t.focus), TextAlignmentOptions.TopLeft); Anchor(status.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(theme.pagePadding, -78), new Vector2(500, 28));

            var scoreboard = Panel(shell.transform, "Scoreboard", Theme(t => t.panel), new Vector2(0, 1), new Vector2(1, 1)); Anchor(scoreboard.GetComponent<RectTransform>(), new Vector2(0, 1), new Vector2(1, 1), new Vector2(theme.pagePadding, -192), new Vector2(-theme.pagePadding, -108));
            score = Label(scoreboard.transform, "HOME  0  –  0  AWAY", 34, Theme(t => t.heading), TextAlignmentOptions.Center); Anchor(score.rectTransform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            clock = Label(scoreboard.transform, "00:00", 15, Theme(t => t.focus), TextAlignmentOptions.TopRight); Anchor(clock.rectTransform, new Vector2(1, 1), new Vector2(1, 1), new Vector2(-20, -28), new Vector2(-20, 0));

            var commentaryPanel = Panel(shell.transform, "CommentaryPanel", Theme(t => t.panelSoft), new Vector2(0, 0), new Vector2(.68f, 1)); Anchor(commentaryPanel.GetComponent<RectTransform>(), new Vector2(0, 0), new Vector2(.68f, 1), new Vector2(theme.pagePadding, 92), new Vector2(-12, -214));
            var heading = Label(commentaryPanel.transform, "MATCH COMMENTARY", 14, Theme(t => t.focus), TextAlignmentOptions.TopLeft); Anchor(heading.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(22, -42), new Vector2(-22, 0));
            commentary = Label(commentaryPanel.transform, "No match events yet.", 15, Theme(t => t.body), TextAlignmentOptions.TopLeft); Anchor(commentary.rectTransform, Vector2.zero, Vector2.one, new Vector2(22, 22), new Vector2(-22, -56));

            var details = Panel(shell.transform, "MatchDetails", Theme(t => t.panel), new Vector2(.7f, 0), new Vector2(1, 1)); Anchor(details.GetComponent<RectTransform>(), new Vector2(.7f, 0), new Vector2(1, 1), new Vector2(8, 92), new Vector2(-theme.pagePadding, -214));
            form = Label(details.transform, "MATCH DETAILS\n\nStart the next fixture to see the teams, stadium, rating balance, and live event feed.", 15, Theme(t => t.body), TextAlignmentOptions.TopLeft); Anchor(form.rectTransform, Vector2.zero, Vector2.one, new Vector2(22, 22), new Vector2(-22, -22));

            var controls = Panel(shell.transform, "Controls", Theme(t => t.panel), new Vector2(0, 0), new Vector2(1, 0)); Anchor(controls.GetComponent<RectTransform>(), new Vector2(0, 0), new Vector2(1, 0), new Vector2(theme.pagePadding, 20), new Vector2(-theme.pagePadding, 78));
            startButton = Button(controls.transform, "START NEXT FIXTURE", Theme(t => t.focus), StartNextFixture); Anchor(startButton.GetComponent<RectTransform>(), new Vector2(0, .5f), new Vector2(0, .5f), new Vector2(0, 0), new Vector2(210, 42));
            pauseButton = Button(controls.transform, "PAUSE", Theme(t => t.warning), TogglePause); Anchor(pauseButton.GetComponent<RectTransform>(), new Vector2(0, .5f), new Vector2(0, .5f), new Vector2(224, 0), new Vector2(120, 42));
            var speed = Button(controls.transform, "4X SPEED", Theme(t => t.success), () => engine?.SetSimulationSpeed(4f)); Anchor(speed.GetComponent<RectTransform>(), new Vector2(0, .5f), new Vector2(0, .5f), new Vector2(358, 0), new Vector2(120, 42));
            var skip = Button(controls.transform, "SKIP TO FULL TIME", Theme(t => t.panelSoft), () => engine?.SkipToFullTime()); Anchor(skip.GetComponent<RectTransform>(), new Vector2(1, .5f), new Vector2(1, .5f), new Vector2(-190, 0), new Vector2(-10, 42));
        }

        private void StartNextFixture() { if (engine != null && engine.StartNextMatch()) { commentary.text = string.Empty; Refresh(); } }
        private void TogglePause() => engine?.TogglePause();
        private void AddCommentary(CareerMatchEvent matchEvent) { if (commentary != null) commentary.text = $"{matchEvent.message}\n" + commentary.text; Refresh(); }
        private void HandleComplete(SeasonFixture completed) { status.text = "FULL-TIME  /  RESULT RECORDED IN CAREER MODE"; Refresh(); }

        private void Refresh()
        {
            if (engine == null || engine.Fixture == null) { status.text = "READY FOR NEXT FIXTURE"; return; }
            var home = engine.HomeClub; var away = engine.AwayClub;
            status.text = engine.IsComplete ? "FULL-TIME  /  RESULT RECORDED" : engine.IsRunning ? "LIVE  /  CAREER MATCH" : "PAUSED  /  CAREER MATCH";
            score.text = $"{home?.shortName ?? "HOME"}  {engine.HomeScore}  –  {engine.AwayScore}  {away?.shortName ?? "AWAY"}";
            form.text = $"MATCH DETAILS\n\n{home?.displayName}\nvs\n{away?.displayName}\n\nSTADIUM  {home?.stadiumName}\nMATCHWEEK  {engine.Fixture.matchweek}\n\nSIMULATION  {(engine.SimulationSpeed):0.##}X";
            startButton.interactable = engine.IsComplete || engine.Fixture == null;
            pauseButton.interactable = !engine.IsComplete && engine.Fixture != null;
            RefreshScoreboard();
        }

        private void RefreshScoreboard() { if (engine != null && clock != null) clock.text = $"{engine.CurrentMinute:00}:00"; }
        private Canvas CreateCanvas() { var obj = new GameObject("Career Match Canvas"); var result = obj.AddComponent<Canvas>(); result.renderMode = RenderMode.ScreenSpaceOverlay; var scaler = obj.AddComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1920, 1080); obj.AddComponent<GraphicRaycaster>(); return result; }
        private GameObject Panel(Transform parent, string name, Color color, Vector2 min, Vector2 max) { var obj = new GameObject(name); obj.transform.SetParent(parent, false); var rect = obj.AddComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; obj.AddComponent<Image>().color = color; return obj; }
        private TMP_Text Label(Transform parent, string text, float size, Color color, TextAlignmentOptions alignment) { var obj = new GameObject("Label"); obj.transform.SetParent(parent, false); var label = obj.AddComponent<TextMeshProUGUI>(); label.text = text; label.fontSize = size; label.color = color; label.alignment = alignment; label.enableWordWrapping = true; label.raycastTarget = false; return label; }
        private Button Button(Transform parent, string text, Color accent, UnityEngine.Events.UnityAction action) { var obj = Panel(parent, text, Color.Lerp(Theme(t => t.panelSoft), accent, .22f), Vector2.zero, Vector2.one); var button = obj.AddComponent<Button>(); button.targetGraphic = obj.GetComponent<Image>(); button.onClick.AddListener(action); var label = Label(obj.transform, text, 12, Theme(t => t.heading), TextAlignmentOptions.Center); Anchor(label.rectTransform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero); return button; }
        private Color Theme(Func<FC2026UITheme, Color> selector) => theme != null ? selector(theme) : Color.black;
        private static void Anchor(RectTransform rect, Vector2 min, Vector2 max, Vector2 offsetMin, Vector2 offsetMax) { rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = offsetMin; rect.offsetMax = offsetMax; }
    }
}
