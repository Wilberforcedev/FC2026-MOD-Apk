using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace FC2026
{
    /// <summary>
    /// Runtime-created, Android-first FC 2026 presentation layer.
    /// It consumes the existing game managers and leaves match/career/catalog rules in those systems.
    /// </summary>
    public sealed class FC2026MobileHub : MonoBehaviour
    {
        private enum Page { Home, Squad, Kits, Career, Tournaments, Store, Match }

        [SerializeField] private FC2026UITheme theme;
        private Canvas canvas;
        private Camera backdropCamera;
        private GameObject backdropRoot;
        private RectTransform content;
        private ScrollRect scroll;
        private TMP_Text titleLabel;
        private TMP_Text walletLabel;
        private TMP_Text statusLabel;
        private Page page = Page.Home;
        private int selectedSquadSlot = -1;
        private int selectedKit;
        private readonly Color[] kitColors =
        {
            new Color(.08f, .68f, .96f), new Color(.88f, .12f, .22f),
            new Color(.95f, .88f, .72f), new Color(.36f, .18f, .72f),
            new Color(.12f, .72f, .43f), new Color(.94f, .48f, .08f)
        };
        private static readonly string[] kitNames = { "NEON HOME", "NIGHT AWAY", "IVORY THIRD", "ROYAL CUP", "GREEN ALT", "EMBER SPECIAL" };

        private GameBootstrap Game => GameBootstrap.Instance;
        private SquadManager Squad => Game != null ? Game.Squad : FindFirstObjectByType<SquadManager>();
        private MatchManager Match => Game != null ? Game.Match : FindFirstObjectByType<MatchManager>();
        private GameModeController Modes => Game != null ? Game.Modes : FindFirstObjectByType<GameModeController>();
        private CareerManager Career => FindFirstObjectByType<CareerManager>();
        private SeasonCalendarManager Calendar => FindFirstObjectByType<SeasonCalendarManager>();
        private FootballWorldDatabase Database => FindFirstObjectByType<FootballWorldCatalogLoader>()?.Database;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void EnsureMobileHub()
        {
            var bootstrap = FindFirstObjectByType<GameBootstrap>();
            if (bootstrap == null)
            {
                var root = new GameObject("FC 2026 Runtime");
                bootstrap = root.AddComponent<GameBootstrap>();
            }

            if (FindFirstObjectByType<FC2026MobileHub>() == null)
                bootstrap.gameObject.AddComponent<FC2026MobileHub>();
        }

        private void Start()
        {
            Screen.orientation = ScreenOrientation.LandscapeLeft;
            Screen.autorotateToPortrait = false;
            Screen.autorotateToPortraitUpsideDown = false;
            Screen.autorotateToLandscapeLeft = true;
            Screen.autorotateToLandscapeRight = true;
            theme = Resources.Load<FC2026UITheme>("FC2026UITheme");
            if (theme == null) theme = ScriptableObject.CreateInstance<FC2026UITheme>();
            CreateStadiumBackdrop();
            BuildShell();
            Open(Page.Home);
            if (Match != null)
            {
                Match.ScoreChanged += OnScoreChanged;
                Match.StateChanged += OnMatchStateChanged;
            }
        }

        private void OnDestroy()
        {
            if (Match != null)
            {
                Match.ScoreChanged -= OnScoreChanged;
                Match.StateChanged -= OnMatchStateChanged;
            }
        }

        private void Update()
        {
            if (page != Page.Match || Match == null || titleLabel == null) return;
            if (Match.State == MatchState.Playing || Match.State == MatchState.Paused)
            {
                var halfMinutes = Match.Config != null ? Match.Config.halfLengthMinutes : 3f;
                var gameMinute = Mathf.Clamp(Mathf.FloorToInt(Match.MatchSeconds / Mathf.Max(.1f, halfMinutes * 120f) * 90f), 0, 90);
                titleLabel.text = string.Format("{0:00}:{1:00}  •  {2} - {3}", gameMinute, 0, Match.HomeScore, Match.AwayScore);
            }
        }

        private void BuildShell()
        {
            var canvasObject = new GameObject("FC 2026 Mobile UI", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasObject.transform.SetParent(transform, false);
            canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            var scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1600, 900);
            scaler.matchWidthOrHeight = .5f;

            if (FindFirstObjectByType<EventSystem>() == null)
            {
                var events = new GameObject("FC 2026 Event System", typeof(EventSystem), typeof(StandaloneInputModule));
                DontDestroyOnLoad(events);
            }

            var shell = Panel(canvas.transform, "StadiumShell", C(t => t.background), Vector2.zero, Vector2.one);
            shell.GetComponent<Image>().color = new Color(C(t => t.background).r, C(t => t.background).g, C(t => t.background).b, .68f);
            var top = Panel(shell.transform, "TopBar", C(t => t.overlay), new Vector2(0, 1), new Vector2(1, 1));
            SetRect(top, new Vector2(0, -104), Vector2.zero, new Vector2(0, 0));
            var brand = Label(top.transform, "FC 2026", 27, C(t => t.heading), TextAlignmentOptions.MidlineLeft);
            SetAnchors(brand.rectTransform, new Vector2(0, 0), new Vector2(.62f, 1), new Vector2(22, 8), new Vector2(0, -4));
            var tagline = Label(top.transform, "THE WORLD IS YOUR STADIUM", 10, C(t => t.muted), TextAlignmentOptions.MidlineLeft);
            SetAnchors(tagline.rectTransform, new Vector2(0, 0), new Vector2(.72f, 0), new Vector2(23, 20), new Vector2(0, 38));
            walletLabel = Label(top.transform, "FC  •  15.0M", 14, C(t => t.success), TextAlignmentOptions.MidlineRight);
            SetAnchors(walletLabel.rectTransform, new Vector2(.62f, 0), new Vector2(1, 1), new Vector2(0, 12), new Vector2(-20, -12));

            var bottom = Panel(shell.transform, "BottomNavigation", C(t => t.overlay), new Vector2(0, 0), new Vector2(1, 0));
            var bottomRect = bottom.GetComponent<RectTransform>();
            bottomRect.anchorMin = new Vector2(0, 0); bottomRect.anchorMax = new Vector2(1, 0);
            bottomRect.pivot = new Vector2(.5f, 0); bottomRect.offsetMin = Vector2.zero; bottomRect.offsetMax = new Vector2(0, 78);
            var oldLayout = bottom.AddComponent<HorizontalLayoutGroup>();
            oldLayout.childAlignment = TextAnchor.MiddleCenter; oldLayout.spacing = 4;
            oldLayout.padding = new RectOffset(8, 8, 8, 8);
            oldLayout.childForceExpandWidth = true; oldLayout.childForceExpandHeight = true;

            var body = Panel(shell.transform, "PageViewport", new Color(0, 0, 0, 0), Vector2.zero, Vector2.one);
            SetAnchors(body.GetComponent<RectTransform>(), Vector2.zero, Vector2.one, new Vector2(0, 78), new Vector2(0, -104));
            scroll = body.AddComponent<ScrollRect>();
            scroll.horizontal = false; scroll.vertical = true; scroll.movementType = ScrollRect.MovementType.Clamped;
            var viewport = Panel(body.transform, "Viewport", new Color(0, 0, 0, 0), Vector2.zero, Vector2.one);
            viewport.GetComponent<RectTransform>().offsetMin = Vector2.zero; viewport.GetComponent<RectTransform>().offsetMax = Vector2.zero;
            viewport.AddComponent<RectMask2D>();
            var contentObject = Panel(viewport.transform, "Content", new Color(0, 0, 0, 0), new Vector2(0, 1), new Vector2(1, 1));
            content = contentObject.GetComponent<RectTransform>();
            content.pivot = new Vector2(.5f, 1);
            content.anchorMin = new Vector2(0, 1); content.anchorMax = new Vector2(1, 1);
            content.offsetMin = Vector2.zero; content.offsetMax = Vector2.zero;
            var vertical = contentObject.AddComponent<VerticalLayoutGroup>();
            vertical.padding = new RectOffset(28, 28, 16, 22);
            vertical.spacing = 12;
            vertical.childAlignment = TextAnchor.UpperCenter;
            vertical.childForceExpandWidth = true;
            vertical.childForceExpandHeight = false;
            var fitter = contentObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            scroll.viewport = viewport.GetComponent<RectTransform>();
            scroll.content = content;

            AddNav(bottom.transform, "HOME", Page.Home);
            AddNav(bottom.transform, "SQUAD", Page.Squad);
            AddNav(bottom.transform, "KITS", Page.Kits);
            AddNav(bottom.transform, "CAREER", Page.Career);
            AddNav(bottom.transform, "MORE", Page.Tournaments);
            statusLabel = Label(shell.transform, "READY FOR KICK-OFF", 10, C(t => t.muted), TextAlignmentOptions.MidlineLeft);
            SetAnchors(statusLabel.rectTransform, new Vector2(0, 0), new Vector2(1, 0), new Vector2(20, 78), new Vector2(-20, 96));
        }

        private void Open(Page next)
        {
            page = next;
            if (backdropRoot != null) backdropRoot.SetActive(page != Page.Match);
            if (backdropCamera != null) backdropCamera.enabled = page != Page.Match;
            foreach (Transform child in content) Destroy(child.gameObject);
            scroll.verticalNormalizedPosition = 1;
            titleLabel = null;
            switch (page)
            {
                case Page.Home: BuildHome(); break;
                case Page.Squad: BuildSquad(); break;
                case Page.Kits: BuildKits(); break;
                case Page.Career: BuildCareer(); break;
                case Page.Tournaments: BuildTournaments(); break;
                case Page.Store: BuildStore(); break;
                case Page.Match: BuildMatch(); break;
            }
            UpdateWallet();
        }

        private void CreateStadiumBackdrop()
        {
            // Small, procedural low-poly stadium dressing keeps the hub cinematic without shipping heavy textures.
            backdropRoot = new GameObject("FC 2026 Stadium Backdrop");
            var cameraObject = new GameObject("Stadium Backdrop Camera");
            cameraObject.transform.SetParent(backdropRoot.transform, false);
            cameraObject.transform.position = new Vector3(0, 13, -30);
            cameraObject.transform.rotation = Quaternion.LookRotation(new Vector3(0, 1, 18) - cameraObject.transform.position);
            backdropCamera = cameraObject.AddComponent<Camera>();
            backdropCamera.clearFlags = CameraClearFlags.SolidColor;
            backdropCamera.backgroundColor = new Color(.008f, .018f, .04f, 1);
            backdropCamera.fieldOfView = 52;
            backdropCamera.depth = -2;
            backdropCamera.allowHDR = false;
            backdropCamera.allowMSAA = false;

            var pitch = BackdropPiece("Pitch", PrimitiveType.Cube, new Vector3(0, -.25f, 18), new Vector3(54, .35f, 100), new Color(.025f, .19f, .105f));
            var centerLine = BackdropPiece("Center Stripe", PrimitiveType.Cube, new Vector3(0, -.055f, 18), new Vector3(.12f, .015f, 99), new Color(.3f, .42f, .34f));
            BackdropPiece("West Stand Lower", PrimitiveType.Cube, new Vector3(-31, 2, 18), new Vector3(9, 5, 94), new Color(.025f, .035f, .065f));
            BackdropPiece("East Stand Lower", PrimitiveType.Cube, new Vector3(31, 2, 18), new Vector3(9, 5, 94), new Color(.025f, .035f, .065f));
            BackdropPiece("West Stand Upper", PrimitiveType.Cube, new Vector3(-28, 6, 18), new Vector3(5, 3, 82), new Color(.045f, .06f, .095f));
            BackdropPiece("East Stand Upper", PrimitiveType.Cube, new Vector3(28, 6, 18), new Vector3(5, 3, 82), new Color(.045f, .06f, .095f));
            BackdropPiece("North Stand", PrimitiveType.Cube, new Vector3(0, 3, 68), new Vector3(58, 7, 7), new Color(.03f, .045f, .075f));
            BackdropPiece("South Stand", PrimitiveType.Cube, new Vector3(0, 3, -31), new Vector3(58, 7, 7), new Color(.03f, .045f, .075f));
            BackdropPiece("West Floodlight Tower", PrimitiveType.Cube, new Vector3(-32, 10, -3), new Vector3(1.2f, 18, 1.2f), new Color(.12f, .15f, .21f));
            BackdropPiece("East Floodlight Tower", PrimitiveType.Cube, new Vector3(32, 10, -3), new Vector3(1.2f, 18, 1.2f), new Color(.12f, .15f, .21f));
            var light = new GameObject("Stadium Key Light").AddComponent<Light>();
            light.transform.SetParent(backdropRoot.transform, false);
            light.type = LightType.Directional;
            light.intensity = .65f;
            light.color = new Color(.58f, .72f, 1f);
            light.transform.rotation = Quaternion.Euler(48, -24, 0);
            RenderSettings.ambientLight = new Color(.16f, .19f, .25f);
        }

        private GameObject BackdropPiece(string pieceName, PrimitiveType type, Vector3 position, Vector3 scale, Color color)
        {
            var piece = GameObject.CreatePrimitive(type);
            piece.name = pieceName;
            piece.transform.SetParent(backdropRoot.transform, true);
            piece.transform.position = position;
            piece.transform.localScale = scale;
            var collider = piece.GetComponent<Collider>();
            if (collider != null) Destroy(collider);
            var renderer = piece.GetComponent<Renderer>();
            var shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Standard");
            if (shader != null)
            {
                var material = new Material(shader);
                material.color = color;
                renderer.sharedMaterial = material;
            }
            return piece;
        }

        private void BuildHome()
        {
            Header("FC 2026  /  FOOTBALL HUB", "YOUR CLUB. YOUR LEGACY.  •  SEASON 01");
            var hero = Panel(content, "FeaturedMatch", C(t => t.panel), Vector2.zero, Vector2.one);
            Size(hero, 188);
            AddAccent(hero.transform, C(t => t.focus));
            Label(hero.transform, "CAREER MODE  /  MATCHDAY 01", 11, C(t => t.focus), TextAlignmentOptions.TopLeft, new Vector2(22, -16), new Vector2(-22, 24));
            Label(hero.transform, "BUILD YOUR\nFOOTBALL LEGACY", 30, C(t => t.heading), TextAlignmentOptions.TopLeft, new Vector2(22, -42), new Vector2(-22, 94));
            Label(hero.transform, "FC CITY     VS     NORTH LONDON", 13, C(t => t.body), TextAlignmentOptions.MidlineLeft, new Vector2(22, 22), new Vector2(-250, 28));
            ActionButton(hero.transform, "PLAY MATCH  →", C(t => t.focus), () => StartMatch(), new Vector2(-220, 22), new Vector2(-22, 72));
            SectionTitle("YOUR FOOTBALL WORLD", "SELECT A GAME MODE");
            DashboardRow(
                new DashboardItem("CAREER", "League campaign  •  fixtures", () => Open(Page.Career), C(t => t.danger)),
                new DashboardItem("SQUAD", "Line-up  •  formations  •  ratings", () => Open(Page.Squad), C(t => t.focus)),
                new DashboardItem("SCENARIO", "Cup nights  •  challenges", () => Open(Page.Tournaments), C(t => t.success)));
            DashboardRow(
                new DashboardItem("DREAM LEAGUE LIVE", "Play matches  •  build your record", () => StartMatch(), C(t => t.focus)),
                new DashboardItem("TRANSFERS", "Scout players  •  strengthen your XI", () => Open(Page.Store), C(t => t.goldCard)),
                new DashboardItem("MY CLUB", "Kits  •  club identity  •  upgrades", () => Open(Page.Kits), C(t => t.socialAccent)));
            FooterNote("FC 2026  /  BUILT FOR LANDSCAPE MOBILE FOOTBALL");
        }

        private readonly struct DashboardItem
        {
            public readonly string title;
            public readonly string description;
            public readonly UnityEngine.Events.UnityAction action;
            public readonly Color accent;

            public DashboardItem(string title, string description, UnityEngine.Events.UnityAction action, Color accent)
            {
                this.title = title;
                this.description = description;
                this.action = action;
                this.accent = accent;
            }
        }

        private void DashboardRow(params DashboardItem[] items)
        {
            var row = new GameObject("DashboardRow", typeof(RectTransform), typeof(HorizontalLayoutGroup));
            row.transform.SetParent(content, false);
            row.GetComponent<RectTransform>().sizeDelta = new Vector2(0, 116);
            var rowLayout = row.GetComponent<HorizontalLayoutGroup>();
            rowLayout.spacing = 12;
            rowLayout.childAlignment = TextAnchor.MiddleCenter;
            rowLayout.childForceExpandWidth = true;
            rowLayout.childForceExpandHeight = true;
            foreach (var item in items)
            {
                var card = Panel(row.transform, item.title.Replace(" ", "") + "Tile", C(t => t.panel), Vector2.zero, Vector2.one);
                var layout = card.AddComponent<LayoutElement>();
                layout.minWidth = 180;
                layout.flexibleWidth = 1;
                var image = card.GetComponent<Image>();
                image.color = Color.Lerp(C(t => t.panel), item.accent, .16f);
                var stripe = Panel(card.transform, "Accent", item.accent, Vector2.zero, new Vector2(0, 1));
                stripe.GetComponent<RectTransform>().sizeDelta = new Vector2(5, 0);
                var button = card.AddComponent<Button>();
                button.targetGraphic = image;
                button.onClick.AddListener(item.action);
                Label(card.transform, item.title, 16, C(t => t.heading), TextAlignmentOptions.TopLeft, new Vector2(18, -16), new Vector2(-14, 42));
                Label(card.transform, item.description, 10, C(t => t.muted), TextAlignmentOptions.TopLeft, new Vector2(18, -48), new Vector2(-14, 14));
                Label(card.transform, "OPEN  →", 9, item.accent, TextAlignmentOptions.BottomRight, new Vector2(12, 8), new Vector2(-14, 24));
            }
        }

        private void BuildSquad()
        {
            var team = Squad?.CurrentTeam;
            var formation = string.IsNullOrWhiteSpace(team?.formation) ? "4-3-3" : team.formation;
            Header("SQUAD MANAGEMENT", formation + "  /  SELECT TWO PLAYERS TO SWAP");
            var players = Squad?.StartingEleven?.ToList() ?? new List<PlayerData>();
            var pitch = Panel(content, "FormationPitch", new Color(.035f, .19f, .105f, 1), Vector2.zero, Vector2.one);
            Size(pitch, 200);
            Label(pitch.transform, formation.Replace("-", "  —  "), 15, Color.white, TextAlignmentOptions.TopLeft, new Vector2(16, -12), new Vector2(-16, 24));
            Label(pitch.transform, "XI  •  " + (team?.displayName ?? "YOUR CLUB"), 11, new Color(.72f, .9f, .78f), TextAlignmentOptions.BottomLeft, new Vector2(16, 12), new Vector2(-16, 22));
            var chemistry = Label(pitch.transform, "CHEMISTRY  " + (Squad?.TeamChemistry ?? 0), 12, C(t => t.focus), TextAlignmentOptions.BottomRight);
            SetAnchors(chemistry.rectTransform, new Vector2(0, 0), new Vector2(1, 0), new Vector2(12, 12), new Vector2(-16, 32));
            SectionTitle("TACTICAL FORMATION", "CHOOSE YOUR TEAM SHAPE");
            var formations = new[] { "4-3-3", "4-2-3-1", "4-4-2", "3-5-2" };
            foreach (var preset in formations)
            {
                var selected = preset == formation;
                ActionButton(content, (selected ? "✓  " : "    ") + preset, selected ? C(t => t.focus) : C(t => t.panelSoft),
                    () => SetFormation(preset), Vector2.zero, new Vector2(0, 46));
            }
            SectionTitle("STARTING XI", selectedSquadSlot < 0 ? "TAP A PLAYER, THEN TAP ANOTHER" : "SLOT " + (selectedSquadSlot + 1) + " SELECTED — CHOOSE A SWAP");
            for (int i = 0; i < players.Count; i++)
            {
                int slot = i;
                var player = players[i];
                var label = player == null ? "EMPTY SLOT" : player.overall.ToString("00") + "   " + player.position + "   " + player.displayName;
                var card = ActionCard((i + 1).ToString("00") + "  /  " + label, player == null ? "TAP TO ASSIGN" : "PAC " + player.pace + "   SHO " + player.shooting + "   PAS " + player.passing,
                    selectedSquadSlot == i ? C(t => t.focusSoft) : C(t => t.panel), () => SelectSquadSlot(slot));
                if (selectedSquadSlot == i) AddAccent(card.transform, C(t => t.focus));
            }
            ActionButton(content, "AUTO SELECT BEST XI", C(t => t.panelSoft), () =>
            {
                if (Squad?.CurrentTeam == null) return;
                foreach (var position in Enum.GetValues(typeof(PlayerPosition)).Cast<PlayerPosition>())
                {
                    var best = Squad.FindBest(position);
                    if (best != null)
                    {
                        int slot = players.FindIndex(p => p != null && p.position == position);
                        if (slot >= 0) Squad.SetPlayer(slot, best);
                    }
                }
                selectedSquadSlot = -1; Open(Page.Squad);
            }, Vector2.zero, new Vector2(0, 52));
        }

        private void SetFormation(string formation)
        {
            if (Squad?.CurrentTeam == null) { SetStatus("SQUAD NOT AVAILABLE"); return; }
            Squad.CurrentTeam.formation = formation;
            SetStatus("FORMATION UPDATED  /  " + formation);
            Open(Page.Squad);
        }

        private void SelectSquadSlot(int slot)
        {
            if (Squad == null) { SetStatus("SQUAD MANAGER NOT AVAILABLE"); return; }
            if (selectedSquadSlot < 0) { selectedSquadSlot = slot; Open(Page.Squad); return; }
            if (selectedSquadSlot == slot) selectedSquadSlot = -1;
            else { Squad.SwapPlayers(selectedSquadSlot, slot); selectedSquadSlot = -1; SetStatus("SQUAD UPDATED"); }
            Open(Page.Squad);
        }

        private void BuildKits()
        {
            Header("THE KIT ROOM", "NEW SEASON. NEW IDENTITY.");
            var preview = Panel(content, "KitPreview", C(t => t.panel), Vector2.zero, Vector2.one);
            Size(preview, 300);
            AddAccent(preview.transform, kitColors[selectedKit]);
            Label(preview.transform, "OFFICIAL CLUB COLLECTION", 11, C(t => t.muted), TextAlignmentOptions.TopLeft, new Vector2(18, -18), new Vector2(-18, 24));
            var shirt = Panel(preview.transform, "ShirtSilhouette", kitColors[selectedKit], new Vector2(.34f, .25f), new Vector2(.66f, .77f));
            shirt.GetComponent<RectTransform>().offsetMin = new Vector2(0, 0); shirt.GetComponent<RectTransform>().offsetMax = Vector2.zero;
            Label(shirt.transform, "26", 42, Color.white, TextAlignmentOptions.Center, Vector2.zero, Vector2.zero);
            Label(preview.transform, kitNames[selectedKit], 22, C(t => t.heading), TextAlignmentOptions.BottomLeft, new Vector2(18, 22), new Vector2(-18, 32));
            Label(preview.transform, "COLLECTION  /  " + (selectedKit + 1).ToString("00") + " OF 06", 10, C(t => t.muted), TextAlignmentOptions.BottomRight, new Vector2(18, 22), new Vector2(-18, 32));
            ActionButton(content, "← PREVIOUS KIT", C(t => t.panelSoft), () => { selectedKit = (selectedKit + kitColors.Length - 1) % kitColors.Length; Open(Page.Kits); }, Vector2.zero, new Vector2(0, 50));
            ActionButton(content, "NEXT KIT  →", C(t => t.panelSoft), () => { selectedKit = (selectedKit + 1) % kitColors.Length; Open(Page.Kits); }, Vector2.zero, new Vector2(0, 50));
            ActionButton(content, "EQUIP THIS KIT", C(t => t.focus), () =>
            {
                if (Game?.UserTeam != null) Game.UserTeam.primaryColor = kitColors[selectedKit];
                SetStatus(kitNames[selectedKit] + " EQUIPPED");
            }, Vector2.zero, new Vector2(0, 54));
            FooterNote("KIT PREVIEW IS A UI SELECTION. CONNECT YOUR KIT MATERIALS TO APPLY IT IN 3D MATCHES.");
        }

        private void BuildCareer()
        {
            Header("MANAGER CAREER", "BUILD A CLUB THAT LASTS");
            var career = Career;
            var calendar = Calendar;
            var team = Squad?.CurrentTeam;
            StatRow("SEASON", calendar != null ? calendar.Season.ToString("00") : "01", "MATCHWEEK", calendar != null ? calendar.NextFixture?.matchweek.ToString("00") ?? "END" : "01");
            StatRow("TRANSFER BUDGET", FormatMoney(career?.TransferBudget ?? 15000000), "SQUAD SIZE", (team?.players?.Count ?? 0).ToString("00"));
            SectionTitle("NEXT FIXTURE", "YOUR ROAD TO THE TOP");
            var fixture = calendar?.NextFixture;
            var fixtureText = fixture != null && Database != null
                ? (Database.FindClub(fixture.homeClubId)?.shortName ?? fixture.homeClubId) + "  VS  " + (Database.FindClub(fixture.awayClubId)?.shortName ?? fixture.awayClubId)
                : "FC CITY  VS  NORTH LONDON";
            ActionCard(fixtureText, fixture != null ? "MATCHWEEK " + fixture.matchweek + "  /  " + fixture.competitionId : "FRIENDLY  /  OPENING MATCH", C(t => t.panel), () => StartMatch());
            SectionTitle("SEASON OBJECTIVES", "KEEP YOUR MOMENTUM");
            Tile("FINISH IN THE TOP TWO", "Consistency wins championships", "View table", () => SetStatus("LEAGUE TABLE: COMPLETE FIXTURES TO UPDATE STANDINGS"));
            Tile("DEVELOP YOUR PLAYERS", "Training, form and potential", "Player growth", () => SetStatus("PLAYER PROGRESSION SYSTEM READY"));
            Tile("BUILD THE SQUAD", "Scout and negotiate transfers", "Transfer market", () => Open(Page.Store));
            ActionButton(content, "PLAY NEXT FIXTURE", C(t => t.focus), StartMatch, Vector2.zero, new Vector2(0, 56));
        }

        private void BuildTournaments()
        {
            Header("TOURNAMENT CENTRAL", "ONE CUP. EVERY MATCH MATTERS.");
            var cup = Panel(content, "CupHero", C(t => t.panel), Vector2.zero, Vector2.one);
            Size(cup, 250);
            AddAccent(cup.transform, C(t => t.goldCard));
            Label(cup.transform, "FC 2026  /  KNOCKOUT SERIES", 11, C(t => t.goldCard), TextAlignmentOptions.TopLeft, new Vector2(18, -18), new Vector2(-18, 24));
            Label(cup.transform, "THE ROAD\nTO THE FINAL", 34, C(t => t.heading), TextAlignmentOptions.TopLeft, new Vector2(18, -54), new Vector2(-18, 100));
            Label(cup.transform, "ROUND OF 16  →  QUARTER-FINAL  →  FINAL", 10, C(t => t.muted), TextAlignmentOptions.BottomLeft, new Vector2(18, 18), new Vector2(-18, 24));
            ActionButton(cup.transform, "ENTER TOURNAMENT", C(t => t.focus), () =>
            {
                Modes?.OpenChampionsCup();
                SetStatus("TOURNAMENT MODE SELECTED");
                StartMatch(GameMode.ChampionsCup);
            }, new Vector2(18, 18), new Vector2(-18, 66));
            Tile("CHAMPIONS CUP", "ELIMINATION FOOTBALL", "Start cup match", () => StartMatch(GameMode.ChampionsCup));
            Tile("PENALTY SHOOTOUT", "NERVES OF STEEL", "Start duel", () => { Modes?.OpenPenaltyDuel(); SetStatus("PENALTY DUEL SELECTED"); });
            Tile("PRACTICE ARENA", "SHARPEN YOUR FINISHING", "Training session", () => { Modes?.OpenPractice(); SetStatus("PRACTICE MODE SELECTED"); });
        }

        private void BuildStore()
        {
            Header("ULTIMATE STORE", "SCOUT SMART. SIGN BIG.");
            var budget = Career?.TransferBudget ?? 15000000;
            StatRow("TRANSFER FUNDS", FormatMoney(budget), "TARGETS", Database != null ? Database.players.Count.ToString("00") : "06");
            SectionTitle("FEATURED PLAYERS", "TAP TO SIGN IF YOUR BUDGET ALLOWS");
            var listings = Database != null && Database.players.Count > 0
                ? Database.players.OrderByDescending(p => p.overall).Take(12).Select(p => new StorePlayer { id = p.id, name = p.displayName, club = Database.FindClub(p.clubId)?.shortName ?? "FREE AGENT", position = p.position, overall = p.overall, fee = p.marketValue }).ToList()
                : DemoPlayers();
            foreach (var listing in listings)
            {
                var item = listing;
                var card = ActionCard(item.overall.ToString("00") + "  /  " + item.name, item.position + "  •  " + item.club + "  •  " + FormatMoney(item.fee),
                    C(t => t.CardTierColor(item.overall)), () => BuyPlayer(item));
                AddAccent(card.transform, C(t => t.focus));
            }
            FooterNote("PURCHASES UPDATE THE ACTIVE SQUAD AND USE THE CAREER TRANSFER BUDGET WHEN AVAILABLE.");
        }

        private void BuyPlayer(StorePlayer item)
        {
            if (Squad?.CurrentTeam == null) { SetStatus("SQUAD NOT READY"); return; }
            if (Career != null && !Career.SpendTransferBudget(item.fee)) { SetStatus("NOT ENOUGH TRANSFER FUNDS"); return; }
            if (Squad.CurrentTeam.players.Any(p => p.id == item.id)) { SetStatus("PLAYER ALREADY IN YOUR SQUAD"); return; }
            Enum.TryParse(item.position, true, out PlayerPosition position);
            Squad.CurrentTeam.players.Add(new PlayerData
            {
                id = item.id, displayName = item.name, position = position, overall = item.overall,
                pace = Mathf.Clamp(item.overall - 2, 40, 99), shooting = Mathf.Clamp(item.overall - 4, 35, 99),
                passing = Mathf.Clamp(item.overall - 3, 35, 99), dribbling = Mathf.Clamp(item.overall - 1, 35, 99),
                defending = Mathf.Clamp(item.overall - 8, 20, 95), physicality = Mathf.Clamp(item.overall - 3, 30, 99)
            });
            SetStatus(item.name.ToUpperInvariant() + " SIGNED");
            Open(Page.Store);
        }

        private void BuildMatch()
        {
            Header("MATCHDAY LIVE", "BROADCAST PRESENTATION  /  TOUCH HUD");
            var board = Panel(content, "BroadcastScoreboard", C(t => t.panel), Vector2.zero, Vector2.one);
            Size(board, 230);
            AddAccent(board.transform, C(t => t.focus));
            titleLabel = Label(board.transform, "00:00  •  0 - 0", 32, C(t => t.heading), TextAlignmentOptions.TopCenter, new Vector2(12, -22), new Vector2(-12, 48));
            var home = Game?.UserTeam?.displayName ?? "FC CITY";
            var away = Game?.OpponentTeam?.displayName ?? "NORTH LONDON";
            AnchoredLabel(board.transform, home.ToUpperInvariant(), 14, C(t => t.body), TextAlignmentOptions.MidlineLeft,
                new Vector2(0, 0), new Vector2(.48f, 1), new Vector2(18, 48), new Vector2(-4, -86));
            AnchoredLabel(board.transform, away.ToUpperInvariant(), 14, C(t => t.body), TextAlignmentOptions.MidlineRight,
                new Vector2(.52f, 0), new Vector2(1, 1), new Vector2(4, 48), new Vector2(-18, -86));
            Label(board.transform, Match != null ? Match.State.ToString().ToUpperInvariant() : "PRE-MATCH", 10, C(t => t.focus), TextAlignmentOptions.BottomCenter, new Vector2(12, 16), new Vector2(-12, 24));
            ActionButton(content, Match?.State == MatchState.Paused ? "RESUME MATCH" : "PAUSE MATCH", C(t => t.panelSoft), () => Match?.TogglePause(), Vector2.zero, new Vector2(0, 52));
            ActionButton(content, "REGISTER HOME GOAL  +1", C(t => t.focus), () => Match?.RegisterGoal(true), Vector2.zero, new Vector2(0, 52));
            ActionButton(content, "REGISTER AWAY GOAL  +1", C(t => t.panelSoft), () => Match?.RegisterGoal(false), Vector2.zero, new Vector2(0, 52));
            ActionButton(content, "RETURN TO CLUB HUB", C(t => t.panelSoft), () => { Modes?.OpenHome(); Open(Page.Home); }, Vector2.zero, new Vector2(0, 52));
            FooterNote("MATCH HUD IS PRESENTATION ONLY; EXISTING BALL, PLAYER, CAMERA AND MATCH SYSTEMS REMAIN SEPARATE.");
        }

        private void StartMatch(GameMode mode = GameMode.Kickoff)
        {
            if (Game == null) { SetStatus("GAME BOOTSTRAP NOT READY"); return; }
            if (FindFirstObjectByType<MatchArenaBootstrap>() == null)
                new GameObject("FC 2026 Runtime Match Arena").AddComponent<MatchArenaBootstrap>();
            if (mode == GameMode.ChampionsCup) Modes?.OpenChampionsCup();
            else Modes?.OpenKickoff();
            Game.Match.StartMatch(new MatchConfig { homeTeam = Game.UserTeam, awayTeam = Game.OpponentTeam, mode = mode, halfLengthMinutes = 3f });
            Open(Page.Match);
        }

        private void OnScoreChanged(int home, int away)
        {
            if (page == Page.Match && titleLabel != null) titleLabel.text = string.Format("{0:00}:00  •  {1} - {2}", Match != null ? Mathf.FloorToInt(Match.MatchSeconds / 4f) : 0, home, away);
        }

        private void OnMatchStateChanged(MatchState state)
        {
            if (state == MatchState.FullTime) SetStatus("FULL TIME  /  " + (Match?.HomeScore ?? 0) + " - " + (Match?.AwayScore ?? 0));
            else if (state == MatchState.HalfTime) SetStatus("HALF TIME  /  REVIEW YOUR TACTICS");
        }

        private void AddNav(Transform parent, string label, Page destination)
        {
            var button = Button(parent, label, C(t => t.panelSoft), () => Open(destination));
            var layout = button.gameObject.AddComponent<LayoutElement>();
            layout.minHeight = 42; layout.preferredHeight = 50; layout.flexibleWidth = 1;
        }

        private void Header(string title, string subtitle)
        {
            var heading = Label(content, title, 27, C(t => t.heading), TextAlignmentOptions.TopLeft);
            heading.fontStyle = FontStyles.Bold;
            heading.rectTransform.sizeDelta = new Vector2(0, 42);
            var sub = Label(content, subtitle, 10, C(t => t.muted), TextAlignmentOptions.TopLeft);
            sub.rectTransform.sizeDelta = new Vector2(0, 22);
        }

        private void SectionTitle(string title, string subtitle)
        {
            var group = Panel(content, "SectionTitle", new Color(0, 0, 0, 0), Vector2.zero, Vector2.one);
            Size(group, 52);
            Label(group.transform, title, 15, C(t => t.heading), TextAlignmentOptions.BottomLeft, new Vector2(0, 22), new Vector2(-4, 24));
            Label(group.transform, subtitle, 9, C(t => t.muted), TextAlignmentOptions.TopLeft, new Vector2(0, 0), new Vector2(-4, 18));
        }

        private void Tile(string title, string description, string actionLabel, UnityEngine.Events.UnityAction action)
        {
            var tile = ActionCard(title, description, C(t => t.panel), action);
            var label = Label(tile.transform, actionLabel.ToUpperInvariant() + "  →", 9, C(t => t.focus), TextAlignmentOptions.BottomRight);
            SetAnchors(label.rectTransform, new Vector2(0, 0), new Vector2(1, 0), new Vector2(12, 10), new Vector2(-14, 28));
        }

        private GameObject ActionCard(string title, string description, Color color, UnityEngine.Events.UnityAction action)
        {
            var card = Panel(content, "ActionCard", color, Vector2.zero, Vector2.one);
            Size(card, 92);
            var button = card.AddComponent<Button>();
            button.targetGraphic = card.GetComponent<Image>();
            button.onClick.AddListener(action);
            Label(card.transform, title, 14, C(t => t.heading), TextAlignmentOptions.TopLeft, new Vector2(16, -14), new Vector2(-16, 28));
            Label(card.transform, description, 10, C(t => t.muted), TextAlignmentOptions.TopLeft, new Vector2(16, -44), new Vector2(-16, 25));
            return card;
        }

        private void StatRow(string leftLabel, string leftValue, string rightLabel, string rightValue)
        {
            var row = Panel(content, "Stats", C(t => t.panel), Vector2.zero, Vector2.one);
            Size(row, 88);
            AnchoredLabel(row.transform, leftLabel, 9, C(t => t.muted), TextAlignmentOptions.TopLeft, Vector2.zero, new Vector2(.48f, 1), new Vector2(14, 8), new Vector2(-4, -10));
            AnchoredLabel(row.transform, leftValue, 17, C(t => t.heading), TextAlignmentOptions.TopLeft, Vector2.zero, new Vector2(.48f, 1), new Vector2(14, 8), new Vector2(-4, -32));
            AnchoredLabel(row.transform, rightLabel, 9, C(t => t.muted), TextAlignmentOptions.TopLeft, new Vector2(.52f, 0), Vector2.one, new Vector2(4, 8), new Vector2(-14, -10));
            AnchoredLabel(row.transform, rightValue, 17, C(t => t.heading), TextAlignmentOptions.TopLeft, new Vector2(.52f, 0), Vector2.one, new Vector2(4, 8), new Vector2(-14, -32));
        }

        private void ActionButton(Transform parent, string label, Color accent, UnityEngine.Events.UnityAction action, Vector2 offsetMin, Vector2 offsetMax)
        {
            var button = Button(parent, label, accent, action);
            var rect = button.GetComponent<RectTransform>();
            if (parent == content)
            {
                rect.sizeDelta = new Vector2(0, Mathf.Max(48, offsetMax.y));
                var layout = button.gameObject.AddComponent<LayoutElement>();
                layout.minHeight = Mathf.Max(48, offsetMax.y); layout.preferredHeight = Mathf.Max(48, offsetMax.y);
            }
            else
            {
                rect.anchorMin = Vector2.zero; rect.anchorMax = new Vector2(1, 0);
                rect.offsetMin = offsetMin; rect.offsetMax = offsetMax;
            }
        }

        private Button Button(Transform parent, string label, Color accent, UnityEngine.Events.UnityAction action)
        {
            var obj = Panel(parent, label, Color.Lerp(C(t => t.panelSoft), accent, .18f), Vector2.zero, Vector2.one);
            var button = obj.AddComponent<Button>();
            button.targetGraphic = obj.GetComponent<Image>();
            var colors = button.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = Color.Lerp(Color.white, C(t => t.focus), .18f);
            colors.pressedColor = Color.Lerp(Color.white, C(t => t.focus), .38f);
            colors.disabledColor = new Color(.4f, .43f, .48f, .6f);
            button.colors = colors;
            button.onClick.AddListener(action);
            var text = Label(obj.transform, label, 11, C(t => t.heading), TextAlignmentOptions.Center);
            SetAnchors(text.rectTransform, Vector2.zero, Vector2.one, new Vector2(8, 2), new Vector2(-8, -2));
            return button;
        }

        private GameObject Panel(Transform parent, string name, Color color, Vector2 min, Vector2 max)
        {
            var obj = new GameObject(name, typeof(RectTransform), typeof(Image));
            obj.transform.SetParent(parent, false);
            var rect = obj.GetComponent<RectTransform>();
            rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero;
            obj.GetComponent<Image>().color = color;
            return obj;
        }

        private TMP_Text Label(Transform parent, string text, float size, Color color, TextAlignmentOptions alignment,
            Vector2? offsetMin = null, Vector2? offsetMax = null)
        {
            var obj = new GameObject("Label", typeof(RectTransform), typeof(TextMeshProUGUI));
            obj.transform.SetParent(parent, false);
            var label = obj.GetComponent<TextMeshProUGUI>();
            label.text = text; label.fontSize = size; label.color = color; label.alignment = alignment;
            label.enableWordWrapping = true; label.raycastTarget = false; label.overflowMode = TextOverflowModes.Ellipsis;
            var rect = label.rectTransform;
            rect.anchorMin = Vector2.zero; rect.anchorMax = Vector2.one;
            rect.offsetMin = offsetMin ?? new Vector2(12, 8);
            rect.offsetMax = offsetMax ?? new Vector2(-12, -8);
            return label;
        }

        private TMP_Text AnchoredLabel(Transform parent, string text, float size, Color color, TextAlignmentOptions alignment,
            Vector2 anchorMin, Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax)
        {
            var label = Label(parent, text, size, color, alignment);
            SetAnchors(label.rectTransform, anchorMin, anchorMax, offsetMin, offsetMax);
            return label;
        }

        private void AddAccent(Transform parent, Color color)
        {
            var accent = Panel(parent, "FocusAccent", color, new Vector2(0, 0), new Vector2(0, 1));
            accent.GetComponent<RectTransform>().sizeDelta = new Vector2(4, 0);
        }

        private void FooterNote(string text)
        {
            var label = Label(content, text, 9, C(t => t.muted), TextAlignmentOptions.Center);
            label.rectTransform.sizeDelta = new Vector2(0, 42);
        }

        private void Size(GameObject obj, float height)
        {
            var rect = obj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0, 1); rect.anchorMax = new Vector2(1, 1);
            rect.pivot = new Vector2(.5f, 1);
            rect.sizeDelta = new Vector2(0, height);
            var layout = obj.GetComponent<LayoutElement>() ?? obj.AddComponent<LayoutElement>();
            layout.minHeight = height; layout.preferredHeight = height; layout.flexibleHeight = 0;
        }

        private static void SetRect(GameObject obj, Vector2 offsetMin, Vector2 offsetMax, Vector2 size)
        {
            var rect = obj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0, 1); rect.anchorMax = new Vector2(1, 1);
            rect.pivot = new Vector2(.5f, 1);
            rect.offsetMin = offsetMin; rect.offsetMax = offsetMax;
            if (size != Vector2.zero) rect.sizeDelta = size;
        }

        private static void SetAnchors(RectTransform rect, Vector2 min, Vector2 max, Vector2 offsetMin, Vector2 offsetMax)
        {
            rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = offsetMin; rect.offsetMax = offsetMax;
        }

        private Color C(Func<FC2026UITheme, Color> selector)
        {
            if (theme != null) return selector(theme);
            return Color.Lerp(new Color(.025f, .035f, .06f), Color.white, .08f);
        }

        private void UpdateWallet()
        {
            if (walletLabel != null) walletLabel.text = "FC  •  " + FormatMoney(Career?.TransferBudget ?? 15000000);
        }

        private void SetStatus(string message)
        {
            if (statusLabel != null) statusLabel.text = message.ToUpperInvariant();
        }

        private static string FormatMoney(int amount) => amount >= 1000000 ? "€" + (amount / 1000000f).ToString("0.0") + "M" : "€" + (amount / 1000f).ToString("0") + "K";

        [Serializable]
        private sealed class StorePlayer
        {
            public string id, name, club, position;
            public int overall, fee;
        }

        private static List<StorePlayer> DemoPlayers() => new List<StorePlayer>
        {
            new StorePlayer { id = "store_ade", name = "A. Adeyemi", club = "DORTMUND", position = "LW", overall = 82, fee = 18500000 },
            new StorePlayer { id = "store_szobo", name = "D. Szoboszlai", club = "LEIPZIG", position = "CM", overall = 83, fee = 22000000 },
            new StorePlayer { id = "store_gimenez", name = "J. Gimenez", club = "MADRID", position = "CB", overall = 80, fee = 14500000 },
            new StorePlayer { id = "store_cunha", name = "M. Cunha", club = "WOLVES", position = "ST", overall = 81, fee = 19500000 },
            new StorePlayer { id = "store_frimpong", name = "J. Frimpong", club = "LEVERKUSEN", position = "RB", overall = 85, fee = 26000000 },
            new StorePlayer { id = "store_raya", name = "D. Raya", club = "NORTH LONDON", position = "GK", overall = 84, fee = 12500000 }
        };
    }
}
