using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    public enum TrainingFocus { Balanced, Pace, Shooting, Passing, Dribbling, Defending, Physicality }

    [Serializable]
    public sealed class PlayerProgressionRecord
    {
        public string playerId;
        [Range(0, 100)] public int form = 50;
        [Range(0, 100)] public int morale = 65;
        [Range(1, 99)] public int potential = 88;
        public float trainingXp;
        public int trainingSessions;
        public int matchesStarted;
        public int matchesWon;
    }

    public sealed class PlayerProgressionManager : MonoBehaviour
    {
        [SerializeField] private List<PlayerProgressionRecord> records = new();
        [SerializeField] private float xpPerAttributePoint = 50f;

        public IReadOnlyList<PlayerProgressionRecord> Records => records;
        public event Action<PlayerData, PlayerProgressionRecord, TrainingFocus> PlayerProgressed;
        public event Action ProgressionChanged;

        public PlayerProgressionRecord GetOrCreate(PlayerData player, int potential = 88)
        {
            if (player == null) return null;
            var record = records.FirstOrDefault(item => item.playerId == player.id);
            if (record != null) return record;
            record = new PlayerProgressionRecord { playerId = player.id, potential = Mathf.Clamp(potential, player.overall, 99) };
            records.Add(record);
            return record;
        }

        public int FormFor(PlayerData player) => GetOrCreate(player)?.form ?? 50;
        public int MoraleFor(PlayerData player) => GetOrCreate(player)?.morale ?? 65;

        public bool TrainPlayer(PlayerData player, TrainingFocus focus, int intensity = 2)
        {
            var record = GetOrCreate(player);
            if (record == null || player.overall >= record.potential) return false;
            intensity = Mathf.Clamp(intensity, 1, 3);
            var xpGain = intensity * 10f + record.morale * .05f;
            record.trainingXp += xpGain;
            record.trainingSessions++;
            record.form = Mathf.Clamp(record.form + intensity, 0, 100);
            record.morale = Mathf.Clamp(record.morale + (intensity == 3 ? -1 : 1), 0, 100);
            while (record.trainingXp >= xpPerAttributePoint && player.overall < record.potential)
            {
                record.trainingXp -= xpPerAttributePoint;
                IncreaseAttribute(player, focus);
                player.overall = Mathf.Clamp(player.overall + 1, 1, record.potential);
            }
            PlayerProgressed?.Invoke(player, record, focus);
            ProgressionChanged?.Invoke();
            return true;
        }

        public void TrainSquad(IEnumerable<PlayerData> players, TrainingFocus focus, int intensity = 2)
        {
            foreach (var player in players ?? Enumerable.Empty<PlayerData>()) TrainPlayer(player, focus, intensity);
        }

        public void ApplyMatchResult(PlayerData player, bool started, bool won)
        {
            var record = GetOrCreate(player);
            if (record == null) return;
            if (started) record.matchesStarted++;
            if (won) { record.matchesWon++; record.form = Mathf.Clamp(record.form + 5, 0, 100); record.morale = Mathf.Clamp(record.morale + 6, 0, 100); }
            else { record.form = Mathf.Clamp(record.form - 2, 0, 100); record.morale = Mathf.Clamp(record.morale - 3, 0, 100); }
            ProgressionChanged?.Invoke();
        }

        public void AdvanceWeek()
        {
            foreach (var record in records)
            {
                record.form = Mathf.RoundToInt(Mathf.MoveTowards(record.form, 50, 4));
                record.morale = Mathf.RoundToInt(Mathf.MoveTowards(record.morale, 65, 3));
            }
            ProgressionChanged?.Invoke();
        }

        private static void IncreaseAttribute(PlayerData player, TrainingFocus focus)
        {
            switch (focus)
            {
                case TrainingFocus.Pace: player.pace = Mathf.Clamp(player.pace + 1, 1, 99); break;
                case TrainingFocus.Shooting: player.shooting = Mathf.Clamp(player.shooting + 1, 1, 99); break;
                case TrainingFocus.Passing: player.passing = Mathf.Clamp(player.passing + 1, 1, 99); break;
                case TrainingFocus.Dribbling: player.dribbling = Mathf.Clamp(player.dribbling + 1, 1, 99); break;
                case TrainingFocus.Defending: player.defending = Mathf.Clamp(player.defending + 1, 1, 99); break;
                case TrainingFocus.Physicality: player.physicality = Mathf.Clamp(player.physicality + 1, 1, 99); break;
                default:
                    player.passing = Mathf.Clamp(player.passing + 1, 1, 99);
                    player.dribbling = Mathf.Clamp(player.dribbling + 1, 1, 99);
                    break;
            }
        }
    }
}
