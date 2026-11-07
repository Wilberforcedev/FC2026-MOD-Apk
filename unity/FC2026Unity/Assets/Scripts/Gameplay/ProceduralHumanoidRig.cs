using UnityEngine;

namespace FC2026.Gameplay
{
    public sealed class ProceduralHumanoidRig : MonoBehaviour
    {
        private static Texture2D skinGrainTexture;
        private static Texture2D kitWeaveTexture;
        private int faceVariantIndex;
        private bool useOwnerFace;

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
            bool goalkeeper,
            bool ownerLikeness = false,
            int skinTone = -1,
            int hairColor = -1,
            int faceVariant = -1,
            int hairStyle = -1,
            int jerseyNumber = 0)
        {
            HeightScale = Mathf.Clamp(heightScale, 0.88f, 1.18f);
            WidthScale = Mathf.Clamp(widthScale, 0.82f, 1.18f);
            IsGoalkeeper = goalkeeper;
            faceVariantIndex = faceVariant >= 0
                ? faceVariant % 3
                : (GetInstanceID() & int.MaxValue) % 3;
            useOwnerFace = ownerLikeness;

            var detailedShirt = CreateTexturedMaterial(shirt, GetKitWeaveTexture());
            var detailedShorts = CreateTexturedMaterial(shorts, GetKitWeaveTexture());
            var detailedSkin = CreateTexturedMaterial(skin, GetSkinGrainTexture());
            var detailedSocks = CreateTexturedMaterial(socks, GetKitWeaveTexture());
            var detailedHair = CreateTexturedMaterial(hair, GetSkinGrainTexture());
            if (hairColor >= 0)
                detailedHair.color = HairColorFor(hairColor);
            detailedSkin.color = useOwnerFace
                ? new Color(0.64f, 0.42f, 0.30f)
                : SkinColorFor(skinTone >= 0 ? skinTone : faceVariantIndex);

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
            CreatePart("Pelvis / Shorts", PrimitiveType.Sphere, Hips, new Vector3(0f, -0.035f * HeightScale, 0f), new Vector3(0.48f * WidthScale, 0.31f * HeightScale, 0.37f * WidthScale), detailedShorts);
            CreateTaperedTorso("Athletic Torso", Spine, detailedShirt);
            CreatePart("Left Shoulder", PrimitiveType.Sphere, Chest, new Vector3(-0.275f * WidthScale, 0.09f * HeightScale, 0f), new Vector3(0.28f * WidthScale, 0.29f * HeightScale, 0.31f * WidthScale), detailedShirt);
            CreatePart("Right Shoulder", PrimitiveType.Sphere, Chest, new Vector3(0.275f * WidthScale, 0.09f * HeightScale, 0f), new Vector3(0.28f * WidthScale, 0.29f * HeightScale, 0.31f * WidthScale), detailedShirt);

            CreatePart("Neck", PrimitiveType.Capsule, Chest, new Vector3(0f, 0.14f * HeightScale, 0f), new Vector3(0.105f * WidthScale, 0.14f * HeightScale, 0.105f * WidthScale), detailedSkin);
            CreatePart("Head Mesh", PrimitiveType.Sphere, Head, Vector3.zero, new Vector3(0.30f, 0.34f, 0.29f), detailedSkin);
            CreatePart("Left Ear", PrimitiveType.Sphere, Head, new Vector3(-0.145f, 0.005f, 0f), new Vector3(0.075f, 0.105f, 0.075f), detailedSkin);
            CreatePart("Right Ear", PrimitiveType.Sphere, Head, new Vector3(0.145f, 0.005f, 0f), new Vector3(0.075f, 0.105f, 0.075f), detailedSkin);
            CreatePart("Left Ear Fold", PrimitiveType.Sphere, Head, new Vector3(-0.15f, 0.01f, 0.058f), new Vector3(0.035f, 0.063f, 0.018f), detailedSkin);
            CreatePart("Right Ear Fold", PrimitiveType.Sphere, Head, new Vector3(0.15f, 0.01f, 0.058f), new Vector3(0.035f, 0.063f, 0.018f), detailedSkin);
            CreateHair(detailedHair, hairStyle);
            CreateTexturedFace(detailedSkin, detailedHair);
            CreateJerseyNumbers(shirt, jerseyNumber);

            CreateLimb(LeftUpperArm, "Left Sleeve", 0.28f, 0.125f, detailedShirt);
            CreateLimb(LeftLowerArm, "Left Forearm", 0.28f, 0.092f, detailedSkin);
            CreateLimb(RightUpperArm, "Right Sleeve", 0.28f, 0.125f, detailedShirt);
            CreateLimb(RightLowerArm, "Right Forearm", 0.28f, 0.092f, detailedSkin);
            CreatePart("Left Elbow", PrimitiveType.Sphere, LeftLowerArm, new Vector3(0f, 0.12f * HeightScale, 0f), new Vector3(0.19f, 0.17f, 0.19f), detailedSkin);
            CreatePart("Right Elbow", PrimitiveType.Sphere, RightLowerArm, new Vector3(0f, 0.12f * HeightScale, 0f), new Vector3(0.19f, 0.17f, 0.19f), detailedSkin);

            CreateLimb(LeftUpperLeg, "Left Thigh", 0.37f, 0.14f * WidthScale, detailedSkin);
            CreateLimb(LeftUpperLeg, "Left Shorts Leg", 0.22f, 0.15f * WidthScale, detailedShorts);
            CreateLimb(LeftLowerLeg, "Left Sock", 0.35f, 0.115f * WidthScale, detailedSocks);
            CreateLimb(RightUpperLeg, "Right Thigh", 0.37f, 0.14f * WidthScale, detailedSkin);
            CreateLimb(RightUpperLeg, "Right Shorts Leg", 0.22f, 0.15f * WidthScale, detailedShorts);
            CreateLimb(RightLowerLeg, "Right Sock", 0.35f, 0.115f * WidthScale, detailedSocks);

            CreatePart("Left Boot", PrimitiveType.Capsule, LeftFoot, new Vector3(0f, -0.015f, 0.12f), new Vector3(0.09f, 0.075f, 0.17f), boots);
            CreatePart("Right Boot", PrimitiveType.Capsule, RightFoot, new Vector3(0f, -0.015f, 0.12f), new Vector3(0.09f, 0.075f, 0.17f), boots);

            var leftHand = CreatePart("Left Hand", PrimitiveType.Sphere, LeftLowerArm, new Vector3(0f, -0.28f * HeightScale, 0.015f), new Vector3(0.105f, 0.14f, 0.08f), detailedSkin);
            var rightHand = CreatePart("Right Hand", PrimitiveType.Sphere, RightLowerArm, new Vector3(0f, -0.28f * HeightScale, 0.015f), new Vector3(0.105f, 0.14f, 0.08f), detailedSkin);

            if (goalkeeper)
            {
                leftHand.transform.localScale *= 1.35f;
                rightHand.transform.localScale *= 1.35f;
            }
        }

