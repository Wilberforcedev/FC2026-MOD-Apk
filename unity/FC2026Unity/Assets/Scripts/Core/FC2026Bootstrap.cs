using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Makes the first Unity prototype self-starting. The Bootstrap scene can stay
    /// almost empty: the 3D match world is created at runtime from deterministic code.
    /// This keeps the initial migration asset-light and fully offline.
    /// </summary>
    public static class FC2026Bootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Boot()
        {
            if (Object.FindFirstObjectByType<MatchManager3D>() != null)
                return;

            var root = new GameObject("FC2026 3D Runtime");
            Object.DontDestroyOnLoad(root);
            root.AddComponent<MatchManager3D>();
        }
    }
}
