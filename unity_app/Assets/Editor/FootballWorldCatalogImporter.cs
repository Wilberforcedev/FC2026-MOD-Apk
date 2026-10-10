#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEngine;

namespace FC2026.Editor
{
    public static class FootballWorldCatalogImporter
    {
        private const string DataRoot = "Assets/Data/FootballWorld";
        private const string DatabasePath = "Assets/Data/FootballWorld/FootballWorldDatabase.asset";

        [MenuItem("FC 2026/Import Football World V1")]
        public static void Import()
        {
            var bundle = FootballWorldCatalogParser.Parse(
                ReadTextAsset("players.json"),
                ReadTextAsset("clubs.json"),
                ReadTextAsset("leagues.json"),
                ReadTextAsset("competitions.json"));
            if (!bundle.Report.IsValid) { LogAndAbort(bundle.Report); return; }

            var database = AssetDatabase.LoadAssetAtPath<FootballWorldDatabase>(DatabasePath);
            if (database == null)
            {
                database = ScriptableObject.CreateInstance<FootballWorldDatabase>();
                AssetDatabase.CreateAsset(database, DatabasePath);
            }
            database.ReplaceCatalogs(bundle.Players.players, bundle.Clubs.clubs, bundle.Leagues.leagues, bundle.Competitions.competitions);
            database.databaseVersion = "world-v1";
            database.contentStatus = "Original fictional V1 content";
            var validation = database.Validate();
            if (!validation.IsValid) { LogAndAbort(validation); return; }
            EditorUtility.SetDirty(database);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            foreach (var warning in validation.Warnings) Debug.LogWarning($"[Football World] {warning}");
            Debug.Log($"Imported Football World V1: {database.players.Count} players, {database.clubs.Count} clubs, {database.leagues.Count} leagues, {database.competitions.Count} competitions.");
        }

        private static TextAsset ReadTextAsset(string fileName)
        {
            var path = Path.Combine(DataRoot, fileName).Replace("\\", "/");
            var asset = AssetDatabase.LoadAssetAtPath<TextAsset>(path);
            if (asset == null) Debug.LogError($"[Football World] Missing catalog: {path}");
            return asset;
        }

        private static void LogAndAbort(FootballWorldValidationReport report)
        {
            foreach (var error in report.Errors) Debug.LogError($"[Football World] {error}");
            foreach (var warning in report.Warnings) Debug.LogWarning($"[Football World] {warning}");
            Debug.LogError("[Football World] Import aborted; the existing database asset was not replaced.");
        }
    }
}
#endif