        private void CreateHair(Material material, int style)
        {
            var selected = style >= 0 ? style % 6 : (GetInstanceID() & int.MaxValue) % 6;
            switch (selected)
            {
                case 1: // close crop
                    CreatePart("Close Crop", PrimitiveType.Sphere, Head,
                        new Vector3(0f, 0.13f, -0.045f), new Vector3(0.28f, 0.09f, 0.27f), material);
                    break;
                case 2: // rounded curls
                    CreatePart("Curly Hair", PrimitiveType.Sphere, Head,
                        new Vector3(0f, 0.13f, -0.055f), new Vector3(0.34f, 0.18f, 0.33f), material);
                    break;
                case 3: // swept top
                    var swept = CreatePart("Swept Hair", PrimitiveType.Sphere, Head,
                        new Vector3(0.035f, 0.14f, -0.055f), new Vector3(0.32f, 0.13f, 0.29f), material);
                    swept.transform.localRotation = Quaternion.Euler(0f, 0f, -12f);
                    break;
                case 4: // short tied-back style
                    CreatePart("Tied Back Hair", PrimitiveType.Sphere, Head,
                        new Vector3(0f, 0.12f, -0.07f), new Vector3(0.30f, 0.13f, 0.29f), material);
                    CreatePart("Hair Tie", PrimitiveType.Sphere, Head,
                        new Vector3(0f, -0.035f, -0.22f), new Vector3(0.12f, 0.17f, 0.12f), material);
                    break;
                case 5: // shaved
                    CreatePart("Shaved Hair", PrimitiveType.Sphere, Head,
                        new Vector3(0f, 0.145f, -0.045f), new Vector3(0.27f, 0.065f, 0.25f), material);
                    break;
                default: // classic short
                    CreatePart("Short Hair", PrimitiveType.Sphere, Head,
                        new Vector3(0f, 0.12f, -0.065f), new Vector3(0.31f, 0.14f, 0.30f), material);
                    break;
            }
        }

