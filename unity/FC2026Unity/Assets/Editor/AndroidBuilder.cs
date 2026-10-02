using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace FC2026.EditorTools
{
    public static class AndroidBuilder
    {
        private const string PackageId = "com.wilberforcedev.fc2026";
        private const string ScenePath = "Assets/Scenes/Bootstrap.unity";
        private const string OutputPath = "Builds/Android/FC2026-3D-debug.apk";

        [MenuItem("FC2026/Configure Android Project")]
        public static void ConfigureAndroid()
        {
            PlayerSettings.companyName = "Wilberforcedev";
            PlayerSettings.productName = "FC 2026 3D Soccer";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, PackageId);
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToPortrait = false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = true;
            PlayerSettings.allowedAutorotateToLandscapeRight = true;
            PlayerSettings.runInBackground = false;

            EditorUserBuildSettings.androidBuildSystem = AndroidBuildSystem.Gradle;
            EditorUserBuildSettings.buildAppBundle = false;
            AssetDatabase.SaveAssets();
            Debug.Log("FC 2026 Android project configured: " + PackageId);
        }

        [MenuItem("FC2026/Build Android Debug APK")]
        public static void BuildAndroid()
        {
            ConfigureAndroid();

            if (!EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android))
                throw new InvalidOperationException("Could not switch Unity to the Android build target. Install Android Build Support in Unity Hub.");

            Directory.CreateDirectory(Path.GetDirectoryName(OutputPath) ?? "Builds/Android");

            var options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = OutputPath,
                target = BuildTarget.Android,
                targetGroup = BuildTargetGroup.Android,
                options = BuildOptions.Development
            };

            var report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
                throw new Exception($"Android build failed: {report.summary.result} ({report.summary.totalErrors} errors)");

            Debug.Log($"FC 2026 3D APK built successfully: {OutputPath} ({report.summary.totalSize / 1024f / 1024f:F1} MB)");
        }
    }
}
