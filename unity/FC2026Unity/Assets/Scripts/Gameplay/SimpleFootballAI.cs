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

            if (owner != null && owner.TeamDirection != attackDirection &&
                role != PlayerRole.Defender && IsSecondClosestToBall(ballFlat))
            {
                CoverPassingLane(ballFlat);
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

            var pressured = opponentDistance < 3.2f;
            var clearShootingLane = opponentDistance > 2.4f;
            var closeRange = distanceToGoal < 18f;
            var longRangeOpportunity = distanceToGoal < 27f && opponentDistance > 5.5f;
            var shotChance = Mathf.Lerp(0.28f, 0.72f, controller.ShootingStat);
            var passPreference = Mathf.Lerp(0.62f, 0.82f, controller.PassingStat);

            // When a defender is close, prefer releasing the ball instead of
            // taking a rushed shot. Passing skill influences that choice.
            if (pressured && Random.value < passPreference)
            {
                actionTimer = Random.Range(0.35f, 0.65f);
                if (controller.AttemptPass(Random.value < 0.25f))
                    return;
            }

            // Take routine close chances, but only attempt longer shots when
            // there is room and the player's shooting skill supports it.
            if (clearShootingLane &&
                (closeRange || (longRangeOpportunity && Random.value < shotChance)))
            {
                actionTimer = Random.Range(0.45f, 0.8f);
                if (controller.AttemptShot(false, Random.value < 0.22f))
                    return;
            }

            var shouldPass = pressured || distanceToGoal > 34f ||
                             Random.value < Mathf.Lerp(0.22f, 0.42f, controller.PassingStat);
            if (shouldPass)
            {
                actionTimer = Random.Range(0.4f, 0.75f);
                if (controller.AttemptPass(Random.value < 0.24f))
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

            var ballProgress = Mathf.InverseLerp(-48f, 38f, ballFlat.z * attackDirection);
            var runDepth = Mathf.Lerp(0.65f, 1.05f, ballProgress);
            var target = anchor + new Vector3(0f, 0f, attackDirection * push * runDepth);

            // Keep teammates in useful lanes: wide players hold the far side,
            // while central attackers can drift into the channel away from the ball.
            var ballSide = Mathf.Clamp(ballFlat.x / 24f, -1f, 1f);
            var homeSide = Mathf.Abs(anchor.x) > 7f
                ? Mathf.Sign(anchor.x)
                : Mathf.Abs(ballSide) > 0.1f
                    ? -Mathf.Sign(ballSide)
                    : decisionOffset < 5f ? -1f : 1f;
            var laneWidth = role switch
            {
                PlayerRole.Forward => 2f,
                PlayerRole.Midfielder => 3.8f,
                PlayerRole.Defender => 1.4f,
                _ => 0f
            };
            var laneShift = homeSide * Mathf.Abs(ballSide) * laneWidth;
            var ballSupport = role == PlayerRole.Midfielder ? 0.14f : 0.08f;
            target.x = Mathf.Lerp(anchor.x + laneShift, ballFlat.x, ballSupport);
            target.x += Mathf.Sin(Time.time * 0.42f + decisionOffset) *
                        (role == PlayerRole.Midfielder ? 1.8f : 1.2f);

            if (role == PlayerRole.Forward)
                target.z = Mathf.Lerp(target.z, ballFlat.z + attackDirection * 8f, 0.28f);
            else if (role == PlayerRole.Midfielder)
                target.z = Mathf.Lerp(target.z, ballFlat.z + attackDirection * 3.5f, 0.12f);

            target.x = Mathf.Clamp(target.x, -27f, 27f);
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
                {
                    // Stay between the opponent and our own goal instead of
                    // running directly toward the opponent and opening space behind.
                    var goalSideMark = Flat(mark.transform.position) +
                                       new Vector3(0f, 0f, -attackDirection * 2.2f);
                    target = Vector3.Lerp(target, goalSideMark, 0.34f);
                }
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
            // attackDirection points at the opponent goal, so the keeper guards the opposite goal.
            const float pitchHalfLength = 52.5f;
            const float postLimit = 3.66f;
            var goalZ = -attackDirection * pitchHalfLength;
            var goal = new Vector3(0f, 0f, goalZ);
            var ballFlat = Flat(ball.Position);
            var selfFlat = Flat(transform.position);
            var distToBall = Vector3.Distance(selfFlat, ballFlat);
            var distanceToGoal = Mathf.Abs(ball.Position.z - goalZ);

            // Stay between the posts and shift toward the ball while keeping the
            // goalkeeper a little farther off the line when play is nearby.
            var setDepth = Mathf.Lerp(3.3f, 0.8f, Mathf.Clamp01(distanceToGoal / 36f));
            var baseTarget = new Vector3(
                Mathf.Clamp(ball.Position.x * 0.58f, -3.1f, 3.1f),
                0f,
                goalZ + attackDirection * setDepth);

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

            var velocity = ball.Velocity;
            var towardGoalSpeed = -attackDirection * velocity.z;
            var timeToGoalLine = velocity.z == 0f
                ? float.PositiveInfinity
                : (goalZ - ball.Position.z) / velocity.z;
            var isThreateningShot = ball.Owner == null &&
                towardGoalSpeed > 2.5f &&
                timeToGoalLine > 0.05f && timeToGoalLine < 1.85f &&
                distanceToGoal < 18f;

            if (isThreateningShot)
            {
                var predictedX = ball.Position.x + velocity.x * timeToGoalLine;
                var predictedY = ball.Position.y + velocity.y * timeToGoalLine +
                    0.5f * Physics.gravity.y * timeToGoalLine * timeToGoalLine;
                var insideGoalMouth = Mathf.Abs(predictedX) <= postLimit &&
                    predictedY >= 0.12f && predictedY <= 2.55f;

                if (insideGoalMouth)
                {
                    // Move toward the projected crossing point first. This gives
                    // the keeper a chance to make a normal save before diving.
                    var interceptTarget = baseTarget;
                    interceptTarget.x = Mathf.Clamp(predictedX, -3.15f, 3.15f);
                    MoveTowards(interceptTarget, moveSpeed * 1.12f, 28f);

                    var lateralReach = Mathf.Abs(predictedX - transform.position.x);
                    var needsDive = lateralReach > 1.05f && lateralReach < 4.15f;
                    if (needsDive && diveTimer <= 0f && timeToGoalLine < 1.35f)
                    {
                        var side = Mathf.Sign(predictedX - transform.position.x);
                        diveTimer = 1.1f;
                        actionTimer = 0.65f;
                        motion?.TriggerGoalkeeperDive(side);
                        body.AddForce(new Vector3(side * 3.1f, 0f, -attackDirection * 0.45f), ForceMode.VelocityChange);
                    }
                    return;
                }
            }

            MoveTowards(baseTarget, moveSpeed * 0.85f, 20f);
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

        private bool IsSecondClosestToBall(Vector3 ballFlat)
        {
            var myDistance = (Flat(transform.position) - ballFlat).sqrMagnitude;
            var nearestDistance = float.MaxValue;
            var secondNearestDistance = float.MaxValue;

            foreach (var mate in FootballPlayerController.All)
            {
                if (mate == null || mate.TeamDirection != attackDirection || mate.IsGoalkeeper)
                    continue;

                var distance = (Flat(mate.transform.position) - ballFlat).sqrMagnitude;
                if (distance < nearestDistance)
                {
                    secondNearestDistance = nearestDistance;
                    nearestDistance = distance;
                }
                else if (distance < secondNearestDistance)
                {
                    secondNearestDistance = distance;
                }
            }

            return Mathf.Abs(myDistance - secondNearestDistance) < 0.08f;
        }

        private void CoverPassingLane(Vector3 ballFlat)
        {
            var target = new Vector3(
                Mathf.Clamp(Mathf.Lerp(ballFlat.x, 0f, 0.35f), -18f, 18f),
                0f,
                Mathf.Clamp(ballFlat.z - attackDirection * 4.5f, -49f, 49f));
            MoveTowards(AvoidCrowding(target), moveSpeed * 0.9f, 18f);
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
