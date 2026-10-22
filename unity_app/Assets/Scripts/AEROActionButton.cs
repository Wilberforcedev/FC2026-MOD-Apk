using UnityEngine;
using UnityEngine.EventSystems;

namespace FC2026
{
    /// <summary>Pointer-held sprint button; touch release always clears sprint.</summary>
    public sealed class AEROActionButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
    {
        [SerializeField] private MobileInputController input;
        [SerializeField] private bool isSprintButton;

        public void Configure(MobileInputController controller, bool sprintButton)
        {
            input = controller;
            isSprintButton = sprintButton;
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            if (isSprintButton) input?.SetSprint(true);
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            if (isSprintButton) input?.SetSprint(false);
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            if (isSprintButton) input?.SetSprint(false);
        }
    }
}