using UnityEngine;
using UnityEngine.InputSystem;

namespace FC2026.Gameplay
{
    [RequireComponent(typeof(Rigidbody), typeof(CapsuleCollider))]
    public sealed class FootballPlayerController : MonoBehaviour
    {
        [SerializeField] private float moveSpeed = 7.2f;
        [SerializeField] private float sprintSpeed = 9.8f;
        [SerializeField] private float acceleration = 18f;
        [SerializeField] private float rotationSpeed = 12f;
        [SerializeField] private float kickDistance = 2.2f;
        [SerializeField] private float kickPower = 9.5f;

        private Rigidbody body;
        private BallController ball;
        private Vector2 touchOrigin;
        private bool leftTouchActive;
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
            ball = FindFirstObjectByType<BallController>();
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

            if (ReadKickPressed())
                TryKick();
        }

        private Vector2 ReadMove()
        {
            Vector2 move = Vector2.zero;

            if (Keyboard.current != null)
            {
                if (Keyboard.current.aKey.isPressed || Keyboard.current.leftArrowKey.isPressed) move.x -= 1f;
                if (Keyboard.current.dKey.isPressed || Keyboard.current.rightArrowKey.isPressed) move.x += 1f;
                if (Keyboard.current.sKey.isPressed || Keyboard.current.downArrowKey.isPressed) move.y -= 1f;
                if (Keyboard.current.wKey.isPressed || Keyboard.current.upArrowKey.isPressed) move.y += 1f;
            }

            if (Gamepad.current != null && Gamepad.current.leftStick.ReadValue().sqrMagnitude > move.sqrMagnitude)
                move = Gamepad.current.leftStick.ReadValue();

            if (Touchscreen.current != null)
            {
                var touch = Touchscreen.current.primaryTouch;
                var pressed = touch.press.isPressed;
                var position = touch.position.ReadValue();

                if (touch.press.wasPressedThisFrame && position.x < Screen.width * 0.52f)
                {
                    touchOrigin = position;
                    leftTouchActive = true;
                }

                if (!pressed)
                    leftTouchActive = false;

                if (leftTouchActive)
                {
                    var delta = (position - touchOrigin) / Mathf.Max(70f, Screen.dpi * 0.34f);
                    if (delta.sqrMagnitude > 1f) delta.Normalize();
                    move = delta;
                }
            }

            return Vector2.ClampMagnitude(move, 1f);
        }

        private bool ReadSprint()
        {
            var keyboardSprint = Keyboard.current != null && (Keyboard.current.leftShiftKey.isPressed || Keyboard.current.rightShiftKey.isPressed);
            var gamepadSprint = Gamepad.current != null && Gamepad.current.rightTrigger.ReadValue() > 0.45f;
            return keyboardSprint || gamepadSprint;
        }

        private bool ReadKickPressed()
        {
            if (Keyboard.current != null && Keyboard.current.spaceKey.wasPressedThisFrame)
                return true;

            if (Gamepad.current != null && Gamepad.current.buttonSouth.wasPressedThisFrame)
                return true;

            if (Touchscreen.current != null)
            {
                var touch = Touchscreen.current.primaryTouch;
                if (touch.press.wasPressedThisFrame && touch.position.ReadValue().x >= Screen.width * 0.52f)
                    return true;
            }

            return false;
        }

        private void TryKick()
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
            ball.Kick(direction, kickPower, 0.12f);
        }
    }
}
