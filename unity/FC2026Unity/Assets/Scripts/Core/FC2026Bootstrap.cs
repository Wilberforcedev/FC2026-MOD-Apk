using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Starts the career hub in the lightweight Bootstrap scene. The hub can
    /// launch the procedural 3D match when the player chooses to play.
    /// </summary>
    public static class FC2026Bootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Boot()
        {
            if (Object.FindFirstObjectByType<CareerHubManager>() != null ||
                Object.FindFirstObjectByType<MatchManager3D>() != null)
                return;

            var root = new GameObject("FC2026 3D Runtime");
            Object.DontDestroyOnLoad(root);
            root.AddComponent<CareerHubManager>();
        }
    }
}
