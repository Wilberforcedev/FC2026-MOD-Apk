using UnityEngine;

namespace FC2026.Gameplay
{
    [RequireComponent(typeof(Rigidbody), typeof(SphereCollider))]
    public sealed class BallController : MonoBehaviour
    {
        private const float GroundY = 0.115f;
        private const float MaxSpeed = 38f;
        private const float DribbleDistance = 0.72f;
        private const float ReclaimDelay = 0.24f;

        [SerializeField] private float magnusCoefficient = 0.026f;
        [SerializeField] private float rollingFriction = 0.85f;

        private Rigidbody body;
        private SphereCollider sphere;
        private TrailRenderer trail;
        private FootballPlayerController owner;
        private FootballPlayerController collisionTarget;
        private Collider[] collisionTargetColliders;
        private bool collisionsIgnored;
        private float collisionRestoreAt;
        private float cooldownUntil;
        private float lastTouchTime = -99f;

        public static BallController Instance { get; private set; }

        public Rigidbody Body => body;
        public Transform LastKicker { get; private set; }
        public FootballPlayerController Owner => owner;
        public Vector3 Position => transform.position;
        public Vector3 Velocity => body != null ? body.linearVelocity : Vector3.zero;
        public float Speed => body != null ? body.linearVelocity.magnitude : 0f;
        public float LastTouchTime => lastTouchTime;
        public float PossessionCooldownUntil => cooldownUntil;
        public bool IsFree => owner == null && Time.time >= cooldownUntil;
        public bool IsOwnedBy(FootballPlayerController player) => owner == player;

        private void Awake()
        {
            Instance = this;
            body = GetComponent<Rigidbody>();
            body.mass = 0.43f;
            body.linearDamping = 0.12f;
            body.angularDamping = 0.35f;
            body.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
            body.interpolation = RigidbodyInterpolation.Interpolate;
            sphere = GetComponent<SphereCollider>();
            EnsureTrail();
        }

        private void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

        private void OnCollisionEnter(Collision collision)
        {
            var player = collision.collider.GetComponentInParent<FootballPlayerController>();
            if (player == null)
                return;

            // Deflections count as a touch, so throw-ins and corners go to the right team.
            LastKicker = player.transform;
            lastTouchTime = Time.time;
        }

        private void FixedUpdate()
        {
            if (body == null)
                return;

            // While the ball is carried, its collider must stay ignored so the
            // carrier's own capsule cannot knock it loose during sharp turns.
            if (collisionsIgnored && owner == null && Time.time >= collisionRestoreAt)
                RestoreCollisions();

            if (owner != null)
            {
                UpdateDribble();
                return;
            }

            UpdateFreeBall();
        }

        private void UpdateDribble()
        {
            if (owner == null)
            {
                ReleasePossession(false);
                return;
            }

            // Keep the ball glued to the ball carrier's leading foot. The spring
            // lets it roll slightly ahead when sprinting instead of teleporting.
            var target = owner.transform.position + owner.transform.forward * DribbleDistance;
            target.y = GroundY;
            var toTarget = target - transform.position;
            toTarget.y = 0f;
            var ownerVelocity = owner.Body != null ? owner.Body.linearVelocity : Vector3.zero;
            var desired = new Vector3(ownerVelocity.x, 0f, ownerVelocity.z) + toTarget * 7.5f;
            var maxDribbleSpeed = Mathf.Max(9f, new Vector2(ownerVelocity.x, ownerVelocity.z).magnitude + 2.5f);
            if (desired.sqrMagnitude > maxDribbleSpeed * maxDribbleSpeed)
                desired = desired.normalized * maxDribbleSpeed;

            var currentHorizontal = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
            var turnResponse = ownerVelocity.magnitude > 7f ? 22f : 32f;
            var controlledHorizontal = Vector3.MoveTowards(
                currentHorizontal, desired, turnResponse * Time.fixedDeltaTime);
            var vertical = Mathf.Min(body.linearVelocity.y, 0f);
            body.linearVelocity = new Vector3(controlledHorizontal.x, vertical, controlledHorizontal.z);

            var travel = controlledHorizontal;
            body.angularVelocity = travel.sqrMagnitude > 0.04f
                ? Vector3.Cross(Vector3.up, travel) * (3.2f / 0.11f) * 0.35f
                : Vector3.zero;

            if (trail != null)
                trail.emitting = false;
        }

        private void UpdateFreeBall()
        {
            var velocity = body.linearVelocity;
            var spin = body.angularVelocity;

            if (velocity.sqrMagnitude > MaxSpeed * MaxSpeed)
                velocity = velocity.normalized * MaxSpeed;

            var grounded = transform.position.y <= GroundY + 0.07f && velocity.y <= 0.6f;
            if (grounded)
            {
                var horizontal = new Vector3(velocity.x, 0f, velocity.z);
                var speed = horizontal.magnitude;
                if (speed > 0.02f)
                {
                    var drop = (rollingFriction + speed * 0.06f) * Time.fixedDeltaTime;
                    horizontal = Vector3.MoveTowards(horizontal, Vector3.zero, drop);
                }

                // A rolling ball curves gently, like a real ground pass with spin.
                if (Mathf.Abs(spin.y) > 0.4f && speed > 1.2f)
                {
                    var side = Vector3.Cross(Vector3.up, horizontal).normalized;
                    horizontal += side * (spin.y * 0.055f * Time.fixedDeltaTime);
                }

                velocity = new Vector3(horizontal.x, velocity.y, horizontal.z);
                body.angularVelocity = new Vector3(spin.x, spin.y * 0.985f, spin.z);
            }
            else
            {
                var magnus = Vector3.Cross(spin, velocity) * magnusCoefficient;
                velocity += magnus * Time.fixedDeltaTime;
            }

            if (transform.position.y < -0.5f)
            {
                ResetBall(new Vector3(transform.position.x, GroundY, transform.position.z));
                return;
            }

            body.linearVelocity = velocity;

            if (trail != null)
                trail.emitting = velocity.magnitude > 8.5f;
        }

