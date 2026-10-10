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
            var players = Read<PlayerCatalogJson>("players.json");
            var clubs = Read<ClubCatalogJson>("clubs.json");
            var leagues = Read<LeagueCatalogJson>("leagues.json");
            var competitions = Read<CompetitionCatalogJson>("competitions.json");
            var database = AssetDatabase.LoadAssetAtPath<FootballWorldDatabase>(DatabasePath);
            if (database == null)
            {
                database = ScriptableObject.CreateInstance<FootballWorldDatabase>();
                AssetDatabase.CreateAsset(database, DatabasePath);
            }
            database.ReplaceCatalogs(players.players, clubs.clubs, leagues.leagues, competitions.competitions);
            database.databaseVersion = "world-v1";
            database.contentStatus = "Original fictional V1 content";
            EditorUtility.SetDirty(database);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log($"Imported Football World V1: {database.players.Count} players, {database.clubs.Count} clubs, {database.leagues.Count} leagues, {database.competitions.Count} competitions.");
        }

        private static T Read<T>(string fileName)
        {
            var path = Path.Combine(DataRoot, fileName).Replace("\\", "/");
            var asset = AssetDatabase.LoadAssetAtPath<TextAsset>(path);
            if (asset == null) throw new FileNotFoundException($"Missing football world catalog: {path}");
            return JsonUtility.FromJson<T>(asset.text);
        }
    }
}
#endif
