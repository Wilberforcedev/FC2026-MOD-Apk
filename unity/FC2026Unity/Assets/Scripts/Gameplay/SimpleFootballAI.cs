using UnityEngine;
using FC2026.Core;

namespace FC2026.Gameplay
{
    [RequireComponent(typeof(FootballPlayerController))]
    public sealed class SimpleFootballAI : MonoBehaviour
    {
        [SerializeField] private float moveSpeed = 6.9f;
        [SerializeField] private float sprintMultiplier = 1.2f;
        [SerializeField] private float pressSpeedMultiplier = 1.1f;

        private FootballPlayerController controller;
        private FootballMotionAnimator motion;
        private Rigidbody body;
        private Vector3 anchor;
        private int attackDirection = 1;
        private PlayerRole role = PlayerRole.Midfielder;
        private bool goalkeeper;
        private float decisionOffset;
        private float actionTimer;
        private float tackleTimer;
        private float diveTimer;

        public int TeamDirection => attackDirection;

        public void FlipSides()
        {
            attackDirection = -attackDirection;
            anchor = new Vector3(-anchor.x, anchor.y, -anchor.z);
        }

        public void Configure(Vector3 homePosition, int direction, PlayerRole assignedRole, float speedMultiplier = 1f)
        {
            anchor = homePosition;
            attackDirection = direction >= 0 ? 1 : -1;
            role = assignedRole;
            goalkeeper = assignedRole == PlayerRole.Goalkeeper;
            moveSpeed *= Mathf.Clamp(speedMultiplier, 0.82f, 1.18f);
            decisionOffset = Random.Range(0f, 10f);
            actionTimer = Random.Range(0.1f, 0.45f);
        }

        private void Awake()
        {
            controller = GetComponent<FootballPlayerController>();
            body = GetComponent<Rigidbody>();
            body.constraints = RigidbodyConstraints.FreezeRotation;
            body.interpolation = RigidbodyInterpolation.Interpolate;
        }

        private void Start()
        {
            if (anchor == Vector3.zero)
                anchor = transform.position;
            motion = GetComponent<FootballMotionAnimator>();
        }

        private void FixedUpdate()
        {
            var ball = BallController.Instance;
            if (ball == null || controller == null)
                return;

            if (!MatchManager3D.IsLive)
            {
                Brake();
                return;
            }

            if (motion == null)
                motion = GetComponent<FootballMotionAnimator>();

            actionTimer = Mathf.Max(0f, actionTimer - Time.fixedDeltaTime);
            tackleTimer = Mathf.Max(0f, tackleTimer - Time.fixedDeltaTime);
            diveTimer = Mathf.Max(0f, diveTimer - Time.fixedDeltaTime);

            if (goalkeeper)
                UpdateGoalkeeper(ball);
            else
                UpdateOutfield(ball);
        }

        private void UpdateOutfield(BallController ball)
        {
            var self = Flat(transform.position);
            var ballFlat = Flat(ball.Position);
            var distToBall = Vector3.Distance(self, ballFlat);
            var owner = ball.Owner;

            if (owner == controller)
            {
                UpdateOnBall(ball, ballFlat);
                return;
            }

            if (owner != null && owner.TeamDirection == attackDirection)
            {
                UpdateAttackingRun(ballFlat, distToBall);
                return;
            }

            if (IsClosestToBall(ballFlat))
            {
                if (owner == null)
                    ChaseLooseBall(ball, ballFlat, distToBall);
                else
                    PressBall(owner, ballFlat, distToBall);
                return;
            }

            UpdateDefensiveShape(ballFlat);
        }

        private void UpdateOnBall(BallController ball, Vector3 ballFlat)
        {
            var goalZ = attackDirection * 52.5f;
            var distanceToGoal = Mathf.Abs(goalZ - ballFlat.z);
            var opponent = NearestOpponent(ballFlat, out var opponentDistance);

            var goal = new Vector3(0f, 0f, goalZ);
            var toGoal = goal - ballFlat;
            toGoal.y = 0f;
            var direction = toGoal.sqrMagnitude > 0.01f ? toGoal.normalized : new Vector3(0f, 0f, attackDirection);

            if (opponentDistance < 3.4f && opponent != null)
            {
                var away = ballFlat - Flat(opponent.transform.position);
                away.y = 0f;
                if (away.sqrMagnitude > 0.01f)
                    direction = (direction + away.normalized * 1.15f).normalized;
            }

            MoveTowards(AvoidCrowding(ballFlat + direction * 6f), moveSpeed * 0.96f, 20f);

            if (actionTimer > 0f)
                return;

            var pressured = opponentDistance < 2.7f;
            if (distanceToGoal < 23f && (pressured || Random.value < 0.5f))
            {
                actionTimer = Random.Range(0.45f, 0.85f);
                if (controller.AttemptShot(false, Random.value < 0.22f))
                    return;
            }

            if (pressured || distanceToGoal > 36f || Random.value < 0.4f)
            {
                actionTimer = Random.Range(0.4f, 0.8f);
                if (controller.AttemptPass(Random.value < 0.24f))
                    return;
            }

            if (distanceToGoal < 31f)
            {
                actionTimer = Random.Range(0.5f, 0.95f);
                if (controller.AttemptShot(false, Random.value < 0.3f))
                    return;
            }
        }

