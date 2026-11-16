using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Lightweight, runtime-generated presentation materials for the procedural
    /// match. Textures are deliberately small and mipmapped for mobile GPUs.
    /// </summary>
    public static class StadiumPresentation
    {
        public static void ApplyAtmosphere()
        {
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = 0.0018f;
            RenderSettings.fogColor = new Color(0.39f, 0.51f, 0.65f);
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.42f, 0.5f, 0.63f);
            RenderSettings.ambientEquatorColor = new Color(0.25f, 0.3f, 0.37f);
            RenderSettings.ambientGroundColor = new Color(0.11f, 0.13f, 0.15f);
            RenderSettings.reflectionIntensity = 0.45f;

            var skyShader = Shader.Find("Skybox/Procedural");
            if (skyShader == null)
                return;

            var sky = new Material(skyShader) { name = "FC2026 Dusk Sky" };
            sky.SetFloat("_SunSize", 0.035f);
            sky.SetFloat("_SunSizeConvergence", 6f);
            sky.SetFloat("_AtmosphereThickness", 1.2f);
            sky.SetColor("_SkyTint", new Color(0.43f, 0.56f, 0.75f));
            sky.SetColor("_GroundColor", new Color(0.11f, 0.14f, 0.18f));
            sky.SetFloat("_Exposure", 1.05f);
            RenderSettings.skybox = sky;
        }

        public static Material CreateGrassMaterial()
        {
            // Eight broad, longitudinal mowing bands read clearly at broadcast
            // distance without requiring a second mesh or a costly shader.
            const int size = 256;
            var texture = new Texture2D(size, size, TextureFormat.RGB24, true)
            {
                name = "FC2026 Mown Pitch Grass",
                wrapMode = TextureWrapMode.Clamp,
                filterMode = FilterMode.Trilinear,
                anisoLevel = 8
            };

            var dark = new Color(0.035f, 0.19f, 0.075f);
            var light = new Color(0.075f, 0.31f, 0.115f);
            var wear = new Color(0.105f, 0.245f, 0.09f);

            for (var y = 0; y < size; y++)
            {
                var band = (y / (size / 8)) % 2 == 0;
                for (var x = 0; x < size; x++)
                {
                    var broadNoise = Mathf.PerlinNoise(x * 0.035f + 3.1f, y * 0.035f + 7.7f);
                    var fineNoise = Mathf.PerlinNoise(x * 0.18f + 15.2f, y * 0.18f + 4.3f);
                    var color = Color.Lerp(dark, light, (band ? 0.72f : 0.18f) + broadNoise * 0.12f);
                    color = Color.Lerp(color, wear, Mathf.Clamp01((0.3f - broadNoise) * 0.45f));
                    color *= Mathf.Lerp(0.96f, 1.04f, fineNoise);
                    texture.SetPixel(x, y, color);
                }
            }

            texture.Apply(true, false);

            var material = CreateStandardMaterial(Color.white, 0.12f);
            material.name = "FC2026 Natural Pitch Grass";
            material.mainTexture = texture;
            material.mainTextureScale = Vector2.one;
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", 0f);
            return material;
        }

        public static Material CreateCrowdMaterial(Color primary, Color secondary)
        {
            const int width = 256;
            const int height = 128;
            var texture = new Texture2D(width, height, TextureFormat.RGB24, true)
            {
                name = "FC2026 Stadium Crowd",
                wrapMode = TextureWrapMode.Repeat,
                filterMode = FilterMode.Bilinear,
                anisoLevel = 2
            };

            var seats = new Color(0.025f, 0.04f, 0.06f);
            var palette = new[]
            {
                primary, secondary,
                new Color(0.67f, 0.48f, 0.36f), new Color(0.88f, 0.89f, 0.86f),
                new Color(0.12f, 0.15f, 0.2f), new Color(0.78f, 0.58f, 0.2f)
            };

            for (var y = 0; y < height; y++)
            {
                for (var x = 0; x < width; x++)
                {
                    var hash = Hash01(x / 2, y / 2);
                    var row = y % 8;
                    var seatColumn = x % 6;
                    var color = Color.Lerp(seats, new Color(0.075f, 0.09f, 0.12f), hash * 0.35f);

                    // Small grouped colour patches suggest spectators and seats at
                    // distance while avoiding hundreds of individual renderers.
                    if (row >= 1 && row <= 6 && seatColumn >= 1 && seatColumn <= 4 && hash > 0.28f)
                    {
                        var paletteIndex = Mathf.FloorToInt(Hash01(x / 6, y / 8) * palette.Length) % palette.Length;
                        color = palette[paletteIndex];
                        if (row == 1 || row == 6)
                            color *= 0.82f;
                    }
                    texture.SetPixel(x, y, color);
                }
            }

            texture.Apply(true, false);

            var material = CreateStandardMaterial(Color.white, 0.08f);
            material.name = "FC2026 Crowd and Seats";
            material.mainTexture = texture;
            material.mainTextureScale = new Vector2(5f, 1.15f);
            return material;
        }

        public static Material CreateBallMaterial()
        {
            const int width = 256;
            const int height = 128;
            var texture = new Texture2D(width, height, TextureFormat.RGB24, true)
            {
                name = "FC2026 Match Ball Panels",
                wrapMode = TextureWrapMode.Repeat,
                filterMode = FilterMode.Trilinear,
                anisoLevel = 4
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

            var material = CreateStandardMaterial(Color.white, 0.24f);
            material.name = "FC2026 Match Ball";
            material.mainTexture = texture;
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", 0f);
            return material;
        }

        public static Material CreateAdBoardMaterial(Color accent)
        {
            const int width = 256;
            const int height = 64;
            var texture = new Texture2D(width, height, TextureFormat.RGB24, true)
            {
                name = "FC2026 LED Advertising Boards",
                wrapMode = TextureWrapMode.Repeat,
                filterMode = FilterMode.Bilinear
            };

            var background = new Color(0.012f, 0.022f, 0.04f);
            for (var y = 0; y < height; y++)
            {
                for (var x = 0; x < width; x++)
                {
                    var block = (x / 32) % 3;
                    var color = background;
                    if (y > 8 && y < height - 8)
                    {
                        color = block == 0 ? accent : block == 1
                            ? new Color(0.82f, 0.9f, 0.96f)
                            : new Color(0.08f, 0.14f, 0.22f);
                        if (x % 32 < 4 || x % 32 > 27)
                            color = background;
                    }
                    texture.SetPixel(x, y, color);
                }
            }

            texture.Apply(true, false);

            var material = CreateStandardMaterial(Color.white, 0.28f);
            material.name = "FC2026 LED Advertising";
            material.mainTexture = texture;
            material.mainTextureScale = new Vector2(8f, 1f);
            EnableEmission(material, accent * 0.28f);
            return material;
        }

        public static Material CreateMetalMaterial()
        {
            return CreateStandardMaterial(new Color(0.19f, 0.22f, 0.27f), 0.68f);
        }

        public static Material CreateFloodlightMaterial()
        {
            var material = CreateStandardMaterial(new Color(0.95f, 0.97f, 1f), 0.2f);
            EnableEmission(material, new Color(0.8f, 0.9f, 1f) * 1.15f);
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
                mast.GetComponent<Renderer>().sharedMaterial = metal;
                Object.Destroy(mast.GetComponent<Collider>());

                var panel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                panel.name = "Light Panel";
                panel.transform.SetParent(tower.transform);
                panel.transform.localPosition = new Vector3(0f, 26.5f, 0f);
                panel.transform.localScale = new Vector3(6f, 2.2f, 0.7f);
                panel.transform.LookAt(new Vector3(0f, 8f, 0f));
                panel.GetComponent<Renderer>().sharedMaterial = glow;
                Object.Destroy(panel.GetComponent<Collider>());
            }
        }

        private static float Hash01(int x, int y)
        {
            unchecked
            {
                uint hash = (uint)(x * 374761393 + y * 668265263);
                hash = (hash ^ (hash >> 13)) * 1274126177u;
                hash ^= hash >> 16;
                return (hash & 0x00FFFFFFu) / 16777216f;
            }
        }

        private static Material CreateStandardMaterial(Color color, float smoothness)
        {
            var shader = Shader.Find("Standard") ?? Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Sprites/Default");
            if (shader == null)
            {
                Debug.LogError("FC 2026: no supported shader was found for generated stadium materials.");
                return null;
            }

            var material = new Material(shader) { color = color };
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", smoothness);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
            return material;
        }

        private static void EnableEmission(Material material, Color color)
        {
            if (material == null || !material.HasProperty("_EmissionColor"))
                return;
            material.EnableKeyword("_EMISSION");
            material.SetColor("_EmissionColor", color);
            material.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
        }
    }
}
