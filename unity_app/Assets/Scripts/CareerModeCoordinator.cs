using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    /// <summary>
    /// Coordinates the existing career, season, match simulation, transfer, scouting,
    /// squad, and progression systems around one persistent CareerModeSave.
    /// </summary>
    public sealed class CareerModeCoordinator : MonoBehaviour
    {
        [SerializeField] private CareerModeManager saveManager;
        [SerializeField] private SeasonCalendarManager calendar;
        [SerializeField] private CareerMatchSimulationEngine matchEngine;
        [SerializeField] private CareerManager legacyCareer;
        [SerializeField] private SquadManager squad;
        [SerializeField] private PlayerProgressionManager progression;
        [SerializeField] private ScoutingNetworkManager scouting;
        [SerializeField] private TransferNegotiationManager negotiations;
        [SerializeField] private FootballWorldDatabase database;
        private bool bindingsReady;
        private bool restoringState;
        private bool processingCupRounds;
        private bool simulatingOtherMatches;
        private MatchManager liveMatch;
        private bool liveMatchSubscribed;
        private SeasonFixture activePlayableFixture;
        private bool activeLiveFixtureProcessed;
        private readonly HashSet<string> createdCupRounds = new HashSet<string>();

        public CareerModeManager SaveManager => saveManager;
        public SeasonCalendarManager Calendar => calendar;
        public FootballWorldDatabase Database => database;
        public SquadManager Squad => squad;
        public SeasonCalendarManager SeasonCalendar => calendar;
        public bool HasActiveCareer => saveManager != null && saveManager.HasCareer;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void EnsureCoordinator()
        {
            var root = FindFirstObjectByType<GameBootstrap>();
            if (root == null)
            {
                var go = new GameObject("AERO Soccer Runtime");
                root = go.AddComponent<GameBootstrap>();
            }
            if (root.GetComponent<CareerModeManager>() == null) root.gameObject.AddComponent<CareerModeManager>();
            if (root.GetComponent<CareerModeCoordinator>() == null) root.gameObject.AddComponent<CareerModeCoordinator>();
        }

        private void Awake()
        {
            saveManager ??= GetComponent<CareerModeManager>();
            if (saveManager == null) saveManager = gameObject.AddComponent<CareerModeManager>();
            ResolveManagers();
        }

        private void Start()
        {
            ResolveManagers();
            if (saveManager != null && saveManager.HasCareer)
            {
                RestoreCareer();
            }
            else
            {
                EnsureLegacySystemsConfigured();
            }
        }

        private void OnEnable()
        {
            BindEvents();
            EnsureLiveMatchSubscription();
        }

        private void OnDisable()
        {
            UnbindEvents();
            if (liveMatch != null && liveMatchSubscribed) liveMatch.StateChanged -= OnLiveMatchStateChanged;
            liveMatchSubscribed = false;
            liveMatch = null;
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused) SaveNow();
        }

        private void OnApplicationQuit() => SaveNow();

        private void Update()
        {
            // The database loader may finish after this persistent bootstrap; keep resolving until it is ready.
            if (!bindingsReady || database == null) { ResolveManagers(); BindEvents(); }
            EnsureLiveMatchSubscription();
        }

        private void ResolveManagers()
        {
            database ??= FindFirstObjectByType<FootballWorldCatalogLoader>()?.Database;
            database ??= Resources.Load<FootballWorldDatabase>("FootballWorldDatabase");
            calendar ??= FindFirstObjectByType<SeasonCalendarManager>();
            if (calendar == null) calendar = gameObject.AddComponent<SeasonCalendarManager>();
            matchEngine ??= FindFirstObjectByType<CareerMatchSimulationEngine>();
            if (matchEngine == null) matchEngine = gameObject.AddComponent<CareerMatchSimulationEngine>();
            legacyCareer ??= FindFirstObjectByType<CareerManager>();
            if (legacyCareer == null) legacyCareer = gameObject.AddComponent<CareerManager>();
            squad ??= FindFirstObjectByType<SquadManager>();
            progression ??= FindFirstObjectByType<PlayerProgressionManager>();
            if (progression == null) progression = gameObject.AddComponent<PlayerProgressionManager>();
            scouting ??= FindFirstObjectByType<ScoutingNetworkManager>();
            if (scouting == null) scouting = gameObject.AddComponent<ScoutingNetworkManager>();
            negotiations ??= FindFirstObjectByType<TransferNegotiationManager>();
            if (negotiations == null) negotiations = gameObject.AddComponent<TransferNegotiationManager>();

            if (calendar != null && database != null) calendar.Configure(database);
            if (matchEngine != null && calendar != null && database != null) matchEngine.Configure(database, calendar);
            if (scouting != null) scouting.Configure(database, legacyCareer);
            if (negotiations != null) negotiations.Configure(legacyCareer, squad, this);
            EnsureLiveMatchSubscription();
        }

        private void EnsureLiveMatchSubscription()
        {
            var candidate = GameBootstrap.Instance != null ? GameBootstrap.Instance.Match : FindFirstObjectByType<MatchManager>();
            if (candidate == liveMatch) return;
            if (liveMatch != null && liveMatchSubscribed) liveMatch.StateChanged -= OnLiveMatchStateChanged;
            liveMatch = candidate;
            liveMatchSubscribed = false;
            if (isActiveAndEnabled && liveMatch != null)
            {
                liveMatch.StateChanged += OnLiveMatchStateChanged;
                liveMatchSubscribed = true;
            }
        }

        private void BindEvents()
        {
            if (bindingsReady) return;
            if (calendar != null) calendar.CalendarChanged += OnCalendarChanged;
            if (matchEngine != null) matchEngine.MatchCompleted += OnMatchCompleted;
            if (progression != null) progression.ProgressionChanged += OnRuntimeSystemsChanged;
            if (scouting != null) scouting.NetworkChanged += OnRuntimeSystemsChanged;
            if (squad != null) squad.SquadChanged += OnRuntimeSystemsChanged;
            if (saveManager != null) saveManager.CareerChanged += OnCareerChanged;
            if (negotiations != null) negotiations.NegotiationChanged += OnNegotiationChanged;
            bindingsReady = calendar != null || matchEngine != null || progression != null || scouting != null || squad != null;
        }

        private void UnbindEvents()
        {
            if (calendar != null) calendar.CalendarChanged -= OnCalendarChanged;
            if (matchEngine != null) matchEngine.MatchCompleted -= OnMatchCompleted;
            if (progression != null) progression.ProgressionChanged -= OnRuntimeSystemsChanged;
            if (scouting != null) scouting.NetworkChanged -= OnRuntimeSystemsChanged;
            if (squad != null) squad.SquadChanged -= OnRuntimeSystemsChanged;
            if (saveManager != null) saveManager.CareerChanged -= OnCareerChanged;
            if (negotiations != null) negotiations.NegotiationChanged -= OnNegotiationChanged;
            bindingsReady = false;
        }

        private void EnsureLegacySystemsConfigured()
        {
            if (database == null || calendar == null) return;
            if (calendar.Fixtures.Count == 0 && database.leagues.Count > 0)
                calendar.GenerateSeason(database.leagues[0].id, 2026);
        }

        public bool StartNewCareer(string managerName, string clubId)
        {
            ResolveManagers();
            if (database == null || saveManager == null) return false;
            var club = database.FindClub(clubId);
            var league = club == null ? null : database.FindLeague(club.leagueId);
            if (club == null || league == null) return false;

            if (!saveManager.StartCareer(managerName, club.id, club.displayName, league.id, 2026,
                Mathf.Max(0, club.startingBudget), 500000)) return false;

            var roster = database.PlayersForClub(club.id).Select(ToPlayerData).ToList();
            var team = new TeamData { id = club.id, displayName = club.displayName, formation = "4-3-3", players = roster };
            if (ColorUtility.TryParseHtmlString(club.primaryColorHex, out var primary)) team.primaryColor = primary;
            if (squad != null) squad.Initialize(team);
            if (calendar != null)
            {
                calendar.Configure(database);
                var clubIds = database.ClubsForLeague(league.id).Select(item => item.id).ToList();
                calendar.GenerateSeasonFromClubIds(league.id, saveManager.Career.season, clubIds);
                SaveManager.Career.runtime.activeLeagueClubIds = clubIds;
                createdCupRounds.Clear();
                ScheduleCupOpeningRounds();
            }
            // Starting squads receive baseline contracts so wages and expiry rules apply to incumbents too.
            saveManager.Career.currentWeeklyWages = roster.Sum(item => item.overall * 700);
            saveManager.Career.contracts.Clear();
            foreach (var player in roster)
                saveManager.Career.contracts.Add(new CareerContractRecord { playerId = player.id, playerName = player.displayName,
                    weeklyWage = player.overall * 700, remainingYears = 3, signedSeason = saveManager.Career.season, expirySeason = saveManager.Career.season + 3 });
            legacyCareer?.SetTransferBudget(saveManager.Career.transferBudget);
            saveManager.CaptureRuntimeSnapshot(calendar, progression, scouting, squad);
            return true;
        }

        public bool RestoreCareer()
        {
            ResolveManagers();
            if (saveManager == null || !saveManager.HasCareer || database == null) return false;
            restoringState = true;
            try
            {
                var club = database.FindClub(saveManager.Career.clubId);
                if (club != null && squad != null && (squad.CurrentTeam == null || squad.CurrentTeam.id != club.id))
                {
                    var team = new TeamData
                    {
                        id = club.id, displayName = club.displayName, formation = "4-3-3",
                        players = database.PlayersForClub(club.id).Select(ToPlayerData).ToList()
                    };
                    if (ColorUtility.TryParseHtmlString(club.primaryColorHex, out var primary)) team.primaryColor = primary;
                    squad.Initialize(team);
                }
                if (calendar != null && SaveManager.Career.runtime != null &&
                    (SaveManager.Career.runtime.fixtures == null || SaveManager.Career.runtime.fixtures.Count == 0))
                {
                    var clubIds = SaveManager.Career.runtime.activeLeagueClubIds;
                    if (clubIds == null || clubIds.Count < 2)
                        clubIds = database.ClubsForLeague(saveManager.Career.leagueId).Select(item => item.id).ToList();
                    calendar.GenerateSeasonFromClubIds(saveManager.Career.leagueId, saveManager.Career.season, clubIds);
                }
                saveManager.RestoreRuntimeSnapshot(calendar, progression, scouting, squad);
            }
            finally
            {
                restoringState = false;
            }

            createdCupRounds.Clear();
            if (calendar != null && !calendar.Fixtures.Any(item => !item.isLeagueFixture))
                ScheduleCupOpeningRounds();
            TryAdvanceCupRounds();
            legacyCareer?.SetTransferBudget(saveManager.Career.transferBudget);
            UpdateWindowState();
            return true;
        }

        public bool LoadCareer()
        {
            if (saveManager == null || !saveManager.Load()) return false;
            return RestoreCareer();
        }

        public void SaveNow()
        {
            if (saveManager == null || !saveManager.HasCareer) return;
            ResolveManagers();
            saveManager.CaptureRuntimeSnapshot(calendar, progression, scouting, squad);
            legacyCareer?.SetTransferBudget(saveManager.Career.transferBudget);
        }

        public bool StartNextCareerFixture()
        {
            ResolveManagers();
            var game = GameBootstrap.Instance;
            if (!HasActiveCareer || database == null || calendar == null || game == null) return false;
            var fixture = calendar.NextFixtureForClub(saveManager.Career.clubId);
            if (fixture == null) return false;
            var homeClub = database.FindClub(fixture.homeClubId);
            var awayClub = database.FindClub(fixture.awayClubId);
            if (homeClub == null || awayClub == null) return false;

            var homeTeam = BuildTeamData(homeClub);
            var awayTeam = BuildTeamData(awayClub);
            game.ConfigureCareerMatch(homeTeam, awayTeam, saveManager.Career.clubId);
            activePlayableFixture = fixture;
            activeLiveFixtureProcessed = false;

            // Rebuild the arena for the selected fixture so kits, sides, names, and squads are current.
            var previousArena = FindFirstObjectByType<MatchArenaBootstrap>();
            if (previousArena != null) Destroy(previousArena.gameObject);
            new GameObject("AERO Career Match Arena").AddComponent<MatchArenaBootstrap>();
            game.Modes?.OpenKickoff();
            game.Match.StartMatch(new MatchConfig
            {
                homeTeam = homeTeam,
                awayTeam = awayTeam,
                mode = GameMode.Career,
                halfLengthMinutes = 3f
            });
            FindFirstObjectByType<FC2026MobileHub>()?.OpenCareerMatch();
            return true;
        }

        private TeamData BuildTeamData(WorldClubDefinition club)
        {
            var team = new TeamData
            {
                id = club.id,
                displayName = club.displayName,
                formation = "4-3-3",
                players = database.PlayersForClub(club.id).Select(ToPlayerData).ToList()
            };
            if (ColorUtility.TryParseHtmlString(club.primaryColorHex, out var primary)) team.primaryColor = primary;
            if (ColorUtility.TryParseHtmlString(club.secondaryColorHex, out var secondary)) team.secondaryColor = secondary;
            return team;
        }

        public bool SignPlayer(string playerId, int fee, int weeklyWage, int contractYears = 3)
        {
            if (!HasActiveCareer || database == null || squad?.CurrentTeam == null) return false;
            var definition = database.FindPlayer(playerId);
            if (definition == null || squad.CurrentTeam.players.Any(item => item.id == playerId)) return false;
            if (!saveManager.TrySignPlayer(playerId, definition.displayName, fee, weeklyWage, contractYears)) return false;
            squad.CurrentTeam.players.Add(ToPlayerData(definition));
            legacyCareer?.SetTransferBudget(saveManager.Career.transferBudget);
            SaveNow();
            return true;
        }

        public bool SellPlayer(string playerId, int fee, int weeklyWageSaved)
        {
            if (!HasActiveCareer || squad?.CurrentTeam == null) return false;
            var player = squad.CurrentTeam.players.FirstOrDefault(item => item != null && item.id == playerId);
            if (player == null || !saveManager.TrySellPlayer(player.id, player.displayName, fee, weeklyWageSaved)) return false;
            squad.CurrentTeam.players.Remove(player);
            legacyCareer?.SetTransferBudget(saveManager.Career.transferBudget);
            SaveNow();
            return true;
        }

        public bool AssignScout(string playerId, ScoutRegion region, int weeks = 2)
        {
            if (!HasActiveCareer || database == null || scouting == null) return false;
            var definition = database.FindPlayer(playerId);
            if (definition == null) return false;
            var scoutTarget = ToPlayerData(definition);
            bool assigned = scouting.AssignScout(scoutTarget, region, weeks);
            if (assigned) SaveNow();
            return assigned;
        }

        public bool TrainSquad(TrainingFocus focus = TrainingFocus.Balanced, int intensity = 2)
        {
            if (!HasActiveCareer || progression == null || squad?.CurrentTeam == null) return false;
            progression.TrainSquad(squad.CurrentTeam.players, focus, intensity);
            SaveNow();
            return true;
        }

        public bool AdvanceWeek()
        {
            if (!HasActiveCareer || calendar == null || saveManager.Career.managerSacked) return false;
            progression?.AdvanceWeek();
            scouting?.AdvanceWeek();
            UpdateWindowState();
            SaveNow();
            return true;
        }

        public bool EndSeason()
        {
            if (!HasActiveCareer || calendar == null || database == null || calendar.Fixtures.Any(item => !item.isPlayed))
                return false;
            var standings = calendar.Standings;
            int position = standings.ToList().FindIndex(item => item.clubId == saveManager.Career.clubId) + 1;
            if (position < 1) return false;
            var league = database.FindLeague(calendar.LeagueId);
            int upper = league == null ? 0 : database.leagues.Count(item => item.country == league.country && item.tier < league.tier);
            int lower = league == null ? 0 : database.leagues.Count(item => item.country == league.country && item.tier > league.tier);
            saveManager.ApplySeasonOutcome(position, standings.Count, league?.tier ?? 1, upper, lower);

            string nextLeague = calendar.LeagueId;
            if (league != null && position <= 3 && upper > 0)
                nextLeague = database.leagues.Where(item => item.country == league.country && item.tier < league.tier).OrderByDescending(item => item.tier).First().id;
            else if (league != null && position > standings.Count - 3 && lower > 0)
                nextLeague = database.leagues.Where(item => item.country == league.country && item.tier > league.tier).OrderBy(item => item.tier).First().id;

            var nextIds = database.ClubsForLeague(nextLeague).Select(item => item.id).ToList();
            if (nextLeague != calendar.LeagueId && !nextIds.Contains(saveManager.Career.clubId) && nextIds.Count >= 2)
            {
                nextIds[nextIds.Count - 1] = saveManager.Career.clubId;
                saveManager.Career.leagueId = nextLeague;
            }
            saveManager.BeginNextSeason();
            saveManager.Career.runtime.activeLeagueClubIds = nextIds;
            saveManager.Career.runtime.fixtures.Clear();
            saveManager.Career.runtime.standings.Clear();
            calendar.GenerateSeasonFromClubIds(nextLeague, saveManager.Career.season, nextIds);
            createdCupRounds.Clear();
            ScheduleCupOpeningRounds();
            UpdateWindowState();
            SaveNow();
            return true;
        }

        public void OpenCareerScreen()
        {
            var screen = FindFirstObjectByType<CareerModeControlScreen>();
            if (screen == null)
            {
                var screenObject = new GameObject("AERO Career Control Screen");
                DontDestroyOnLoad(screenObject);
                screen = screenObject.AddComponent<CareerModeControlScreen>();
            }
            screen.Configure(this);
            screen.Open();
        }

        private void OnCalendarChanged()
        {
            if (restoringState || !HasActiveCareer) return;
            TryAdvanceCupRounds();
            UpdateWindowState();
            SaveNow();
        }

        private void OnLiveMatchStateChanged(MatchState state)
        {
            if (state != MatchState.FullTime || activePlayableFixture == null || activeLiveFixtureProcessed || liveMatch == null) return;
            activeLiveFixtureProcessed = true;
            var fixture = activePlayableFixture;
            activePlayableFixture = null;

            int homeGoals = liveMatch.HomeScore;
            int awayGoals = liveMatch.AwayScore;
            if (calendar == null || !calendar.RecordResult(fixture.fixtureId, homeGoals, awayGoals))
            {
                Debug.LogWarning("[AERO Career] The live result could not be recorded against its fixture: " + fixture.fixtureId, this);
                SaveNow();
                return;
            }

            string managedId = saveManager.Career.clubId;
            bool managedClubWasHome = fixture.homeClubId == managedId;
            int goalsFor = managedClubWasHome ? homeGoals : awayGoals;
            int goalsAgainst = managedClubWasHome ? awayGoals : homeGoals;
            if (fixture.isLeagueFixture)
                saveManager.RecordMatch(fixture.fixtureId, fixture.competitionId,
                    managedClubWasHome ? fixture.awayClubId : fixture.homeClubId,
                    managedClubWasHome, goalsFor, goalsAgainst, fixture.matchweek);

            var starterIds = new HashSet<string>((squad?.StartingEleven ?? Array.Empty<PlayerData>())
                .Where(player => player != null && !string.IsNullOrWhiteSpace(player.id)).Select(player => player.id));
            bool won = goalsFor > goalsAgainst;
            foreach (var player in squad?.CurrentTeam?.players ?? new List<PlayerData>())
                if (starterIds.Contains(player.id)) progression?.ApplyMatchResult(player, true, won);

            UpdateWindowState();
            SaveNow();
            SimulateRemainingFixtures(fixture.matchweek, fixture.fixtureId);
        }

        private void OnMatchCompleted(SeasonFixture fixture)
        {
            if (fixture == null || !HasActiveCareer || !fixture.isLeagueFixture) { SaveNow(); return; }
            string managedId = saveManager.Career.clubId;
            bool home = fixture.homeClubId == managedId;
            if (!home && fixture.awayClubId != managedId) { SaveNow(); return; }
            // The legacy match simulator is retained for background/AI fixtures only.
            int forGoals = home ? fixture.homeGoals : fixture.awayGoals;
            int againstGoals = home ? fixture.awayGoals : fixture.homeGoals;
            if (!simulatingOtherMatches && saveManager.Career.matchHistory.Any(item => item.fixtureId == fixture.fixtureId))
            {
                SaveNow();
                return;
            }
            saveManager.RecordMatch(fixture.fixtureId, fixture.competitionId, home ? fixture.awayClubId : fixture.homeClubId,
                home, forGoals, againstGoals, fixture.matchweek);
            UpdateWindowState();
            SaveNow();
        }

        private void SimulateRemainingFixtures(int matchweek, string completedFixtureId)
        {
            if (simulatingOtherMatches || matchEngine == null || calendar == null) return;
            simulatingOtherMatches = true;
            try
            {
                var remaining = calendar.FixturesForMatchweek(matchweek)
                    .Where(item => !item.isPlayed && item.fixtureId != completedFixtureId)
                    .OrderBy(item => item.isLeagueFixture ? 0 : 1).ThenBy(item => item.fixtureId).ToList();
                foreach (var fixture in remaining)
                {
                    if (fixture.homeClubId == saveManager.Career.clubId || fixture.awayClubId == saveManager.Career.clubId)
                        continue; // The manager must play each of their own fixtures.
                    if (matchEngine.StartFixture(fixture)) matchEngine.SkipToFullTime();
                }
            }
            finally { simulatingOtherMatches = false; }
            SaveNow();
        }

        private void OnCareerChanged()
        {
            if (HasActiveCareer) legacyCareer?.SetTransferBudget(saveManager.Career.transferBudget);
        }

        private void OnRuntimeSystemsChanged()
        {
            if (!restoringState) SaveNow();
        }
        private void OnNegotiationChanged(NegotiationState state, string message)
        {
            if (state != NegotiationState.Completed || !HasActiveCareer || negotiations?.ActiveListing?.player == null) return;
            var player = negotiations.ActiveListing.player;
            if (!saveManager.Career.contracts.Any(item => item.playerId == player.id))
                saveManager.TrySignPlayer(player.id, player.displayName, negotiations.ActiveOffer.transferFee, negotiations.ActiveOffer.weeklyWage, negotiations.ActiveOffer.contractYears);
            SaveNow();
        }

        private void UpdateWindowState()
        {
            if (!HasActiveCareer || calendar == null) return;
            saveManager.UpdateTransferWindow(calendar.NextFixture?.matchweek ?? calendar.TotalMatchweeks + 1, Math.Max(2, calendar.TotalMatchweeks));
            int rank = calendar.Standings.ToList().FindIndex(item => item.clubId == saveManager.Career.clubId) + 1;
            if (rank > 0) saveManager.SetLeaguePosition(rank);
        }

        private void ScheduleCupOpeningRounds()
        {
            if (database == null || calendar == null || !HasActiveCareer) return;
            foreach (var competition in database.competitions.Where(item => item != null &&
                !string.IsNullOrWhiteSpace(item.id) &&
                !(item.competitionType ?? string.Empty).ToLowerInvariant().Contains("league") &&
                (item.eligibleLeagueIds ?? Array.Empty<string>()).Length > 0))
            {
                string key = competition.id + "-s" + calendar.Season + "-r16";
                if (createdCupRounds.Contains(key) || calendar.Fixtures.Any(item => item.competitionId == competition.id)) continue;
                var eligible = database.clubs.Where(club => (competition.eligibleLeagueIds ?? Array.Empty<string>()).Contains(club.leagueId))
                    .OrderBy(club => StableHash(club.id + calendar.Season + competition.id)).Take(16).ToList();
                if (eligible.Count < 4) continue;
                var fixtures = new List<SeasonFixture>();
                string openingRound = eligible.Count >= 16 ? "Round of 16" : eligible.Count >= 8 ? "Quarter-final" : "Semi-final";
                string roundKey = openingRound.ToLowerInvariant().Replace("-", "").Replace(" ", "");
                int cupWeek = Math.Min(Math.Max(1, calendar.TotalMatchweeks - 2), 6);
                for (int i = 0; i < eligible.Count / 2; i++)
                {
                    var home = eligible[i * 2]; var away = eligible[i * 2 + 1];
                    fixtures.Add(new SeasonFixture { fixtureId = $"cup-{competition.id}-s{calendar.Season}-{roundKey}-{i + 1}",
                        competitionId = competition.id, leagueId = calendar.LeagueId, season = calendar.Season,
                        matchweek = cupWeek, homeClubId = home.id, awayClubId = away.id, isLeagueFixture = false,
                        cupRound = openingRound, cupTieId = $"{competition.id}-s{calendar.Season}-{roundKey}-{i + 1}" });
                }
                calendar.AppendFixtures(fixtures);
                createdCupRounds.Add(key);
            }
        }

        private void TryAdvanceCupRounds()
        {
            if (processingCupRounds || calendar == null) return;
            processingCupRounds = true;
            try
            {
                var cupFixtures = calendar.Fixtures.Where(item => !item.isLeagueFixture).ToList();
                foreach (var group in cupFixtures.GroupBy(item => new { item.competitionId, item.cupRound, item.season }))
                {
                    var ties = group.ToList();
                    if (ties.Count == 0 || ties.Any(item => !item.isPlayed)) continue;
                    string existingNext = group.Key.cupRound == "Round of 16" ? "Quarter-final" :
                        group.Key.cupRound == "Quarter-final" ? "Semi-final" :
                        group.Key.cupRound == "Semi-final" ? "Final" : null;
                    if (existingNext == null) continue;
                    string key = group.Key.competitionId + "-s" + group.Key.season + "-" + existingNext;
                    if (createdCupRounds.Contains(key) || cupFixtures.Any(item => item.competitionId == group.Key.competitionId && item.cupRound == existingNext && item.season == group.Key.season)) continue;
                    var winners = ties.Select(item => ChooseCupWinner(item)).Where(id => !string.IsNullOrWhiteSpace(id)).ToList();
                    if (winners.Count < 2) continue;
                    var nextFixtures = new List<SeasonFixture>();
                    int nextWeek = Math.Min(Math.Max(1, calendar.TotalMatchweeks - 1), ties.Max(item => item.matchweek) + 1);
                    for (int i = 0; i + 1 < winners.Count; i += 2)
                        nextFixtures.Add(new SeasonFixture { fixtureId = $"cup-{group.Key.competitionId}-s{group.Key.season}-{existingNext.ToLowerInvariant().Replace("-", "")}-{i / 2 + 1}",
                            competitionId = group.Key.competitionId, leagueId = calendar.LeagueId, season = group.Key.season, matchweek = nextWeek,
                            homeClubId = winners[i], awayClubId = winners[i + 1], isLeagueFixture = false, cupRound = existingNext,
                            cupTieId = $"{group.Key.competitionId}-{existingNext}-{i / 2 + 1}" });
                    if (nextFixtures.Count > 0) { createdCupRounds.Add(key); calendar.AppendFixtures(nextFixtures); }
                }
            }
            finally { processingCupRounds = false; }
        }

        private string ChooseCupWinner(SeasonFixture tie)
        {
            if (tie.homeGoals > tie.awayGoals) tie.winnerClubId = tie.homeClubId;
            else if (tie.awayGoals > tie.homeGoals) tie.winnerClubId = tie.awayClubId;
            else tie.winnerClubId = StableHash(tie.fixtureId + tie.homeClubId + tie.awayClubId) % 2 == 0 ? tie.homeClubId : tie.awayClubId;
            return tie.winnerClubId;
        }

        private static PlayerData ToPlayerData(WorldPlayerDefinition item)
        {
            Enum.TryParse(item.position, true, out PlayerPosition position);
            return new PlayerData { id = item.id, displayName = item.displayName, position = position,
                isGoalkeeper = position == PlayerPosition.GK, overall = Mathf.Clamp(item.overall, 1, 99), pace = Mathf.Clamp(item.pace, 1, 99),
                shooting = Mathf.Clamp(item.shooting, 1, 99), passing = Mathf.Clamp(item.passing, 1, 99), dribbling = Mathf.Clamp(item.dribbling, 1, 99),
                defending = Mathf.Clamp(item.defending, 1, 99), physicality = Mathf.Clamp(item.physicality, 1, 99) };
        }

        private static int StableHash(string value)
        {
            unchecked { int hash = 23; foreach (char character in value ?? string.Empty) hash = hash * 31 + character; return hash & 0x7fffffff; }
        }
    }
}