        private void UpdateAttackingRun(Vector3 ballFlat, float distToBall)
        {
            var push = role switch
            {
                PlayerRole.Forward => 11.5f,
                PlayerRole.Midfielder => 6.5f,
                PlayerRole.Defender => 2.5f,
                _ => 0f
            };

            var target = anchor + new Vector3(0f, 0f, attackDirection * push);
            target.x += Mathf.Sin(Time.time * 0.42f + decisionOffset) * (role == PlayerRole.Midfielder ? 2.6f : 1.4f);
            target.x = Mathf.Lerp(target.x, ballFlat.x, 0.2f);
            target.z = Mathf.Clamp(target.z, -48f, 48f);

            // Leave room for the ball carrier and make a supporting angle.
            if (distToBall < 5f)
            {
                var away = Flat(transform.position) - ballFlat;
                if (away.sqrMagnitude > 0.01f)
                    target += away.normalized * 3f;
            }

            var speed = role == PlayerRole.Forward ? moveSpeed * sprintMultiplier : moveSpeed;
            MoveTowards(AvoidCrowding(target), speed, 18f);
        }

        private void UpdateDefensiveShape(Vector3 ballFlat)
        {
            var target = anchor + (ballFlat - anchor) * 0.16f + new Vector3(0f, 0f, -attackDirection * 6.5f);

            if (role == PlayerRole.Defender)
            {
                var mark = NearestOpponent(anchor, out var markDistance);
                if (mark != null && markDistance < 11f)
                    target = Vector3.Lerp(anchor, Flat(mark.transform.position), 0.45f);
            }

            target.z = Mathf.Clamp(target.z, -49f, 49f);
            target.x = Mathf.Clamp(target.x, -30f, 30f);
            MoveTowards(AvoidCrowding(target), moveSpeed * 0.95f, 18f);
        }

        private void ChaseLooseBall(BallController ball, Vector3 ballFlat, float distToBall)
        {
            var intercept = ballFlat + Flat(ball.Velocity) * 0.2f;
            MoveTowards(intercept, moveSpeed * sprintMultiplier, 21f);

            if (distToBall <= 1.05f && ball.IsFree)
            {
                ball.Claim(controller);
                actionTimer = 0.25f;
            }
        }

        private void PressBall(FootballPlayerController owner, Vector3 ballFlat, float distToBall)
        {
            var target = ballFlat + Flat(owner.Body != null ? owner.Body.linearVelocity : Vector3.zero) * 0.12f;
            MoveTowards(target, moveSpeed * pressSpeedMultiplier, 22f);

            if (distToBall <= 1.9f && tackleTimer <= 0f)
            {
                tackleTimer = 0.65f;
                controller.AttemptTackle();
            }
        }

