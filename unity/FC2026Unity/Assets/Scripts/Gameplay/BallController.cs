using UnityEngine;

namespace FC2026.Gameplay
{
    [RequireComponent(typeof(Rigidbody), typeof(SphereCollider))]
    public sealed class BallController : MonoBehaviour
    {
        private Rigidbody body;

        public Rigidbody Body => body;

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
            body.mass = 0.43f;
            body.linearDamping = 0.22f;
            body.angularDamping = 0.18f;
            body.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
            body.interpolation = RigidbodyInterpolation.Interpolate;
        }

        public void Kick(Vector3 direction, float power, float lift = 0.08f)
        {
            if (direction.sqrMagnitude < 0.001f)
                return;

            var impulse = direction.normalized;
            impulse.y = Mathf.Max(impulse.y, lift);
            body.AddForce(impulse.normalized * power, ForceMode.Impulse);
        }

        public void ResetBall(Vector3 position)
        {
            body.linearVelocity = Vector3.zero;
            body.angularVelocity = Vector3.zero;
            transform.position = position;
        }
    }
}
