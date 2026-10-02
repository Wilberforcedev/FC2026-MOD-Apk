using UnityEngine;

namespace FC2026.Gameplay
{
    public sealed class ProceduralHumanoidRig : MonoBehaviour
    {
        public Transform VisualRoot { get; private set; }
        public Transform Hips { get; private set; }
        public Transform Spine { get; private set; }
        public Transform Chest { get; private set; }
        public Transform Head { get; private set; }
        public Transform LeftUpperArm { get; private set; }
        public Transform LeftLowerArm { get; private set; }
        public Transform RightUpperArm { get; private set; }
        public Transform RightLowerArm { get; private set; }
        public Transform LeftUpperLeg { get; private set; }
        public Transform LeftLowerLeg { get; private set; }
        public Transform RightUpperLeg { get; private set; }
        public Transform RightLowerLeg { get; private set; }
        public Transform LeftFoot { get; private set; }
        public Transform RightFoot { get; private set; }

        public float HeightScale { get; private set; } = 1f;
        public float WidthScale { get; private set; } = 1f;
        public bool IsGoalkeeper { get; private set; }
        public bool IsReady => VisualRoot != null;

        public void Build(
            Material shirt,
            Material shorts,
            Material skin,
            Material hair,
            Material socks,
            Material boots,
            float heightScale,
            float widthScale,
            bool goalkeeper)
        {
            HeightScale = Mathf.Clamp(heightScale, 0.88f, 1.18f);
            WidthScale = Mathf.Clamp(widthScale, 0.82f, 1.18f);
            IsGoalkeeper = goalkeeper;

            VisualRoot = CreateBone("Visual Rig", transform, Vector3.zero);
            Hips = CreateBone("Hips", VisualRoot, new Vector3(0f, 0.94f * HeightScale, 0f));
            Spine = CreateBone("Spine", Hips, new Vector3(0f, 0.28f * HeightScale, 0f));
            Chest = CreateBone("Chest", Spine, new Vector3(0f, 0.29f * HeightScale, 0f));
            var neck = CreateBone("Neck", Chest, new Vector3(0f, 0.28f * HeightScale, 0f));
            Head = CreateBone("Head", neck, new Vector3(0f, 0.19f * HeightScale, 0f));

            LeftUpperArm = CreateBone("Left Upper Arm", Chest, new Vector3(-0.32f * WidthScale, 0.18f * HeightScale, 0f));
            LeftLowerArm = CreateBone("Left Lower Arm", LeftUpperArm, new Vector3(0f, -0.32f * HeightScale, 0f));
            RightUpperArm = CreateBone("Right Upper Arm", Chest, new Vector3(0.32f * WidthScale, 0.18f * HeightScale, 0f));
            RightLowerArm = CreateBone("Right Lower Arm", RightUpperArm, new Vector3(0f, -0.32f * HeightScale, 0f));

            LeftUpperLeg = CreateBone("Left Upper Leg", Hips, new Vector3(-0.15f * WidthScale, -0.15f * HeightScale, 0f));
            LeftLowerLeg = CreateBone("Left Lower Leg", LeftUpperLeg, new Vector3(0f, -0.40f * HeightScale, 0f));
            LeftFoot = CreateBone("Left Foot", LeftLowerLeg, new Vector3(0f, -0.39f * HeightScale, 0.08f));
            RightUpperLeg = CreateBone("Right Upper Leg", Hips, new Vector3(0.15f * WidthScale, -0.15f * HeightScale, 0f));
            RightLowerLeg = CreateBone("Right Lower Leg", RightUpperLeg, new Vector3(0f, -0.40f * HeightScale, 0f));
            RightFoot = CreateBone("Right Foot", RightLowerLeg, new Vector3(0f, -0.39f * HeightScale, 0.08f));

            CreatePart("Pelvis / Shorts", PrimitiveType.Cube, Hips, new Vector3(0f, -0.05f, 0f), new Vector3(0.52f * WidthScale, 0.28f * HeightScale, 0.36f * WidthScale), shorts);
            CreatePart("Torso", PrimitiveType.Capsule, Spine, new Vector3(0f, 0.16f * HeightScale, 0f), new Vector3(0.48f * WidthScale, 0.42f * HeightScale, 0.34f * WidthScale), shirt);

            CreatePart("Head Mesh", PrimitiveType.Sphere, Head, Vector3.zero, Vector3.one * (0.38f * Mathf.Lerp(1f, HeightScale, 0.22f)), skin);
            CreatePart("Hair", PrimitiveType.Sphere, Head, new Vector3(0f, 0.14f, -0.015f), new Vector3(0.39f, 0.16f, 0.39f), hair);

            CreateLimb(LeftUpperArm, "Left Sleeve", 0.28f, 0.13f, shirt);
            CreateLimb(LeftLowerArm, "Left Forearm", 0.29f, 0.10f, skin);
            CreateLimb(RightUpperArm, "Right Sleeve", 0.28f, 0.13f, shirt);
            CreateLimb(RightLowerArm, "Right Forearm", 0.29f, 0.10f, skin);

            CreateLimb(LeftUpperLeg, "Left Thigh", 0.36f, 0.15f * WidthScale, skin);
            CreateLimb(LeftLowerLeg, "Left Sock", 0.34f, 0.12f * WidthScale, socks);
            CreateLimb(RightUpperLeg, "Right Thigh", 0.36f, 0.15f * WidthScale, skin);
            CreateLimb(RightLowerLeg, "Right Sock", 0.34f, 0.12f * WidthScale, socks);

            CreatePart("Left Boot", PrimitiveType.Cube, LeftFoot, new Vector3(0f, -0.02f, 0.12f), new Vector3(0.18f, 0.11f, 0.34f), boots);
            CreatePart("Right Boot", PrimitiveType.Cube, RightFoot, new Vector3(0f, -0.02f, 0.12f), new Vector3(0.18f, 0.11f, 0.34f), boots);

            var leftHand = CreatePart("Left Hand", PrimitiveType.Sphere, LeftLowerArm, new Vector3(0f, -0.31f * HeightScale, 0f), Vector3.one * 0.12f, skin);
            var rightHand = CreatePart("Right Hand", PrimitiveType.Sphere, RightLowerArm, new Vector3(0f, -0.31f * HeightScale, 0f), Vector3.one * 0.12f, skin);

            if (goalkeeper)
            {
                leftHand.transform.localScale *= 1.35f;
                rightHand.transform.localScale *= 1.35f;
            }
        }

        private void CreateLimb(Transform parent, string name, float length, float radius, Material material)
        {
            CreatePart(
                name,
                PrimitiveType.Capsule,
                parent,
                new Vector3(0f, -length * 0.52f * HeightScale, 0f),
                new Vector3(radius, length * 0.52f * HeightScale, radius),
                material);
        }

        private static Transform CreateBone(string name, Transform parent, Vector3 localPosition)
        {
            var bone = new GameObject(name).transform;
            bone.SetParent(parent, false);
            bone.localPosition = localPosition;
            bone.localRotation = Quaternion.identity;
            bone.localScale = Vector3.one;
            return bone;
        }

        private static GameObject CreatePart(string name, PrimitiveType type, Transform parent, Vector3 localPosition, Vector3 localScale, Material material)
        {
            var part = GameObject.CreatePrimitive(type);
            part.name = name;
            part.transform.SetParent(parent, false);
            part.transform.localPosition = localPosition;
            part.transform.localRotation = Quaternion.identity;
            part.transform.localScale = localScale;
            part.GetComponent<Renderer>().material = material;

            var collider = part.GetComponent<Collider>();
            if (collider != null)
                Object.Destroy(collider);

            return part;
        }
    }
}