        private void UpdateGoalkeeper(BallController ball)
        {
            // attackDirection points at the opponent's goal, so the keeper defends the opposite line.
            var goalZ = -attackDirection * 52.5f;
            var goal = new Vector3(0f, 0f, goalZ);
            var ballFlat = Flat(ball.Position);
            var selfFlat = Flat(transform.position);
            var distToBall = Vector3.Distance(selfFlat, ballFlat);

            var goalToBall = ballFlat - goal;
            goalToBall.y = 0f;
            var depth = Mathf.Clamp(goalToBall.magnitude * 0.1f, 0.7f, 4f);
            var baseTarget = goal + (goalToBall.sqrMagnitude > 0.01f ? goalToBall.normalized : Vector3.zero) * depth;
            baseTarget.x = Mathf.Clamp(baseTarget.x, -3.6f, 3.6f);

            if (ball.Owner == controller)
            {
                MoveTowards(baseTarget, moveSpeed * 0.7f, 18f);
                if (actionTimer <= 0f)
                {
                    var clearance = new Vector3(Random.Range(-0.4f, 0.4f), 0f, attackDirection);
                    clearance.Normalize();
                    ball.Kick(clearance, 21f, 0.4f, transform, Random.Range(-2f, 2f));
                    actionTimer = 1.2f;
                }
                return;
            }

            if (distToBall <= 1.9f && actionTimer <= 0f)
            {
                if (ball.IsFree)
                {
                    ball.Claim(controller);
                    actionTimer = 0.5f;
                    return;
                }

                if (ball.Owner != null && ball.Owner.TeamDirection != attackDirection)
                {
                    actionTimer = 0.5f;
                    if (controller.AttemptTackle())
                        return;
                }
            }

            MoveTowards(baseTarget, moveSpeed * 0.85f, 20f);

            var velocity = ball.Velocity;
            var flatVelocity = Flat(velocity);
            var toGoal = goal - ballFlat;
            toGoal.y = 0f;
            if (velocity.magnitude > 7f && goalToBall.magnitude < 12f && flatVelocity.sqrMagnitude > 0.01f &&
                toGoal.sqrMagnitude > 0.01f &&
                Vector3.Dot(flatVelocity.normalized, toGoal.normalized) > 0.5f && diveTimer <= 0f)
            {
                var timeToLine = Mathf.Abs((goalZ - ball.Position.z) / Mathf.Max(0.5f, Mathf.Abs(velocity.z)));
                var predictedX = ball.Position.x + velocity.x * timeToLine;
                if (Mathf.Abs(predictedX) < 4.6f)
                {
                    diveTimer = 1.1f;
                    motion?.TriggerGoalkeeperDive(Mathf.Sign(predictedX - transform.position.x));
                    body.AddForce(new Vector3(Mathf.Sign(predictedX - transform.position.x) * 2.3f, 0f, 0f), ForceMode.VelocityChange);
                }
            }
        }

        private bool IsClosestToBall(Vector3 ballFlat)
        {
            var myDistance = (Flat(transform.position) - ballFlat).sqrMagnitude;
            foreach (var mate in FootballPlayerController.All)
            {
                if (mate == null || mate == controller || mate.TeamDirection != attackDirection || mate.IsGoalkeeper)
                    continue;

                var distance = (Flat(mate.transform.position) - ballFlat).sqrMagnitude;
                if (distance < myDistance - 0.04f)
                    return false;
            }
            return true;
        }

        private FootballPlayerController NearestOpponent(Vector3 position, out float distance)
        {
            FootballPlayerController nearest = null;
            distance = 30f;
            foreach (var candidate in FootballPlayerController.All)
            {
                if (candidate == null || candidate.TeamDirection == attackDirection)
                    continue;

                var delta = Flat(candidate.transform.position) - position;
                var candidateDistance = delta.magnitude;
                if (candidateDistance < distance)
                {
                    distance = candidateDistance;
                    nearest = candidate;
                }
            }
            return nearest;
        }

        private Vector3 AvoidCrowding(Vector3 target)
        {
            var self = Flat(transform.position);
            foreach (var mate in FootballPlayerController.All)
            {
                if (mate == null || mate == controller || mate.TeamDirection != attackDirection || mate.IsGoalkeeper)
                    continue;

                var delta = self - Flat(mate.transform.position);
                var sqr = delta.sqrMagnitude;
                if (sqr > 0.01f && sqr < 6.25f)
                    target += delta / sqr * 1.1f;
            }
            return target;
        }

        private void MoveTowards(Vector3 target, float speed, float acceleration)
        {
            if (body == null)
                return;

            var self = Flat(transform.position);
            var direction = target - self;
            direction.y = 0f;

            if (direction.sqrMagnitude > 0.09f)
            {
                direction.Normalize();
                var targetVelocity = direction * speed;
                var current = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
                var changed = Vector3.MoveTowards(current, targetVelocity, acceleration * Time.fixedDeltaTime);
                body.linearVelocity = new Vector3(changed.x, body.linearVelocity.y, changed.z);
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), 9f * Time.fixedDeltaTime);
            }
            else
            {
                Brake(acceleration);
            }
        }

        private void Brake(float acceleration = 18f)
        {
            if (body == null)
                return;
            var current = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
            var changed = Vector3.MoveTowards(current, Vector3.zero, acceleration * Time.fixedDeltaTime);
            body.linearVelocity = new Vector3(changed.x, body.linearVelocity.y, changed.z);
        }

        private static Vector3 Flat(Vector3 value)
        {
            value.y = 0f;
            return value;
        }
    }
}
