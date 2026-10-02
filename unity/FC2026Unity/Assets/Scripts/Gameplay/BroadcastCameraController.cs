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
        private Camera broadcastCamera;

        public void Configure(Transform ballTarget, Transform playerTarget)
        {
            ball = ballTarget;
            controlledPlayer = playerTarget;
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
    }
}
