using UnityEngine;

namespace FC2026.Core
{
    public static class StadiumPresentation
    {
        public static void ApplyAtmosphere()
        {
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = 0.0024f;
            RenderSettings.fogColor = new Color(0.52f, 0.63f, 0.75f);
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.42f, 0.5f, 0.63f);
            RenderSettings.ambientEquatorColor = new Color(0.25f, 0.3f, 0.37f);
            RenderSettings.ambientGroundColor = new Color(0.11f, 0.13f, 0.15f);
            RenderSettings.reflectionIntensity = 0.6f;

            var skyShader = Shader.Find("Skybox/Procedural");
            if (skyShader == null)
                return;

            var sky = new Material(skyShader) { name = "FC2026 Dusk Sky" };
            sky.SetFloat("_SunSize", 0.04f);
            sky.SetFloat("_SunSizeConvergence", 6f);
            sky.SetFloat("_AtmosphereThickness", 1.12f);
            sky.SetColor("_SkyTint", new Color(0.5f, 0.64f, 0.84f));
            sky.SetColor("_GroundColor", new Color(0.14f, 0.17f, 0.2f));
            sky.SetFloat("_Exposure", 1.1f);
            RenderSettings.skybox = sky;
        }

        public static Material CreateGrassMaterial()
        {
            const int size = 256;
            var texture = new Texture2D(size, size, TextureFormat.RGB24, true)
            {
                name = "FC2026 Pitch Grass",
                wrapMode = TextureWrapMode.Repeat,
                filterMode = FilterMode.Trilinear,
                anisoLevel = 4
            };

            var dark = new Color(0.05f, 0.28f, 0.1f);
            var light = new Color(0.085f, 0.4f, 0.16f);
            var wear = new Color(0.12f, 0.32f, 0.13f);

            for (var y = 0; y < size; y++)
            {
                for (var x = 0; x < size; x++)
                {
                    var stripe = (y / 16) % 2 == 0 ? 0f : 1f;
                    var noise = Mathf.PerlinNoise(x * 0.09f + 3.1f, y * 0.09f + 7.7f);
                    var color = Color.Lerp(dark, light, stripe * 0.55f + noise * 0.25f);
                    if (noise < 0.24f)
                        color = Color.Lerp(color, wear, 0.4f);
                    texture.SetPixel(x, y, color);
                }
            }

            texture.Apply(true, false);

            var material = CreateStandardMaterial(Color.white, 0.22f);
            material.name = "FC2026 Grass";
            material.mainTexture = texture;
            material.mainTextureScale = new Vector2(5f, 8f);
            return material;
        }

        public static Material CreateCrowdMaterial(Color primary, Color secondary)
        {
            const int width = 256;
            const int height = 128;
            var texture = new Texture2D(width, height, TextureFormat.RGB24, true)
            {
                name = "FC2026 Crowd",
                wrapMode = TextureWrapMode.Repeat,
                filterMode = FilterMode.Bilinear
            };

            var seats = new Color(0.035f, 0.05f, 0.075f);
            var palette = new[]
            {
                primary, secondary,
                new Color(0.72f, 0.52f, 0.38f), new Color(0.92f, 0.92f, 0.9f),
                new Color(0.16f, 0.18f, 0.24f), new Color(0.85f, 0.68f, 0.18f)
            };

            for (var y = 0; y < height; y++)
            {
                for (var x = 0; x < width; x++)
                {
                    var hash = Mathf.Abs(Mathf.Sin(x * 12.9898f + y * 78.233f) * 43758.5453f) % 1f;
                    var color = Color.Lerp(seats, new Color(0.08f, 0.1f, 0.14f), hash * 0.5f);
                    var inSeatBlock = x % 5 != 0 && y % 4 != 0;
                    if (inSeatBlock && hash > 0.32f)
                        color = palette[Mathf.FloorToInt(hash * palette.Length) % palette.Length];
                    texture.SetPixel(x, y, color);
                }
            }

            texture.Apply(true, false);

            var material = CreateStandardMaterial(Color.white, 0.12f);
            material.name = "FC2026 Crowd";
            material.mainTexture = texture;
            material.mainTextureScale = new Vector2(9f, 1.5f);
            return material;
        }

