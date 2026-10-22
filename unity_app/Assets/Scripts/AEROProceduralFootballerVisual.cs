using System.Collections.Generic;
using UnityEngine;

namespace FC2026
{
    /// <summary>
    /// Lightweight, articulated fallback visual for the mobile prototype. Builds separate
    /// torso/head/arm/leg meshes and animates a simple gait. This is not a skinned,
    /// motion-captured or production-quality humanoid rig.
    /// </summary>
    public sealed class AEROProceduralFootballerVisual : MonoBehaviour
    {
        [SerializeField, Range(0.7f, 1.2f)] private float bodyScale = 1f;
        private static readonly Dictionary<int, Material> SharedMaterials = new();
        private readonly List<Renderer> renderers = new();
        private Transform leftLeg;
        private Transform rightLeg;
        private Transform leftArm;
        private Transform rightArm;
        private Transform head;
        private Vector3 lastWorldPosition;
        private float gaitPhase;
        private bool built;

        public void Build(Color primary, Color secondary, bool goalkeeper, int shirtNumber)
        {
            if (built) return;
            built = true;
            renderers.Clear();
            Color kit = goalkeeper ? new Color(0.98f, 0.68f, 0.08f) : primary;
            Color trim = secondary;
            Color skin = new Color(0.73f, 0.49f, 0.34f);
            Color shorts = new Color(0.035f, 0.055f, 0.08f);
            Color socks = Color.Lerp(kit, Color.white, 0.16f);
            Color boots = new Color(0.025f, 0.035f, 0.045f);

            Part(PrimitiveType.Capsule, "Upper Body / Jersey", transform, new Vector3(0, 1.23f, 0),
                new Vector3(0.43f, 0.36f, 0.255f), kit);
            Part(PrimitiveType.Cube, "Shorts", transform, new Vector3(0, 0.76f, 0),
                new Vector3(0.39f, 0.22f, 0.26f), shorts);
            head = Part(PrimitiveType.Sphere, "Head", transform, new Vector3(0, 1.77f, 0.005f),
                new Vector3(0.265f, 0.29f, 0.255f), skin).transform;
            Part(PrimitiveType.Sphere, "Hair", transform, new Vector3(0, 1.89f, -0.005f),
                new Vector3(0.27f, 0.16f, 0.26f), new Color(0.055f, 0.035f, 0.025f));

            leftArm = NewPivot("Left Arm Pivot", new Vector3(-0.255f, 1.38f, 0));
            Part(PrimitiveType.Capsule, "Left Arm", leftArm, new Vector3(0, -0.19f, 0),
                new Vector3(0.13f, 0.23f, 0.13f), skin);
            rightArm = NewPivot("Right Arm Pivot", new Vector3(0.255f, 1.38f, 0));
            Part(PrimitiveType.Capsule, "Right Arm", rightArm, new Vector3(0, -0.19f, 0),
                new Vector3(0.13f, 0.23f, 0.13f), skin);

            leftLeg = NewPivot("Left Leg Pivot", new Vector3(-0.115f, 0.69f, 0));
            Part(PrimitiveType.Capsule, "Left Leg", leftLeg, new Vector3(0, -0.275f, 0),
                new Vector3(0.145f, 0.31f, 0.15f), skin);
            Part(PrimitiveType.Cube, "Left Boot", leftLeg, new Vector3(0, -0.565f, 0.065f),
                new Vector3(0.16f, 0.095f, 0.28f), boots);

            rightLeg = NewPivot("Right Leg Pivot", new Vector3(0.115f, 0.69f, 0));
            Part(PrimitiveType.Capsule, "Right Leg", rightLeg, new Vector3(0, -0.275f, 0),
                new Vector3(0.145f, 0.31f, 0.15f), skin);
            Part(PrimitiveType.Cube, "Right Boot", rightLeg, new Vector3(0, -0.565f, 0.065f),
                new Vector3(0.16f, 0.095f, 0.28f), boots);

            foreach (var renderer in renderers)
            {
                renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
                renderer.receiveShadows = true;
            }
            lastWorldPosition = transform.position;
        }

        private Transform NewPivot(string objectName, Vector3 localPosition)
        {
            var pivot = new GameObject(objectName);
            pivot.transform.SetParent(transform, false);
            pivot.transform.localPosition = localPosition;
            pivot.transform.localRotation = Quaternion.identity;
            return pivot.transform;
        }

        private GameObject Part(PrimitiveType type, string objectName, Transform parent,
            Vector3 localPosition, Vector3 localScale, Color color)
        {
            var part = GameObject.CreatePrimitive(type);
            part.name = objectName;
            part.transform.SetParent(parent, false);
            part.transform.localPosition = localPosition * bodyScale;
            part.transform.localScale = localScale * bodyScale;
            var collider = part.GetComponent<Collider>();
            if (collider != null) Destroy(collider);
            var renderer = part.GetComponent<Renderer>();
            renderer.sharedMaterial = GetSharedMaterial(color);
            renderers.Add(renderer);
            return part;
        }

        private static Material GetSharedMaterial(Color color)
        {
            Color32 c = color;
            int key = c.r | (c.g << 8) | (c.b << 16) | (c.a << 24);
            if (SharedMaterials.TryGetValue(key, out var cached) && cached != null) return cached;
            var shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Standard");
            var material = new Material(shader) { color = color, enableInstancing = true };
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", 0.22f);
            SharedMaterials[key] = material;
            return material;
        }

        private void LateUpdate()
        {
            if (!built || leftLeg == null || rightLeg == null) return;
            Vector3 current = transform.position;
            float speed = Vector3.Distance(current, lastWorldPosition) / Mathf.Max(Time.deltaTime, 0.001f);
            lastWorldPosition = current;
            float stride = Mathf.Clamp01(speed / 4f);
            gaitPhase += Time.deltaTime * (3f + speed * 2.5f);
            float swing = Mathf.Sin(gaitPhase) * 32f * stride;
            leftLeg.localRotation = Quaternion.Euler(swing, 0, 0);
            rightLeg.localRotation = Quaternion.Euler(-swing, 0, 0);
            leftArm.localRotation = Quaternion.Euler(-swing * 0.65f, 0, 0);
            rightArm.localRotation = Quaternion.Euler(swing * 0.65f, 0, 0);
            if (head != null) head.localRotation = Quaternion.Euler(0, Mathf.Sin(gaitPhase * 0.4f) * 2f * stride, 0);
        }
    }
}