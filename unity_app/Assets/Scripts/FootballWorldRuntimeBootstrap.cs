using UnityEngine;

namespace FC2026
{
    /// <summary>Creates the catalog loader before scene objects initialize, so career and catalog screens can resolve it.</summary>
    public static class FootballWorldRuntimeBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void EnsureCatalogLoader()
        {
            if (Object.FindFirstObjectByType<FootballWorldCatalogLoader>() != null) return;
            var root = new GameObject("AERO Soccer 2027 Football World");
            Object.DontDestroyOnLoad(root);
            root.AddComponent<FootballWorldCatalogLoader>();
        }
    }
}