        private void CreateJerseyNumbers(Material shirt, int jerseyNumber)
        {
            if (jerseyNumber <= 0)
                return;

            var ink = shirt != null && shirt.color.grayscale > 0.56f
                ? new Color(0.055f, 0.065f, 0.085f)
                : new Color(0.96f, 0.96f, 0.92f);
            CreateJerseyNumber("Back Shirt Number", jerseyNumber, new Vector3(0f, 0.12f, -0.169f),
                Quaternion.Euler(0f, 180f, 0f), ink);
        }

        private void CreateJerseyNumber(string objectName, int jerseyNumber, Vector3 position,
            Quaternion rotation, Color color)
        {
            var numberObject = new GameObject(objectName);
            numberObject.transform.SetParent(Spine, false);
            numberObject.transform.localPosition = position;
            numberObject.transform.localRotation = rotation;

            var number = numberObject.AddComponent<TextMesh>();
            number.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (number.font == null)
                number.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            number.text = jerseyNumber.ToString();
            number.anchor = TextAnchor.MiddleCenter;
            number.alignment = TextAlignment.Center;
            number.fontSize = 80;
            number.characterSize = 0.105f;
            number.color = color;

            var renderer = numberObject.GetComponent<MeshRenderer>();
            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            renderer.receiveShadows = false;
        }

        private void CreateTexturedFace(Material skin, Material hair)
        {
            var resourcePath = useOwnerFace ? "PlayerFaces/owner_face" : "PlayerFaces/face_0" + (faceVariantIndex + 1);
            var faceTexture = Resources.Load<Texture2D>(resourcePath);
            if (faceTexture == null)
            {
                CreateFallbackFace(skin, hair);
                return;
            }

            const int rings = 18;
            const int sides = 40;
            const float faceRadiusX = 0.235f;
            const float faceRadiusY = 0.285f;
            const float faceCenterY = -0.005f;
            var vertices = new Vector3[1 + rings * sides];
            var uvs = new Vector2[vertices.Length];
            var triangles = new int[sides * 3 + (rings - 1) * sides * 6];
            vertices[0] = new Vector3(0f, faceCenterY, 0.294f);
            uvs[0] = new Vector2(0.5f, 0.5f);

            for (var ring = 1; ring <= rings; ring++)
            {
                var radius = ring / (float)rings;
                for (var side = 0; side < sides; side++)
                {
                    var angle = side * Mathf.PI * 2f / sides;
                    var x = Mathf.Cos(angle) * faceRadiusX * radius;
                    var y = faceCenterY + Mathf.Sin(angle) * faceRadiusY * radius;
                    var ellipsoid = Mathf.Max(0.04f, 1f - x * x / (0.30f * 0.30f) - y * y / (0.34f * 0.34f));
                    var index = 1 + (ring - 1) * sides + side;
                    vertices[index] = new Vector3(x, y, 0.29f * Mathf.Sqrt(ellipsoid) + 0.003f);
                    uvs[index] = new Vector2(0.5f + x / (2f * faceRadiusX), 0.5f + (y - faceCenterY) / (2f * faceRadiusY));
                }
            }

            var triangle = 0;
            for (var side = 0; side < sides; side++)
            {
                triangles[triangle++] = 0;
                triangles[triangle++] = 1 + side;
                triangles[triangle++] = 1 + (side + 1) % sides;
            }

            for (var ring = 1; ring < rings; ring++)
            for (var side = 0; side < sides; side++)
            {
                var next = (side + 1) % sides;
                var inner = 1 + (ring - 1) * sides;
                var outer = 1 + ring * sides;
                triangles[triangle++] = inner + side;
                triangles[triangle++] = outer + side;
                triangles[triangle++] = outer + next;
                triangles[triangle++] = inner + side;
                triangles[triangle++] = outer + next;
                triangles[triangle++] = inner + next;
            }

            var mesh = new Mesh { name = "Textured Player Face" };
            mesh.vertices = vertices;
            mesh.uv = uvs;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            var shader = Shader.Find("Standard");
            var faceMaterial = new Material(shader) { mainTexture = faceTexture };
            faceMaterial.SetFloat("_Glossiness", 0.22f);
            var face = new GameObject("Photographic Face Texture");
            face.transform.SetParent(Head, false);
            face.AddComponent<MeshFilter>().sharedMesh = mesh;
            var faceRenderer = face.AddComponent<MeshRenderer>();
            faceRenderer.sharedMaterial = faceMaterial;
            faceRenderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            faceRenderer.receiveShadows = false;
        }

