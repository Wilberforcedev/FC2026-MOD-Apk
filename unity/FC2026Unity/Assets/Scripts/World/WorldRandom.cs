using System;

namespace FC2026.World
{
    /// <summary>
    /// Small xorshift generator so the world is identical on every device and
    /// does not depend on the runtime's System.Random implementation.
    /// </summary>
    public sealed class DeterministicRandom
    {
        private uint state;

        public DeterministicRandom(uint seed)
        {
            state = seed == 0 ? 0x9E3779B9u : seed;
        }

        public uint NextUInt()
        {
            var value = state;
            value ^= value << 13;
            value ^= value >> 17;
            value ^= value << 5;
            state = value;
            return value;
        }

        public int Range(int minInclusive, int maxExclusive)
        {
            if (maxExclusive <= minInclusive)
                return minInclusive;
            return minInclusive + (int)(NextUInt() % (uint)(maxExclusive - minInclusive));
        }

        public float Value01 => (NextUInt() & 0xFFFFFFu) / 16777216f;

        public T Pick<T>(T[] values)
        {
            return values[Range(0, values.Length)];
        }
    }

    public static class WorldHash
    {
        public static uint Combine(string value, uint salt = 2166136261u)
        {
            unchecked
            {
                var hash = 2166136261u ^ salt;
                if (value != null)
                {
                    for (var i = 0; i < value.Length; i++)
                    {
                        hash ^= value[i];
                        hash *= 16777619u;
                    }
                }
                return hash;
            }
        }

        public static int Index(string value, int count)
        {
            return count <= 0 ? 0 : (int)(Combine(value) % (uint)count);
        }
    }
}
