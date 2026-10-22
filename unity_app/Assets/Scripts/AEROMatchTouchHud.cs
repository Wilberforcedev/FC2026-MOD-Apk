using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;

namespace FC2026
{
    /// <summary>Creates touch controls for the runtime-generated Android match scene.</summary>
    public sealed class AEROMatchTouchHud : MonoBehaviour
    {
        [SerializeField] private MobileInputController input;
        private Sprite circleSprite;

        private void Awake() => input ??= GetComponent<MobileInputController>();

        private void Start()
        {
            if (input == null) { Debug.LogWarning("[AERO Controls] MobileInputController is missing.", this); return; }
            EnsureEventSystem();
            BuildHud();
        }

        private void BuildHud()
        {
            var canvasObject = new GameObject("AERO Match Touch HUD", typeof(RectTransform), typeof(Canvas),
                typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasObject.transform.SetParent(transform, false);
            var canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 90;
            var scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(900, 1600);
            scaler.matchWidthOrHeight = 0.45f;
            circleSprite = CreateCircleSprite();

            var joystick = CreateImage("Move Joystick", canvasObject.transform, new Vector2(0, 0),
                new Vector2(142, 158), new Vector2(190, 190), new Color(0.02f, 0.10f, 0.17f, 0.48f));
            var knob = CreateImage("Joystick Knob", joystick.transform, new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(72, 72), new Color(0.02f, 0.78f, 0.95f, 0.82f));
            knob.GetComponent<RectTransform>().anchorMin = new Vector2(0.5f, 0.5f);
            knob.GetComponent<RectTransform>().anchorMax = new Vector2(0.5f, 0.5f);
            knob.GetComponent<RectTransform>().anchoredPosition = Vector2.zero;
            joystick.AddComponent<AEROJoystick>().Configure(input, knob.GetComponent<RectTransform>());

            AddAction(canvasObject.transform, "SHOOT", new Vector2(0.5f, 0), new Vector2(-120, 308), new Color(0.03f, 0.65f, 0.88f, 0.92f), input.PressShoot);
            AddAction(canvasObject.transform, "PASS", new Vector2(0.5f, 0), new Vector2(-250, 205), new Color(0.05f, 0.33f, 0.48f, 0.9f), input.PressPass);
            AddAction(canvasObject.transform, "SPRINT", new Vector2(0.5f, 0), new Vector2(-120, 158), new Color(0.05f, 0.28f, 0.24f, 0.9f), null, true);
            AddAction(canvasObject.transform, "TACKLE", new Vector2(0.5f, 0), new Vector2(-250, 86), new Color(0.35f, 0.13f, 0.2f, 0.9f), input.PressTackle);
            AddAction(canvasObject.transform, "SWITCH", new Vector2(0.5f, 0), new Vector2(-376, 208), new Color(0.18f, 0.22f, 0.32f, 0.9f), input.PressSwitchPlayer);

            var hint = new GameObject("Control Hint", typeof(RectTransform), typeof(TextMeshProUGUI));
            hint.transform.SetParent(canvasObject.transform, false);
            var hintRect = hint.GetComponent<RectTransform>();
            hintRect.anchorMin = new Vector2(0.5f, 0);
            hintRect.anchorMax = new Vector2(0.5f, 0);
            hintRect.pivot = new Vector2(0.5f, 0);
            hintRect.anchoredPosition = new Vector2(0, 22);
            hintRect.sizeDelta = new Vector2(500, 30);
            var hintText = hint.GetComponent<TextMeshProUGUI>();
            hintText.text = "MOVE  •  PASS  •  SHOOT  •  SPRINT";
            hintText.fontSize = 17;
            hintText.color = new Color(0.77f, 0.88f, 0.95f, 0.72f);
            hintText.alignment = TextAlignmentOptions.Center;
            hintText.raycastTarget = false;
        }

        private void AddAction(Transform parent, string label, Vector2 anchor, Vector2 offset,
            Color color, UnityEngine.Events.UnityAction action, bool hold = false)
        {
            var obj = new GameObject(label + " Button", typeof(RectTransform), typeof(Image), typeof(Button));
            obj.transform.SetParent(parent, false);
            var rect = obj.GetComponent<RectTransform>();
            rect.anchorMin = anchor;
            rect.anchorMax = anchor;
            rect.pivot = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = offset;
            rect.sizeDelta = new Vector2(105, 105);
            var image = obj.GetComponent<Image>();
            image.sprite = circleSprite;
            image.color = color;
            image.raycastTarget = true;
            var button = obj.GetComponent<Button>();
            button.targetGraphic = image;
            button.transition = Selectable.Transition.ColorTint;
            var colors = button.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = new Color(0.7f, 0.96f, 1f);
            colors.pressedColor = new Color(0.42f, 0.82f, 0.95f);
            button.colors = colors;
            if (!hold && action != null) button.onClick.AddListener(action);
            if (hold) obj.AddComponent<AEROActionButton>().Configure(input, true);

            var labelObject = new GameObject("Label", typeof(RectTransform), typeof(TextMeshProUGUI));
            labelObject.transform.SetParent(obj.transform, false);
            var labelRect = labelObject.GetComponent<RectTransform>();
            labelRect.anchorMin = Vector2.zero;
            labelRect.anchorMax = Vector2.one;
            labelRect.offsetMin = new Vector2(2, 2);
            labelRect.offsetMax = new Vector2(-2, -2);
            var text = labelObject.GetComponent<TextMeshProUGUI>();
            text.text = label;
            text.fontSize = 13;
            text.fontStyle = FontStyles.Bold;
            text.alignment = TextAlignmentOptions.Center;
            text.color = Color.white;
            text.raycastTarget = false;
        }

        private GameObject CreateImage(string name, Transform parent, Vector2 anchor, Vector2 position, Vector2 size, Color color)
        {
            var obj = new GameObject(name, typeof(RectTransform), typeof(Image));
            obj.transform.SetParent(parent, false);
            var rect = obj.GetComponent<RectTransform>();
            rect.anchorMin = anchor;
            rect.anchorMax = anchor;
            rect.pivot = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = position;
            rect.sizeDelta = size;
            var image = obj.GetComponent<Image>();
            image.sprite = circleSprite ?? CreateCircleSprite();
            image.color = color;
            image.raycastTarget = true;
            return obj;
        }

        private Sprite CreateCircleSprite()
        {
            const int size = 96;
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false)
            { name = "AERO Touch Circle", filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp };
            var pixels = new Color[size * size];
            for (int y = 0; y < size; y++)
            for (int x = 0; x < size; x++)
            {
                float dx = (x + 0.5f - size * 0.5f) / (size * 0.5f);
                float dy = (y + 0.5f - size * 0.5f) / (size * 0.5f);
                float distance = Mathf.Sqrt(dx * dx + dy * dy);
                float alpha = Mathf.Clamp01((1f - distance) * 18f);
                pixels[y * size + x] = new Color(1, 1, 1, alpha);
            }
            texture.SetPixels(pixels);
            texture.Apply(false, true);
            return Sprite.Create(texture, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), size);
        }

        private static void EnsureEventSystem()
        {
            if (FindFirstObjectByType<EventSystem>() != null) return;
            new GameObject("AERO Touch Event System", typeof(EventSystem), typeof(StandaloneInputModule));
        }
    }
}