        public static Material CreateBallMaterial()
        {
            const int width = 256;
            const int height = 128;
            var texture = new Texture2D(width, height, TextureFormat.RGB24, true)
            {
                name = "FC2026 Match Ball",
                wrapMode = TextureWrapMode.Repeat,
                filterMode = FilterMode.Trilinear
            };

            var white = new Color(0.97f, 0.98f, 1f);
            var panel = new Color(0.07f, 0.09f, 0.13f);
            for (var y = 0; y < height; y++)
            {
                for (var x = 0; x < width; x++)
                {
                    var seam = Mathf.Abs(Mathf.Sin(x * 0.16f) * Mathf.Cos(y * 0.1f));
                    var color = Color.Lerp(white, new Color(0.82f, 0.86f, 0.92f), seam * 0.16f);
                    var row = y / 32;
                    var centerX = (x + (row % 2) * 32) % 64;
                    var centerY = y % 32;
                    var dx = centerX - 32f;
                    var dy = (centerY - 16f) * 0.9f;
                    var angle = Mathf.Atan2(dy, dx);
                    var radius = 10f + Mathf.Cos(angle * 5f) * 1.4f;
                    if (dx * dx + dy * dy < radius * radius)
                        color = panel;
                    texture.SetPixel(x, y, color);
                }
            }

            texture.Apply(true, false);

            var material = CreateStandardMaterial(Color.white, 0.35f);
            material.name = "FC2026 Match Ball";
            material.mainTexture = texture;
            return material;
        }

        public static Material CreateAdBoardMaterial(Color accent)
        {
            const int width = 256;
            const int height = 64;
            var texture = new Texture2D(width, height, TextureFormat.RGB24, true)
            {
                name = "FC2026 LED Boards",
                wrapMode = TextureWrapMode.Repeat,
                filterMode = FilterMode.Bilinear
            };

            var background = new Color(0.015f, 0.03f, 0.05f);
            for (var y = 0; y < height; y++)
            {
                for (var x = 0; x < width; x++)
                {
                    var block = (x / 32) % 3;
                    var color = background;
                    if (y > 8 && y < height - 8)
                    {
                        color = block == 0 ? accent : block == 1 ? new Color(0.92f, 0.95f, 1f) : new Color(0.1f, 0.16f, 0.24f);
                        if (x % 32 < 4 || x % 32 > 27)
                            color = background;
                    }
                    texture.SetPixel(x, y, color);
                }
            }

            texture.Apply(true, false);

            var material = CreateStandardMaterial(Color.white, 0.45f);
            material.name = "FC2026 LED Boards";
            material.mainTexture = texture;
            material.mainTextureScale = new Vector2(12f, 1f);
            EnableEmission(material, accent * 0.45f);
            return material;
        }

        public static Material CreateMetalMaterial()
        {
            return CreateStandardMaterial(new Color(0.23f, 0.25f, 0.29f), 0.55f);
        }

        public static Material CreateFloodlightMaterial()
        {
            var material = CreateStandardMaterial(new Color(0.95f, 0.97f, 1f), 0.25f);
            EnableEmission(material, new Color(0.86f, 0.93f, 1f) * 1.4f);
            return material;
        }

        public static void CreateFloodlightTowers(Transform parent, Material metal, Material glow)
        {
            for (var i = 0; i < 4; i++)
            {
                var x = i % 2 == 0 ? -43f : 43f;
                var z = i < 2 ? -67f : 67f;

                var tower = new GameObject($"Floodlight Tower {i + 1}");
                tower.transform.SetParent(parent);
                tower.transform.position = new Vector3(x, 0f, z);

                var mast = GameObject.CreatePrimitive(PrimitiveType.Cube);
                mast.name = "Mast";
                mast.transform.SetParent(tower.transform);
                mast.transform.localPosition = new Vector3(0f, 13f, 0f);
                mast.transform.localScale = new Vector3(0.5f, 26f, 0.5f);
                mast.GetComponent<Renderer>().material = metal;
                Object.Destroy(mast.GetComponent<Collider>());

                var panel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                panel.name = "Light Panel";
                panel.transform.SetParent(tower.transform);
                panel.transform.localPosition = new Vector3(0f, 26.5f, 0f);
                panel.transform.localScale = new Vector3(6f, 2.2f, 0.7f);
                panel.transform.LookAt(new Vector3(0f, 8f, 0f));
                panel.GetComponent<Renderer>().material = glow;
                Object.Destroy(panel.GetComponent<Collider>());
            }
        }

        private static Material CreateStandardMaterial(Color color, float smoothness)
        {
            var shader = Shader.Find("Standard") ?? Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Sprites/Default");
            var material = new Material(shader) { color = color };
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", smoothness);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
            return material;
        }

        private static void EnableEmission(Material material, Color color)
        {
            if (!material.HasProperty("_EmissionColor"))
                return;
            material.EnableKeyword("_EMISSION");
            material.SetColor("_EmissionColor", color);
            material.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
        }
    }
}
