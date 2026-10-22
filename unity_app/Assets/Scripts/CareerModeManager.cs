using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    [Serializable]
    public sealed class CareerObjective
    {
        public string id;
        public string title;
        public string description;
        public int target;
        public int progress;
        public bool completed;
        public int reward;
    }

    [Serializable]
    public sealed class CareerPlayerProgress
    {
        public string playerId;
        public int developmentPoints;
        public int seasonGrowth;
        public int lastKnownOverall;
    }

    [Serializable]
    public sealed class CareerTransferRecord
    {
        public string playerId;
        public string playerName;
        public string direction;
        public int transferFee;
        public int weeklyWage;
        public int season;
    }

    [Serializable]
    public sealed class CareerMatchRecord
    {
        public string fixtureId;
        public string competitionId;
        public string opponentClubId;
        public bool wasHome;
        public int goalsFor;
        public int goalsAgainst;
        public int season;
        public int matchweek;
    }

    [Serializable]
    public sealed class CareerContractRecord
    {
        public string playerId;
        public string playerName;
        public int weeklyWage;
        public int remainingYears = 3;
        public int signedSeason;
        public int expirySeason;
    }

    [Serializable]
    public sealed class CareerPlayerSnapshot
    {
        public string id;
        public string displayName;
        public PlayerPosition position;
        public int overall;
        public int pace;
        public int shooting;
        public int passing;
        public int dribbling;
        public int defending;
        public int physicality;
        public bool isGoalkeeper;
    }

    [Serializable]
    public sealed class CareerRuntimeSnapshot
    {
        public string leagueId;
        public int season;
        public List<SeasonFixture> fixtures = new List<SeasonFixture>();
        public List<ClubSeasonStanding> standings = new List<ClubSeasonStanding>();
        public List<PlayerProgressionRecord> progressionRecords = new List<PlayerProgressionRecord>();
        public List<ScoutAssignment> scoutAssignments = new List<ScoutAssignment>();
        public List<ScoutReport> scoutReports = new List<ScoutReport>();
        public List<CareerPlayerSnapshot> squadPlayers = new List<CareerPlayerSnapshot>();
        public List<string> activeLeagueClubIds = new List<string>();
    }

    [Serializable]
    public sealed class CareerModeSave
    {
        public int schemaVersion = 2;
        public string managerName;
        public string clubId;
        public string clubName;
        public string leagueId;
        public int season = 2026;
        public int matchweek = 1;
        public int managerReputation = 50;
        public int boardConfidence = 70;
        public int transferBudget = 15000000;
        public int weeklyWageBudget = 500000;
        public int currentWeeklyWages;
        public int leaguePoints;
        public int leaguePosition = 20;
        public int wins;
        public int draws;
        public int losses;
        public int goalsFor;
        public int goalsAgainst;
        public int cleanSheets;
        public int matchesPlayed;
        public int totalMatchweeks = 38;
        public bool transferWindowOpen = true;
        public bool managerSacked;
        public string lastSeasonOutcome;
        public int promotionCount;
        public int relegationCount;
        public List<CareerContractRecord> contracts = new List<CareerContractRecord>();
        public CareerRuntimeSnapshot runtime = new CareerRuntimeSnapshot();
        public List<CareerObjective> objectives = new List<CareerObjective>();
        public List<CareerPlayerProgress> playerProgress = new List<CareerPlayerProgress>();
        public List<CareerTransferRecord> transfers = new List<CareerTransferRecord>();
        public List<CareerMatchRecord> matchHistory = new List<CareerMatchRecord>();
    }

    /// <summary>
    /// Saveable career-mode domain service. Connect this component to the career hub,
    /// fixture results, transfer market, board objectives, and training UI.
    /// Uses Unity JsonUtility and Application.persistentDataPath; no external packages.
    /// </summary>
    public sealed class CareerModeManager : MonoBehaviour
    {
        [SerializeField] private string saveFileName = "aero-career-save.json";
        [SerializeField] private CareerModeSave career = new CareerModeSave();

        public CareerModeSave Career => career;
        public event Action CareerChanged;
        private string SavePath => Path.Combine(Application.persistentDataPath, saveFileName);

        public bool HasCareer => career != null && !string.IsNullOrWhiteSpace(career.clubId);
        public bool TransferWindowOpen => HasCareer && career.transferWindowOpen && !career.managerSacked;
        public string SaveLocation => SavePath;

        private void Awake()
        {
            if (File.Exists(SavePath)) Load();
        }

        private void OnApplicationPause(bool paused) { if (paused && HasCareer) Save(); }
        private void OnApplicationQuit() { if (HasCareer) Save(); }

        public bool StartCareer(string managerName, string clubId, string clubName, string leagueId,
            int season = 2026, int startingTransferBudget = 15000000, int weeklyWageBudget = 500000)
        {
            if (string.IsNullOrWhiteSpace(managerName) || string.IsNullOrWhiteSpace(clubId) ||
                string.IsNullOrWhiteSpace(clubName) || string.IsNullOrWhiteSpace(leagueId)) return false;

            career = new CareerModeSave
            {
                managerName = managerName.Trim(),
                clubId = clubId,
                clubName = clubName,
                leagueId = leagueId,
                season = Mathf.Max(1, season),
                transferBudget = Mathf.Max(0, startingTransferBudget),
                weeklyWageBudget = Mathf.Max(0, weeklyWageBudget),
                boardConfidence = 70,
                managerReputation = 50,
                objectives = CreateDefaultObjectives()
            };
            Save();
            NotifyChanged();
            return true;
        }

        public bool Load()
        {
            try
            {
                if (!File.Exists(SavePath)) return false;
                CareerModeSave loaded = JsonUtility.FromJson<CareerModeSave>(File.ReadAllText(SavePath));
                if (loaded == null || loaded.schemaVersion < 1 || loaded.schemaVersion > 2 || string.IsNullOrWhiteSpace(loaded.clubId)) return false;
                bool migrated = loaded.schemaVersion < 2;
                loaded.schemaVersion = 2;
                EnsureCollections(loaded);
                career = loaded;
                if (migrated) Save();
                NotifyChanged();
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError("[AERO Career] Could not load career save: " + ex.Message, this);
                return false;
            }
        }

        public bool Save()
        {
            try
            {
                EnsureCollections(career);
                string directory = Path.GetDirectoryName(SavePath);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                string temporaryPath = SavePath + ".tmp";
                string backupPath = SavePath + ".bak";
                File.WriteAllText(temporaryPath, JsonUtility.ToJson(career, true));
                if (File.Exists(SavePath))
                {
                    if (File.Exists(backupPath)) File.Delete(backupPath);
                    File.Move(SavePath, backupPath);
                }
                try
                {
                    File.Move(temporaryPath, SavePath);
                    if (File.Exists(backupPath)) File.Delete(backupPath);
                }
                catch
                {
                    if (!File.Exists(SavePath) && File.Exists(backupPath)) File.Move(backupPath, SavePath);
                    throw;
                }
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError("[AERO Career] Could not save career: " + ex.Message, this);
                return false;
            }
        }

        public bool RecordMatch(string fixtureId, string competitionId, string opponentClubId, bool home,
            int goalsFor, int goalsAgainst, int matchweek)
        {
            if (!HasCareer || goalsFor < 0 || goalsAgainst < 0 ||
                career.matchHistory.Any(m => m.fixtureId == fixtureId && !string.IsNullOrEmpty(fixtureId))) return false;

            career.matchHistory.Add(new CareerMatchRecord
            {
                fixtureId = fixtureId,
                competitionId = competitionId,
                opponentClubId = opponentClubId,
                wasHome = home,
                goalsFor = goalsFor,
                goalsAgainst = goalsAgainst,
                season = career.season,
                matchweek = Mathf.Max(1, matchweek)
            });
            career.matchesPlayed++;
            career.goalsFor += goalsFor;
            career.goalsAgainst += goalsAgainst;
            if (goalsFor > goalsAgainst) { career.wins++; career.leaguePoints += 3; career.managerReputation = Mathf.Min(100, career.managerReputation + 1); }
            else if (goalsFor == goalsAgainst) { career.draws++; career.leaguePoints++; }
            else { career.losses++; career.boardConfidence = Mathf.Max(0, career.boardConfidence - 2); }
            if (goalsAgainst == 0) career.cleanSheets++;
            career.matchweek = Mathf.Max(career.matchweek, matchweek + 1);
            UpdateObjectiveProgress("league-points", career.leaguePoints);
            UpdateObjectiveProgress("win-matches", career.wins);
            UpdateObjectiveProgress("clean-sheets", career.cleanSheets);
            Save();
            NotifyChanged();
            return true;
        }

        public bool TrySignPlayer(string playerId, string playerName, int transferFee, int weeklyWage, int contractYears = 3)
        {
            if (!HasCareer || !TransferWindowOpen || string.IsNullOrWhiteSpace(playerId) || string.IsNullOrWhiteSpace(playerName) ||
                transferFee < 0 || weeklyWage < 0 || contractYears < 1 || contractYears > 7 ||
                transferFee > career.transferBudget || career.currentWeeklyWages + weeklyWage > career.weeklyWageBudget ||
                career.contracts.Any(contract => contract.playerId == playerId)) return false;

            career.transferBudget -= transferFee;
            career.currentWeeklyWages += weeklyWage;
            career.transfers.Add(new CareerTransferRecord
            {
                playerId = playerId, playerName = playerName, direction = "IN",
                transferFee = transferFee, weeklyWage = weeklyWage, season = career.season
            });
            career.contracts.Add(new CareerContractRecord
            {
                playerId = playerId, playerName = playerName, weeklyWage = weeklyWage,
                remainingYears = contractYears, signedSeason = career.season, expirySeason = career.season + contractYears
            });
            Save();
            NotifyChanged();
            return true;
        }

        public bool TrySellPlayer(string playerId, string playerName, int transferFee, int weeklyWageSaved)
        {
            if (!HasCareer || string.IsNullOrWhiteSpace(playerId) || transferFee < 0 || weeklyWageSaved < 0) return false;
            career.transferBudget = Mathf.Max(0, career.transferBudget + transferFee);
            career.currentWeeklyWages = Mathf.Max(0, career.currentWeeklyWages - weeklyWageSaved);
            career.transfers.Add(new CareerTransferRecord
            {
                playerId = playerId, playerName = playerName, direction = "OUT",
                transferFee = transferFee, weeklyWage = weeklyWageSaved, season = career.season
            });
            career.contracts.RemoveAll(contract => contract.playerId == playerId);
            Save();
            NotifyChanged();
            return true;
        }

        public bool ApplyTraining(string playerId, int currentOverall, int developmentPoints = 1)
        {
            if (!HasCareer || string.IsNullOrWhiteSpace(playerId) || currentOverall < 1 || currentOverall > 99 || developmentPoints <= 0) return false;
            CareerPlayerProgress progress = career.playerProgress.FirstOrDefault(p => p.playerId == playerId);
            if (progress == null)
            {
                progress = new CareerPlayerProgress { playerId = playerId, lastKnownOverall = currentOverall };
                career.playerProgress.Add(progress);
            }
            progress.developmentPoints = Mathf.Min(100, progress.developmentPoints + developmentPoints);
            progress.lastKnownOverall = currentOverall;
            Save();
            NotifyChanged();
            return true;
        }

        public int GetTrainingOverallBonus(string playerId)
        {
            CareerPlayerProgress progress = career.playerProgress.FirstOrDefault(p => p.playerId == playerId);
            return progress == null ? 0 : Mathf.Min(3, progress.developmentPoints / 10);
        }

        public void SetLeaguePosition(int position)
        {
            if (!HasCareer) return;
            career.leaguePosition = Mathf.Max(1, position);
            UpdateObjectiveProgress("top-four", career.leaguePosition <= 4 ? 1 : 0);
            UpdateObjectiveProgress("avoid-relegation", career.leaguePosition <= 17 ? 1 : 0);
            Save();
            NotifyChanged();
        }

        public void UpdateTransferWindow(int currentMatchweek, int totalMatchweeks)
        {
            if (!HasCareer) return;
            totalMatchweeks = Mathf.Max(2, totalMatchweeks);
            currentMatchweek = Mathf.Clamp(currentMatchweek, 1, totalMatchweeks + 1);
            bool open = !career.managerSacked && (currentMatchweek <= 4 ||
                (currentMatchweek >= Mathf.CeilToInt(totalMatchweeks * .48f) && currentMatchweek <= Mathf.CeilToInt(totalMatchweeks * .55f)));
            if (career.matchweek == currentMatchweek && career.totalMatchweeks == totalMatchweeks && career.transferWindowOpen == open) return;
            career.matchweek = currentMatchweek;
            career.totalMatchweeks = totalMatchweeks;
            career.transferWindowOpen = open;
            Save();
            NotifyChanged();
        }

        public void CaptureRuntimeSnapshot(SeasonCalendarManager calendar, PlayerProgressionManager progression,
            ScoutingNetworkManager scouting, SquadManager squad)
        {
            if (!HasCareer || career.runtime == null) return;
            if (calendar != null)
            {
                career.runtime.leagueId = calendar.LeagueId;
                career.runtime.season = calendar.Season;
                career.runtime.fixtures = calendar.Fixtures.Where(item => item != null).Select(CloneFixture).ToList();
                career.runtime.standings = calendar.Standings.Where(item => item != null).Select(CloneStanding).ToList();
                career.runtime.activeLeagueClubIds = calendar.Standings.Select(item => item.clubId).Where(id => !string.IsNullOrWhiteSpace(id)).ToList();
                career.totalMatchweeks = calendar.Fixtures.Count == 0 ? career.totalMatchweeks : calendar.Fixtures.Max(item => item.matchweek);
            }
            if (progression != null) career.runtime.progressionRecords = progression.Records.Select(CloneProgress).ToList();
            if (scouting != null)
            {
                career.runtime.scoutAssignments = scouting.Assignments.Select(CloneAssignment).ToList();
                career.runtime.scoutReports = scouting.Reports.Select(CloneReport).ToList();
            }
            if (squad?.CurrentTeam != null)
            {
                career.runtime.squadPlayers = squad.CurrentTeam.players.Where(item => item != null).Select(item => new CareerPlayerSnapshot
                {
                    id = item.id, displayName = item.displayName, position = item.position, overall = item.overall,
                    pace = item.pace, shooting = item.shooting, passing = item.passing, dribbling = item.dribbling,
                    defending = item.defending, physicality = item.physicality, isGoalkeeper = item.isGoalkeeper
                }).ToList();
            }
            Save();
        }

        public void RestoreRuntimeSnapshot(SeasonCalendarManager calendar, PlayerProgressionManager progression,
            ScoutingNetworkManager scouting, SquadManager squad)
        {
            if (!HasCareer || career.runtime == null) return;
            if (calendar != null && career.runtime.fixtures != null && career.runtime.fixtures.Count > 0)
                calendar.RestoreSnapshot(career.runtime.leagueId, career.runtime.season, career.runtime.fixtures, career.runtime.standings);
            if (progression != null) progression.RestoreRecords(career.runtime.progressionRecords);
            if (scouting != null) scouting.RestoreState(career.runtime.scoutAssignments, career.runtime.scoutReports);
            if (squad?.CurrentTeam != null && career.runtime.squadPlayers != null && career.runtime.squadPlayers.Count > 0)
            {
                squad.CurrentTeam.players.Clear();
                foreach (CareerPlayerSnapshot saved in career.runtime.squadPlayers)
                {
                    if (saved == null || string.IsNullOrWhiteSpace(saved.id)) continue;
                    squad.CurrentTeam.players.Add(new PlayerData { id = saved.id, displayName = saved.displayName, position = saved.position,
                        overall = Mathf.Clamp(saved.overall, 1, 99), pace = Mathf.Clamp(saved.pace, 1, 99), shooting = Mathf.Clamp(saved.shooting, 1, 99),
                        passing = Mathf.Clamp(saved.passing, 1, 99), dribbling = Mathf.Clamp(saved.dribbling, 1, 99), defending = Mathf.Clamp(saved.defending, 1, 99),
                        physicality = Mathf.Clamp(saved.physicality, 1, 99), isGoalkeeper = saved.isGoalkeeper });
                }
                squad.Initialize(squad.CurrentTeam);
            }
            NotifyChanged();
        }

        public void ApplySeasonOutcome(int finalPosition, int leagueSize, int oldTier, int upperTierAvailable, int lowerTierAvailable)
        {
            if (!HasCareer) return;
            career.leaguePosition = Mathf.Clamp(finalPosition, 1, Mathf.Max(1, leagueSize));
            UpdateObjectiveProgress("top-four", career.leaguePosition <= 4 ? 1 : 0);
            UpdateObjectiveProgress("avoid-relegation", career.leaguePosition <= leagueSize - 3 ? 1 : 0);
            if (career.leaguePosition <= 3 && upperTierAvailable > 0) { career.promotionCount++; career.lastSeasonOutcome = "PROMOTED"; }
            else if (career.leaguePosition > Mathf.Max(1, leagueSize - 3) && lowerTierAvailable > 0) { career.relegationCount++; career.lastSeasonOutcome = "RELEGATED"; }
            else career.lastSeasonOutcome = "FINISHED " + career.leaguePosition + " / " + leagueSize;
            if (career.boardConfidence <= 10) career.managerSacked = true;
            Save();
            NotifyChanged();
        }

        public void BeginNextSeason()
        {
            if (!HasCareer) return;
            career.season++;
            career.matchweek = 1;
            career.transferWindowOpen = true;
            career.managerSacked = false;
            foreach (CareerContractRecord contract in career.contracts.ToList())
            {
                contract.remainingYears = Mathf.Max(0, contract.remainingYears - 1);
                if (contract.remainingYears == 0)
                {
                    career.currentWeeklyWages = Mathf.Max(0, career.currentWeeklyWages - contract.weeklyWage);
                    career.contracts.Remove(contract);
                }
                else contract.expirySeason = career.season + contract.remainingYears;
            }
            career.leaguePoints = career.wins = career.draws = career.losses = 0;
            career.goalsFor = career.goalsAgainst = career.cleanSheets = career.matchesPlayed = 0;
            career.leaguePosition = 20;
            career.objectives = CreateDefaultObjectives();
            foreach (CareerPlayerProgress player in career.playerProgress)
            {
                player.seasonGrowth = 0;
                player.developmentPoints = Mathf.Max(0, player.developmentPoints - 5);
            }
            Save();
            NotifyChanged();
        }

        private void UpdateObjectiveProgress(string id, int value)
        {
            CareerObjective objective = career.objectives.FirstOrDefault(o => o.id == id);
            if (objective == null || objective.completed) return;
            objective.progress = Mathf.Clamp(value, 0, objective.target);
            if (objective.progress < objective.target) return;
            objective.completed = true;
            career.transferBudget = Mathf.Max(0, career.transferBudget + objective.reward);
            career.boardConfidence = Mathf.Min(100, career.boardConfidence + 5);
        }

        private static List<CareerObjective> CreateDefaultObjectives() => new List<CareerObjective>
        {
            new CareerObjective { id = "league-points", title = "League consistency", description = "Earn 30 league points.", target = 30, reward = 1000000 },
            new CareerObjective { id = "win-matches", title = "Winning mentality", description = "Win 10 league matches.", target = 10, reward = 750000 },
            new CareerObjective { id = "clean-sheets", title = "Defensive discipline", description = "Keep 8 clean sheets.", target = 8, reward = 500000 },
            new CareerObjective { id = "top-four", title = "Board ambition", description = "Finish in the top four.", target = 1, reward = 2000000 },
            new CareerObjective { id = "avoid-relegation", title = "Stay competitive", description = "Avoid relegation.", target = 1, reward = 1000000 }
        };

        private static SeasonFixture CloneFixture(SeasonFixture item) => new SeasonFixture
        {
            fixtureId = item.fixtureId, competitionId = item.competitionId, leagueId = item.leagueId, season = item.season,
            matchweek = item.matchweek, homeClubId = item.homeClubId, awayClubId = item.awayClubId,
            isPlayed = item.isPlayed, homeGoals = item.homeGoals, awayGoals = item.awayGoals
        };
        private static ClubSeasonStanding CloneStanding(ClubSeasonStanding item) => new ClubSeasonStanding
        {
            clubId = item.clubId, played = item.played, wins = item.wins, draws = item.draws, losses = item.losses,
            goalsFor = item.goalsFor, goalsAgainst = item.goalsAgainst, points = item.points
        };
        private static PlayerProgressionRecord CloneProgress(PlayerProgressionRecord item) => new PlayerProgressionRecord
        {
            playerId = item.playerId, form = item.form, morale = item.morale, potential = item.potential,
            trainingXp = item.trainingXp, trainingSessions = item.trainingSessions, matchesStarted = item.matchesStarted, matchesWon = item.matchesWon
        };
        private static ScoutAssignment CloneAssignment(ScoutAssignment item) => new ScoutAssignment
        { assignmentId = item.assignmentId, playerId = item.playerId, region = item.region, weeksRemaining = item.weeksRemaining, budgetCost = item.budgetCost };
        private static ScoutReport CloneReport(ScoutReport item) => new ScoutReport
        { playerId = item.playerId, region = item.region, confidence = item.confidence, estimatedOverall = item.estimatedOverall,
          estimatedPotential = item.estimatedPotential, estimatedFee = item.estimatedFee, recommendation = item.recommendation, isComplete = item.isComplete };

        private static void EnsureCollections(CareerModeSave save)
        {
            if (save.contracts == null) save.contracts = new List<CareerContractRecord>();
            if (save.runtime == null) save.runtime = new CareerRuntimeSnapshot();
            if (save.runtime.fixtures == null) save.runtime.fixtures = new List<SeasonFixture>();
            if (save.runtime.standings == null) save.runtime.standings = new List<ClubSeasonStanding>();
            if (save.runtime.progressionRecords == null) save.runtime.progressionRecords = new List<PlayerProgressionRecord>();
            if (save.runtime.scoutAssignments == null) save.runtime.scoutAssignments = new List<ScoutAssignment>();
            if (save.runtime.scoutReports == null) save.runtime.scoutReports = new List<ScoutReport>();
            if (save.runtime.squadPlayers == null) save.runtime.squadPlayers = new List<CareerPlayerSnapshot>();
            if (save.runtime.activeLeagueClubIds == null) save.runtime.activeLeagueClubIds = new List<string>();
            if (save.objectives == null) save.objectives = new List<CareerObjective>();
            if (save.playerProgress == null) save.playerProgress = new List<CareerPlayerProgress>();
            if (save.transfers == null) save.transfers = new List<CareerTransferRecord>();
            if (save.matchHistory == null) save.matchHistory = new List<CareerMatchRecord>();
        }

        private void NotifyChanged() => CareerChanged?.Invoke();
    }
}
