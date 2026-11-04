using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Flat IMGUI palette shared by the career hub and the in-match HUD so both
    /// surfaces use the same button hierarchy and colour language.
    /// </summary>
    internal static class HubTheme
    {
        public static readonly Color32 TextColor = new Color32(0xF2, 0xF7, 0xFB, 0xFF);
        public static readonly Color32 GoldTextColor = new Color32(0xF5, 0xDD, 0x92, 0xFF);
        public static readonly Color32 PanelColor = new Color32(0x0F, 0x15, 0x1B, 0xE6);
        public static readonly Color32 TableHeaderColor = new Color32(0x1B, 0x2A, 0x38, 0xFF);
        public static readonly Color32 TableRowColor = new Color32(0x16, 0x1F, 0x29, 0xFF);
        public static readonly Color32 TableAltRowColor = new Color32(0x12, 0x1A, 0x22, 0xFF);
        public static readonly Color32 HighlightColor = new Color32(0x45, 0x39, 0x16, 0xFF);

        private static readonly Color32 SecondaryColor = new Color32(0x31, 0x46, 0x5A, 0xFF);
        private static readonly Color32 SecondaryHover = new Color32(0x3E, 0x59, 0x72, 0xFF);
        private static readonly Color32 SecondaryActive = new Color32(0x27, 0x38, 0x48, 0xFF);
        private static readonly Color32 PrimaryColor = new Color32(0x14, 0x7A, 0x4E, 0xFF);
        private static readonly Color32 PrimaryHover = new Color32(0x1B, 0x99, 0x62, 0xFF);
        private static readonly Color32 PrimaryActive = new Color32(0x0F, 0x5F, 0x3D, 0xFF);
        private static readonly Color32 AccentColor = new Color32(0x8A, 0x6D, 0x1D, 0xFF);
        private static readonly Color32 AccentHover = new Color32(0xA5, 0x85, 0x24, 0xFF);
        private static readonly Color32 AccentActive = new Color32(0x6E, 0x57, 0x17, 0xFF);
        private static readonly Color32 DangerColor = new Color32(0x8E, 0x3B, 0x3B, 0xFF);
        private static readonly Color32 DangerHover = new Color32(0xAB, 0x49, 0x49, 0xFF);
        private static readonly Color32 DangerActive = new Color32(0x74, 0x2F, 0x2F, 0xFF);
        private static readonly Color32 RowColor = new Color32(0x23, 0x33, 0x43, 0xFF);
        private static readonly Color32 RowHover = new Color32(0x2D, 0x44, 0x57, 0xFF);
        private static readonly Color32 RowActive = new Color32(0x1C, 0x2A, 0x37, 0xFF);
        private static readonly Color32 RowSelectedHover = new Color32(0x56, 0x47, 0x1C, 0xFF);

        public static GUIStyle SecondaryButton(int fontSize)
        {
            return BuildButton(fontSize, SecondaryColor, SecondaryHover, SecondaryActive, TextColor);
        }

        public static GUIStyle PrimaryButton(int fontSize)
        {
            return BuildButton(fontSize, PrimaryColor, PrimaryHover, PrimaryActive, Color.white);
        }

        public static GUIStyle AccentButton(int fontSize)
        {
            return BuildButton(fontSize, AccentColor, AccentHover, AccentActive, Color.white);
        }

        public static GUIStyle DangerButton(int fontSize)
        {
            return BuildButton(fontSize, DangerColor, DangerHover, DangerActive, Color.white);
        }

        public static GUIStyle Row(int fontSize, bool selected)
        {
            return BuildRow(fontSize,
                selected ? HighlightColor : RowColor,
                selected ? RowSelectedHover : RowHover,
                selected ? HighlightColor : RowActive,
                selected ? GoldTextColor : TextColor);
        }

        public static GUIStyle Panel()
        {
            var style = new GUIStyle(GUI.skin.box)
            {
                border = new RectOffset(0, 0, 0, 0),
                padding = new RectOffset(0, 0, 0, 0)
            };
            ApplyBackgrounds(style, PanelColor, PanelColor, PanelColor);
            return style;
        }

        public static GUIStyle BuildButton(int fontSize, Color background, Color hover, Color active, Color text)
        {
            var style = new GUIStyle(GUI.skin.button)
            {
                fontSize = fontSize,
                fontStyle = FontStyle.Bold,
                wordWrap = true,
                border = new RectOffset(0, 0, 0, 0)
            };
            ApplyBackgrounds(style, background, hover, active);
            style.normal.textColor = text;
            style.hover.textColor = text;
            style.active.textColor = text;
            style.focused.textColor = text;
            return style;
        }

        public static GUIStyle BuildRow(int fontSize, Color background, Color hover, Color active, Color text)
        {
            var style = new GUIStyle(GUI.skin.button)
            {
                fontSize = fontSize,
                alignment = TextAnchor.MiddleLeft,
                clipping = TextClipping.Clip,
                wordWrap = false,
                padding = new RectOffset(14, 10, 2, 2),
                border = new RectOffset(0, 0, 0, 0)
            };
            ApplyBackgrounds(style, background, hover, active);
            style.normal.textColor = text;
            style.hover.textColor = text;
            style.active.textColor = text;
            style.focused.textColor = text;
            return style;
        }

        public static Texture2D SolidTexture(Color color)
        {
            var texture = new Texture2D(1, 1, TextureFormat.RGBA32, false)
            {
                hideFlags = HideFlags.HideAndDontSave
            };
            texture.SetPixel(0, 0, color);
            texture.Apply();
            return texture;
        }

        private static void ApplyBackgrounds(GUIStyle style, Color normal, Color hover, Color active)
        {
            style.normal.background = SolidTexture(normal);
            style.hover.background = SolidTexture(hover);
            style.active.background = SolidTexture(active);
            style.focused.background = SolidTexture(hover);
        }
    }
}
