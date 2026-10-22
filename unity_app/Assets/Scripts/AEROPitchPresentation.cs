using System.Collections;
using UnityEngine;

namespace FC2026
{
    /// <summary>Lightweight 3D match dressing: pitch markings, goals, and stadium stands.</summary>
    public sealed class AEROPitchPresentation : MonoBehaviour
    {
        private static readonly Color LineColor = new Color(0.88f, 0.96f, 0.9f);
        private static readonly Color GoalColor = new Color(0.92f, 0.96f, 1f);
        private bool built;
        private Material lineMaterial;
        private Material goalMaterial;
        private Material standMaterial;
        private Material netMaterial;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Attach()
        {
            var arena = FindFirstObjectByType<MatchArenaBootstrap>();
            if (arena != null && arena.GetComponent<AEROPitchPresentation>() == null)
                arena.gameObject.AddComponent<AEROPitchPresentation>();
        }

        private IEnumerator Start()
        {
            // MatchArenaBootstrap creates its pitch in Start; wait until that pass completes.
            yield return null;
            BuildPresentation();
        }

        private void BuildPresentation()
        {
            if (built) return;
            var pitch = GameObject.Find("Pitch");
            if (pitch == null) return;
            built = true;
            var topY = pitch.transform.position.y + pitch.transform.localScale.y * 0.5f + 0.025f;
            var halfX = pitch.transform.localScale.x * 0.5f - 2.5f;
            var halfZ = pitch.transform.localScale.z * 0.5f - 2.5f;
            lineMaterial = Material(LineColor);
            goalMaterial = Material(GoalColor);
            standMaterial = Material(new Color(0.035f, 0.055f, 0.09f));
            netMaterial = Material(new Color(0.55f, 0.72f, 0.82f, 0.8f));
            BuildGrassStripes(pitch, halfX, halfZ);

            Line("Touchline North", new Vector3(-halfX, topY, halfZ), new Vector3(halfX, topY, halfZ));
            Line("Touchline South", new Vector3(-halfX, topY, -halfZ), new Vector3(halfX, topY, -halfZ));
            Line("Goal Line West", new Vector3(-halfX, topY, -halfZ), new Vector3(-halfX, topY, halfZ));
            Line("Goal Line East", new Vector3(halfX, topY, -halfZ), new Vector3(halfX, topY, halfZ));
            Line("Halfway Line", new Vector3(-halfX, topY, 0), new Vector3(halfX, topY, 0));
            Circle("Centre Circle", Vector3.up * (topY + 0.01f), 9.15f, 64);
            Circle("Centre Spot", new Vector3(0, topY + 0.015f, 0), 0.22f, 16);
            Box("West Penalty Box", new Vector3(-halfX + 16.5f, topY, 0), new Vector3(0.035f, 0.025f, 40.3f));
            Box("East Penalty Box", new Vector3(halfX - 16.5f, topY, 0), new Vector3(0.035f, 0.025f, 40.3f));
            BuildGoal(-halfX, topY, -1);
            BuildGoal(halfX, topY, 1);
            BuildStands(halfX, halfZ);
            var sun = new GameObject("AERO Matchday Lighting").AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.intensity = 1.05f;
            sun.color = new Color(0.78f, 0.86f, 1f);
            sun.transform.rotation = Quaternion.Euler(48f, -32f, 0f);
            sun.transform.SetParent(transform, true);
        }

        private void BuildGoal(float x, float y, int side)
        {
            var z = side * 0f;
            var root = new GameObject(side < 0 ? "West Goal" : "East Goal");
            root.transform.SetParent(transform, true);
            var depthDirection = side < 0 ? -1f : 1f;
            const float width = 7.32f, height = 2.44f, depth = 2.2f;
            Post(root.transform, new Vector3(x, y + height * 0.5f, z - width * 0.5f), new Vector3(0.14f, height, 0.14f));
            Post(root.transform, new Vector3(x, y + height * 0.5f, z + width * 0.5f), new Vector3(0.14f, height, 0.14f));
            Post(root.transform, new Vector3(x, y + height, z), new Vector3(0.14f, 0.14f, width));
            Post(root.transform, new Vector3(x + depthDirection * depth, y + height * 0.5f, z - width * 0.5f), new Vector3(0.08f, height, 0.08f));
            Post(root.transform, new Vector3(x + depthDirection * depth, y + height * 0.5f, z + width * 0.5f), new Vector3(0.08f, height, 0.08f));
            Post(root.transform, new Vector3(x + depthDirection * depth, y + height, z), new Vector3(0.08f, 0.08f, width));
            // A lightweight net lattice gives the goal a visible depth cue without cloth simulation.
            for (int i = 0; i <= 6; i++)
            {
                float netZ = z - width * 0.5f + width * i / 6f;
                Line("Goal Net Vertical", new Vector3(x + depthDirection * depth, y, netZ), new Vector3(x + depthDirection * depth, y + height, netZ), 0.025f, netMaterial);
            }
            for (int row = 1; row <= 3; row++)
            {
                float netY = y + height * row / 4f;
                Line("Goal Net Horizontal", new Vector3(x, netY, z - width * 0.5f), new Vector3(x + depthDirection * depth, netY, z - width * 0.5f), 0.025f, netMaterial);
                Line("Goal Net Horizontal", new Vector3(x, netY, z + width * 0.5f), new Vector3(x + depthDirection * depth, netY, z + width * 0.5f), 0.025f, netMaterial);
                Line("Goal Net Rear", new Vector3(x + depthDirection * depth, netY, z - width * 0.5f), new Vector3(x + depthDirection * depth, netY, z + width * 0.5f), 0.025f, netMaterial);
            }
            Line("Goal Net Side", new Vector3(x, y, z - width * 0.5f), new Vector3(x + depthDirection * depth, y, z - width * 0.5f), 0.025f, netMaterial);
            Line("Goal Net Side", new Vector3(x, y, z + width * 0.5f), new Vector3(x + depthDirection * depth, y, z + width * 0.5f), 0.025f, netMaterial);
        }

