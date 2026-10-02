using UnityEngine;

namespace FC2026.Gameplay
{
    [RequireComponent(typeof(Rigidbody), typeof(ProceduralHumanoidRig))]
    public sealed class FootballMotionAnimator : MonoBehaviour
    {
        private const float KickDuration = 0.48f;
        private const float TackleDuration = 0.72f;
        private const float CelebrationDuration = 2.6f;
        private const float DiveDuration = 0.82f;

        private Rigidbody body;
        private ProceduralHumanoidRig rig;
        private float locomotionPhase;
        private float kickTimer;
        private float tackleTimer;
        private float celebrationTimer;
        private float diveTimer;
        private float kickIntensity = 1f;
        private float diveSide = 1f;
        private float cadence = 1f;
        private float strideScale = 1f;
        private float forwardLean = 1f;
        private int celebrationStyle;
        private bool kickWithLeftFoot;
        private bool goalkeeper;

        public bool IsCelebrating => celebrationTimer > 0f;
        public bool IsDiving => diveTimer > 0f;

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
            rig = GetComponent<ProceduralHumanoidRig>();
        }

        public void Configure(bool isGoalkeeper, float styleSeed = 0.5f)
        {
            goalkeeper = isGoalkeeper;
            var seed = Mathf.Repeat(styleSeed, 1f);
            cadence = Mathf.Lerp(0.92f, 1.12f, seed);
            strideScale = Mathf.Lerp(0.92f, 1.12f, 1f - seed * 0.55f);
            forwardLean = Mathf.Lerp(0.82f, 1.16f, seed);
            celebrationStyle = Mathf.FloorToInt(seed * 4f) % 4;
        }

        private void LateUpdate()
        {
            if (rig == null)
                rig = GetComponent<ProceduralHumanoidRig>();

            if (body == null)
                body = GetComponent<Rigidbody>();

            if (rig == null || !rig.IsReady || body == null)
                return;

            kickTimer = Mathf.Max(0f, kickTimer - Time.deltaTime);
            tackleTimer = Mathf.Max(0f, tackleTimer - Time.deltaTime);
            celebrationTimer = Mathf.Max(0f, celebrationTimer - Time.deltaTime);
            diveTimer = Mathf.Max(0f, diveTimer - Time.deltaTime);

            var horizontalVelocity = new Vector3(body.linearVelocity.x, 0f, body.linearVelocity.z);
            var speed = horizontalVelocity.magnitude;
            var speed01 = Mathf.Clamp01(speed / 9.5f);
            locomotionPhase += Time.deltaTime * Mathf.Lerp(2.2f, 10.4f, speed01) * cadence;

            ApplyBasePose(speed01);

            if (celebrationTimer > 0f)
                ApplyCelebration();
            else if (diveTimer > 0f)
                ApplyGoalkeeperDive();
            else if (tackleTimer > 0f)
                ApplyTackle();
            else if (kickTimer > 0f)
                ApplyKick();
            else
                ApplyLocomotion(speed01);
        }

        private void ApplyBasePose(float speed01)
        {
            var breath = Mathf.Sin(Time.time * 2.1f) * 0.008f;
            var bob = speed01 > 0.05f ? Mathf.Abs(Mathf.Sin(locomotionPhase * 2f)) * 0.035f * speed01 : breath;

            rig.VisualRoot.localPosition = new Vector3(0f, bob, 0f);
            rig.VisualRoot.localRotation = Quaternion.identity;
            rig.Hips.localRotation = Quaternion.identity;
            rig.Spine.localRotation = Quaternion.identity;
            rig.Chest.localRotation = Quaternion.identity;
            rig.Head.localRotation = Quaternion.identity;
            rig.LeftUpperArm.localRotation = Quaternion.identity;
            rig.LeftLowerArm.localRotation = Quaternion.identity;
            rig.RightUpperArm.localRotation = Quaternion.identity;
            rig.RightLowerArm.localRotation = Quaternion.identity;
            rig.LeftUpperLeg.localRotation = Quaternion.identity;
            rig.LeftLowerLeg.localRotation = Quaternion.identity;
            rig.RightUpperLeg.localRotation = Quaternion.identity;
            rig.RightLowerLeg.localRotation = Quaternion.identity;
            rig.LeftFoot.localRotation = Quaternion.identity;
            rig.RightFoot.localRotation = Quaternion.identity;
        }

