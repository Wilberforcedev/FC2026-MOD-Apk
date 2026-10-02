using UnityEngine;
using FC2026.Core;

namespace FC2026.Gameplay
{
    public sealed class GoalTrigger : MonoBehaviour
    {
        public bool HomeGoal { get; set; }
        public MatchManager3D Match { get; set; }

        private void OnTriggerEnter(Collider other)
        {
            if (other.GetComponent<BallController>() == null)
                return;

            Match?.RegisterGoal(HomeGoal);
        }
    }
}
