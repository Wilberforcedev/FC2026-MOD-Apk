#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEngine;

namespace FC2026.Editor
{
    /// <summary>
    /// Copies canonical JSON catalogs into Resources so they can be loaded on Android at runtime.
    /// Source of truth remains Assets/Data/FootballWorld.
    /// </summary>
    [InitializeOnLoad]
    internal static class FootballWorldResourcesSync
    {
        private const string Source = "Assets/Data/FootballWorld";
        private const string Destination = "Assets/Resources/FootballWorld";
        private static bool syncing;

        static FootballWorldResourcesSync()
        {
            EditorApplication.delayCall += Sync;
        }

        private static void Sync()
        {
            if (syncing || EditorApplication.isCompiling || EditorApplication.isUpdating) return;
            syncing = true;
            try
            {
                if (!Directory.Exists(Source)) return;
                Directory.CreateDirectory(Destination);
                var changed = false;
                foreach (var name in new[] { "players.json", "clubs.json", "leagues.json", "competitions.json" })
                {
                    var from = Path.Combine(Source, name);
                    var to = Path.Combine(Destination, name);
                    if (!File.Exists(from)) continue;
                    if (File.Exists(to) && File.ReadAllText(from) == File.ReadAllText(to)) continue;
                    File.Copy(from, to, true);
                    changed = true;
                }
                if (changed) AssetDatabase.Refresh();
                Debug.Log("[Football World] Resource catalog sync complete. Source: Assets/Data/FootballWorld");
            }
            finally { syncing = false; }
        }
    }
}
#endif