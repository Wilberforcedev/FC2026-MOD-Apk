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
            Hips = CreateBone("Hips", VisualRoot, new Vector3(0f, 0.91f * HeightScale, 0f));
            Spine = CreateBone("Spine", Hips, new Vector3(0f, 0.27f * HeightScale, 0f));
            Chest = CreateBone("Chest", Spine, new Vector3(0f, 0.28f * HeightScale, 0f));
            var neck = CreateBone("Neck", Chest, new Vector3(0f, 0.17f * HeightScale, 0f));
            Head = CreateBone("Head", neck, new Vector3(0f, 0.14f * HeightScale, 0f));

            LeftUpperArm = CreateBone("Left Upper Arm", Chest, new Vector3(-0.30f * WidthScale, 0.12f * HeightScale, 0f));
            LeftLowerArm = CreateBone("Left Lower Arm", LeftUpperArm, new Vector3(0f, -0.29f * HeightScale, 0f));
            RightUpperArm = CreateBone("Right Upper Arm", Chest, new Vector3(0.30f * WidthScale, 0.12f * HeightScale, 0f));
            RightLowerArm = CreateBone("Right Lower Arm", RightUpperArm, new Vector3(0f, -0.29f * HeightScale, 0f));

            LeftUpperLeg = CreateBone("Left Upper Leg", Hips, new Vector3(-0.13f * WidthScale, -0.09f * HeightScale, 0f));
            LeftLowerLeg = CreateBone("Left Lower Leg", LeftUpperLeg, new Vector3(0f, -0.40f * HeightScale, 0f));
            LeftFoot = CreateBone("Left Foot", LeftLowerLeg, new Vector3(0f, -0.35f * HeightScale, 0.08f));
            RightUpperLeg = CreateBone("Right Upper Leg", Hips, new Vector3(0.13f * WidthScale, -0.09f * HeightScale, 0f));
            RightLowerLeg = CreateBone("Right Lower Leg", RightUpperLeg, new Vector3(0f, -0.40f * HeightScale, 0f));
            RightFoot = CreateBone("Right Foot", RightLowerLeg, new Vector3(0f, -0.35f * HeightScale, 0.08f));

            // Smooth tapered trunk and rounded deltoids give the kit a shoulder-to-waist shape.
            CreatePart("Pelvis / Shorts", PrimitiveType.Sphere, Hips, new Vector3(0f, -0.035f * HeightScale, 0f), new Vector3(0.48f * WidthScale, 0.31f * HeightScale, 0.37f * WidthScale), shorts);
            CreateTaperedTorso("Athletic Torso", Spine, shirt);
            CreatePart("Left Shoulder", PrimitiveType.Sphere, Chest, new Vector3(-0.275f * WidthScale, 0.09f * HeightScale, 0f), new Vector3(0.28f * WidthScale, 0.29f * HeightScale, 0.31f * WidthScale), shirt);
            CreatePart("Right Shoulder", PrimitiveType.Sphere, Chest, new Vector3(0.275f * WidthScale, 0.09f * HeightScale, 0f), new Vector3(0.28f * WidthScale, 0.29f * HeightScale, 0.31f * WidthScale), shirt);

            CreatePart("Neck", PrimitiveType.Capsule, Chest, new Vector3(0f, 0.14f * HeightScale, 0f), new Vector3(0.105f * WidthScale, 0.14f * HeightScale, 0.105f * WidthScale), skin);
            CreatePart("Head Mesh", PrimitiveType.Sphere, Head, Vector3.zero, new Vector3(0.30f, 0.34f, 0.29f), skin);
            CreatePart("Left Ear", PrimitiveType.Sphere, Head, new Vector3(-0.145f, 0.005f, 0f), new Vector3(0.075f, 0.105f, 0.075f), skin);
            CreatePart("Right Ear", PrimitiveType.Sphere, Head, new Vector3(0.145f, 0.005f, 0f), new Vector3(0.075f, 0.105f, 0.075f), skin);
            CreatePart("Hair", PrimitiveType.Sphere, Head, new Vector3(0f, 0.12f, -0.015f), new Vector3(0.31f, 0.14f, 0.30f), hair);

            CreateLimb(LeftUpperArm, "Left Sleeve", 0.28f, 0.125f, shirt);
            CreateLimb(LeftLowerArm, "Left Forearm", 0.28f, 0.092f, skin);
            CreateLimb(RightUpperArm, "Right Sleeve", 0.28f, 0.125f, shirt);
            CreateLimb(RightLowerArm, "Right Forearm", 0.28f, 0.092f, skin);
            CreatePart("Left Elbow", PrimitiveType.Sphere, LeftLowerArm, new Vector3(0f, 0.12f * HeightScale, 0f), new Vector3(0.19f, 0.17f, 0.19f), skin);
            CreatePart("Right Elbow", PrimitiveType.Sphere, RightLowerArm, new Vector3(0f, 0.12f * HeightScale, 0f), new Vector3(0.19f, 0.17f, 0.19f), skin);

            CreateLimb(LeftUpperLeg, "Left Thigh", 0.37f, 0.14f * WidthScale, skin);
            CreateLimb(LeftUpperLeg, "Left Shorts Leg", 0.22f, 0.15f * WidthScale, shorts);
            CreateLimb(LeftLowerLeg, "Left Sock", 0.35f, 0.115f * WidthScale, socks);
            CreateLimb(RightUpperLeg, "Right Thigh", 0.37f, 0.14f * WidthScale, skin);
            CreateLimb(RightUpperLeg, "Right Shorts Leg", 0.22f, 0.15f * WidthScale, shorts);
            CreateLimb(RightLowerLeg, "Right Sock", 0.35f, 0.115f * WidthScale, socks);

            CreatePart("Left Boot", PrimitiveType.Capsule, LeftFoot, new Vector3(0f, -0.015f, 0.12f), new Vector3(0.09f, 0.075f, 0.17f), boots);
            CreatePart("Right Boot", PrimitiveType.Capsule, RightFoot, new Vector3(0f, -0.015f, 0.12f), new Vector3(0.09f, 0.075f, 0.17f), boots);

            var leftHand = CreatePart("Left Hand", PrimitiveType.Sphere, LeftLowerArm, new Vector3(0f, -0.28f * HeightScale, 0.015f), new Vector3(0.105f, 0.14f, 0.08f), skin);
            var rightHand = CreatePart("Right Hand", PrimitiveType.Sphere, RightLowerArm, new Vector3(0f, -0.28f * HeightScale, 0.015f), new Vector3(0.105f, 0.14f, 0.08f), skin);

            if (goalkeeper)
            {
                leftHand.transform.localScale *= 1.35f;
                rightHand.transform.localScale *= 1.35f;
            }
        }

        private void CreateTaperedTorso(string name, Transform parent, Material material)
        {
            var heights = new[] { -0.32f, -0.23f, -0.10f, 0.08f, 0.24f, 0.39f, 0.51f };
            var radiusX = new[] { 0.22f, 0.245f, 0.255f, 0.28f, 0.32f, 0.335f, 0.235f };
            var radiusZ = new[] { 0.13f, 0.145f, 0.15f, 0.16f, 0.17f, 0.175f, 0.13f };
            const int sides = 20;
            var vertices = new Vector3[heights.Length * sides + 2];
            var triangles = new int[(heights.Length - 1) * sides * 6 + sides * 6];

            for (var ring = 0; ring < heights.Length; ring++)
            for (var side = 0; side < sides; side++)
            {
                var angle = side * Mathf.PI * 2f / sides;
                vertices[ring * sides + side] = new Vector3(
                    Mathf.Cos(angle) * radiusX[ring] * WidthScale,
                    heights[ring] * HeightScale,
                    Mathf.Sin(angle) * radiusZ[ring] * WidthScale);
            }

            var bottomCenter = vertices.Length - 2;
            var topCenter = vertices.Length - 1;
            vertices[bottomCenter] = new Vector3(0f, heights[0] * HeightScale, 0f);
            vertices[topCenter] = new Vector3(0f, heights[heights.Length - 1] * HeightScale, 0f);

            var index = 0;
            for (var ring = 0; ring < heights.Length - 1; ring++)
            for (var side = 0; side < sides; side++)
            {
                var next = (side + 1) % sides;
                var lower = ring * sides + side;
                var lowerNext = ring * sides + next;
                var upper = (ring + 1) * sides + side;
                var upperNext = (ring + 1) * sides + next;
                triangles[index++] = lower;
                triangles[index++] = upper;
                triangles[index++] = upperNext;
                triangles[index++] = lower;
                triangles[index++] = upperNext;
                triangles[index++] = lowerNext;
            }

            for (var side = 0; side < sides; side++)
            {
                var next = (side + 1) % sides;
                triangles[index++] = bottomCenter;
                triangles[index++] = side;
                triangles[index++] = next;
                var top = (heights.Length - 1) * sides;
                triangles[index++] = topCenter;
                triangles[index++] = top + next;
                triangles[index++] = top + side;
            }

            var mesh = new Mesh { name = name + " Mesh" };
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            var torso = new GameObject(name);
            torso.transform.SetParent(parent, false);
            torso.AddComponent<MeshFilter>().sharedMesh = mesh;
            torso.AddComponent<MeshRenderer>().sharedMaterial = material;
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
