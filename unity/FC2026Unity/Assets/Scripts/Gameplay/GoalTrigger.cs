using UnityEngine;
using FC2026.Core;

namespace FC2026.Gameplay
{
    public sealed class GoalTrigger : MonoBehaviour
    {
        public bool HomeGoal { get; set; }
        public MatchManager3D Match { get; set; }

        private float lastGoalAt = -99f;

        private void OnTriggerEnter(Collider other)
        {
            if (Match == null || !Match.Live || Time.time - lastGoalAt < 2f)
                return;

            var ball = other.GetComponent<BallController>();
            if (ball == null)
                return;

            lastGoalAt = Time.time;
            var scorer = ball.LastKicker;
            if (scorer != null)
            {
                scorer.GetComponent<FootballMotionAnimator>()?.TriggerCelebration();
                FindFirstObjectByType<BroadcastCameraController>()?.FocusCelebration(scorer);
            }

            Match.RegisterGoal(HomeGoal);
        }
    }
}
