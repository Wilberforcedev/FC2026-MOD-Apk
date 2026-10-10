using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FC2026
{
    [Serializable]
    public sealed class TransferFeedPost
    {
        public string author;
        public string handle;
        public string badge;
        public string body;
        public string time;
        public int likes;
        public int reposts;
        public string playerId;
    }

    public sealed class TransferSocialFeedScreen : MonoBehaviour
    {
        [SerializeField] private FC2026UITheme theme;
        [SerializeField] private FootballWorldDatabase database;
        [SerializeField] private ScoutingNetworkManager scouting;
        [SerializeField] private TransferNegotiationManager negotiation;
        [SerializeField] private Canvas canvas;

        private readonly List<TransferFeedPost> posts = new();
        private Transform feedContent;
        private TMP_Text status;
        private TMP_Text tabTitle;
        private int activeTab;

        private void Start()
        {
            theme ??= Resources.Load<FC2026UITheme>("FC2026UITheme");
            database ??= FindFirstObjectByType<FootballWorldCatalogLoader>()?.Database;
            scouting ??= FindFirstObjectByType<ScoutingNetworkManager>();
            negotiation ??= FindFirstObjectByType<TransferNegotiationManager>();
            SeedPosts();
            if (scouting != null) scouting.ReportCompleted += OnReportCompleted;
            if (negotiation != null) negotiation.NegotiationChanged += OnNegotiationChanged;
            BuildScreen();
        }

        private void OnDestroy()
        {
            if (scouting != null) scouting.ReportCompleted -= OnReportCompleted;
            if (negotiation != null) negotiation.NegotiationChanged -= OnNegotiationChanged;
        }

        private void SeedPosts()
        {
            posts.Clear();
            var players = database?.players.Take(4).ToList() ?? new List<WorldPlayerDefinition>();
            foreach (var player in players)
            {
                var club = database.FindClub(player.clubId);
                posts.Add(new TransferFeedPost { author = "FC26 Transfer Room", handle = "@FC26TransferRoom", badge = "TRANSFER NEWS", body = $"Contract talks progressing for {player.displayName}. {club?.displayName} are listening to offers in the Transfer Market. The race is heating up. ⚽", time = "12m", likes = 48200, reposts = 11500, playerId = player.id });
                posts.Add(new TransferFeedPost { author = "Aurelia Scout Network", handle = "@AureliaScouts", badge = "SCOUT REPORT", body = $"Our regional network has flagged {player.displayName} as a player to watch. Potential, role fit, and value report available for your club.", time = "1h", likes = 92100, reposts = 24800, playerId = player.id });
            }
        }

        public void BuildScreen()
        {
            if (canvas == null) canvas = CreateCanvas();
            foreach (Transform child in canvas.transform) Destroy(child.gameObject);
            var shell = Panel(canvas.transform, "TransferSocialShell", Theme(t => t.background), Vector2.zero, Vector2.one);
            var topGlow = Panel(shell.transform, "TopGlow", Theme(t => t.overlay), new Vector2(0, .88f), Vector2.one);
            var appTitle = Label(shell.transform, "FC26", 22, Theme(t => t.heading), TextAlignmentOptions.TopLeft); Anchor(appTitle.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(28, -34), new Vector2(160, 34));
            var live = Label(shell.transform, "TRANSFER NETWORK", 11, Theme(t => t.focus), TextAlignmentOptions.TopRight); Anchor(live.rectTransform, new Vector2(1, 1), new Vector2(1, 1), new Vector2(-28, -34), new Vector2(-28, 0));
            var nav = Panel(shell.transform, "FeedTabs", Theme(t => t.panel), new Vector2(0, 1), new Vector2(1, 1)); Anchor(nav.GetComponent<RectTransform>(), new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -148), new Vector2(-20, -70));
            var news = Button(nav.transform, "DYNAMIC\nNEWS FEED", Theme(t => t.focus), () => SetTab(0)); Anchor(news.GetComponent<RectTransform>(), new Vector2(0, 0), new Vector2(.34f, 1), Vector2.zero, Vector2.zero);
            var inbox = Button(nav.transform, "CLUB\nINBOX", Theme(t => t.body), () => SetTab(1)); Anchor(inbox.GetComponent<RectTransform>(), new Vector2(.34f, 0), new Vector2(.67f, 1), Vector2.zero, Vector2.zero);
            var buzz = Button(nav.transform, "SOCIAL\nBUZZ", Theme(t => t.body), () => SetTab(2)); Anchor(buzz.GetComponent<RectTransform>(), new Vector2(.67f, 0), new Vector2(1, 1), Vector2.zero, Vector2.zero);
            Badge(nav.transform, "3", new Vector2(.30f, .5f)); Badge(nav.transform, "1", new Vector2(.63f, .5f));
            tabTitle = Label(shell.transform, "DYNAMIC NEWS FEED", 12, Theme(t => t.muted), TextAlignmentOptions.TopLeft); Anchor(tabTitle.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(34, -178), new Vector2(400, -148));

            var viewport = Panel(shell.transform, "FeedViewport", new Color(0, 0, 0, 0), new Vector2(0, 0), new Vector2(1, 1)); Anchor(viewport.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, new Vector2(24, 176), new Vector2(-24, 112)); viewport.AddComponent<RectMask2D>();
            var scroll = shell.AddComponent<ScrollRect>(); scroll.viewport = viewport.GetComponent<RectTransform>(); scroll.horizontal = false; scroll.vertical = true; scroll.movementType = ScrollRect.MovementType.Clamped;
            var content = Panel(viewport.transform, "FeedContent", new Color(0, 0, 0, 0), new Vector2(0, 1), new Vector2(1, 1)); content.GetComponent<RectTransform>().pivot = new Vector2(.5f, 1); content.GetComponent<RectTransform>().sizeDelta = new Vector2(0, 1500); feedContent = content.transform; scroll.content = content.GetComponent<RectTransform>();
            var layout = content.AddComponent<VerticalLayoutGroup>(); layout.spacing = 18; layout.padding = new RectOffset(0, 10, 0, 24); layout.childForceExpandWidth = true; layout.childForceExpandHeight = false;
            status = Label(shell.transform, "SCOUT NETWORK ONLINE  /  TAP A POST TO TAKE ACTION", 11, Theme(t => t.muted), TextAlignmentOptions.Left); Anchor(status.rectTransform, new Vector2(0, 0), new Vector2(1, 0), new Vector2(32, 54), new Vector2(-32, 86));
            var bottom = Panel(shell.transform, "BottomNav", Theme(t => t.panel), new Vector2(0, 0), new Vector2(1, 0)); Anchor(bottom.GetComponent<RectTransform>(), new Vector2(0, 0), new Vector2(1, 0), new Vector2(20, 12), new Vector2(-20, 50));
            var home = Label(bottom.transform, "⌂  HOME", 12, Theme(t => t.focus), TextAlignmentOptions.Center); Anchor(home.rectTransform, new Vector2(0, 0), new Vector2(.25f, 1), Vector2.zero, Vector2.zero);
            var market = Label(bottom.transform, "◈  MARKET", 12, Theme(t => t.body), TextAlignmentOptions.Center); Anchor(market.rectTransform, new Vector2(.25f, 0), new Vector2(.5f, 1), Vector2.zero, Vector2.zero);
            var scout = Label(bottom.transform, "◎  SCOUTING", 12, Theme(t => t.body), TextAlignmentOptions.Center); Anchor(scout.rectTransform, new Vector2(.5f, 0), new Vector2(.75f, 1), Vector2.zero, Vector2.zero);
            var club = Label(bottom.transform, "●  CLUB", 12, Theme(t => t.body), TextAlignmentOptions.Center); Anchor(club.rectTransform, new Vector2(.75f, 0), new Vector2(1, 1), Vector2.zero, Vector2.zero);
            RenderFeed();
        }

        private void RenderFeed()
        {
            foreach (Transform child in feedContent) Destroy(child.gameObject);
            var filtered = activeTab == 0 ? posts : activeTab == 1 ? posts.Where(item => item.badge == "TRANSFER NEWS") : posts.Where(item => item.badge == "SCOUT REPORT");
            foreach (var post in filtered) CreatePostCard(post);
            tabTitle.text = activeTab == 0 ? "DYNAMIC NEWS FEED" : activeTab == 1 ? "CLUB INBOX" : "SOCIAL BUZZ";
        }

        private void CreatePostCard(TransferFeedPost post)
        {
            var card = Panel(feedContent, "Post", Theme(t => t.panel), Vector2.zero, Vector2.one); var cardLayout = card.AddComponent<LayoutElement>(); cardLayout.preferredHeight = 300; cardLayout.minHeight = 300;
            var avatar = Panel(card.transform, "Avatar", Theme(t => t.focus), new Vector2(0, 1), new Vector2(0, 1)); avatar.GetComponent<RectTransform>().sizeDelta = new Vector2(64, 64); avatar.GetComponent<RectTransform>().anchoredPosition = new Vector2(30, -38);
            var initials = Label(avatar.transform, Initials(post.author), 18, Theme(t => t.inverse), TextAlignmentOptions.Center); Anchor(initials.rectTransform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            var author = Label(card.transform, post.author, 17, Theme(t => t.heading), TextAlignmentOptions.TopLeft); Anchor(author.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(112, -28), new Vector2(-80, 0));
            var handle = Label(card.transform, $"✓  {post.handle}   ·   {post.time}", 12, Theme(t => t.muted), TextAlignmentOptions.TopLeft); Anchor(handle.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(112, -55), new Vector2(-20, -28));
            var badge = Label(card.transform, post.badge, 11, Theme(t => t.focus), TextAlignmentOptions.Center); badge.color = Theme(t => t.socialAccent); Anchor(badge.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(112, -90), new Vector2(240, -64));
            var body = Label(card.transform, post.body, 16, Theme(t => t.body), TextAlignmentOptions.TopLeft); Anchor(body.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(30, -122), new Vector2(-24, -184));
            var engagement = Label(card.transform, $"♥  {post.likes / 1000f:0.0}K      ↻  {post.reposts / 1000f:0.0}K      ···  Reply", 12, Theme(t => t.muted), TextAlignmentOptions.Left); Anchor(engagement.rectTransform, new Vector2(0, 0), new Vector2(1, 0), new Vector2(30, 26), new Vector2(-30, 54));
            var action = Button(card.transform, post.badge == "SCOUT REPORT" ? "SCOUT PLAYER" : "OPEN NEGOTIATION", post.badge == "SCOUT REPORT" ? Theme(t => t.focus) : Theme(t => t.warning), () => TakeAction(post)); Anchor(action.GetComponent<RectTransform>(), new Vector2(1, 0), new Vector2(1, 0), new Vector2(-210, 22), new Vector2(-24, 58));
        }

        private void TakeAction(TransferFeedPost post)
        {
            var world = database?.players.FirstOrDefault(item => item.id == post.playerId); if (world == null) return;
            var player = new PlayerData { id = world.id, displayName = world.displayName, overall = world.overall, position = Enum.TryParse(world.position, true, out PlayerPosition position) ? position : PlayerPosition.CM, pace = world.pace, shooting = world.shooting, passing = world.passing, dribbling = world.dribbling, defending = world.defending, physicality = world.physicality };
            if (post.badge == "SCOUT REPORT") status.text = scouting != null && scouting.AssignScout(player, ScoutRegion.Europe, 2) ? $"SCOUT ASSIGNED  /  {player.displayName.ToUpperInvariant()}  /  REPORT IN 2 WEEKS" : "SCOUTING NETWORK BUSY OR BUDGET TOO LOW";
            else status.text = negotiation != null && negotiation.OpenNegotiation(new TransferListing { player = player, currentClub = database.FindClub(world.clubId)?.displayName, fee = world.marketValue }) ? $"NEGOTIATION OPEN  /  {player.displayName.ToUpperInvariant()}  /  SUBMIT A CREDIBLE OFFER" : "NEGOTIATION ALREADY OPEN";
        }

        private void OnReportCompleted(ScoutReport report) => status.text = $"SCOUT REPORT READY  /  {report.recommendation}";
        private void OnNegotiationChanged(NegotiationState state, string message) => status.text = $"{state.ToString().ToUpperInvariant()}  /  {message}";
        private void SetTab(int tab) { activeTab = tab; RenderFeed(); }
        private void Badge(Transform parent, string text, Vector2 anchor) { var badge = Panel(parent, "UnreadBadge", Theme(t => t.socialAccent), anchor, anchor); badge.GetComponent<RectTransform>().sizeDelta = new Vector2(28, 28); var label = Label(badge.transform, text, 12, Theme(t => t.inverse), TextAlignmentOptions.Center); Anchor(label.rectTransform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero); }
        private Canvas CreateCanvas() { var obj = new GameObject("Transfer Social Feed Canvas"); var result = obj.AddComponent<Canvas>(); result.renderMode = RenderMode.ScreenSpaceOverlay; var scaler = obj.AddComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1080, 1920); obj.AddComponent<GraphicRaycaster>(); return result; }
        private GameObject Panel(Transform parent, string name, Color color, Vector2 min, Vector2 max) { var obj = new GameObject(name); obj.transform.SetParent(parent, false); var rect = obj.AddComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; obj.AddComponent<Image>().color = color; return obj; }
        private TMP_Text Label(Transform parent, string text, float size, Color color, TextAlignmentOptions alignment) { var obj = new GameObject("Label"); obj.transform.SetParent(parent, false); var label = obj.AddComponent<TextMeshProUGUI>(); label.text = text; label.fontSize = size; label.color = color; label.alignment = alignment; label.enableWordWrapping = true; label.raycastTarget = false; return label; }
        private Button Button(Transform parent, string text, Color accent, UnityEngine.Events.UnityAction action) { var obj = Panel(parent, text, Color.Lerp(Theme(t => t.panelSoft), accent, .2f), Vector2.zero, Vector2.one); var button = obj.AddComponent<Button>(); button.targetGraphic = obj.GetComponent<Image>(); button.onClick.AddListener(action); var label = Label(obj.transform, text, 11, Theme(t => t.heading), TextAlignmentOptions.Center); Anchor(label.rectTransform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero); return button; }
        private Color Theme(Func<FC2026UITheme, Color> selector) => theme != null ? selector(theme) : Color.black;
        private static string Initials(string value) { var words = (value ?? "FC").Split(' '); return words.Length > 1 ? $"{words[0][0]}{words[1][0]}" : value.Substring(0, Mathf.Min(2, value.Length)).ToUpperInvariant(); }
        private static void Anchor(RectTransform rect, Vector2 min, Vector2 max, Vector2 offsetMin, Vector2 offsetMax) { rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = offsetMin; rect.offsetMax = offsetMax; }
    }
}
