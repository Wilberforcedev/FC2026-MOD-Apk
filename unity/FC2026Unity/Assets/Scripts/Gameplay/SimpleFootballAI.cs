using UnityEngine;

namespace FC2026.Gameplay
{
    [RequireComponent(typeof(Rigidbody), typeof(CapsuleCollider))]
    public sealed class SimpleFootballAI : MonoBehaviour
    {
        [SerializeField] private float moveSpeed = 5.6f;
        [SerializeField] private float engagementRadius = 15f;
        [SerializeField] private float kickDistance = 2.1f;
        [SerializeField] private float kickPower = 7.5f;

        private Rigidbody body;
        private BallController ball;
        private Vector3 anchor;
        private int attackDirection = 1;
        private float decisionOffset;

        public void Configure(Vector3 homePosition, int direction, float speedMultiplier = 1f)
        {
            anchor = homePosition;
            attackDirection = direction >= 0 ? 1 : -1;
            moveSpeed *= Mathf.Clamp(speedMultiplier, 0.82f, 1.18f);
            decisionOffset = Random.Range(0f, 10f);
        }

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
            body.constraints = RigidbodyConstraints.FreezeRotation;
            body.interpolation = RigidbodyInterpolation.Interpolate;
        }

        private void Start()
        {
            ball = FindFirstObjectByType<BallController>();
            if (anchor == Vector3.zero)
                anchor = transform.position;
        }

        private void FixedUpdate()
        {
            if (ball == null)
                return;

            var ballFlat = new Vector3(ball.transform.position.x, 0f, ball.transform.position.z);
            var selfFlat = new Vector3(transform.position.x, 0f, transform.position.z);
            var distToBall = Vector3.Distance(selfFlat, ballFlat);

            Vector3 target;
            if (distToBall <= engagementRadius)
            {
                var laneBias = new Vector3(Mathf.Sin(Time.time * 0.7f + decisionOffset) * 1.4f, 0f, 0f);
                target = ballFlat + laneBias;
            }
            else
            {
                var ballInfluence = new Vector3(ballFlat.x * 0.16f, 0f, ballFlat.z * 0.12f);
                target = anchor + ballInfluence;
            }

            var direction = target - selfFlat;
            direction.y = 0f;
            if (direction.sqrMagnitude > 0.2f)
            {
                direction.Normalize();
                var targetVelocity = direction * moveSpeed;
                var current = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
                var changed = Vector3.MoveTowards(current, targetVelocity, 14f * Time.fixedDeltaTime);
                body.linearVelocity = new Vector3(changed.x, body.linearVelocity.y, changed.z);
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), 8f * Time.fixedDeltaTime);
            }

            if (distToBall <= kickDistance)
            {
                var goalDirection = new Vector3(Random.Range(-0.12f, 0.12f), 0.05f, attackDirection).normalized;
                ball.Kick(goalDirection, kickPower + Random.Range(-0.8f, 1.1f), 0.07f);
            }
        }
    }
}