        private void ApplyLocomotion(float speed01)
        {
            if (speed01 < 0.035f)
            {
                rig.Chest.localRotation = Quaternion.Euler(Mathf.Sin(Time.time * 1.6f) * 1.4f, 0f, 0f);
                return;
            }

            var cycle = Mathf.Sin(locomotionPhase);
            var opposite = Mathf.Sin(locomotionPhase + Mathf.PI);
            var stride = Mathf.Lerp(16f, 45f, speed01) * strideScale;
            var arm = Mathf.Lerp(12f, 38f, speed01);
            var knee = Mathf.Max(0f, -cycle) * Mathf.Lerp(9f, 42f, speed01);
            var otherKnee = Mathf.Max(0f, -opposite) * Mathf.Lerp(9f, 42f, speed01);

            rig.LeftUpperLeg.localRotation = Quaternion.Euler(cycle * stride, 0f, 0f);
            rig.RightUpperLeg.localRotation = Quaternion.Euler(opposite * stride, 0f, 0f);
            rig.LeftLowerLeg.localRotation = Quaternion.Euler(knee, 0f, 0f);
            rig.RightLowerLeg.localRotation = Quaternion.Euler(otherKnee, 0f, 0f);

            rig.LeftUpperArm.localRotation = Quaternion.Euler(opposite * arm, 0f, 5f);
            rig.RightUpperArm.localRotation = Quaternion.Euler(cycle * arm, 0f, -5f);
            rig.LeftLowerArm.localRotation = Quaternion.Euler(-18f - Mathf.Abs(cycle) * 12f, 0f, 0f);
            rig.RightLowerArm.localRotation = Quaternion.Euler(-18f - Mathf.Abs(opposite) * 12f, 0f, 0f);

            rig.Hips.localRotation = Quaternion.Euler(0f, cycle * 4.5f * speed01, 0f);
            rig.Chest.localRotation = Quaternion.Euler(-Mathf.Lerp(2f, 11f, speed01) * forwardLean, -cycle * 4f, 0f);
            rig.Head.localRotation = Quaternion.Euler(Mathf.Lerp(1f, 5f, speed01), cycle * 1.5f, 0f);
        }

        private void ApplyKick()
        {
            var t = 1f - kickTimer / KickDuration;
            var windup = Mathf.SmoothStep(0f, 1f, Mathf.Clamp01(t / 0.38f));
            var strike = Mathf.SmoothStep(0f, 1f, Mathf.Clamp01((t - 0.32f) / 0.42f));
            var recovery = Mathf.SmoothStep(0f, 1f, Mathf.Clamp01((t - 0.72f) / 0.28f));
            var angle = Mathf.Lerp(0f, -38f * kickIntensity, windup);
            angle = Mathf.Lerp(angle, 72f * kickIntensity, strike);
            angle = Mathf.Lerp(angle, 6f, recovery);

            var kickingUpper = kickWithLeftFoot ? rig.LeftUpperLeg : rig.RightUpperLeg;
            var kickingLower = kickWithLeftFoot ? rig.LeftLowerLeg : rig.RightLowerLeg;
            var supportUpper = kickWithLeftFoot ? rig.RightUpperLeg : rig.LeftUpperLeg;

            kickingUpper.localRotation = Quaternion.Euler(angle, 0f, 0f);
            kickingLower.localRotation = Quaternion.Euler(Mathf.Lerp(35f, -12f, strike), 0f, 0f);
            supportUpper.localRotation = Quaternion.Euler(-9f, 0f, 0f);
            rig.Chest.localRotation = Quaternion.Euler(-12f * kickIntensity, kickWithLeftFoot ? -16f : 16f, kickWithLeftFoot ? 7f : -7f);
            rig.LeftUpperArm.localRotation = Quaternion.Euler(-22f, 0f, 24f);
            rig.RightUpperArm.localRotation = Quaternion.Euler(18f, 0f, -24f);
        }

        private void ApplyTackle()
        {
            var t = 1f - tackleTimer / TackleDuration;
            var extension = Mathf.Sin(Mathf.Clamp01(t) * Mathf.PI);
            rig.VisualRoot.localPosition = new Vector3(0f, -0.24f * extension, 0.15f * extension);
            rig.Chest.localRotation = Quaternion.Euler(28f * extension, 0f, 0f);
            rig.RightUpperLeg.localRotation = Quaternion.Euler(74f * extension, 0f, 0f);
            rig.RightLowerLeg.localRotation = Quaternion.Euler(-18f * extension, 0f, 0f);
            rig.LeftUpperLeg.localRotation = Quaternion.Euler(-22f * extension, 0f, 0f);
            rig.LeftUpperArm.localRotation = Quaternion.Euler(-18f, 0f, 42f * extension);
            rig.RightUpperArm.localRotation = Quaternion.Euler(22f, 0f, -42f * extension);
        }

