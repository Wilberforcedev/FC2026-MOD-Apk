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
    public sealed class CareerModeSave
    {
        public int schemaVersion = 1;
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
                if (loaded == null || loaded.schemaVersion != 1 || string.IsNullOrWhiteSpace(loaded.clubId)) return false;
                EnsureCollections(loaded);
                career = loaded;
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
                File.WriteAllText(temporaryPath, JsonUtility.ToJson(career, true));
                if (File.Exists(SavePath)) File.Delete(SavePath);
                File.Move(temporaryPath, SavePath);
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

        public bool TrySignPlayer(string playerId, string playerName, int transferFee, int weeklyWage)
        {
            if (!HasCareer || string.IsNullOrWhiteSpace(playerId) || string.IsNullOrWhiteSpace(playerName) ||
                transferFee < 0 || weeklyWage < 0 || transferFee > career.transferBudget ||
                career.currentWeeklyWages + weeklyWage > career.weeklyWageBudget) return false;

            career.transferBudget -= transferFee;
            career.currentWeeklyWages += weeklyWage;
            career.transfers.Add(new CareerTransferRecord
            {
                playerId = playerId, playerName = playerName, direction = "IN",
                transferFee = transferFee, weeklyWage = weeklyWage, season = career.season
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

        public void BeginNextSeason()
        {
            if (!HasCareer) return;
            career.season++;
            career.matchweek = 1;
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

        private static void EnsureCollections(CareerModeSave save)
        {
            if (save.objectives == null) save.objectives = new List<CareerObjective>();
            if (save.playerProgress == null) save.playerProgress = new List<CareerPlayerProgress>();
            if (save.transfers == null) save.transfers = new List<CareerTransferRecord>();
            if (save.matchHistory == null) save.matchHistory = new List<CareerMatchRecord>();
        }

        private void NotifyChanged() => CareerChanged?.Invoke();
    }
}
