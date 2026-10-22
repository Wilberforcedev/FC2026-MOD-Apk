using UnityEngine;

namespace FC2026
{
    [RequireComponent(typeof(Rigidbody), typeof(SphereCollider))]
    public sealed class BallController : MonoBehaviour
    {
        [SerializeField] private float maxSpeed = 32f;
        [SerializeField, Range(0.95f, 0.999f)] private float groundFriction = 0.995f;
        [SerializeField, Range(0f, 1f)] private float surfaceBounciness = 0.38f;
        private Rigidbody body;
        private PhysicMaterial ballMaterial;

        public Vector3 Velocity => body != null ? body.linearVelocity : Vector3.zero;
        public bool IsMoving => Velocity.sqrMagnitude > 0.08f;

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
            body.mass = 0.43f;
            body.linearDamping = 0.02f;
            body.angularDamping = 0.055f;
            body.maxAngularVelocity = 80f;
            body.interpolation = RigidbodyInterpolation.Interpolate;
            body.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
            var sphere = GetComponent<SphereCollider>();
            ballMaterial = new PhysicMaterial("AERO Match Ball")
            {
                dynamicFriction = 0.18f,
                staticFriction = 0.2f,
                bounciness = surfaceBounciness,
                frictionCombine = PhysicMaterialCombine.Minimum,
                bounceCombine = PhysicMaterialCombine.Average
            };
            sphere.sharedMaterial = ballMaterial;
        }

        public void Kick(Vector3 direction, float power, float lift = 0.08f, float curve = 0f)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude < 0.01f) direction = transform.forward;
            direction.Normalize();
            var launch = direction * Mathf.Clamp(power, 0f, maxSpeed);
            launch.y = Mathf.Clamp(lift, 0f, 1f) * Mathf.Clamp(power, 0f, maxSpeed);
            if (launch.sqrMagnitude > maxSpeed * maxSpeed) launch = launch.normalized * maxSpeed;
            body.linearVelocity = launch;
            body.angularVelocity = Vector3.Cross(direction.normalized, Vector3.up) * curve;
        }

        public void Pass(Vector3 target, float power = 12f)
        {
            var direction = target - transform.position;
            Kick(direction, power, 0.025f, 0.3f);
        }

        public void Shoot(Vector3 target, float power = 24f)
        {
            var direction = target - transform.position;
            Kick(direction, power, 0.18f, 1.2f);
        }

        public void StopAndPlace(Vector3 worldPosition)
        {
            if (body == null) body = GetComponent<Rigidbody>();
            body.linearVelocity = Vector3.zero;
            body.angularVelocity = Vector3.zero;
            body.Sleep();
            transform.position = worldPosition;
            body.WakeUp();
        }

        private void FixedUpdate()
        {
            if (body == null || Mathf.Abs(body.linearVelocity.y) > 0.15f) return;
            float retention = Mathf.Pow(groundFriction, Time.fixedDeltaTime * 50f);
            body.linearVelocity = new Vector3(body.linearVelocity.x * retention, body.linearVelocity.y, body.linearVelocity.z * retention);
        }

        private void OnDestroy()
        {
            if (ballMaterial != null) Destroy(ballMaterial);
        }
    }
}
