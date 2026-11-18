using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Small local kit preferences for the managed club. The default palette
    /// always follows the club colours; alternate palettes are saved by club.
    /// </summary>
    public static class CareerKitSystem
    {
        private static readonly Color[] Primary =
        {
            Color.clear,
            new Color32(0x11, 0xA9, 0xD8, 0xFF),
            new Color32(0x17, 0x35, 0x71, 0xFF),
            new Color32(0x72, 0x38, 0xB8, 0xFF),
            new Color32(0x13, 0x8B, 0x69, 0xFF),
            new Color32(0xEE, 0x70, 0x25, 0xFF)
        };

        private static readonly Color[] Secondary =
        {
            Color.clear,
            new Color32(0x08, 0x2E, 0x53, 0xFF),
            new Color32(0xF4, 0xF7, 0xFC, 0xFF),
            new Color32(0xF5, 0xD5, 0xFF, 0xFF),
            new Color32(0xE8, 0xF7, 0xF0, 0xFF),
            new Color32(0x16, 0x25, 0x39, 0xFF)
        };

        public static readonly string[] PresetNames =
        {
            "CLUB COLORS", "CYAN NIGHT", "AWAY WHITE", "VIOLET", "EMERALD", "SUNSET"
        };

        public static readonly string[] SlotNames = { "HOME", "AWAY", "THIRD", "GOALKEEPER" };

        public static int GetPreset(string clubId, int slot)
        {
            if (string.IsNullOrEmpty(clubId))
                return 0;
            return Mathf.Clamp(PlayerPrefs.GetInt(Key(clubId, slot), 0), 0, PresetNames.Length - 1);
        }

        public static int GetActiveMatchSlot(string clubId)
        {
            if (string.IsNullOrEmpty(clubId))
                return 0;
            return Mathf.Clamp(PlayerPrefs.GetInt($"FC2026.Kit.Active.{clubId}", 0), 0, 2);
        }

        public static void SetActiveMatchSlot(string clubId, int slot)
        {
            if (string.IsNullOrEmpty(clubId))
                return;
            PlayerPrefs.SetInt($"FC2026.Kit.Active.{clubId}", Mathf.Clamp(slot, 0, 2));
            PlayerPrefs.Save();
        }

        public static void SetPreset(string clubId, int slot, int preset)
        {
            if (string.IsNullOrEmpty(clubId))
                return;
            PlayerPrefs.SetInt(Key(clubId, slot), Mathf.Clamp(preset, 0, PresetNames.Length - 1));
            PlayerPrefs.Save();
        }

        public static Color GetPrimary(string clubId, int slot, Color fallback)
        {
            var preset = GetPreset(clubId, slot);
            return preset == 0 ? fallback : Primary[preset];
        }

        public static Color GetSecondary(string clubId, int slot, Color fallback)
        {
            var preset = GetPreset(clubId, slot);
            return preset == 0 ? fallback : Secondary[preset];
        }

        public static Color PreviewPrimary(int preset, Color fallback)
        {
            preset = Mathf.Clamp(preset, 0, PresetNames.Length - 1);
            return preset == 0 ? fallback : Primary[preset];
        }

        public static Color PreviewSecondary(int preset, Color fallback)
        {
            preset = Mathf.Clamp(preset, 0, PresetNames.Length - 1);
            return preset == 0 ? fallback : Secondary[preset];
        }

        private static string Key(string clubId, int slot) => $"FC2026.Kit.{clubId}.{slot}";
    }
}
