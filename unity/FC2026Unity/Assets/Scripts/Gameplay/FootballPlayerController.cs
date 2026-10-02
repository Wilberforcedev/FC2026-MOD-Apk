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
        private Vector2 touchOrigin;
        private bool leftTouchActive;
        private float mobileSprintAmount;
        private bool passQueued;
        private bool shootQueued;
        private bool tackleQueued;
        private Vector3 lastMoveDirection = Vector3.forward;

        public bool IsUserControlled { get; set; } = true;

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

            ReadMobileTouches();

            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.JoystickButton0))
                shootQueued = true;
            if (Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.JoystickButton2))
                passQueued = true;
            if (Input.GetKeyDown(KeyCode.X) || Input.GetKeyDown(KeyCode.JoystickButton1))
                tackleQueued = true;
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
                TryKick(false);
            }

            if (shootQueued)
            {
                shootQueued = false;
                TryKick(true);
            }
        }

        private Vector2 ReadMove()
        {
            var move = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));

            if (leftTouchActive && Input.touchCount > 0)
            {
                for (var i = 0; i < Input.touchCount; i++)
                {
                    var touch = Input.GetTouch(i);
                    if (touch.position.x >= Screen.width * 0.52f)
                        continue;

                    var delta = (touch.position - touchOrigin) / Mathf.Max(70f, Screen.dpi * 0.34f);
                    mobileSprintAmount = Mathf.Clamp01(delta.magnitude);
                    if (delta.sqrMagnitude > 1f) delta.Normalize();
                    move = delta;
                    break;
                }
            }

            return Vector2.ClampMagnitude(move, 1f);
        }

        private bool ReadSprint()
        {
            var keyboardSprint = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift);
            return keyboardSprint || mobileSprintAmount > 0.84f;
        }

        private void ReadMobileTouches()
        {
            mobileSprintAmount = 0f;

            if (Input.touchCount == 0)
            {
                leftTouchActive = false;
                return;
            }

            if (Input.touchCount >= 2)
            {
                for (var i = 0; i < Input.touchCount; i++)
                {
                    if (Input.GetTouch(i).phase == TouchPhase.Began)
                    {
                        tackleQueued = true;
                        break;
                    }
                }
            }

            for (var i = 0; i < Input.touchCount; i++)
            {
                var touch = Input.GetTouch(i);

                if (touch.phase == TouchPhase.Began)
                {
                    if (touch.position.x < Screen.width * 0.52f)
                    {
                        touchOrigin = touch.position;
                        leftTouchActive = true;
                    }
                    else if (Input.touchCount == 1)
                    {
                        if (touch.position.y >= Screen.height * 0.55f)
                            shootQueued = true;
                        else
                            passQueued = true;
                    }
                }

                if ((touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled) && touch.position.x < Screen.width * 0.52f)
                    leftTouchActive = false;
            }
        }

        private void PerformTackle()
        {
            motion?.TriggerTackle();
            var direction = lastMoveDirection.sqrMagnitude > 0.01f ? lastMoveDirection : transform.forward;
            body.AddForce(direction.normalized * 1.8f, ForceMode.VelocityChange);
        }

        private void TryKick(bool shot)
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
                motion?.TriggerShot(useLeftFoot);
                ball.Kick(direction, shotPower, 0.13f, transform);
            }
            else
            {
                motion?.TriggerPass(useLeftFoot);
                ball.Kick(direction, passPower, 0.045f, transform);
            }
        }
    }
}
