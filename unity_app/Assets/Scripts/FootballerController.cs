using System.Linq;
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
        private Animator animator;
        private string speedParameter;
        private string sprintParameter;
        private string passTrigger;
        private string shootTrigger;
        private string tackleTrigger;
        private TeamData team;
        private bool attacksPositiveZ = true;
        private bool isUserControlled;
        private bool inputEventsBound;

        public PlayerData Player { get; private set; }
        public TeamData Team => team;
        public bool IsUserControlled
        {
            get => isUserControlled;
            set
            {
                if (isUserControlled == value) return;
                isUserControlled = value;
                SynchronizeInputBindings();
            }
        }

        public void Initialize(PlayerData player, MobileInputController mobileInput = null, TeamData teamData = null, bool isHomeSide = true)
        {
            Player = player;
            input = mobileInput;
            team = teamData;
            attacksPositiveZ = isHomeSide;
            SynchronizeInputBindings();
        }

        private void Awake()
        {
            motor = GetComponent<CharacterController>();
            animator = GetComponentInChildren<Animator>();
            if (animator == null) return;
            foreach (var parameter in animator.parameters)
            {
                if (parameter.name == "Speed" || parameter.name == "MoveSpeed") speedParameter = parameter.name;
                else if (parameter.name == "IsSprinting" || parameter.name == "Sprint") sprintParameter = parameter.name;
                else if (parameter.name == "Pass" || parameter.name == "PassTrigger") passTrigger = parameter.name;
                else if (parameter.name == "Shoot" || parameter.name == "ShootTrigger") shootTrigger = parameter.name;
                else if (parameter.name == "Tackle" || parameter.name == "TackleTrigger") tackleTrigger = parameter.name;
            }
        }

        private void OnDestroy() => UnbindInputEvents();

        private void SynchronizeInputBindings()
        {
            if (isUserControlled && input != null && !inputEventsBound)
            {
                input.PassPressed += HandlePassPressed;
                input.ShootPressed += HandleShootPressed;
                input.TacklePressed += HandleTacklePressed;
                input.SwitchPlayerPressed += HandleSwitchPlayerPressed;
                inputEventsBound = true;
            }
            else if ((!isUserControlled || input == null) && inputEventsBound) UnbindInputEvents();
        }

        private void UnbindInputEvents()
        {
            if (input != null && inputEventsBound)
            {
                input.PassPressed -= HandlePassPressed;
                input.ShootPressed -= HandleShootPressed;
                input.TacklePressed -= HandleTacklePressed;
                input.SwitchPlayerPressed -= HandleSwitchPlayerPressed;
            }
            inputEventsBound = false;
        }

        private void HandlePassPressed()
        {
            var ball = FindFirstObjectByType<BallController>();
            if (ball == null || !CanControlBall(ball)) return;
            var players = FindObjectsByType<FootballerController>(FindObjectsSortMode.None)
                .Where(candidate => candidate != this && team != null && candidate.team == team).ToList();
            var forwardPass = players.Where(candidate => Vector3.Dot(transform.forward,
                    (candidate.transform.position - transform.position).normalized) > 0.1f)
                .OrderBy(candidate => Vector3.Distance(transform.position, candidate.transform.position)).FirstOrDefault();
            var target = forwardPass ?? players.OrderBy(candidate => Vector3.Distance(transform.position, candidate.transform.position)).FirstOrDefault();
            if (target != null) Pass(ball, target.transform.position);
        }

        private void HandleShootPressed()
        {
            var ball = FindFirstObjectByType<BallController>();
            if (ball == null || !CanControlBall(ball)) return;
            var goalZ = attacksPositiveZ ? 51.5f : -51.5f;
            var target = new Vector3(Random.Range(-1.8f, 1.8f), 1.2f, goalZ);
            Shoot(ball, target);
        }

        private void HandleTacklePressed()
        {
            var ball = FindFirstObjectByType<BallController>();
            if (ball == null) return;
            var nearestOpponent = FindObjectsByType<FootballerController>(FindObjectsSortMode.None)
                .Where(candidate => candidate != this && candidate.team != team)
                .OrderBy(candidate => Vector3.Distance(transform.position, candidate.transform.position)).FirstOrDefault();
            if (nearestOpponent == null || Vector3.Distance(transform.position, nearestOpponent.transform.position) > 2.1f) return;
            if (animator != null && !string.IsNullOrEmpty(tackleTrigger)) animator.SetTrigger(tackleTrigger);
            if (Vector3.Distance(ball.transform.position, nearestOpponent.transform.position) < 2.2f)
                ball.Kick((ball.transform.position - transform.position).normalized, 5.5f, 0.03f, 0.1f);
        }

        private void HandleSwitchPlayerPressed()
        {
            if (team == null) return;
            var ball = FindFirstObjectByType<BallController>();
            var next = FindObjectsByType<FootballerController>(FindObjectsSortMode.None)
                .Where(candidate => candidate != this && candidate.team == team)
                .OrderBy(candidate => ball == null ? Vector3.Distance(transform.position, candidate.transform.position) :
                    Vector3.Distance(ball.transform.position, candidate.transform.position)).FirstOrDefault();
            if (next == null) return;
            IsUserControlled = false;
            next.IsUserControlled = true;
        }

        private void Update()
        {
            actionCooldown -= Time.deltaTime;
            var move = IsUserControlled && input != null ? input.Move : Vector2.zero;
            var desired = new Vector3(move.x, 0f, move.y);
            var speed = IsUserControlled && input != null && input.SprintHeld ? sprintSpeed : walkSpeed;
            currentVelocity = Vector3.MoveTowards(currentVelocity, desired * speed, acceleration * Time.deltaTime);
            if (currentVelocity.sqrMagnitude > 0.04f) transform.forward = Vector3.Slerp(transform.forward, currentVelocity.normalized, 12f * Time.deltaTime);
            if (animator != null)
            {
                if (!string.IsNullOrEmpty(speedParameter)) animator.SetFloat(speedParameter, currentVelocity.magnitude);
                if (!string.IsNullOrEmpty(sprintParameter)) animator.SetBool(sprintParameter, speed > walkSpeed + 0.1f && currentVelocity.sqrMagnitude > 0.04f);
            }
            motor.Move(currentVelocity * Time.deltaTime + Physics.gravity * Time.deltaTime);
        }

        public bool CanControlBall(BallController ball) => ball != null && Vector3.Distance(ball.transform.position, ballContact != null ? ballContact.position : transform.position) <= controlRadius;

        public void Pass(BallController ball, Vector3 target)
        {
            if (actionCooldown > 0f || !CanControlBall(ball)) return;
            ball.Pass(target);
            if (animator != null && !string.IsNullOrEmpty(passTrigger)) animator.SetTrigger(passTrigger);
            actionCooldown = 0.25f;
        }

        public void Shoot(BallController ball, Vector3 target)
        {
            if (actionCooldown > 0f || !CanControlBall(ball)) return;
            ball.Shoot(target);
            if (animator != null && !string.IsNullOrEmpty(shootTrigger)) animator.SetTrigger(shootTrigger);
            actionCooldown = 0.45f;
        }
    }
}
