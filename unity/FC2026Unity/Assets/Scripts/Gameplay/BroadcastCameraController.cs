using UnityEngine;

namespace FC2026.Gameplay
{
    [RequireComponent(typeof(Camera))]
    public sealed class BroadcastCameraController : MonoBehaviour
    {
        [SerializeField] private Vector3 broadcastOffset = new Vector3(0f, 27f, -31f);
        [SerializeField] private float positionSmooth = 4.5f;
        [SerializeField] private float rotationSmooth = 7f;
        [SerializeField] private float minFieldOfView = 43f;
        [SerializeField] private float maxFieldOfView = 56f;

        private Transform ball;
        private Transform controlledPlayer;
        private Transform cinematicTarget;
        private Camera broadcastCamera;
        private float cinematicUntil;

        public void Configure(Transform ballTarget, Transform playerTarget)
        {
            ball = ballTarget;
            controlledPlayer = playerTarget;
        }

        public void FocusCelebration(Transform scorer, float seconds = 2.4f)
        {
            if (scorer == null)
                return;

            cinematicTarget = scorer;
            cinematicUntil = Time.time + Mathf.Max(1.2f, seconds);
        }

        private void Awake()
        {
            broadcastCamera = GetComponent<Camera>();
            broadcastCamera.fieldOfView = 49f;
            broadcastCamera.nearClipPlane = 0.15f;
            broadcastCamera.farClipPlane = 350f;
        }

        private void LateUpdate()
        {
            if (ball == null)
                return;

            if (cinematicTarget != null && Time.time < cinematicUntil)
            {
                UpdateCelebrationCamera();
                return;
            }

            if (Time.time >= cinematicUntil)
                cinematicTarget = null;

            var focus = ball.position;
            if (controlledPlayer != null)
                focus = Vector3.Lerp(ball.position, controlledPlayer.position, 0.24f);

            // Keep the broadcast rig above the sideline while following play up field.
            var desired = new Vector3(
                Mathf.Clamp(focus.x * 0.48f, -18f, 18f),
                broadcastOffset.y,
                Mathf.Clamp(focus.z * 0.42f + broadcastOffset.z, -45f, -8f));

            transform.position = Vector3.Lerp(transform.position, desired, 1f - Mathf.Exp(-positionSmooth * Time.deltaTime));

            var lookPoint = new Vector3(focus.x * 0.55f, 0.8f, focus.z * 0.82f + 5f);
            var desiredRotation = Quaternion.LookRotation(lookPoint - transform.position, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, desiredRotation, 1f - Mathf.Exp(-rotationSmooth * Time.deltaTime));

            var separation = controlledPlayer == null ? 0f : Vector3.Distance(ball.position, controlledPlayer.position);
            var targetFov = Mathf.Lerp(minFieldOfView, maxFieldOfView, Mathf.InverseLerp(2f, 25f, separation));
            broadcastCamera.fieldOfView = Mathf.Lerp(broadcastCamera.fieldOfView, targetFov, 1f - Mathf.Exp(-3f * Time.deltaTime));
        }

        private void UpdateCelebrationCamera()
        {
            var forward = cinematicTarget.forward;
            var side = cinematicTarget.right;
            var desired = cinematicTarget.position - forward * 5.2f + side * 2.2f + Vector3.up * 2.3f;
            transform.position = Vector3.Lerp(transform.position, desired, 1f - Mathf.Exp(-7.5f * Time.deltaTime));

            var lookPoint = cinematicTarget.position + Vector3.up * 1.35f;
            var desiredRotation = Quaternion.LookRotation(lookPoint - transform.position, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, desiredRotation, 1f - Mathf.Exp(-10f * Time.deltaTime));
            broadcastCamera.fieldOfView = Mathf.Lerp(broadcastCamera.fieldOfView, 33f, 1f - Mathf.Exp(-7f * Time.deltaTime));
        }
    }
}