        private void ApplyCelebration()
        {
            var elapsed = CelebrationDuration - celebrationTimer;
            var pulse = Mathf.Sin(elapsed * 5.2f);
            rig.VisualRoot.localPosition = new Vector3(0f, Mathf.Max(0f, pulse) * 0.08f, 0f);

            switch (celebrationStyle)
            {
                case 0: // arms wide
                    rig.LeftUpperArm.localRotation = Quaternion.Euler(0f, 0f, 88f);
                    rig.RightUpperArm.localRotation = Quaternion.Euler(0f, 0f, -88f);
                    rig.Chest.localRotation = Quaternion.Euler(-8f, 0f, 0f);
                    break;
                case 1: // double fist pump
                    rig.LeftUpperArm.localRotation = Quaternion.Euler(-35f, 0f, 72f);
                    rig.RightUpperArm.localRotation = Quaternion.Euler(-35f, 0f, -72f);
                    rig.LeftLowerArm.localRotation = Quaternion.Euler(-85f + pulse * 8f, 0f, 0f);
                    rig.RightLowerArm.localRotation = Quaternion.Euler(-85f + pulse * 8f, 0f, 0f);
                    break;
                case 2: // point upward
                    rig.RightUpperArm.localRotation = Quaternion.Euler(-102f, 0f, -8f);
                    rig.RightLowerArm.localRotation = Quaternion.Euler(-18f, 0f, 0f);
                    rig.LeftUpperArm.localRotation = Quaternion.Euler(5f, 0f, 38f);
                    break;
                default: // knee slide silhouette
                    rig.VisualRoot.localPosition = new Vector3(0f, -0.35f, elapsed * 0.06f);
                    rig.Chest.localRotation = Quaternion.Euler(-15f, 0f, 0f);
                    rig.LeftUpperLeg.localRotation = Quaternion.Euler(58f, 0f, 0f);
                    rig.RightUpperLeg.localRotation = Quaternion.Euler(58f, 0f, 0f);
                    rig.LeftLowerLeg.localRotation = Quaternion.Euler(-72f, 0f, 0f);
                    rig.RightLowerLeg.localRotation = Quaternion.Euler(-72f, 0f, 0f);
                    rig.LeftUpperArm.localRotation = Quaternion.Euler(0f, 0f, 78f);
                    rig.RightUpperArm.localRotation = Quaternion.Euler(0f, 0f, -78f);
                    break;
            }
        }

        private void ApplyGoalkeeperDive()
        {
            var t = 1f - diveTimer / DiveDuration;
            var arc = Mathf.Sin(Mathf.Clamp01(t) * Mathf.PI);
            rig.VisualRoot.localPosition = new Vector3(diveSide * arc * 0.48f, arc * 0.22f, 0f);
            rig.VisualRoot.localRotation = Quaternion.Euler(0f, 0f, -diveSide * arc * 72f);
            rig.LeftUpperArm.localRotation = Quaternion.Euler(-78f, 0f, 58f * diveSide);
            rig.RightUpperArm.localRotation = Quaternion.Euler(-78f, 0f, 58f * diveSide);
            rig.LeftLowerArm.localRotation = Quaternion.Euler(-18f, 0f, 0f);
            rig.RightLowerArm.localRotation = Quaternion.Euler(-18f, 0f, 0f);
            rig.LeftUpperLeg.localRotation = Quaternion.Euler(20f, 0f, 12f);
            rig.RightUpperLeg.localRotation = Quaternion.Euler(-18f, 0f, -12f);
        }

        public void TriggerPass(bool leftFoot = false)
        {
            TriggerKick(0.62f, leftFoot);
        }

        public void TriggerShot(bool leftFoot = false)
        {
            TriggerKick(1f, leftFoot);
        }

        public void TriggerKick(float intensity = 1f, bool leftFoot = false)
        {
            kickIntensity = Mathf.Clamp(intensity, 0.45f, 1.15f);
            kickWithLeftFoot = leftFoot;
            kickTimer = KickDuration;
        }

        public void TriggerTackle()
        {
            if (!goalkeeper)
                tackleTimer = TackleDuration;
        }

        public void TriggerCelebration(int style = -1)
        {
            if (style >= 0)
                celebrationStyle = style % 4;
            celebrationTimer = CelebrationDuration;
        }

        public void TriggerGoalkeeperDive(float side)
        {
            if (!goalkeeper)
                return;
            diveSide = side == 0f ? 1f : Mathf.Sign(side);
            diveTimer = DiveDuration;
        }
    }
}
