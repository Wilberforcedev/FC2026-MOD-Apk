using UnityEngine;

namespace FC2026
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class FootballerController : MonoBehaviour
    {
        [SerializeField] private float walkSpeed = 4.2f;
        [SerializeField] private float sprintSpeed = 7.2f;
        [SerializeField] private float acceleration = 18f;
        [SerializeField] private Transform ballContact;
        [SerializeField] private float controlRadius = 1.45f;
        private CharacterController motor;
        private MobileInputController input;
        private Vector3 currentVelocity;
        private float actionCooldown;

        public PlayerData Player { get; private set; }
        public bool IsUserControlled { get; set; }

        public void Initialize(PlayerData player, MobileInputController mobileInput = null)
        {
            Player = player;
            input = mobileInput;
        }

        private void Awake() => motor = GetComponent<CharacterController>();

        private void Update()
        {
            actionCooldown -= Time.deltaTime;
            var move = IsUserControlled && input != null ? input.Move : Vector2.zero;
            var desired = new Vector3(move.x, 0f, move.y);
            var speed = IsUserControlled && input != null && input.SprintHeld ? sprintSpeed : walkSpeed;
            currentVelocity = Vector3.MoveTowards(currentVelocity, desired * speed, acceleration * Time.deltaTime);
            if (currentVelocity.sqrMagnitude > 0.04f) transform.forward = Vector3.Slerp(transform.forward, currentVelocity.normalized, 12f * Time.deltaTime);
            motor.Move(currentVelocity * Time.deltaTime + Physics.gravity * Time.deltaTime);
        }

        public bool CanControlBall(BallController ball) => ball != null && Vector3.Distance(ball.transform.position, ballContact != null ? ballContact.position : transform.position) <= controlRadius;

        public void Pass(BallController ball, Vector3 target)
        {
            if (actionCooldown > 0f || !CanControlBall(ball)) return;
            ball.Pass(target); actionCooldown = 0.25f;
        }

        public void Shoot(BallController ball, Vector3 target)
        {
            if (actionCooldown > 0f || !CanControlBall(ball)) return;
            ball.Shoot(target); actionCooldown = 0.45f;
        }
    }
}