        private void CreateFallbackFace(Material skin, Material hair)
        {
            CreatePart("Fallback Face Surface", PrimitiveType.Sphere, Head,
                new Vector3(0f, 0f, 0.235f), new Vector3(0.4f, 0.58f, 0.08f), skin);
            var dark = new Material(skin)
            {
                name = "Procedural Face Details",
                mainTexture = null,
                color = new Color(0.055f, 0.038f, 0.03f)
            };
            var nose = new Material(skin)
            {
                name = "Procedural Nose Detail",
                mainTexture = null,
                color = Color.Lerp(skin.color, Color.white, 0.1f)
            };
            var mouth = new Material(skin)
            {
                name = "Procedural Mouth Detail",
                mainTexture = null,
                color = new Color(0.27f, 0.1f, 0.09f)
            };

            CreatePart("Left Eye", PrimitiveType.Sphere, Head,
                new Vector3(-0.082f, 0.048f, 0.28f), new Vector3(0.052f, 0.026f, 0.018f), dark);
            CreatePart("Right Eye", PrimitiveType.Sphere, Head,
                new Vector3(0.082f, 0.048f, 0.28f), new Vector3(0.052f, 0.026f, 0.018f), dark);
            CreatePart("Left Brow", PrimitiveType.Cube, Head,
                new Vector3(-0.082f, 0.092f, 0.278f), new Vector3(0.09f, 0.018f, 0.018f), hair);
            CreatePart("Right Brow", PrimitiveType.Cube, Head,
                new Vector3(0.082f, 0.092f, 0.278f), new Vector3(0.09f, 0.018f, 0.018f), hair);
            CreatePart("Nose", PrimitiveType.Sphere, Head,
                new Vector3(0f, -0.005f, 0.295f), new Vector3(0.045f, 0.07f, 0.04f), nose);
            CreatePart("Mouth", PrimitiveType.Capsule, Head,
                new Vector3(0f, -0.105f, 0.278f), new Vector3(0.072f, 0.013f, 0.012f), mouth);
        }

        private static Color SkinColorFor(int skinTone)
        {
            switch (Mathf.Clamp(skinTone, 0, 4))
            {
                case 0:
                    return new Color(0.86f, 0.68f, 0.55f);
                case 1:
                    return new Color(0.76f, 0.56f, 0.42f);
                case 2:
                    return new Color(0.64f, 0.44f, 0.31f);
                case 3:
                    return new Color(0.45f, 0.29f, 0.20f);
                default:
                    return new Color(0.32f, 0.20f, 0.14f);
            }
        }

        private static Color HairColorFor(int hairColor)
        {
            switch (Mathf.Clamp(hairColor, 0, 3))
            {
                case 0:
                    return new Color(0.035f, 0.025f, 0.02f);
                case 1:
                    return new Color(0.13f, 0.08f, 0.05f);
                case 2:
                    return new Color(0.26f, 0.16f, 0.08f);
                default:
                    return new Color(0.62f, 0.48f, 0.24f);
            }
        }

        private static Material CreateTexturedMaterial(Material source, Texture2D detailTexture)
        {
            var material = new Material(source);
            material.mainTexture = detailTexture;
            material.mainTextureScale = new Vector2(2f, 2f);
            return material;
        }

