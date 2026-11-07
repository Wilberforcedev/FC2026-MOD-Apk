using System.Collections.Generic;
using UnityEngine;
using FC2026.Core;

namespace FC2026.Gameplay
{
    [RequireComponent(typeof(Rigidbody), typeof(CapsuleCollider))]
    public sealed class FootballPlayerController : MonoBehaviour
    {
        private static readonly List<FootballPlayerController> Registry = new();

        [SerializeField] private float moveSpeed = 7.1f;
        [SerializeField] private float sprintSpeed = 9.7f;
        [SerializeField] private float acceleration = 21f;
        [SerializeField] private float rotationSpeed = 12f;
        [SerializeField] private float controlRadius = 0.95f;
        [SerializeField] private float kickReach = 2.15f;
        [SerializeField] private float staminaDrain = 0.09f;
        [SerializeField] private float staminaRecovery = 0.05f;

        private Rigidbody body;
        private FootballMotionAnimator motion;
        private bool passQueued;
        private bool throughBallQueued;
        private bool shootQueued;
        private bool chipShotQueued;
        private bool finesseShotQueued;
        private bool tackleQueued;
        private Vector3 lastMoveDirection = Vector3.forward;
        private Vector2 mobileMove;
        private bool mobileSprint;
        private float stamina = 1f;
        private float kickLock;
        private float tackleCooldown;
        private float shootingStat = 0.6f;
        private float passingStat = 0.6f;
        private float defendingStat = 0.6f;
        private int skinTone = -1;
        private int hairColor = -1;
        private int faceVariant = -1;
        private int hairStyle = -1;
        private int jerseyNumber;

        public bool IsUserControlled { get; set; } = true;
        public int TeamDirection { get; set; } = 1;
        public int TeamId { get; private set; } = 1;
        public PlayerRole Role { get; private set; } = PlayerRole.Midfielder;
        public Vector3 HomePosition { get; private set; }
        public float Stamina01 => stamina;
        public float ShootingStat => shootingStat;
        public float PassingStat => passingStat;
        public bool IsGoalkeeper => Role == PlayerRole.Goalkeeper;
        public bool HasBall => BallController.Instance != null && BallController.Instance.IsOwnedBy(this);
        public Vector3 LastMoveDirection => lastMoveDirection;
        public Rigidbody Body => body;
        public static FootballPlayerController ActiveUserPlayer { get; private set; }

        public static IReadOnlyList<FootballPlayerController> All => Registry;

        public static FootballPlayerController FindNearestTo(Vector3 position, int teamDirection, bool excludeGoalkeeper = false)
        {
            FootballPlayerController nearest = null;
            var best = float.MaxValue;
            foreach (var candidate in Registry)
            {
                if (candidate == null || candidate.TeamDirection != teamDirection)
                    continue;
                if (excludeGoalkeeper && candidate.IsGoalkeeper)
                    continue;
                var delta = candidate.transform.position - position;
                delta.y = 0f;
                if (delta.sqrMagnitude < best)
                {
                    best = delta.sqrMagnitude;
                    nearest = candidate;
                }
            }
            return nearest;
        }

        public void Configure(PlayerRole role, Vector3 homePosition, int teamDirection, float shooting, float passing,
            int playerSkinTone = -1, int playerHairColor = -1, int playerFaceVariant = -1,
            float defending = 0.6f, int playerHairStyle = -1, int playerJerseyNumber = 0)
        {
            Role = role;
            HomePosition = homePosition;
            TeamDirection = teamDirection >= 0 ? 1 : -1;
            TeamId = TeamDirection;
            shootingStat = Mathf.Clamp01(shooting);
            passingStat = Mathf.Clamp01(passing);
            defendingStat = Mathf.Clamp01(defending);
            skinTone = playerSkinTone;
            hairColor = playerHairColor;
            faceVariant = playerFaceVariant;
            hairStyle = playerHairStyle;
            jerseyNumber = playerJerseyNumber;
            lastMoveDirection = new Vector3(0f, 0f, TeamDirection);
        }

