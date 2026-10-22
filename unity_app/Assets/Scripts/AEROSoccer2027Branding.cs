using TMPro;
using UnityEngine;

namespace FC2026
{
    /// <summary>Applies AERO Soccer 2027 branding to the runtime-generated mobile hub.</summary>
    public sealed class AEROSoccer2027Branding : MonoBehaviour
    {
        private float nextRefresh;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AttachBranding()
        {
            var host = FindFirstObjectByType<FC2026MobileHub>();
            if (host == null) host = new GameObject("AERO Soccer 2027").AddComponent<FC2026MobileHub>();
            if (host.GetComponent<AEROSoccer2027Branding>() == null)
                host.gameObject.AddComponent<AEROSoccer2027Branding>();
            host.gameObject.name = "AERO Soccer 2027";
        }

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
        }

        private void Update()
        {
            if (Time.unscaledTime < nextRefresh) return;
            nextRefresh = Time.unscaledTime + 0.5f;
            foreach (var label in FindObjectsByType<TMP_Text>(FindObjectsSortMode.None))
            {
                if (label == null || string.IsNullOrEmpty(label.text)) continue;
                if (label.text.Contains("FC 2026"))
                    label.text = label.text.Replace("FC 2026", "AERO Soccer 2027");
            }
            foreach (var item in FindObjectsByType<Transform>(FindObjectsSortMode.None))
                if (item != null && item.name.Contains("FC 2026"))
                    item.name = item.name.Replace("FC 2026", "AERO Soccer 2027");
        }
    }
}