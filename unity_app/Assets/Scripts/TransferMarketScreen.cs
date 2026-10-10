using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FC2026
{
    [Serializable]
    public sealed class TransferListing
    {
        public PlayerData player;
        public string currentClub;
        public int fee;
        public bool isRecommended;
    }

    public sealed class TransferMarketScreen : MonoBehaviour
    {
        [Header("Theme and services")]
        [SerializeField] private FC2026UITheme theme;
        [SerializeField] private CareerManager career;
        [SerializeField] private SquadManager squad;
        [SerializeField] private FootballWorldDatabase worldDatabase;
        [SerializeField] private Canvas canvas;
        [SerializeField] private List<TransferListing> listings = new();

        private readonly List<GameObject> cardObjects = new();
        private Transform cardGrid;
        private TMP_Text detailsTitle;
        private TMP_Text detailsBody;
        private TMP_Text budgetLabel;
        private TMP_Text statusLabel;
        private TransferListing selected;
        private string search = string.Empty;
        private PlayerPosition? positionFilter;

        private void Start()
        {
            theme ??= Resources.Load<FC2026UITheme>("FC2026UITheme");
            career ??= FindFirstObjectByType<CareerManager>();
            squad ??= FindFirstObjectByType<SquadManager>();
            if (listings.Count == 0) listings = worldDatabase != null ? CreateListingsFromDatabase(worldDatabase) : CreateDemoListings();
            BuildScreen();
        }

        public void BuildScreen()
        {
            if (canvas == null) canvas = CreateCanvas();
            foreach (Transform child in canvas.transform) Destroy(child.gameObject);
            var shell = Panel(canvas.transform, "TransferMarketShell", ColorOf(t => t.overlay), new Vector2(0, 0), new Vector2(1, 1));
            var title = Label(shell, "TRANSFER MARKET", 38, theme.heading, TextAnchor.UpperLeft);
            title.rectTransform.anchorMin = new Vector2(0, 1); title.rectTransform.anchorMax = new Vector2(0, 1); title.rectTransform.pivot = new Vector2(0, 1); title.rectTransform.anchoredPosition = new Vector2(theme.pagePadding, -34); title.rectTransform.sizeDelta = new Vector2(800, 60);
            var subtitle = Label(shell, "SCOUT THE NEXT STAR FOR YOUR XI", 13, theme.muted, TextAnchor.UpperLeft);
            subtitle.rectTransform.anchorMin = new Vector2(0, 1); subtitle.rectTransform.anchorMax = new Vector2(0, 1); subtitle.rectTransform.pivot = new Vector2(0, 1); subtitle.rectTransform.anchoredPosition = new Vector2(theme.pagePadding, -94); subtitle.rectTransform.sizeDelta = new Vector2(600, 28);

            var topRail = Panel(shell, "TopRail", ColorOf(t => t.panel), new Vector2(0, 1), new Vector2(1, 1));
            topRail.GetComponent<RectTransform>().offsetMin = new Vector2(theme.pagePadding, -160); topRail.GetComponent<RectTransform>().offsetMax = new Vector2(-theme.pagePadding, -112);
            var budget = Label(topRail, $"TRANSFER BUDGET  {FormatMoney(career?.TransferBudget ?? 15000000)}", 16, theme.success, TextAnchor.MiddleLeft);
            budget.rectTransform.anchorMin = new Vector2(0, 0); budget.rectTransform.anchorMax = new Vector2(0, 1); budget.rectTransform.sizeDelta = new Vector2(340, 0); budget.rectTransform.anchoredPosition = new Vector2(18, 0); budgetLabel = budget;
            var searchButton = Button(topRail, "SEARCH PLAYERS", theme.focus, () => { search = search.Length == 0 ? "a" : string.Empty; RenderCards(); });
            searchButton.GetComponent<RectTransform>().anchorMin = new Vector2(1, 0); searchButton.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1); searchButton.GetComponent<RectTransform>().pivot = new Vector2(1, .5f); searchButton.GetComponent<RectTransform>().sizeDelta = new Vector2(180, 0); searchButton.GetComponent<RectTransform>().anchoredPosition = new Vector2(-16, 0);

            var gridPanel = Panel(shell, "CardGridPanel", ColorOf(t => t.panelSoft), new Vector2(0, 0), new Vector2(.68f, 1));
            gridPanel.GetComponent<RectTransform>().offsetMin = new Vector2(theme.pagePadding, 90); gridPanel.GetComponent<RectTransform>().offsetMax = new Vector2(-12, -188);
            var scroll = gridPanel.AddComponent<ScrollRect>(); scroll.horizontal = false; scroll.vertical = true; scroll.movementType = ScrollRect.MovementType.Clamped;
            var viewport = Panel(gridPanel.transform, "Viewport", new Color(0, 0, 0, 0), new Vector2(0, 0), new Vector2(1, 1)); viewport.GetComponent<RectTransform>().offsetMin = Vector2.zero; viewport.GetComponent<RectTransform>().offsetMax = Vector2.zero; viewport.GetComponent<RectMask2D>(); scroll.viewport = viewport.GetComponent<RectTransform>();
            var content = Panel(viewport.transform, "CardGrid", new Color(0, 0, 0, 0), new Vector2(0, 1), new Vector2(1, 1)); content.GetComponent<RectTransform>().pivot = new Vector2(.5f, 1); content.GetComponent<RectTransform>().sizeDelta = new Vector2(0, 440); cardGrid = content.transform; scroll.content = content.GetComponent<RectTransform>();
            var layout = content.AddComponent<GridLayoutGroup>(); layout.cellSize = new Vector2(170, 226); layout.spacing = new Vector2(theme.cardGap, theme.cardGap); layout.padding = new RectOffset(18, 18, 18, 18); layout.constraint = GridLayoutGroup.Constraint.FixedColumnCount; layout.constraintCount = 3;

            var details = Panel(shell, "PlayerDetails", ColorOf(t => t.panel), new Vector2(.7f, 0), new Vector2(1, 1)); details.GetComponent<RectTransform>().offsetMin = new Vector2(8, 90); details.GetComponent<RectTransform>().offsetMax = new Vector2(-theme.pagePadding, -188);
            detailsTitle = Label(details, "SELECT A PLAYER", 26, theme.heading, TextAnchor.UpperLeft); detailsTitle.rectTransform.offsetMin = new Vector2(24, 0); detailsTitle.rectTransform.offsetMax = new Vector2(-24, -58); detailsTitle.rectTransform.anchorMin = new Vector2(0, 1); detailsTitle.rectTransform.anchorMax = new Vector2(1, 1); detailsTitle.rectTransform.pivot = new Vector2(.5f, 1);
            detailsBody = Label(details, "Preview a player card to view attributes, role, club, and transfer fee.", 15, theme.body, TextAnchor.UpperLeft); detailsBody.rectTransform.offsetMin = new Vector2(24, 90); detailsBody.rectTransform.offsetMax = new Vector2(-24, -82); detailsBody.rectTransform.anchorMin = new Vector2(0, 0); detailsBody.rectTransform.anchorMax = new Vector2(1, 1); detailsBody.rectTransform.pivot = new Vector2(.5f, .5f);
            var buy = Button(details, "MAKE OFFER", theme.focus, PurchaseSelected); buy.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0); buy.GetComponent<RectTransform>().anchorMax = new Vector2(1, 0); buy.GetComponent<RectTransform>().offsetMin = new Vector2(24, 24); buy.GetComponent<RectTransform>().offsetMax = new Vector2(-24, 78);
            statusLabel = Label(shell, "SELECT A PLAYER TO SCOUT", 13, theme.muted, TextAnchor.MiddleLeft); statusLabel.rectTransform.anchorMin = new Vector2(0, 0); statusLabel.rectTransform.anchorMax = new Vector2(1, 0); statusLabel.rectTransform.offsetMin = new Vector2(theme.pagePadding, 26); statusLabel.rectTransform.offsetMax = new Vector2(-theme.pagePadding, 68);
            RenderCards();
        }

        private void RenderCards()
        {
            foreach (var card in cardObjects) Destroy(card); cardObjects.Clear();
            var filtered = listings.Where(l => string.IsNullOrEmpty(search) || l.player.displayName.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
            foreach (var listing in filtered) cardObjects.Add(CreatePlayerCard(listing));
            if (budgetLabel != null) budgetLabel.text = $"TRANSFER BUDGET  {FormatMoney(career?.TransferBudget ?? 15000000)}";
        }

        private GameObject CreatePlayerCard(TransferListing listing)
        {
            var card = Panel(cardGrid, listing.player.id, theme.CardTierColor(listing.player.overall), new Vector2(0, 1), new Vector2(0, 1)); card.GetComponent<RectTransform>().sizeDelta = new Vector2(170, 226); cardObjects.Add(card);
            var button = card.AddComponent<Button>(); button.targetGraphic = card.GetComponent<Image>(); button.onClick.AddListener(() => Select(listing));
            Label(card.transform, listing.player.overall.ToString(), 30, theme.inverse, TextAnchor.UpperLeft).rectTransform.anchoredPosition = new Vector2(14, -12);
            Label(card.transform, listing.player.position.ToString(), 12, theme.inverse, TextAnchor.UpperRight).rectTransform.anchoredPosition = new Vector2(-12, -16);
            var name = Label(card.transform, listing.player.displayName.ToUpperInvariant(), 16, theme.inverse, TextAnchor.MiddleCenter); name.rectTransform.anchorMin = new Vector2(0, .52f); name.rectTransform.anchorMax = new Vector2(1, .72f); name.rectTransform.offsetMin = new Vector2(8, 0); name.rectTransform.offsetMax = new Vector2(-8, 0);
            var club = Label(card.transform, listing.currentClub, 11, theme.inverse, TextAnchor.MiddleCenter); club.rectTransform.anchorMin = new Vector2(0, .4f); club.rectTransform.anchorMax = new Vector2(1, .52f); club.rectTransform.offsetMin = new Vector2(6, 0); club.rectTransform.offsetMax = new Vector2(-6, 0);
            var fee = Label(card.transform, FormatMoney(listing.fee), 14, theme.inverse, TextAnchor.LowerCenter); fee.rectTransform.anchorMin = new Vector2(0, 0); fee.rectTransform.anchorMax = new Vector2(1, 0); fee.rectTransform.offsetMin = new Vector2(8, 12); fee.rectTransform.offsetMax = new Vector2(-8, 42);
            return card;
        }

        private void Select(TransferListing listing)
        {
            selected = listing;
            detailsTitle.text = listing.player.displayName.ToUpperInvariant();
            detailsBody.text = $"{listing.player.position}  •  {listing.currentClub}\n\nOVERALL     {listing.player.overall}\nPACE        {listing.player.pace}\nSHOOTING    {listing.player.shooting}\nPASSING     {listing.player.passing}\nDRIBBLING   {listing.player.dribbling}\nDEFENDING   {listing.player.defending}\nPHYSICALITY {listing.player.physicality}\n\nTRANSFER FEE  {FormatMoney(listing.fee)}";
            statusLabel.text = $"FOCUSED  /  {listing.player.displayName.ToUpperInvariant()}  /  {listing.player.position}";
        }

        private void PurchaseSelected()
        {
            if (selected == null) { statusLabel.text = "SELECT A PLAYER FIRST"; return; }
            if (career != null && !career.SpendTransferBudget(selected.fee)) { statusLabel.text = "TRANSFER BUDGET TOO LOW"; return; }
            if (squad?.CurrentTeam != null && !squad.CurrentTeam.players.Contains(selected.player)) squad.CurrentTeam.players.Add(selected.player);
            statusLabel.text = $"SIGNED  /  {selected.player.displayName.ToUpperInvariant()}  /  WELCOME TO THE CLUB";
            listings.Remove(selected); selected = null; detailsTitle.text = "SELECT A PLAYER"; detailsBody.text = "The player has joined your squad."; RenderCards();
        }

        private Canvas CreateCanvas()
        {
            var obj = new GameObject("Transfer Market Canvas"); var result = obj.AddComponent<Canvas>(); result.renderMode = RenderMode.ScreenSpaceOverlay; obj.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; obj.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1920, 1080); obj.AddComponent<GraphicRaycaster>(); return result;
        }

        private GameObject Panel(Transform parent, string name, Color color, Vector2 min, Vector2 max)
        {
            var obj = new GameObject(name); obj.transform.SetParent(parent, false); var rect = obj.AddComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; obj.AddComponent<Image>().color = color; return obj;
        }

        private TMP_Text Label(Transform parent, string text, float size, Color color, TextAnchor anchor)
        {
            var obj = new GameObject("Label"); obj.transform.SetParent(parent, false); var label = obj.AddComponent<TextMeshProUGUI>(); label.text = text; label.fontSize = size; label.color = color; label.alignment = ToTMPAlign(anchor); label.enableWordWrapping = true; label.raycastTarget = false; return label;
        }

        private Button Button(Transform parent, string label, Color accent, UnityEngine.Events.UnityAction action)
        {
            var obj = Panel(parent, label, Color.Lerp(ColorOf(t => t.panelSoft), accent, .22f), new Vector2(.5f, .5f), new Vector2(.5f, .5f)); var rect = obj.GetComponent<RectTransform>(); rect.sizeDelta = new Vector2(210, 48); var button = obj.AddComponent<Button>(); button.targetGraphic = obj.GetComponent<Image>(); button.onClick.AddListener(action); var text = Label(obj.transform, label, 13, theme.heading, TextAnchor.MiddleCenter); text.rectTransform.anchorMin = Vector2.zero; text.rectTransform.anchorMax = Vector2.one; text.rectTransform.offsetMin = Vector2.zero; text.rectTransform.offsetMax = Vector2.zero; return button;
        }

        private static TextAlignmentOptions ToTMPAlign(TextAnchor anchor) => anchor switch
        {
            TextAnchor.UpperLeft => TextAlignmentOptions.TopLeft,
            TextAnchor.UpperRight => TextAlignmentOptions.TopRight,
            TextAnchor.LowerCenter => TextAlignmentOptions.Bottom,
            TextAnchor.MiddleCenter => TextAlignmentOptions.Center,
            _ => TextAlignmentOptions.Left
        };

        private Color ColorOf(Func<FC2026UITheme, Color> selector) => theme != null ? selector(theme) : Color.black;
        private static string FormatMoney(int amount) => amount >= 1000000 ? $"€{amount / 1000000f:0.0}M" : $"€{amount / 1000f:0}K";

        private static List<TransferListing> CreateListingsFromDatabase(FootballWorldDatabase database)
        {
            return database.players.Select(player =>
            {
                Enum.TryParse(player.position, true, out PlayerPosition position);
                return new TransferListing
                {
                    player = new PlayerData
                    {
                        id = player.id,
                        displayName = player.displayName,
                        position = position,
                        overall = player.overall,
                        pace = player.pace,
                        shooting = player.shooting,
                        passing = player.passing,
                        dribbling = player.dribbling,
                        defending = player.defending,
                        physicality = player.physicality
                    },
                    currentClub = database.FindClub(player.clubId)?.displayName ?? "Unknown Club",
                    fee = player.marketValue,
                    isRecommended = player.overall >= 80
                };
            }).ToList();
        }

        private static List<TransferListing> CreateDemoListings() => new()
        {
            new TransferListing { player = P("adeyemi", "Adeyemi", PlayerPosition.LW, 82, 96, 78, 72), currentClub = "Dortmund", fee = 18500000, isRecommended = true },
            new TransferListing { player = P("szoboszlai", "Szoboszlai", PlayerPosition.CM, 83, 78, 81, 88), currentClub = "Leipzig", fee = 22000000, isRecommended = true },
            new TransferListing { player = P("gimenez", "Giménez", PlayerPosition.CB, 80, 74, 32, 68), currentClub = "Atleti", fee = 14500000 },
            new TransferListing { player = P("cunha", "Cunha", PlayerPosition.ST, 81, 84, 83, 76), currentClub = "Wolves", fee = 19500000 },
            new TransferListing { player = P("raya2", "Raya", PlayerPosition.GK, 84, 58, 22, 83), currentClub = "London FC", fee = 12500000 },
            new TransferListing { player = P("frimpong", "Frimpong", PlayerPosition.RB, 85, 96, 62, 79), currentClub = "Leverkusen", fee = 26000000 }
        };

        private static PlayerData P(string id, string name, PlayerPosition position, int overall, int pace, int shooting, int passing) => new() { id = id, displayName = name, position = position, overall = overall, pace = pace, shooting = shooting, passing = passing, dribbling = (pace + passing) / 2, defending = position is PlayerPosition.CB or PlayerPosition.CDM ? 84 : 48, physicality = 76 };
    }
}
