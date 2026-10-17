using UnityEngine;

namespace FC2026.Gameplay
{
    [RequireComponent(typeof(Rigidbody), typeof(CapsuleCollider))]
    public sealed class FootballPlayerController : MonoBehaviour
    {
        [SerializeField] private float moveSpeed = 7.2f;
        [SerializeField] private float sprintSpeed = 9.8f;
        [SerializeField] private float acceleration = 18f;
        [SerializeField] private float rotationSpeed = 12f;
        [SerializeField] private float kickDistance = 2.25f;
        [SerializeField] private float passPower = 6.8f;
        [SerializeField] private float shotPower = 10.2f;

        private Rigidbody body;
        private BallController ball;
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

        public bool IsUserControlled { get; set; } = true;
        public int TeamDirection { get; set; } = 1;
        public static FootballPlayerController ActiveUserPlayer { get; private set; }

        public void SetUserControlled(bool active)
        {
            IsUserControlled = active;
            if (active)
                ActiveUserPlayer = this;
            else if (ActiveUserPlayer == this)
                ActiveUserPlayer = null;
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
            motion = FootballVisualFactory.EnsureAnimatedRig(gameObject, false, styleSeed);
            ball = FindFirstObjectByType<BallController>();
        }

        private void Update()
        {
            if (!IsUserControlled)
                return;

            // The on-screen controls are drawn by MatchManager3D. Clear a held
            // direction as soon as the finger is lifted, including cancelled touches.
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
            if (!IsUserControlled)
                return;

            var move = ReadMove();
            var sprint = ReadSprint();
            var desiredSpeed = sprint ? sprintSpeed : moveSpeed;
            var desired = new Vector3(move.x, 0f, move.y);
            if (desired.sqrMagnitude > 1f)
                desired.Normalize();

            if (desired.sqrMagnitude > 0.01f)
            {
                lastMoveDirection = desired.normalized;
                var targetVelocity = desired * desiredSpeed;
                var currentHorizontal = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
                var changed = Vector3.MoveTowards(currentHorizontal, targetVelocity, acceleration * Time.fixedDeltaTime);
                body.linearVelocity = new Vector3(changed.x, body.linearVelocity.y, changed.z);

                var look = Quaternion.LookRotation(lastMoveDirection, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, look, rotationSpeed * Time.fixedDeltaTime);
            }
            else
            {
                var currentHorizontal = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
                var changed = Vector3.MoveTowards(currentHorizontal, Vector3.zero, acceleration * 0.8f * Time.fixedDeltaTime);
                body.linearVelocity = new Vector3(changed.x, body.linearVelocity.y, changed.z);
            }

            if (tackleQueued)
            {
                tackleQueued = false;
                PerformTackle();
            }

            if (passQueued)
            {
                passQueued = false;
                TryKick(false, false);
            }

            if (throughBallQueued)
            {
                throughBallQueued = false;
                TryKick(false, true);
            }

            if (shootQueued)
            {
                shootQueued = false;
                TryKick(true, false, chipShotQueued, finesseShotQueued);
                chipShotQueued = false;
                finesseShotQueued = false;
            }
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

        public FootballPlayerController SwitchToNearestTeammate()
        {
            var allPlayers = FindObjectsByType<FootballPlayerController>(FindObjectsSortMode.None);
            FootballPlayerController nearest = null;
            var nearestDistance = float.MaxValue;
            foreach (var candidate in allPlayers)
            {
                if (candidate == null || candidate == this || candidate.TeamDirection != TeamDirection || candidate.IsUserControlled)
                    continue;
                if (candidate.GetComponent<SimpleFootballAI>() == null)
                    continue;

                var toBall = candidate.transform.position - (ball != null ? ball.transform.position : transform.position);
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
            enabled = true;

            var newAi = nearest.GetComponent<SimpleFootballAI>();
            if (newAi != null) newAi.enabled = false;
            nearest.SetUserControlled(true);
            return nearest;
        }

        private void PerformTackle()
        {
            motion?.TriggerTackle();
            var direction = lastMoveDirection.sqrMagnitude > 0.01f ? lastMoveDirection : transform.forward;
            body.AddForce(direction.normalized * 1.8f, ForceMode.VelocityChange);
        }

        private void TryKick(bool shot, bool throughBall, bool chip = false, bool finesse = false)
        {
            if (ball == null)
                ball = FindFirstObjectByType<BallController>();

            if (ball == null)
                return;

            var toBall = ball.transform.position - transform.position;
            toBall.y = 0f;
            if (toBall.magnitude > kickDistance)
                return;

            var direction = lastMoveDirection.sqrMagnitude > 0.01f ? lastMoveDirection : transform.forward;
            var localBall = transform.InverseTransformPoint(ball.transform.position);
            var useLeftFoot = localBall.x < 0f;

            if (shot)
            {
                var target = new Vector3(0f, 0.8f, TeamDirection * 52.5f);
                direction = (target - ball.transform.position).normalized;
                if (finesse)
                    direction = (direction + transform.right * (TeamDirection * 0.14f)).normalized;
                motion?.TriggerShot(useLeftFoot);
                ball.Kick(direction, shotPower * (chip ? 0.82f : 1f), chip ? 0.48f : (finesse ? 0.16f : 0.13f), transform);
            }
            else
            {
                motion?.TriggerPass(useLeftFoot);
                var target = FindPassTarget(throughBall);
                if (target != null)
                {
                    var lead = throughBall ? target.GetComponent<Rigidbody>().linearVelocity * 0.45f : Vector3.zero;
                    direction = (target.position + lead - ball.transform.position).normalized;
                }
                ball.Kick(direction, throughBall ? passPower * 1.18f : passPower, throughBall ? 0.19f : 0.045f, transform);
            }
        }

        private Transform FindPassTarget(bool throughBall)
        {
            var allPlayers = FindObjectsByType<FootballPlayerController>(FindObjectsSortMode.None);
            Transform best = null;
            var bestScore = float.MinValue;
            var forward = lastMoveDirection.sqrMagnitude > 0.01f ? lastMoveDirection.normalized : transform.forward;
            foreach (var candidate in allPlayers)
            {
                if (candidate == null || candidate == this || candidate.TeamDirection != TeamDirection || candidate.GetComponent<SimpleFootballAI>() == null)
                    continue;
                var offset = candidate.transform.position - transform.position;
                offset.y = 0f;
                var distance = offset.magnitude;
                if (distance < 3f || distance > (throughBall ? 30f : 24f))
                    continue;
                var forwardAmount = Vector3.Dot(offset.normalized, forward);
                if (forwardAmount < (throughBall ? 0.25f : -0.15f))
                    continue;
                var score = forwardAmount * 12f - distance * 0.16f + (throughBall ? offset.z * TeamDirection * 0.08f : 0f);
                if (score > bestScore)
                {
                    bestScore = score;
                    best = candidate.transform;
                }
            }
            return best;
        }
    }
}
