namespace FC2026.Gameplay
{
    /// <summary>
    /// Carries a generated player's match attributes and appearance as one profile.
    /// </summary>
    public readonly struct PlayerMatchProfile
    {
        public float HeightScale { get; }
        public float WidthScale { get; }
        public float Shooting { get; }
        public float Passing { get; }
        public float Defending { get; }
        public float Pace { get; }
        public float Physical { get; }
        public int SkinTone { get; }
        public int HairColor { get; }
        public int FaceVariant { get; }
        public bool LeftFooted { get; }

        public PlayerMatchProfile(
            float heightScale,
            float widthScale,
            float shooting,
            float passing,
            float defending,
            float pace,
            float physical,
            int skinTone,
            int hairColor,
            int faceVariant,
            bool leftFooted)
        {
            HeightScale = heightScale;
            WidthScale = widthScale;
            Shooting = shooting;
            Passing = passing;
            Defending = defending;
            Pace = pace;
            Physical = physical;
            SkinTone = skinTone;
            HairColor = hairColor;
            FaceVariant = faceVariant;
            LeftFooted = leftFooted;
        }
    }
}
