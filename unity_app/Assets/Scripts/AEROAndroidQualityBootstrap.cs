using UnityEngine;

namespace FC2026
{
    /// <summary>
    /// Conservative Android defaults for the procedural prototype. This does not replace
    /// a device profiling pass; it selects a safe frame-rate/LOD/shadow starting point.
    /// </summary>
    public static class AEROAndroidQualityBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void ApplyAndroidProfile()
        {
            if (Application.platform != RuntimePlatform.Android) return;

            int ramMb = SystemInfo.systemMemorySize;
            int gpuMb = SystemInfo.graphicsMemorySize;
            int cores = SystemInfo.processorCount;
            bool lowTier = ramMb > 0 && ramMb <= 3072 || gpuMb > 0 && gpuMb <= 1024 || cores <= 4;

            QualitySettings.vSyncCount = 0;
            Application.targetFrameRate = lowTier ? 30 : 60;
            QualitySettings.lodBias = lowTier ? 0.65f : 1f;
            QualitySettings.maximumLODLevel = lowTier ? 1 : 0;
            QualitySettings.shadowDistance = lowTier ? 18f : 35f;
            QualitySettings.shadows = lowTier ? ShadowQuality.HardOnly : ShadowQuality.All;
            QualitySettings.antiAliasing = lowTier ? 0 : 2;
            QualitySettings.skinWeights = lowTier ? SkinWeights.TwoBones : SkinWeights.FourBones;
            QualitySettings.streamingMipmapsActive = true;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;

            Debug.Log($"[AERO Graphics] Android profile={(lowTier ? "LOW" : "STANDARD")}; RAM={ramMb}MB; GPU={gpuMb}MB; CPU cores={cores}; target FPS={Application.targetFrameRate}. Profile is provisional until device profiling.");
        }
    }
}