using System.Collections;
using System.Reflection;
using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Bridges the existing prototype match to local career progression without
    /// changing the procedural match scene. Kept small so it can be replaced by
    /// explicit match events when the match manager is refactored.
    /// </summary>
    public sealed class CareerMatchRuntimeInstaller : MonoBehaviour
    {
        private static readonly FieldInfo HomeScoreField =
            typeof(MatchManager3D).GetField("homeScore", BindingFlags.Instance | BindingFlags.NonPublic);
        private static readonly FieldInfo AwayScoreField =
            typeof(MatchManager3D).GetField("awayScore", BindingFlags.Instance | BindingFlags.NonPublic);

        private MatchManager3D match;
        private float elapsed;
        private bool finished;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void InstallMonitor()
        {
            if (Object.FindFirstObjectByType<CareerMatchRuntimeInstaller>() != null)
                return;

            var monitor = new GameObject("FC2026 Career Match Monitor");
            Object.DontDestroyOnLoad(monitor);
            monitor.AddComponent<CareerMatchRuntimeInstaller>();
        }

        private void Update()
        {
            if (match == null)
            {
                match = Object.FindFirstObjectByType<MatchManager3D>();
                if (match == null)
                    return;
            }

            if (finished)
                return;

            elapsed += Time.deltaTime;
            if (elapsed >= 180f)
                StartCoroutine(FinishMatch());
        }

        private IEnumerator FinishMatch()
        {
            finished = true;
            var home = HomeScoreField != null ? (int)HomeScoreField.GetValue(match) : 0;
            var away = AwayScoreField != null ? (int)AwayScoreField.GetValue(match) : 0;
            var save = CareerSaveSystem.Load();

            if (save != null)
            {
                save.played++;
                if (home > away) save.wins++;
                else if (home == away) save.draws++;
                else save.losses++;

                save.matchweek++;
                if (save.matchweek > 38)
                {
                    save.season++;
                    save.matchweek = 1;
                }

                CareerSaveSystem.Save(save);
                var hub = Object.FindFirstObjectByType<CareerHubManager>();
                if (hub != null)
                {
                    var saveField = typeof(CareerHubManager).GetField("save",
                        BindingFlags.Instance | BindingFlags.NonPublic);
                    saveField?.SetValue(hub, save);
                    hub.enabled = true;
                }
            }

            yield return new WaitForSeconds(3f);
            if (match != null)
                Destroy(match.gameObject);
            elapsed = 0f;
            match = null;
            finished = false;
        }
    }
}