        private static Texture2D GetSkinGrainTexture()
        {
            if (skinGrainTexture != null)
                return skinGrainTexture;

            skinGrainTexture = CreateFineTexture("Subtle Skin Grain", 64, (x, y) =>
            {
                var smallPores = Mathf.Sin(x * Mathf.PI * 2f / 8f) * Mathf.Sin(y * Mathf.PI * 2f / 8f);
                var broadVariation = Mathf.Sin(x * Mathf.PI * 14f / 64f) * Mathf.Sin(y * Mathf.PI * 22f / 64f);
                var value = 0.975f + smallPores * 0.012f + broadVariation * 0.01f;
                return new Color(value, value, value, 1f);
            });
            return skinGrainTexture;
        }

        private static Texture2D GetKitWeaveTexture()
        {
            if (kitWeaveTexture != null)
                return kitWeaveTexture;

            kitWeaveTexture = CreateFineTexture("Fine Kit Weave", 32, (x, y) =>
            {
                var thread = ((x + y) & 1) == 0 ? 0.96f : 1f;
                var seam = x % 8 == 0 || y % 8 == 0 ? 0.94f : 1f;
                var value = thread * seam;
                return new Color(value, value, value, 1f);
            });
            return kitWeaveTexture;
        }

        private static Texture2D CreateFineTexture(string name, int size, System.Func<int, int, Color> pixel)
        {
            var texture = new Texture2D(size, size, TextureFormat.RGB24, true) { name = name, wrapMode = TextureWrapMode.Repeat, filterMode = FilterMode.Bilinear };
            var colors = new Color[size * size];
            for (var y = 0; y < size; y++)
            for (var x = 0; x < size; x++)
                colors[y * size + x] = pixel(x, y);
            texture.SetPixels(colors);
            texture.Apply(true, true);
            return texture;
        }

        private void CreateTaperedTorso(string name, Transform parent, Material material)
        {
            var heights = new[] { -0.32f, -0.23f, -0.10f, 0.08f, 0.24f, 0.39f, 0.51f };
            var radiusX = new[] { 0.22f, 0.245f, 0.255f, 0.28f, 0.32f, 0.335f, 0.235f };
            var radiusZ = new[] { 0.13f, 0.145f, 0.15f, 0.16f, 0.17f, 0.175f, 0.13f };
            const int sides = 20;
            var vertices = new Vector3[heights.Length * sides + 2];
            var uvs = new Vector2[vertices.Length];
            var triangles = new int[(heights.Length - 1) * sides * 6 + sides * 6];

            for (var ring = 0; ring < heights.Length; ring++)
            for (var side = 0; side < sides; side++)
            {
                var angle = side * Mathf.PI * 2f / sides;
                vertices[ring * sides + side] = new Vector3(
                    Mathf.Cos(angle) * radiusX[ring] * WidthScale,
                    heights[ring] * HeightScale,
                    Mathf.Sin(angle) * radiusZ[ring] * WidthScale);
                uvs[ring * sides + side] = new Vector2(side / (float)sides, ring / (float)(heights.Length - 1));
            }

            var bottomCenter = vertices.Length - 2;
            var topCenter = vertices.Length - 1;
            vertices[bottomCenter] = new Vector3(0f, heights[0] * HeightScale, 0f);
            vertices[topCenter] = new Vector3(0f, heights[heights.Length - 1] * HeightScale, 0f);
            uvs[bottomCenter] = new Vector2(0.5f, 0f);
            uvs[topCenter] = new Vector2(0.5f, 1f);

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
            mesh.uv = uvs;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            var torso = new GameObject(name);
            torso.transform.SetParent(parent, false);
            torso.AddComponent<MeshFilter>().sharedMesh = mesh;
            var torsoRenderer = torso.AddComponent<MeshRenderer>();
            torsoRenderer.sharedMaterial = material;
            torsoRenderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
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
            var renderer = part.GetComponent<Renderer>();
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            renderer.receiveShadows = false;

            var collider = part.GetComponent<Collider>();
            if (collider != null)
                Object.Destroy(collider);

            return part;
        }
    }
}
