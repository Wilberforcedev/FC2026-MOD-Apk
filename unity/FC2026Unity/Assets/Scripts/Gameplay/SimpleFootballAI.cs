using System.Collections.Generic;
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

        private readonly List<SimpleFootballAI> teammates = new();

        private Rigidbody body;
        private BallController ball;
        private FootballMotionAnimator motion;
        private Vector3 anchor;
        private int attackDirection = 1;
        private float decisionOffset;
        private float kickCooldown;
        private float tackleCooldown;
        private float diveCooldown;
        private bool goalkeeper;

        public int TeamDirection => attackDirection;

        public void Configure(Vector3 homePosition, int direction, float speedMultiplier = 1f, bool isGoalkeeper = false)
        {
            anchor = homePosition;
            attackDirection = direction >= 0 ? 1 : -1;
            goalkeeper = isGoalkeeper;
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
            var styleSeed = (uint)gameObject.name.GetHashCode() / (float)uint.MaxValue;
            motion = FootballVisualFactory.EnsureAnimatedRig(gameObject, goalkeeper, styleSeed);
            ball = FindFirstObjectByType<BallController>();
            if (anchor == Vector3.zero)
                anchor = transform.position;

            var allPlayers = FindObjectsByType<SimpleFootballAI>(FindObjectsSortMode.None);
            foreach (var candidate in allPlayers)
            {
                if (candidate != null && candidate.attackDirection == attackDirection && !candidate.goalkeeper)
                    teammates.Add(candidate);
            }
        }

        private void FixedUpdate()
        {
            if (ball == null)
                return;

            kickCooldown = Mathf.Max(0f, kickCooldown - Time.fixedDeltaTime);
            tackleCooldown = Mathf.Max(0f, tackleCooldown - Time.fixedDeltaTime);
            diveCooldown = Mathf.Max(0f, diveCooldown - Time.fixedDeltaTime);

            if (goalkeeper)
            {
                UpdateGoalkeeper();
                return;
            }

            UpdateOutfieldPlayer();
        }

        private void UpdateOutfieldPlayer()
        {
            var ballFlat = new Vector3(ball.transform.position.x, 0f, ball.transform.position.z);
            var selfFlat = new Vector3(transform.position.x, 0f, transform.position.z);
            var distToBall = Vector3.Distance(selfFlat, ballFlat);
            var teamHasBall = HasTeamPossession();
            var isClosestPressingPlayer = IsClosestTeammateToBall();

            Vector3 target;
            if (teamHasBall && ball.LastKicker == transform)
            {
                // The player who last played the ball carries play forward while staying close enough to recover it.
                target = ballFlat + Vector3.forward * (attackDirection * 1.8f);
            }
            else if (!teamHasBall && isClosestPressingPlayer)
            {
                // Only the nearest outfield teammate presses. Others keep their shape instead of forming a swarm.
                var laneBias = new Vector3(Mathf.Sin(Time.time * 0.7f + decisionOffset) * 0.65f, 0f, 0f);
                target = ballFlat + laneBias;
            }
            else
            {
                var ballInfluence = new Vector3(ballFlat.x * 0.12f, 0f, ballFlat.z * 0.09f);
                var attackingRun = teamHasBall ? attackDirection * 5f : 0f;
                target = anchor + ballInfluence + Vector3.forward * attackingRun;
            }

            MoveTowards(target, moveSpeed, 14f);

            if (!teamHasBall && distToBall <= 3.1f && tackleCooldown <= 0f && ball.LastKicker != transform && Random.value < 0.018f)
            {
                tackleCooldown = 1.2f;
                motion?.TriggerTackle();
            }

            if (distToBall > kickDistance || kickCooldown > 0f)
                return;

            kickCooldown = Random.Range(0.65f, 1.0f);
            var goalZ = attackDirection * 52.5f;
            var distanceToGoal = Mathf.Abs(goalZ - transform.position.z);
            var shooting = distanceToGoal < 25f || (distanceToGoal < 38f && Random.value < 0.12f);

            if (shooting)
            {
                var goalDirection = new Vector3(Random.Range(-0.08f, 0.08f), 0.07f, attackDirection).normalized;
                motion?.TriggerShot(Random.value < 0.18f);
                ball.Kick(goalDirection, kickPower + Random.Range(0.6f, 2.2f), 0.10f, transform);
                return;
            }

            var passTarget = FindForwardPassTarget();
            var passDirection = passTarget != null
                ? (passTarget.position - transform.position + Vector3.up * 1.1f).normalized
                : new Vector3(Random.Range(-0.12f, 0.12f), 0.045f, attackDirection).normalized;
            motion?.TriggerPass(Random.value < 0.18f);
            ball.Kick(passDirection, kickPower - 1.2f + Random.Range(-0.4f, 0.7f), 0.035f, transform);
        }

        private bool HasTeamPossession()
        {
            var lastKicker = ball != null ? ball.LastKicker : null;
            if (lastKicker == null)
                return false;

            var ai = lastKicker.GetComponent<SimpleFootballAI>();
            if (ai != null)
                return ai.TeamDirection == attackDirection;

            var user = lastKicker.GetComponent<FootballPlayerController>();
            return user != null && user.TeamDirection == attackDirection;
        }

        private bool IsClosestTeammateToBall()
        {
            var closest = this;
            var closestDistance = float.MaxValue;

            foreach (var teammate in teammates)
            {
                if (teammate == null || teammate.goalkeeper)
                    continue;

                var distance = (teammate.transform.position - ball.transform.position).sqrMagnitude;
                if (distance < closestDistance)
                {
                    closestDistance = distance;
                    closest = teammate;
                }
            }

            return closest == this;
        }

        private Transform FindForwardPassTarget()
        {
            Transform bestTarget = null;
            var bestScore = float.MinValue;
            var ownProgress = transform.position.z * attackDirection;

            foreach (var teammate in teammates)
            {
                if (teammate == null || teammate == this || teammate.goalkeeper)
                    continue;

                var offset = teammate.transform.position - transform.position;
                var distance = offset.magnitude;
                var forwardProgress = offset.z * attackDirection;

                if (distance < 4f || distance > 24f || forwardProgress < -2f)
                    continue;

                var score = forwardProgress * 1.6f - Mathf.Abs(offset.x) * 0.22f - distance * 0.12f;
                if (teammate.transform.position.z * attackDirection <= ownProgress - 2f)
                    score -= 4f;

                if (score > bestScore)
                {
                    bestScore = score;
                    bestTarget = teammate.transform;
                }
            }

            return bestTarget;
        }

        private void UpdateGoalkeeper()
        {
            var self = new Vector3(transform.position.x, 0f, transform.position.z);
            var ballFlat = new Vector3(ball.transform.position.x, 0f, ball.transform.position.z);
            var distToBall = Vector3.Distance(self, ballFlat);
            var trackingX = Mathf.Clamp(ballFlat.x, anchor.x - 4.4f, anchor.x + 4.4f);
            var targetZ = anchor.z + attackDirection * (distToBall < 15f ? 2.8f : 1.1f);
            var target = new Vector3(trackingX, 0f, targetZ);

            MoveTowards(target, moveSpeed * 0.82f, 18f);

            var ballSpeed = ball.Body.linearVelocity.magnitude;
            if (distToBall < 8.5f && ballSpeed > 4.2f && diveCooldown <= 0f)
            {
                var side = Mathf.Sign(ballFlat.x - self.x);
                if (Mathf.Abs(ballFlat.x - self.x) > 0.65f)
                {
                    diveCooldown = 0.95f;
                    motion?.TriggerGoalkeeperDive(side);
                    body.AddForce(new Vector3(side * 1.7f, 0f, 0f), ForceMode.VelocityChange);
                }
            }

            if (distToBall <= 1.85f && kickCooldown <= 0f)
            {
                kickCooldown = 1.1f;
                var clearance = new Vector3(Random.Range(-0.16f, 0.16f), 0.07f, attackDirection).normalized;
                motion?.TriggerPass(false);
                ball.Kick(clearance, 8.2f, 0.12f, transform);
            }
        }

        private void MoveTowards(Vector3 target, float speed, float acceleration)
        {
            var selfFlat = new Vector3(transform.position.x, 0f, transform.position.z);
            var direction = target - selfFlat;
            direction.y = 0f;

            if (direction.sqrMagnitude > 0.12f)
            {
                direction.Normalize();
                var targetVelocity = direction * speed;
                var current = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
                var changed = Vector3.MoveTowards(current, targetVelocity, acceleration * Time.fixedDeltaTime);
                body.linearVelocity = new Vector3(changed.x, body.linearVelocity.y, changed.z);
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), 8f * Time.fixedDeltaTime);
            }
            else
            {
                var current = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
                var changed = Vector3.MoveTowards(current, Vector3.zero, acceleration * Time.fixedDeltaTime);
                body.linearVelocity = new Vector3(changed.x, body.linearVelocity.y, changed.z);
            }
        }
    }
}
