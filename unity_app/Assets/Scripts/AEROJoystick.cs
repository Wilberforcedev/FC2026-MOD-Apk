using UnityEngine;
using UnityEngine.EventSystems;

namespace FC2026
{
    /// <summary>Virtual joystick that feeds normalized values into the existing football input layer.</summary>
    public sealed class AEROJoystick : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        [SerializeField] private MobileInputController input;
        [SerializeField] private RectTransform knob;
        private RectTransform background;
        private float maximumTravel = 55f;

        public void Configure(MobileInputController controller, RectTransform knobTransform)
        {
            input = controller;
            knob = knobTransform;
            background = GetComponent<RectTransform>();
            if (background != null && knob != null)
                maximumTravel = Mathf.Max(12f, (background.rect.width - knob.rect.width) * 0.5f);
        }

        public void OnPointerDown(PointerEventData eventData) => OnDrag(eventData);

        public void OnDrag(PointerEventData eventData)
        {
            if (background == null || knob == null || input == null) return;
            if (!RectTransformUtility.ScreenPointToLocalPointInRectangle(background, eventData.position,
                eventData.pressEventCamera, out var localPosition)) return;
            var clamped = Vector2.ClampMagnitude(localPosition, maximumTravel);
            knob.anchoredPosition = clamped;
            input.SetMove(clamped / maximumTravel);
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            if (knob != null) knob.anchoredPosition = Vector2.zero;
            input?.SetMove(Vector2.zero);
        }
    }
}