        private void BuildGrassStripes(GameObject pitch, float halfX, float halfZ)
        {
            var first = Material(new Color(0.035f, 0.29f, 0.12f));
            var second = Material(new Color(0.045f, 0.34f, 0.145f));
            const int stripeCount = 10;
            float stripeLength = (halfZ * 2f + 5f) / stripeCount;
            for (int i = 0; i < stripeCount; i++)
            {
                var stripe = GameObject.CreatePrimitive(PrimitiveType.Cube);
                stripe.name = "AERO Grass Mowing Stripe " + (i + 1);
                stripe.transform.SetParent(transform, true);
                stripe.transform.position = new Vector3(pitch.transform.position.x, pitch.transform.position.y + pitch.transform.localScale.y * 0.5f + 0.006f,
                    -halfZ - 2.5f + stripeLength * (i + 0.5f));
                stripe.transform.localScale = new Vector3(halfX * 2f + 5f, 0.008f, stripeLength + 0.02f);
                stripe.GetComponent<Renderer>().sharedMaterial = i % 2 == 0 ? first : second;
                Destroy(stripe.GetComponent<Collider>());
            }
        }

        private void BuildStands(float halfX, float halfZ)
        {
            for (int tier = 0; tier < 3; tier++)
            {
                var height = 2.2f + tier * 1.1f;
                var sideScale = new Vector3(8f, 1.6f, halfZ * 2f + 15f);
                var endScale = new Vector3(halfX * 2f + 15f, 1.6f, 8f);
                Cube("AERO West Stand Tier " + tier, new Vector3(-halfX - 5f, height, 0), sideScale, standMaterial);
                Cube("AERO East Stand Tier " + tier, new Vector3(halfX + 5f, height, 0), sideScale, standMaterial);
                Cube("AERO North Stand Tier " + tier, new Vector3(0, height, halfZ + 5f), endScale, standMaterial);
                Cube("AERO South Stand Tier " + tier, new Vector3(0, height, -halfZ - 5f), endScale, standMaterial);
            }

            // Two inexpensive non-shadow-casting spotlights add stadium depth on mid/high presets.
            foreach (float x in new[] { -halfX - 8f, halfX + 8f })
            foreach (float z in new[] { -halfZ - 8f, halfZ + 8f })
            {
                var lightObject = new GameObject("AERO Stadium Floodlight");
                lightObject.transform.SetParent(transform, true);
                lightObject.transform.position = new Vector3(x, 15f, z);
                lightObject.transform.rotation = Quaternion.LookRotation(new Vector3(-x * 0.18f, -15f, -z * 0.18f));
                var light = lightObject.AddComponent<Light>();
                light.type = LightType.Spot;
                light.range = 48f;
                light.spotAngle = 82f;
                light.intensity = 1.25f;
                light.color = new Color(0.62f, 0.79f, 1f);
                light.shadows = LightShadows.None;
            }
        }

        private void BuildGoalLinePlaceholder() { }

        private void Line(string name, Vector3 a, Vector3 b) => Line(name, a, b, 0.11f, lineMaterial);

        private void Line(string name, Vector3 a, Vector3 b, float width, Material overrideMaterial)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, true);
            var line = go.AddComponent<LineRenderer>();
            line.positionCount = 2;
            line.useWorldSpace = true;
            line.SetPosition(0, a); line.SetPosition(1, b);
            line.startWidth = line.endWidth = width;
            line.material = overrideMaterial != null ? overrideMaterial : Material(LineColor);
            line.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        }

        private void Circle(string name, Vector3 center, float radius, int points)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, true);
            var line = go.AddComponent<LineRenderer>();
            line.positionCount = points + 1;
            line.useWorldSpace = true;
            line.loop = false;
            line.startWidth = line.endWidth = 0.11f;
            line.material = lineMaterial != null ? lineMaterial : Material(LineColor);
            for (int i = 0; i <= points; i++)
            {
                float angle = Mathf.PI * 2f * i / points;
                line.SetPosition(i, center + new Vector3(Mathf.Cos(angle) * radius, 0, Mathf.Sin(angle) * radius));
            }
        }

        private void Box(string name, Vector3 center, Vector3 scale) => Cube(name, center, scale, lineMaterial != null ? lineMaterial : Material(LineColor));

        private void Post(Transform parent, Vector3 position, Vector3 scale)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = "Goal frame";
            go.transform.SetParent(parent, true);
            go.transform.position = position;
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = goalMaterial != null ? goalMaterial : Material(GoalColor);
            Destroy(go.GetComponent<Collider>());
        }

        private void Cube(string name, Vector3 position, Vector3 scale, Material material)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = name;
            go.transform.SetParent(transform, true);
            go.transform.position = position;
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = material;
            Destroy(go.GetComponent<Collider>());
        }

        private static Material Material(Color color)
        {
            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            var material = new Material(shader);
            material.color = color;
            return material;
        }
    }
}