        public void FlipSides()
        {
            TeamDirection = -TeamDirection;
            HomePosition = new Vector3(-HomePosition.x, HomePosition.y, -HomePosition.z);
            lastMoveDirection = new Vector3(0f, 0f, TeamDirection);
        }

        public void SetUserControlled(bool active)
        {
            IsUserControlled = active;
            if (active)
            {
                ActiveUserPlayer = this;
                ClearQueuedActions();
            }
            else if (ActiveUserPlayer == this)
            {
                ActiveUserPlayer = null;
            }
        }

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
            body.constraints = RigidbodyConstraints.FreezeRotation;
            body.interpolation = RigidbodyInterpolation.Interpolate;
        }

        private void OnEnable()
        {
            if (!Registry.Contains(this))
                Registry.Add(this);
        }

        private void OnDisable()
        {
            Registry.Remove(this);
            if (ActiveUserPlayer == this)
                ActiveUserPlayer = null;
        }

        private void Start()
        {
            var styleSeed = (uint)gameObject.name.GetHashCode() / (float)uint.MaxValue;
            motion = FootballVisualFactory.EnsureAnimatedRig(gameObject, IsGoalkeeper, styleSeed,
                false, skinTone, hairColor, faceVariant, hairStyle, jerseyNumber);
        }

