using UnityEngine;

namespace FC2026
{
    [CreateAssetMenu(fileName = "FC2026UITheme", menuName = "FC 2026/UI Theme")]
    public sealed class FC2026UITheme : ScriptableObject
    {
        [Header("Stadium shell")]
        public Color background = new(0.015f, 0.02f, 0.035f, 1f);
        public Color overlay = new(0.02f, 0.03f, 0.06f, 0.84f);
        public Color panel = new(0.055f, 0.07f, 0.11f, 0.94f);
        public Color panelSoft = new(0.11f, 0.12f, 0.16f, 0.88f);
        public Color divider = new(0.25f, 0.3f, 0.4f, 0.55f);

        [Header("Typography")]
        public Color heading = Color.white;
        public Color body = new(0.88f, 0.9f, 0.94f, 1f);
        public Color muted = new(0.62f, 0.67f, 0.75f, 1f);
        public Color inverse = new(0.015f, 0.02f, 0.035f, 1f);

        [Header("Interaction")]
        public Color focus = new(0.1f, 0.95f, 0.98f, 1f);
        public Color focusSoft = new(0.1f, 0.95f, 0.98f, 0.18f);
        public Color success = new(0.68f, 0.93f, 0.28f, 1f);
        public Color warning = new(1f, 0.68f, 0.2f, 1f);
        public Color danger = new(1f, 0.28f, 0.31f, 1f);
        public Color socialAccent = new(0.95f, 0.25f, 0.68f, 1f);

        [Header("Collectible cards")]
        public Color bronzeCard = new(0.82f, 0.48f, 0.3f, 1f);
        public Color silverCard = new(0.7f, 0.74f, 0.79f, 1f);
        public Color goldCard = new(0.93f, 0.72f, 0.28f, 1f);
        public Color eliteCard = new(0.16f, 0.34f, 0.58f, 1f);

        [Header("Layout tokens")]
        [Min(0)] public float pagePadding = 56f;
        [Min(0)] public float cardGap = 18f;
        [Min(0)] public float panelRadius = 18f;
        [Min(0)] public float focusLineWidth = 3f;

        public Color CardTierColor(int overall)
        {
            if (overall >= 90) return eliteCard;
            if (overall >= 80) return goldCard;
            if (overall >= 70) return silverCard;
            return bronzeCard;
        }
    }
}
