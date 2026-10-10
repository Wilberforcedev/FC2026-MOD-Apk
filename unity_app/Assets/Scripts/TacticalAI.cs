using UnityEngine;

namespace FC2026
{
    public sealed class TacticalAI : MonoBehaviour
    {
        [SerializeField] private float positionResponse = 4f;
        [SerializeField] private float pressDistance = 8f;
        [SerializeField] private FootballerController footballer;
        private BallController ball;
        private Vector3 homePosition;
        private Transform opponent;

        public void Initialize(BallController matchBall, Vector3 formationPosition, Transform nearestOpponent = null)
        {
            ball = matchBall;
            homePosition = formationPosition;
            opponent = nearestOpponent;
        }

        private void Update()
        {
            if (ball == null || footballer == null) return;
            var ballOffset = ball.transform.position - homePosition;
            ballOffset.y = 0f;
            var tacticalTarget = homePosition + Vector3.ClampMagnitude(ballOffset * 0.18f, 4.5f);
            if (opponent != null && Vector3.Distance(transform.position, ball.transform.position) < pressDistance)
                tacticalTarget = Vector3.Lerp(tacticalTarget, opponent.position, 0.22f);
            var direction = tacticalTarget - transform.position;
            direction.y = 0f;
            if (direction.sqrMagnitude > 0.5f) transform.position = Vector3.MoveTowards(transform.position, tacticalTarget, positionResponse * Time.deltaTime);
        }
    }
}
