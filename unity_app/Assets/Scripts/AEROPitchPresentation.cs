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
        }

        private void BuildStands(float halfX, float halfZ)
        {
            var standMaterial = Material(new Color(0.035f, 0.055f, 0.09f));
            for (int tier = 0; tier < 3; tier++)
            {
                var height = 2.2f + tier * 1.1f;
                var scale = new Vector3(8f, 1.6f, halfZ * 2f + 15f);
                Cube("AERO West Stand Tier " + tier, new Vector3(-halfX - 5f, height, 0), scale, standMaterial);
                Cube("AERO East Stand Tier " + tier, new Vector3(halfX + 5f, height, 0), scale, standMaterial);
            }
        }

        private void BuildGoalLinePlaceholder() { }

        private void Line(string name, Vector3 a, Vector3 b)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, true);
            var line = go.AddComponent<LineRenderer>();
            line.positionCount = 2;
            line.useWorldSpace = true;
            line.SetPosition(0, a); line.SetPosition(1, b);
            line.startWidth = line.endWidth = 0.11f;
            line.material = Material(LineColor);
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
            line.material = Material(LineColor);
            for (int i = 0; i <= points; i++)
            {
                float angle = Mathf.PI * 2f * i / points;
                line.SetPosition(i, center + new Vector3(Mathf.Cos(angle) * radius, 0, Mathf.Sin(angle) * radius));
            }
        }

        private void Box(string name, Vector3 center, Vector3 scale) => Cube(name, center, scale, Material(LineColor));

        private void Post(Transform parent, Vector3 position, Vector3 scale)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = "Goal frame";
            go.transform.SetParent(parent, true);
            go.transform.position = position;
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = Material(GoalColor);
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