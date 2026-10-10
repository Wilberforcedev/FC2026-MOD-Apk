using System;
using UnityEngine;

namespace FC2026
{
    public sealed class MobileInputController : MonoBehaviour
    {
        public Vector2 Move { get; private set; }
        public bool SprintHeld { get; private set; }
        public event Action PassPressed;
        public event Action ShootPressed;
        public event Action TacklePressed;
        public event Action SwitchPlayerPressed;

        public void SetMove(Vector2 value) => Move = Vector2.ClampMagnitude(value, 1f);
        public void SetSprint(bool value) => SprintHeld = value;
        public void PressPass() => PassPressed?.Invoke();
        public void PressShoot() => ShootPressed?.Invoke();
        public void PressTackle() => TacklePressed?.Invoke();
        public void PressSwitchPlayer() => SwitchPlayerPressed?.Invoke();
        public void ResetInput() { Move = Vector2.zero; SprintHeld = false; }
    }
}
