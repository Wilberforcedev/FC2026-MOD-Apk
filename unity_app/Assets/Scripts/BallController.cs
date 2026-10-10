using UnityEngine;

namespace FC2026
{
    [RequireComponent(typeof(Rigidbody), typeof(SphereCollider))]
    public sealed class BallController : MonoBehaviour
    {
        [SerializeField] private float maxSpeed = 32f;
        [SerializeField] private float groundFriction = 0.985f;
        private Rigidbody body;

        public Vector3 Velocity => body != null ? body.linearVelocity : Vector3.zero;
        public bool IsMoving => Velocity.sqrMagnitude > 0.08f;

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
            body.mass = 0.43f;
            body.linearDamping = 0.08f;
            body.angularDamping = 0.12f;
            body.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
        }

        public void Kick(Vector3 direction, float power, float lift = 0.08f, float curve = 0f)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude < 0.01f) direction = transform.forward;
            direction.Normalize();
            var launch = direction * Mathf.Clamp(power, 0f, maxSpeed);
            launch.y = Mathf.Clamp(lift, 0f, 1f) * power;
            body.linearVelocity = launch;
            body.angularVelocity = Vector3.up * curve;
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

        private void FixedUpdate()
        {
            if (body == null || Mathf.Abs(body.linearVelocity.y) > 0.15f) return;
            body.linearVelocity = new Vector3(body.linearVelocity.x * groundFriction, body.linearVelocity.y, body.linearVelocity.z * groundFriction);
        }
    }
}
