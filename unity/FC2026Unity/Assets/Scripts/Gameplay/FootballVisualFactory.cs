using UnityEngine;

namespace FC2026.Gameplay
{
    public static class FootballVisualFactory
    {
        public static FootballMotionAnimator EnsureAnimatedRig(GameObject player, bool goalkeeper, float styleSeed)
        {
            var existingMotion = player.GetComponent<FootballMotionAnimator>();
            var existingRig = player.GetComponent<ProceduralHumanoidRig>();
            if (existingMotion != null && existingRig != null && existingRig.IsReady)
            {
                existingMotion.Configure(goalkeeper, styleSeed);
                return existingMotion;
            }

            var originalRenderers = player.GetComponentsInChildren<Renderer>(true);
            var capsule = player.GetComponent<CapsuleCollider>();
            var heightScale = capsule != null ? Mathf.Clamp(capsule.height / 1.82f, 0.88f, 1.18f) : 1f;
            var widthScale = capsule != null ? Mathf.Clamp(capsule.radius / 0.31f, 0.82f, 1.18f) : 1f;

            var shirt = FindMaterial(originalRenderers, "3D Body") ?? CreateMaterial(new Color(0.85f, 0.86f, 0.9f), 0.32f);
            var shorts = FindMaterial(originalRenderers, "Shorts") ?? CreateMaterial(new Color(0.08f, 0.1f, 0.18f), 0.28f);
            var skin = FindMaterial(originalRenderers, "Head") ?? CreateMaterial(new Color(0.64f, 0.42f, 0.28f), 0.34f);
            var hair = FindMaterial(originalRenderers, "Hair") ?? CreateMaterial(new Color(0.035f, 0.025f, 0.02f), 0.45f);
            var socks = goalkeeper ? shirt : shorts;
            var boots = CreateMaterial(styleSeed > 0.72f ? new Color(0.9f, 0.32f, 0.08f) : new Color(0.035f, 0.045f, 0.06f), 0.58f);

            var rig = existingRig ?? player.AddComponent<ProceduralHumanoidRig>();
            if (!rig.IsReady)
                rig.Build(shirt, shorts, skin, hair, socks, boots, heightScale, widthScale, goalkeeper);

            foreach (var renderer in originalRenderers)
                renderer.enabled = false;

            var motion = existingMotion ?? player.AddComponent<FootballMotionAnimator>();
            motion.Configure(goalkeeper, styleSeed);
            return motion;
        }

        private static Material FindMaterial(Renderer[] renderers, string objectName)
        {
            foreach (var renderer in renderers)
            {
                if (renderer != null && renderer.gameObject.name == objectName)
                    return renderer.material;
            }
            return null;
        }

        private static Material CreateMaterial(Color color, float smoothness)
        {
            var shader = Shader.Find("Standard") ?? Shader.Find("Universal Render Pipeline/Lit");
            var material = new Material(shader) { color = color };
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", smoothness);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
            return material;
        }
    }
}
