using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FC2026
{
    public sealed class FootballWorldBrowserScreen : MonoBehaviour
    {
        [SerializeField] private FC2026UITheme theme;
        [SerializeField] private FootballWorldDatabase database;
        [SerializeField] private Canvas canvas;
        [SerializeField] private bool startOnPlayers;

        private Transform grid;
        private TMP_Text modeLabel;
        private TMP_Text titleLabel;
        private TMP_Text detailLabel;
        private TMP_Text statusLabel;
        private readonly List<GameObject> cards = new();
        private bool showPlayers;
        private string search = string.Empty;

        private void Start()
        {
            theme ??= Resources.Load<FC2026UITheme>("FC2026UITheme");
            database ??= FindFirstObjectByType<FootballWorldCatalogLoader>()?.Database;
            showPlayers = startOnPlayers;
            BuildScreen();
        }

        public void BuildScreen()
        {
            if (canvas == null) canvas = CreateCanvas();
            foreach (Transform child in canvas.transform) Destroy(child.gameObject);
            var shell = Panel(canvas.transform, "FootballWorldBrowser", Theme(t => t.overlay), Vector2.zero, Vector2.one);
            titleLabel = Label(shell.transform, showPlayers ? "PLAYER DATABASE" : "CLUB DATABASE", 38, Theme(t => t.heading), TextAlignmentOptions.TopLeft);
            Anchor(titleLabel.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(theme.pagePadding, -30), new Vector2(720, 60));
            var subtitle = Label(shell.transform, "FOOTBALL WORLD  /  ORIGINAL V1 CATALOG", 13, Theme(t => t.muted), TextAlignmentOptions.TopLeft);
            Anchor(subtitle.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(theme.pagePadding, -88), new Vector2(620, 26));

            var rail = Panel(shell.transform, "CatalogRail", Theme(t => t.panel), new Vector2(0, 1), new Vector2(1, 1));
            Anchor(rail.GetComponent<RectTransform>(), new Vector2(0, 1), new Vector2(1, 1), new Vector2(theme.pagePadding, -154), new Vector2(-theme.pagePadding, -110));
            modeLabel = Label(rail.transform, $"VIEW  /  {(showPlayers ? "PLAYERS" : "CLUBS")}", 15, Theme(t => t.focus), TextAlignmentOptions.Left);
            Anchor(modeLabel.rectTransform, new Vector2(0, 0), new Vector2(0, 1), new Vector2(18, 0), new Vector2(220, 0));
            var toggle = Button(rail.transform, showPlayers ? "SHOW CLUBS" : "SHOW PLAYERS", Theme(t => t.focus), ToggleMode);
            Anchor(toggle.GetComponent<RectTransform>(), new Vector2(1, .5f), new Vector2(1, .5f), new Vector2(-18, 0), new Vector2(190, 42));
            var searchButton = Button(rail.transform, search.Length == 0 ? "FILTER: ALL" : $"FILTER: {search.ToUpperInvariant()}", Theme(t => t.focus), CycleSearch);
            Anchor(searchButton.GetComponent<RectTransform>(), new Vector2(1, .5f), new Vector2(1, .5f), new Vector2(-220, 0), new Vector2(180, 42));

            var listPanel = Panel(shell.transform, "CatalogList", Theme(t => t.panelSoft), new Vector2(0, 0), new Vector2(.66f, 1));
            Anchor(listPanel.GetComponent<RectTransform>(), new Vector2(0, 0), new Vector2(.66f, 1), new Vector2(theme.pagePadding, 86), new Vector2(-12, -176));
            var scroll = listPanel.AddComponent<ScrollRect>(); scroll.horizontal = false; scroll.vertical = true;
            var content = Panel(listPanel.transform, "CatalogGrid", new Color(0, 0, 0, 0), new Vector2(0, 1), new Vector2(1, 1)); content.GetComponent<RectTransform>().pivot = new Vector2(.5f, 1); content.GetComponent<RectTransform>().sizeDelta = new Vector2(0, showPlayers ? 1500 : 620); scroll.content = content.GetComponent<RectTransform>();
            var layout = content.AddComponent<GridLayoutGroup>(); layout.cellSize = new Vector2(205, showPlayers ? 178 : 152); layout.spacing = new Vector2(theme.cardGap, theme.cardGap); layout.padding = new RectOffset(18, 18, 18, 18); layout.constraint = GridLayoutGroup.Constraint.FixedColumnCount; layout.constraintCount = 3; grid = content.transform;

            var detailPanel = Panel(shell.transform, "CatalogDetail", Theme(t => t.panel), new Vector2(.68f, 0), new Vector2(1, 1));
            Anchor(detailPanel.GetComponent<RectTransform>(), new Vector2(.68f, 0), new Vector2(1, 1), new Vector2(8, 86), new Vector2(-theme.pagePadding, -176));
            var eyebrow = Label(detailPanel.transform, "SELECT AN ITEM", 12, Theme(t => t.focus), TextAlignmentOptions.TopLeft); Anchor(eyebrow.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(24, -40), new Vector2(-24, 20));
            detailLabel = Label(detailPanel.transform, showPlayers ? "Choose a player" : "Choose a club", 18, Theme(t => t.body), TextAlignmentOptions.TopLeft); Anchor(detailLabel.rectTransform, Vector2.zero, Vector2.one, new Vector2(24, 24), new Vector2(-24, -62));
            statusLabel = Label(shell.transform, $"{database?.clubs.Count ?? 0} CLUBS  •  {database?.players.Count ?? 0} PLAYERS  •  {database?.leagues.Count ?? 0} LEAGUES", 13, Theme(t => t.muted), TextAlignmentOptions.Left); Anchor(statusLabel.rectTransform, new Vector2(0, 0), new Vector2(1, 0), new Vector2(theme.pagePadding, 24), new Vector2(-theme.pagePadding, 64));
            RenderCards();
        }

        private void RenderCards()
        {
            foreach (var card in cards) Destroy(card); cards.Clear();
            if (database == null) return;
            if (showPlayers)
            {
                foreach (var player in database.players.Where(MatchesSearch).Take(80)) cards.Add(PlayerCard(player));
            }
            else
            {
                foreach (var club in database.clubs.Where(MatchesSearch)) cards.Add(ClubCard(club));
            }
            modeLabel.text = $"VIEW  /  {(showPlayers ? "PLAYERS" : "CLUBS")}";
            titleLabel.text = showPlayers ? "PLAYER DATABASE" : "CLUB DATABASE";
        }

        private GameObject PlayerCard(WorldPlayerDefinition player)
        {
            var card = Panel(grid, player.id, Theme(t => t.CardTierColor(player.overall)), Vector2.zero, Vector2.one); card.GetComponent<RectTransform>().sizeDelta = new Vector2(205, 178);
            var button = card.AddComponent<Button>(); button.targetGraphic = card.GetComponent<Image>(); button.onClick.AddListener(() => SelectPlayer(player));
            Label(card.transform, player.overall.ToString(), 30, Theme(t => t.inverse), TextAlignmentOptions.TopLeft).rectTransform.anchoredPosition = new Vector2(14, -12);
            Label(card.transform, player.position, 12, Theme(t => t.inverse), TextAlignmentOptions.TopRight).rectTransform.anchoredPosition = new Vector2(-12, -16);
            var name = Label(card.transform, player.displayName.ToUpperInvariant(), 15, Theme(t => t.inverse), TextAlignmentOptions.Center); Anchor(name.rectTransform, new Vector2(0, .45f), new Vector2(1, .75f), new Vector2(8, 0), new Vector2(-8, 0));
            var club = database.FindClub(player.clubId); var meta = Label(card.transform, $"{club?.shortName ?? player.clubId}  •  €{player.marketValue / 1000000f:0.0}M", 11, Theme(t => t.inverse), TextAlignmentOptions.Bottom); Anchor(meta.rectTransform, Vector2.zero, new Vector2(1, 0), new Vector2(8, 10), new Vector2(-8, 38));
            return card;
        }

        private GameObject ClubCard(WorldClubDefinition club)
        {
            var card = Panel(grid, club.id, Theme(t => t.panel), Vector2.zero, Vector2.one); card.GetComponent<RectTransform>().sizeDelta = new Vector2(205, 152);
            var button = card.AddComponent<Button>(); button.targetGraphic = card.GetComponent<Image>(); button.onClick.AddListener(() => SelectClub(club));
            var accent = Panel(card.transform, "Accent", ParseColor(club.primaryColorHex), new Vector2(0, 0), new Vector2(0, 1)); accent.GetComponent<RectTransform>().sizeDelta = new Vector2(7, 0);
            Label(card.transform, club.shortName, 26, Theme(t => t.focus), TextAlignmentOptions.TopLeft).rectTransform.anchoredPosition = new Vector2(22, -16);
            var name = Label(card.transform, club.displayName.ToUpperInvariant(), 16, Theme(t => t.heading), TextAlignmentOptions.Left); Anchor(name.rectTransform, new Vector2(0, .45f), new Vector2(1, .8f), new Vector2(22, 0), new Vector2(-12, 0));
            var meta = Label(card.transform, $"{club.country}  •  {club.stadiumName}", 11, Theme(t => t.muted), TextAlignmentOptions.Bottom); Anchor(meta.rectTransform, Vector2.zero, new Vector2(1, 0), new Vector2(22, 12), new Vector2(-12, 38));
            return card;
        }

        private void SelectPlayer(WorldPlayerDefinition player)
        {
            var club = database.FindClub(player.clubId);
            detailLabel.text = $"{player.displayName.ToUpperInvariant()}\n\n{player.position}  /  {club?.displayName}\n\nOVERALL     {player.overall}\nPACE        {player.pace}\nSHOOTING    {player.shooting}\nPASSING     {player.passing}\nDRIBBLING   {player.dribbling}\nDEFENDING   {player.defending}\nPHYSICALITY {player.physicality}\n\nAGE  {player.age}     VALUE  €{player.marketValue / 1000000f:0.0}M";
            statusLabel.text = $"FOCUSED  /  PLAYER  /  {player.id}";
        }

        private void SelectClub(WorldClubDefinition club)
        {
            var players = database.PlayersForClub(club.id);
            detailLabel.text = $"{club.displayName.ToUpperInvariant()}\n\n{club.country}  /  {club.leagueId}\n\nSTADIUM  {club.stadiumName}\nBUDGET   €{club.startingBudget / 1000000f:0.0}M\nSQUAD    {players.Count} PLAYERS\n\nPRIMARY  {club.primaryColorHex}\nSECONDARY  {club.secondaryColorHex}";
            statusLabel.text = $"FOCUSED  /  CLUB  /  {club.id}";
        }

        private bool MatchesSearch(WorldPlayerDefinition player) => string.IsNullOrEmpty(search) || player.displayName.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0 || player.position.Equals(search, StringComparison.OrdinalIgnoreCase);
        private bool MatchesSearch(WorldClubDefinition club) => string.IsNullOrEmpty(search) || club.displayName.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0 || club.shortName.Equals(search, StringComparison.OrdinalIgnoreCase);
        private void ToggleMode() { showPlayers = !showPlayers; BuildScreen(); }
        private void CycleSearch() { search = search switch { "" => "a", "a" => "e", _ => "" }; BuildScreen(); }

        private Canvas CreateCanvas() { var obj = new GameObject("Football World Canvas"); var result = obj.AddComponent<Canvas>(); result.renderMode = RenderMode.ScreenSpaceOverlay; var scaler = obj.AddComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1920, 1080); obj.AddComponent<GraphicRaycaster>(); return result; }
        private GameObject Panel(Transform parent, string name, Color color, Vector2 min, Vector2 max) { var obj = new GameObject(name); obj.transform.SetParent(parent, false); var rect = obj.AddComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; obj.AddComponent<Image>().color = color; return obj; }
        private TMP_Text Label(Transform parent, string text, float size, Color color, TextAlignmentOptions alignment) { var obj = new GameObject("Label"); obj.transform.SetParent(parent, false); var label = obj.AddComponent<TextMeshProUGUI>(); label.text = text; label.fontSize = size; label.color = color; label.alignment = alignment; label.enableWordWrapping = true; label.raycastTarget = false; return label; }
        private Button Button(Transform parent, string text, Color accent, UnityEngine.Events.UnityAction action) { var obj = Panel(parent, text, Color.Lerp(Theme(t => t.panelSoft), accent, .22f), Vector2.zero, Vector2.one); var button = obj.AddComponent<Button>(); button.targetGraphic = obj.GetComponent<Image>(); button.onClick.AddListener(action); var label = Label(obj.transform, text, 12, Theme(t => t.heading), TextAlignmentOptions.Center); Anchor(label.rectTransform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero); return button; }
        private Color Theme(Func<FC2026UITheme, Color> selector) => theme != null ? selector(theme) : Color.black;
        private static void Anchor(RectTransform rect, Vector2 min, Vector2 max, Vector2 offsetMin, Vector2 offsetMax) { rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = offsetMin; rect.offsetMax = offsetMax; }
        private static Color ParseColor(string value) => ColorUtility.TryParseHtmlString(value, out var color) ? color : Color.white;
    }
}
