using System;

namespace FC2026.World
{
    /// <summary>
    /// Deterministic scoreline model for AI fixtures. Expected goals come from
    /// squad strength plus home advantage, then goals are Poisson sampled from
    /// the same xorshift stream used to build the world.
    /// </summary>
    public static class WorldSimulation
    {
        private const int MaxGoals = 7;
        private const float HomeAttackBonus = 3f;
        private const float BaseHomeGoals = 1.32f;
        private const float BaseAwayGoals = 1.08f;
        private const float HomeStrengthWeight = 0.045f;
        private const float AwayStrengthWeight = 0.038f;

        public static WorldScoreline Simulate(WorldClub home, WorldClub away, int seed)
        {
            if (home == null || away == null)
                return new WorldScoreline(0, 0);

            var strengthGap = home.Strength + HomeAttackBonus - away.Strength;
            var homeExpected = Clamp(BaseHomeGoals + strengthGap * HomeStrengthWeight, 0.15f, 4.2f);
            var awayExpected = Clamp(BaseAwayGoals - strengthGap * AwayStrengthWeight, 0.15f, 4.2f);

            var fixtureSeed = unchecked((uint)seed
                ^ WorldHash.Combine(home.Id)
                ^ (WorldHash.Combine(away.Id) * 2654435761u));
            var random = new DeterministicRandom(fixtureSeed);
            return new WorldScoreline(SamplePoisson(homeExpected, random), SamplePoisson(awayExpected, random));
        }

        private static int SamplePoisson(float lambda, DeterministicRandom random)
        {
            var limit = Math.Exp(-lambda);
            var product = 1f;
            var goals = 0;
            do
            {
                goals++;
                product *= random.Value01;
            }
            while (product > limit && goals <= MaxGoals);
            return goals - 1;
        }

        private static float Clamp(float value, float minimum, float maximum)
        {
            return value < minimum ? minimum : value > maximum ? maximum : value;
        }
    }
}
