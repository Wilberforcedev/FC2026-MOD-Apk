using UnityEngine;

namespace FC2026
{
    /// <summary>Registers a goal when the ball crosses the end-line trigger.</summary>
    [RequireComponent(typeof(BoxCollider))]
    public sealed class AEROGoalTrigger : MonoBehaviour
    {
        public bool HomeTeamScores { get; set; }
        private bool handlingGoal;

        private void OnTriggerEnter(Collider other)
        {
            if (handlingGoal) return;
            var ball = other.GetComponent<BallController>() ?? other.GetComponentInParent<BallController>();
            var match = GameBootstrap.Instance != null ? GameBootstrap.Instance.Match : FindFirstObjectByType<MatchManager>();
            if (ball == null || match == null || match.State != MatchState.Playing) return;

            handlingGoal = true;
            match.RegisterGoal(HomeTeamScores);
            ball.StopAndPlace(new Vector3(0f, 0.55f, 0f));
            handlingGoal = false;
        }
    }
}