        private void Update()
        {
            if (!IsUserControlled || !MatchManager3D.IsLive)
                return;

            if (Application.isMobilePlatform && Input.touchCount == 0)
            {
                mobileMove = Vector2.zero;
                mobileSprint = false;
            }

            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.JoystickButton0))
                shootQueued = true;
            if (Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.JoystickButton2))
                passQueued = true;
            if (Input.GetKeyDown(KeyCode.Q))
                throughBallQueued = true;
            if (Input.GetKeyDown(KeyCode.X) || Input.GetKeyDown(KeyCode.JoystickButton1))
                tackleQueued = true;
            if (Input.GetKeyDown(KeyCode.Tab))
                SwitchToNearestTeammate();
        }

        private void FixedUpdate()
        {
            kickLock = Mathf.Max(0f, kickLock - Time.fixedDeltaTime);
            tackleCooldown = Mathf.Max(0f, tackleCooldown - Time.fixedDeltaTime);

            if (!IsUserControlled)
            {
                var aiSpeed = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z).magnitude;
                UpdateStamina(aiSpeed > moveSpeed * 1.02f, aiSpeed);
                return;
            }

            if (!MatchManager3D.IsLive)
            {
                ClearQueuedActions();
                Decelerate(acceleration);
                return;
            }

            var move = ReadMove();
            var sprinting = ReadSprint() && move.sqrMagnitude > 0.02f && stamina > 0.04f;
            var carryFactor = HasBall ? 0.93f : 1f;
            var fatigueFactor = Mathf.Lerp(0.74f, 1f, stamina);
            var desiredSpeed = (sprinting ? sprintSpeed : moveSpeed) * fatigueFactor * carryFactor;
            var desired = new Vector3(move.x, 0f, move.y);
            if (desired.sqrMagnitude > 1f)
                desired.Normalize();

            var horizontal = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
            if (desired.sqrMagnitude > 0.01f)
            {
                lastMoveDirection = desired.normalized;
                var targetVelocity = desired * desiredSpeed;
                var changed = Vector3.MoveTowards(horizontal, targetVelocity, acceleration * Time.fixedDeltaTime);
                body.linearVelocity = new Vector3(changed.x, body.linearVelocity.y, changed.z);

                var look = Quaternion.LookRotation(lastMoveDirection, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, look, rotationSpeed * Time.fixedDeltaTime);
            }
            else
            {
                Decelerate(acceleration * 0.85f);
            }

            UpdateStamina(sprinting, horizontal.magnitude);

            if (tackleQueued)
            {
                tackleQueued = false;
                AttemptTackle();
            }

            if (passQueued)
            {
                passQueued = false;
                AttemptPass(false);
            }

            if (throughBallQueued)
            {
                throughBallQueued = false;
                AttemptPass(true);
            }

            if (shootQueued)
            {
                shootQueued = false;
                AttemptShot(chipShotQueued, finesseShotQueued);
                chipShotQueued = false;
                finesseShotQueued = false;
            }

            TryClaimLooseBall();
        }

        private void Decelerate(float rate)
        {
            var horizontal = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
            var changed = Vector3.MoveTowards(horizontal, Vector3.zero, rate * Time.fixedDeltaTime);
            body.linearVelocity = new Vector3(changed.x, body.linearVelocity.y, changed.z);
        }

        private void UpdateStamina(bool sprinting, float speed)
        {
            if (sprinting)
                stamina -= staminaDrain * Time.fixedDeltaTime;
            else
                stamina += (speed < 1.2f ? staminaRecovery : staminaRecovery * 0.55f) * Time.fixedDeltaTime;
            stamina = Mathf.Clamp01(stamina);
        }

        private void TryClaimLooseBall()
        {
            var ball = BallController.Instance;
            if (ball == null || !ball.IsFree || kickLock > 0f)
                return;

            var delta = ball.Position - transform.position;
            delta.y = 0f;
            if (delta.sqrMagnitude <= controlRadius * controlRadius)
                ball.Claim(this);
        }

        private Vector2 ReadMove()
        {
            var move = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
            if (Application.isMobilePlatform)
                move = mobileMove;
            return Vector2.ClampMagnitude(move, 1f);
        }

        private bool ReadSprint()
        {
            var keyboardSprint = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift);
            return keyboardSprint || (Application.isMobilePlatform && mobileSprint);
        }

        public void SetMobileMove(Vector2 direction, bool sprint = false)
        {
            mobileMove = Vector2.ClampMagnitude(direction, 1f);
            mobileSprint = sprint;
        }

        public void QueuePass() => passQueued = true;
        public void QueueThroughBall() => throughBallQueued = true;
        public void QueueShot() => shootQueued = true;
        public void QueueChipShot() { chipShotQueued = true; shootQueued = true; }
        public void QueueFinesseShot() { finesseShotQueued = true; shootQueued = true; }
        public void QueueTackle() => tackleQueued = true;

        public void ClearQueuedActions()
        {
            passQueued = false;
            throughBallQueued = false;
            shootQueued = false;
            chipShotQueued = false;
            finesseShotQueued = false;
            tackleQueued = false;
        }

        public FootballPlayerController SwitchToNearestTeammate()
        {
            var ball = BallController.Instance;
            var reference = ball != null ? ball.Position : transform.position;
            FootballPlayerController nearest = null;
            var nearestDistance = float.MaxValue;
            foreach (var candidate in Registry)
            {
                if (candidate == null || candidate == this || candidate.TeamDirection != TeamDirection ||
                    candidate.IsUserControlled || candidate.IsGoalkeeper)
                    continue;

                var toBall = candidate.transform.position - reference;
                toBall.y = 0f;
                if (toBall.sqrMagnitude < nearestDistance)
                {
                    nearestDistance = toBall.sqrMagnitude;
                    nearest = candidate;
                }
            }

            if (nearest == null)
                return this;

            var oldAi = GetComponent<SimpleFootballAI>();
            if (oldAi != null) oldAi.enabled = true;
            SetUserControlled(false);

            var newAi = nearest.GetComponent<SimpleFootballAI>();
            if (newAi != null) newAi.enabled = false;
            nearest.SetUserControlled(true);
            return nearest;
        }

        public bool AttemptTackle()
        {
            if (tackleCooldown > 0f)
                return false;

            tackleCooldown = 0.58f;
            motion?.TriggerTackle();
            var direction = lastMoveDirection.sqrMagnitude > 0.01f ? lastMoveDirection.normalized : transform.forward;
            body.AddForce(direction * 2.1f, ForceMode.VelocityChange);

            var ball = BallController.Instance;
            if (ball == null)
                return false;

            var delta = ball.Position - transform.position;
            delta.y = 0f;
            if (delta.magnitude > 2.05f || ball.Owner == this)
                return false;

            if (ball.Owner == null)
            {
                if (!ball.IsFree)
                    return false;
                ball.Claim(this);
                return true;
            }

            if (ball.Owner.TeamDirection == TeamDirection)
                return false;

            var defenderBonus = Role == PlayerRole.Defender ? 0.12f : Role == PlayerRole.Midfielder ? 0.05f : 0f;
            var skillBonus = (defendingStat - 0.6f) * 0.22f;
            var chance = Mathf.Clamp(Mathf.Lerp(0.36f, 0.78f, stamina) + defenderBonus + skillBonus,
                0.25f, 0.9f);
            if (Random.value > chance)
                return false;

            ball.Steal(this);
            return true;
        }

        public bool AttemptShot(bool chip = false, bool finesse = false)
        {
            var ball = BallController.Instance;
            if (!CanPlayBall(ball) || kickLock > 0f)
                return false;

            var goalZ = TeamDirection * 52.4f;
            var distance = Mathf.Abs(goalZ - ball.Position.z);
            if (distance > 44f)
                return false;

            var targetX = ChooseShotTargetX();
            var flat = new Vector3(targetX - ball.Position.x, 0f, goalZ - ball.Position.z);
            if (flat.sqrMagnitude < 0.01f)
                return false;
            flat.Normalize();

            var accuracy = Mathf.Lerp(0.55f, 0.95f, shootingStat)
                           * Mathf.Clamp01(1.18f - distance * 0.011f)
                           * Mathf.Lerp(0.82f, 1f, stamina);
            var error = (1f - accuracy) * (0.10f + distance * 0.0035f);
            flat = (flat + transform.right * Random.Range(-error, error)).normalized;

            var power = Mathf.Lerp(15.5f, 26.5f, shootingStat) * Mathf.Lerp(0.92f, 1.07f, Mathf.Clamp01(distance / 36f));
            if (chip) power *= 0.72f;
            else if (finesse) power *= 0.95f;

            var lift = chip ? 0.5f : finesse ? 0.11f : Mathf.Clamp(0.085f + distance * 0.0014f, 0.085f, 0.155f);
            var curve = finesse ? Mathf.Sign(targetX - ball.Position.x) * (3.5f + shootingStat * 5.5f) : 0f;

            var useLeftFoot = transform.InverseTransformPoint(ball.Position).x < 0f;
            motion?.TriggerShot(useLeftFoot);
            ball.Kick(flat, power, lift, transform, curve);
            kickLock = 0.32f;
            return true;
        }

        private float ChooseShotTargetX()
        {
            var keeperX = 0f;
            var foundKeeper = false;
            foreach (var candidate in Registry)
            {
                if (candidate == null || candidate.TeamDirection == TeamDirection || !candidate.IsGoalkeeper)
                    continue;
                keeperX = candidate.transform.position.x;
                foundKeeper = true;
                break;
            }

            var side = foundKeeper && Mathf.Abs(keeperX) > 0.2f
                ? -Mathf.Sign(keeperX)
                : Mathf.Sign(transform.position.x);
            if (side == 0f)
                side = Random.value < 0.5f ? -1f : 1f;

            var aimInput = Application.isMobilePlatform ? mobileMove.x : Input.GetAxisRaw("Horizontal");
            return Mathf.Clamp(side * 2.6f + aimInput * 0.85f, -3.3f, 3.3f);
        }

        public bool AttemptPass(bool throughBall)
        {
            var ball = BallController.Instance;
            if (!CanPlayBall(ball) || kickLock > 0f)
                return false;

            var target = FindPassTarget(throughBall);
            if (target == null)
                return false;

            var targetBody = target.Body;
            var flatDistance = Vector2.Distance(new Vector2(ball.Position.x, ball.Position.z),
                new Vector2(target.transform.position.x, target.transform.position.z));
            var speed = Mathf.Clamp(7f + flatDistance * 0.95f, 8.5f, 22f) * Mathf.Lerp(0.9f, 1.05f, passingStat);
            if (throughBall)
                speed *= 1.12f;

            var aimPoint = target.transform.position;
            if (throughBall)
                aimPoint += new Vector3(0f, 0f, TeamDirection * 5.5f);
            if (targetBody != null)
                aimPoint += new Vector3(targetBody.linearVelocity.x, 0f, targetBody.linearVelocity.z) *
                            (throughBall ? 0.55f : Mathf.Clamp01(flatDistance / speed) * 0.85f);

            var flat = new Vector3(aimPoint.x - ball.Position.x, 0f, aimPoint.z - ball.Position.z);
            if (flat.sqrMagnitude < 0.01f)
                return false;
            flat.Normalize();

            var passError = (1f - passingStat) * (throughBall ? 0.045f : 0.03f);
            flat = (flat + transform.right * Random.Range(-passError, passError)).normalized;

            var useLeftFoot = transform.InverseTransformPoint(ball.Position).x < 0f;
            motion?.TriggerPass(useLeftFoot);
            ball.Kick(flat, speed, throughBall ? 0.17f : 0.025f, transform, throughBall ? 1.5f : 0f);
            kickLock = 0.26f;
            return true;
        }

        private FootballPlayerController FindPassTarget(bool throughBall)
        {
            var ball = BallController.Instance;
            var origin = ball != null ? ball.Position : transform.position;
            var forward = lastMoveDirection.sqrMagnitude > 0.01f
                ? lastMoveDirection.normalized
                : new Vector3(0f, 0f, TeamDirection);

            FootballPlayerController best = null;
            var bestScore = float.MinValue;
            var maxRange = throughBall ? 32f : 26f;

            foreach (var candidate in Registry)
            {
                if (candidate == null || candidate == this || candidate.TeamDirection != TeamDirection || candidate.IsGoalkeeper)
                    continue;

                var offset = candidate.transform.position - origin;
                offset.y = 0f;
                var distance = offset.magnitude;
                if (distance < 3.5f || distance > maxRange)
                    continue;
                if (candidate.transform.position.z * TeamDirection < transform.position.z * TeamDirection - 12f)
                    continue;

                var forwardAmount = Vector3.Dot(offset.normalized, forward);
                if (forwardAmount < (throughBall ? 0.2f : -0.25f))
                    continue;

                var openness = NearestOpponentDistance(candidate.transform.position);
                var laneRisk = LaneRisk(origin, candidate.transform.position);
                var score = forwardAmount * 9f + Mathf.Clamp(openness, 0f, 12f) * 0.85f
                            - Mathf.Abs(offset.x) * 0.07f - distance * 0.08f - laneRisk * 7f;

                if (throughBall)
                    score += offset.z * TeamDirection * 0.12f;
                if (candidate.Role == PlayerRole.Forward)
                    score += throughBall ? 3f : 1.2f;

                if (score > bestScore)
                {
                    bestScore = score;
                    best = candidate;
                }
            }

            return best;
        }

        private float NearestOpponentDistance(Vector3 position)
        {
            var nearest = 20f;
            foreach (var candidate in Registry)
            {
                if (candidate == null || candidate.TeamDirection == TeamDirection)
                    continue;
                var delta = candidate.transform.position - position;
                delta.y = 0f;
                nearest = Mathf.Min(nearest, delta.magnitude);
            }
            return nearest;
        }

        private float LaneRisk(Vector3 from, Vector3 to)
        {
            var start = new Vector2(from.x, from.z);
            var end = new Vector2(to.x, to.z);
            var length = Vector2.Distance(start, end);
            if (length < 0.5f)
                return 0f;

            var risk = 0f;
            foreach (var candidate in Registry)
            {
                if (candidate == null || candidate.TeamDirection == TeamDirection)
                    continue;

                var point = new Vector2(candidate.transform.position.x, candidate.transform.position.z);
                var t = Mathf.Clamp01(Vector2.Dot(point - start, end - start) / (length * length));
                var distance = Vector2.Distance(point, Vector2.Lerp(start, end, t));
                if (distance < 2.4f)
                    risk += Mathf.Lerp(1f, 0.25f, t) * (1f - distance / 2.4f);
            }
            return risk;
        }

        private bool CanPlayBall(BallController ball)
        {
            if (ball == null)
                return false;
            if (ball.Owner == this)
                return true;
            if (ball.Owner != null)
                return false;

            var delta = ball.Position - transform.position;
            delta.y = 0f;
            return delta.sqrMagnitude <= kickReach * kickReach;
        }
    }
}
