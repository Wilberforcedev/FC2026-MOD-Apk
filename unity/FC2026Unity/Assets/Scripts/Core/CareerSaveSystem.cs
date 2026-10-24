using System;
using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Minimal, versioned career snapshot for the Unity 3D mobile game.
    /// Keep this data-only so it can be connected to the career hub and season
    /// manager without coupling save files to scene objects.
    /// </summary>
    [Serializable]
    public sealed class CareerSaveData
    {
        public int schemaVersion = CareerSaveSystem.CurrentSchemaVersion;
        public int season = 1;
        public int matchweek = 1;
        public string managedClubId = string.Empty;
        public int transferBudget = 15000000;
        public int played;
        public int wins;
        public int draws;
        public int losses;
    }

    /// <summary>
    /// Local, offline-first career persistence for Android and Editor builds.
    /// Uses PlayerPrefs so the first career implementation needs no scene asset
    /// or network service. Cloud sync can be added behind this API later.
    /// </summary>
    public static class CareerSaveSystem
    {
        public const int CurrentSchemaVersion = 1;
        private const string SaveKey = "fc2026.career.save.v1";

        public static bool Save(CareerSaveData data)
        {
            if (!IsValid(data))
                return false;

            try
            {
                PlayerPrefs.SetString(SaveKey, JsonUtility.ToJson(data));
                PlayerPrefs.Save();
                return true;
            }
            catch (Exception exception)
            {
                Debug.LogWarning($"FC 2026 career save failed: {exception.Message}");
                return false;
            }
        }

        public static CareerSaveData Load()
        {
            if (!PlayerPrefs.HasKey(SaveKey))
                return null;

            try
            {
                var json = PlayerPrefs.GetString(SaveKey, string.Empty);
                if (string.IsNullOrWhiteSpace(json))
                    return null;

                var data = JsonUtility.FromJson<CareerSaveData>(json);
                return IsValid(data) ? data : null;
            }
            catch (Exception exception)
            {
                Debug.LogWarning($"FC 2026 career save could not be loaded: {exception.Message}");
                return null;
            }
        }

        public static void Delete()
        {
            PlayerPrefs.DeleteKey(SaveKey);
            PlayerPrefs.Save();
        }

        private static bool IsValid(CareerSaveData data)
        {
            return data != null
                && data.schemaVersion == CurrentSchemaVersion
                && data.season >= 1
                && data.matchweek >= 1
                && data.transferBudget >= 0
                && data.played >= 0
                && data.wins >= 0
                && data.draws >= 0
                && data.losses >= 0
                && data.wins + data.draws + data.losses <= data.played
                && data.managedClubId != null;
        }
    }
}
