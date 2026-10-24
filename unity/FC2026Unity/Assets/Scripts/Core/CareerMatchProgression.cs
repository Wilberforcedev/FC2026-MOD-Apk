using System.Collections;
using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Runs a short prototype career fixture and records its final score.
    /// A three-minute real-time match represents one complete fixture.
    /// </summary>
    public sealed class CareerMatchProgression : MonoBehaviour
    {
        private const float MatchDurationSeconds = 180f;
        private int homeScore;
        private int awayScore;
        private float elapsed;
        private bool finished;

        public static void RegisterGoal(bool homeGoal)
        {
            var progression = Object.FindFirstObjectByType<CareerMatchProgression>();
            if (progression == null || progression.finished)
                return;

            // The home goal being entered means the away team scored.
            if (homeGoal)
                progression.awayScore++;
            else
                progression.homeScore++;
        }

        private void Update()
        {
            if (finished)
                return;

            elapsed += Time.deltaTime;
            if (elapsed >= MatchDurationSeconds)
                StartCoroutine(FinishMatch());
        }

        private IEnumerator FinishMatch()
        {
            finished = true;
            var finalHomeScore = homeScore;
            var finalAwayScore = awayScore;

            CareerHubManager.CompleteMatch(finalHomeScore, finalAwayScore);
            yield return new WaitForSeconds(3f);
            Destroy(gameObject);
        }
    }
}