        public void Claim(FootballPlayerController player)
        {
            if (player == null)
                return;

            if (owner == player)
                return;

            if (owner != null)
                ReleasePossession(false);

            owner = player;
            LastKicker = player.transform;
            lastTouchTime = Time.time;
            cooldownUntil = Time.time + 0.1f;
            IgnoreCollisionsWith(player, 0.4f);
        }

        public void ForcePossession(FootballPlayerController player)
        {
            if (player == null)
                return;
            ReleasePossession(false);
            Claim(player);
        }

        public void Steal(FootballPlayerController player)
        {
            if (player == null)
                return;

            LastKicker = player.transform;
            lastTouchTime = Time.time;
            owner = player;
            cooldownUntil = Time.time + 0.1f;
            IgnoreCollisionsWith(player, 0.4f);
            var nudge = player.transform.forward * 1.2f;
            nudge.y = 0f;
            body.linearVelocity = nudge;
        }

        public void ReleasePossession(bool touched = true)
        {
            if (owner != null)
            {
                if (touched)
                    lastTouchTime = Time.time;
                LastKicker = owner.transform;
            }

            owner = null;
            cooldownUntil = Time.time + ReclaimDelay;
            RestoreCollisions();
        }

        public void Kick(Vector3 direction, float power, float lift = 0.08f, Transform kicker = null, float curve = 0f)
        {
            var flat = new Vector3(direction.x, 0f, direction.z);
            if (flat.sqrMagnitude < 0.001f)
                flat = transform.forward;
            flat.Normalize();

            var kickerController = kicker != null ? kicker.GetComponent<FootballPlayerController>() : null;
            if (kickerController != null)
                ReleasePossession(false);
            else
                owner = null;

            LastKicker = kicker;
            lastTouchTime = Time.time;
            cooldownUntil = Time.time + ReclaimDelay;

            var speed = Mathf.Clamp(power, 2.5f, MaxSpeed);
            var lift01 = Mathf.Clamp(lift, 0f, 0.92f);
            var verticalSpeed = speed * lift01;
            var horizontalSpeed = Mathf.Sqrt(Mathf.Max(0.04f, speed * speed - verticalSpeed * verticalSpeed));

            body.linearVelocity = flat * horizontalSpeed + Vector3.up * verticalSpeed;
            body.angularVelocity = Vector3.up * Mathf.Clamp(curve, -14f, 14f);

            if (kickerController != null)
                IgnoreCollisionsWith(kickerController, 0.22f);
        }

        public void ResetBall(Vector3 position)
        {
            owner = null;
            LastKicker = null;
            cooldownUntil = 0f;
            lastTouchTime = -99f;
            RestoreCollisions();
            transform.position = position;
            transform.rotation = Quaternion.identity;
            body.linearVelocity = Vector3.zero;
            body.angularVelocity = Vector3.zero;
            if (trail != null)
            {
                trail.Clear();
                trail.emitting = false;
            }
        }

        private void IgnoreCollisionsWith(FootballPlayerController player, float duration)
        {
            RestoreCollisions();
            collisionTarget = player;
            collisionTargetColliders = player.GetComponentsInChildren<Collider>(true);
            foreach (var candidate in collisionTargetColliders)
            {
                if (candidate != null && candidate != sphere)
                    Physics.IgnoreCollision(candidate, sphere, true);
            }

            collisionsIgnored = true;
            collisionRestoreAt = Time.time + duration;
        }

        private void RestoreCollisions()
        {
            if (!collisionsIgnored)
                return;

            if (collisionTargetColliders != null)
            {
                foreach (var candidate in collisionTargetColliders)
                {
                    if (candidate != null && sphere != null)
                        Physics.IgnoreCollision(candidate, sphere, false);
                }
            }

            collisionsIgnored = false;
            collisionTarget = null;
            collisionTargetColliders = null;
        }

        private void EnsureTrail()
        {
            trail = GetComponent<TrailRenderer>();
            if (trail == null)
                trail = gameObject.AddComponent<TrailRenderer>();

            trail.time = 0.32f;
            trail.startWidth = 0.075f;
            trail.endWidth = 0f;
            trail.numCapVertices = 2;
            trail.emitting = false;
            trail.startColor = new Color(1f, 1f, 1f, 0.5f);
            trail.endColor = new Color(1f, 1f, 1f, 0f);

            var shader = Shader.Find("Sprites/Default") ?? Shader.Find("Unlit/Color") ?? Shader.Find("Standard");
            if (shader != null)
                trail.material = new Material(shader) { color = Color.white };
        }
    }
}
