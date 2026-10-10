using UnityEngine;

namespace FC2026
{
    public sealed class MatchCameraController : MonoBehaviour
    {
        public enum CameraMode { Broadcast, FollowPlayer, GoalReplay }
        [SerializeField] private Camera targetCamera;
        [SerializeField] private Transform followTarget;
        [SerializeField] private BallController ball;
        [SerializeField] private CameraMode mode = CameraMode.Broadcast;
        [SerializeField] private float smooth = 5f;

        public void Configure(Camera cameraToUse, BallController matchBall) { targetCamera = cameraToUse; ball = matchBall; }
        public void SetMode(CameraMode next) => mode = next;
        public void SetFollowTarget(Transform target) => followTarget = target;

        private void LateUpdate()
        {
            if (targetCamera == null || ball == null) return;
            var target = mode == CameraMode.FollowPlayer && followTarget != null ? followTarget.position : ball.transform.position;
            var desiredPosition = mode == CameraMode.Broadcast
                ? target + new Vector3(0f, 22f, -25f)
                : target + new Vector3(0f, 8f, -10f);
            targetCamera.transform.position = Vector3.Lerp(targetCamera.transform.position, desiredPosition, smooth * Time.deltaTime);
            var lookPoint = target + Vector3.up * 0.35f;
            targetCamera.transform.rotation = Quaternion.Slerp(targetCamera.transform.rotation, Quaternion.LookRotation(lookPoint - targetCamera.transform.position), smooth * Time.deltaTime);
        }
    }
}
