using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace FC2026.EditorTools
{
    /// <summary>
    /// Single source of truth for FC 2026 Android settings and builds.
    /// Settings are re-applied on every clone and before every build so local
    /// machines and CI produce the same package.
    /// </summary>
    public static class AndroidBuilder
    {
        private const string PackageId = "com.wilberforcedev.fc2026";
        private const string ScenePath = "Assets/Scenes/Bootstrap.unity";
        private const string BuildDirectory = "Builds/Android";
        private const string DefaultVersionName = "1.0.0";
        private const int DefaultVersionCode = 1;
        private const int MinimumApiLevel = 24;
        private const int TargetApiLevel = 35;
        private const string SettingsStampKey = "FC2026.AndroidBuilder.SettingsStamp";
        // Bump when production settings change so existing clones re-apply them.
        private const int SettingsRevision = 1;

        private static string ProjectRoot
        {
            get
            {
                var parent = Directory.GetParent(Application.dataPath);
                return parent != null ? parent.FullName : Directory.GetCurrentDirectory();
            }
        }

        private static string CurrentVersionName =>
            string.IsNullOrWhiteSpace(PlayerSettings.bundleVersion) ? DefaultVersionName : PlayerSettings.bundleVersion;

        private static int CurrentVersionCode => PlayerSettings.Android.bundleVersionCode;

        [InitializeOnLoadMethod]
        private static void ScheduleSettingsCheck()
        {
            if (Application.isBatchMode)
                return;

            EditorApplication.delayCall += ApplySettingsOnce;
        }

        private static void ApplySettingsOnce()
        {
            var stamp = Application.dataPath + "|" + SettingsRevision;
            if (EditorPrefs.GetString(SettingsStampKey, string.Empty) == stamp)
                return;

            ApplyProductionSettings(false);
            EditorPrefs.SetString(SettingsStampKey, stamp);
            Debug.Log("FC 2026: production Android settings applied. Commit ProjectSettings/*.asset after opening the project.");
        }

        [MenuItem("FC2026/Configure Android Project", false, 1)]
        public static void ConfigureAndroid()
        {
            ApplyProductionSettings(true);
        }

        [MenuItem("FC2026/Build Android Debug APK", false, 20)]
        public static void BuildAndroid()
        {
            BuildAndroidPackage(false, true, false);
        }

        [MenuItem("FC2026/Build Android Release APK", false, 21)]
        public static void BuildAndroidReleaseApk()
        {
            BuildAndroidPackage(false, false, true);
        }

        [MenuItem("FC2026/Build Android Release AAB", false, 22)]
        public static void BuildAndroidReleaseAab()
        {
            BuildAndroidPackage(true, false, true);
        }

        [MenuItem("FC2026/Validate Android Release Setup", false, 40)]
        public static void ValidateAndroidReleaseSetup()
        {
            ApplyProductionSettings(true);
            try
            {
                if (!TryApplySigning(false))
                    throw new InvalidOperationException(SigningHelp);

                var problems = CollectReleaseProblems();
                if (problems.Count > 0)
                    throw new InvalidOperationException("Release setup is incomplete:\n- " + string.Join("\n- ", problems));

                Debug.Log($"FC 2026: release setup OK - {PackageId} {CurrentVersionName} ({CurrentVersionCode}), API {MinimumApiLevel}-{TargetApiLevel}, ARM64/IL2CPP.");
            }
            finally
            {
                ClearSigning();
                SaveProjectSettings();
            }
        }

        private static void ApplyProductionSettings(bool verbose)
        {
            var currentVersion = PlayerSettings.bundleVersion;

            PlayerSettings.companyName = "Wilberforcedev";
            PlayerSettings.productName = "FC 2026 3D Soccer";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, PackageId);
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetManagedStrippingLevel(NamedBuildTarget.Android, ManagedStrippingLevel.Medium);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.Android.minSdkVersion = (AndroidSdkVersions)MinimumApiLevel;
            PlayerSettings.Android.targetSdkVersion = (AndroidSdkVersions)TargetApiLevel;
            PlayerSettings.Android.forceInternetPermission = false;
            PlayerSettings.Android.forceSDCardPermission = false;

            var requestedVersion = Environment.GetEnvironmentVariable("FC2026_VERSION_NAME");
            if (!string.IsNullOrWhiteSpace(requestedVersion))
            {
                var normalizedVersion = NormalizeVersionName(requestedVersion);
                if (normalizedVersion != requestedVersion.Trim().TrimStart('v', 'V'))
                    Debug.LogWarning($"FC 2026: '{requestedVersion}' is not a valid version name; using {normalizedVersion}.");
                PlayerSettings.bundleVersion = normalizedVersion;
            }
            else if (string.IsNullOrWhiteSpace(currentVersion) || currentVersion == "0.1")
                PlayerSettings.bundleVersion = DefaultVersionName;

            if (int.TryParse(Environment.GetEnvironmentVariable("FC2026_VERSION_CODE"), out var versionCode) && versionCode > 0)
                PlayerSettings.Android.bundleVersionCode = versionCode;
            else if (PlayerSettings.Android.bundleVersionCode < 1)
                PlayerSettings.Android.bundleVersionCode = DefaultVersionCode;

            PlayerSettings.defaultInterfaceOrientation = UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToPortrait = false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = true;
            PlayerSettings.allowedAutorotateToLandscapeRight = true;
            PlayerSettings.runInBackground = false;

            ApplyMobileQualitySettings();
            SaveProjectSettings();

            if (verbose)
                Debug.Log($"FC 2026: Android configured for {PackageId} {CurrentVersionName} ({CurrentVersionCode}), API {MinimumApiLevel}-{TargetApiLevel}, ARM64/IL2CPP. Release signing is applied from environment variables at build time.");
        }

        private static void SaveProjectSettings()
        {
            AssetDatabase.SaveAssets();
            if (!Application.isBatchMode && !EditorApplication.ExecuteMenuItem("File/Save Project"))
                Debug.LogWarning("FC 2026: could not persist ProjectSettings automatically. Run File > Save Project once, then commit ProjectSettings/*.asset.");
        }

        private static void ApplyMobileQualitySettings()
        {
            var levels = QualitySettings.names.Length;
            if (levels == 0)
                return;

            var original = Mathf.Clamp(QualitySettings.GetQualityLevel(), 0, levels - 1);
            for (var i = 0; i < levels; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                QualitySettings.pixelLightCount = 2;
                QualitySettings.shadows = ShadowQuality.HardOnly;
                QualitySettings.shadowResolution = ShadowResolution.Medium;
                QualitySettings.shadowCascades = 2;
                QualitySettings.shadowDistance = 45f;
                QualitySettings.antiAliasing = 2;
                QualitySettings.vSyncCount = 0;
                QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
                QualitySettings.lodBias = 1.1f;
                QualitySettings.softParticles = false;
                QualitySettings.realtimeReflectionProbes = false;
            }

            QualitySettings.SetQualityLevel(original, false);
        }

        private static bool TryApplySigning(bool required)
        {
            var keystorePath = Environment.GetEnvironmentVariable("FC2026_KEYSTORE_PATH");
            var keystoreBase64 = Environment.GetEnvironmentVariable("FC2026_KEYSTORE_BASE64");
            if (string.IsNullOrWhiteSpace(keystorePath) && !string.IsNullOrWhiteSpace(keystoreBase64))
            {
                try
                {
                    var decodedPath = Path.Combine(ProjectRoot, BuildDirectory, "fc2026-release.keystore");
                    var decodedDirectory = Path.GetDirectoryName(decodedPath);
                    if (!string.IsNullOrEmpty(decodedDirectory))
                        Directory.CreateDirectory(decodedDirectory);
                    File.WriteAllBytes(decodedPath, Convert.FromBase64String(keystoreBase64));
                    keystorePath = decodedPath;
                }
                catch (Exception exception)
                {
                    if (required)
                        throw new InvalidOperationException("FC2026_KEYSTORE_BASE64 could not be decoded: " + exception.Message, exception);
                    Debug.LogWarning("FC 2026: could not decode FC2026_KEYSTORE_BASE64: " + exception.Message);
                    return false;
                }
            }

            var storePassword = Environment.GetEnvironmentVariable("FC2026_KEYSTORE_PASS");
            var keyAlias = Environment.GetEnvironmentVariable("FC2026_KEY_ALIAS");
            var keyPassword = Environment.GetEnvironmentVariable("FC2026_KEY_PASS");

            if (!string.IsNullOrWhiteSpace(keystorePath) && !Path.IsPathRooted(keystorePath))
                keystorePath = Path.Combine(ProjectRoot, keystorePath);

            if (string.IsNullOrWhiteSpace(keystorePath) || string.IsNullOrWhiteSpace(storePassword) ||
                string.IsNullOrWhiteSpace(keyAlias) || string.IsNullOrWhiteSpace(keyPassword))
            {
                if (required)
                    throw new InvalidOperationException(SigningHelp);
                return false;
            }

            if (!File.Exists(keystorePath))
            {
                if (required)
                    throw new FileNotFoundException("Android release keystore was not found.", keystorePath);
                Debug.LogWarning("FC 2026: Android release keystore was not found at " + keystorePath);
                return false;
            }

            keystorePath = EnsureKeystoreInsideProject(keystorePath);
            PlayerSettings.Android.useCustomKeystore = true;
            PlayerSettings.Android.keystoreName = ToProjectRelative(keystorePath);
            PlayerSettings.Android.keystorePass = storePassword;
            PlayerSettings.Android.keyaliasName = keyAlias;
            PlayerSettings.Android.keyaliasPass = keyPassword;
            return true;
        }

        private static string EnsureKeystoreInsideProject(string path)
        {
            var fullPath = Path.GetFullPath(path);
            var root = ProjectRoot + Path.DirectorySeparatorChar;
            if (fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                return fullPath;

            var destination = Path.Combine(ProjectRoot, BuildDirectory, "fc2026-release.keystore");
            Directory.CreateDirectory(Path.GetDirectoryName(destination) ?? BuildDirectory);
            File.Copy(fullPath, destination, true);
            return destination;
        }

        private static void ClearSigning()
        {
            PlayerSettings.Android.useCustomKeystore = false;
            PlayerSettings.Android.keystoreName = string.Empty;
            PlayerSettings.Android.keystorePass = string.Empty;
            PlayerSettings.Android.keyaliasName = string.Empty;
            PlayerSettings.Android.keyaliasPass = string.Empty;
        }

        private static void BuildAndroidPackage(bool appBundle, bool development, bool requireSigning)
        {
            ApplyProductionSettings(true);

            try
            {
                if (requireSigning)
                {
                    if (!TryApplySigning(true))
                        throw new InvalidOperationException(SigningHelp);

                    var problems = CollectReleaseProblems();
                    if (problems.Count > 0)
                        throw new InvalidOperationException("Release setup is incomplete:\n- " + string.Join("\n- ", problems));

                    if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("FC2026_VERSION_CODE")))
                        Debug.LogWarning("FC 2026: FC2026_VERSION_CODE is not set. Confirm the Play Console version code before uploading.");
                }

                if (!File.Exists(Path.Combine(ProjectRoot, ScenePath)))
                    throw new FileNotFoundException("Bootstrap scene was not found.", ScenePath);

                if (!EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android))
                    throw new InvalidOperationException("Could not switch Unity to the Android build target. Install Android Build Support in Unity Hub.");

                EditorUserBuildSettings.androidBuildSystem = AndroidBuildSystem.Gradle;
                EditorUserBuildSettings.buildAppBundle = appBundle;
                PlayerSettings.SetIl2CppCompilerConfiguration(
                    NamedBuildTarget.Android,
                    development ? Il2CppCompilerConfiguration.Debug : Il2CppCompilerConfiguration.Release);

                var fileName = appBundle
                    ? $"FC2026-{CurrentVersionName}.aab"
                    : development ? "FC2026-3D-debug.apk" : $"FC2026-{CurrentVersionName}.apk";
                var outputDirectory = Path.Combine(ProjectRoot, BuildDirectory);
                Directory.CreateDirectory(outputDirectory);
                var outputPath = Path.Combine(outputDirectory, fileName);

                var options = new BuildPlayerOptions
                {
                    scenes = new[] { ScenePath },
                    locationPathName = outputPath,
                    target = BuildTarget.Android,
                    options = development ? BuildOptions.Development : BuildOptions.None
                };

                var report = BuildPipeline.BuildPlayer(options);
                if (report.summary.result != BuildResult.Succeeded)
                    throw new Exception($"Android build failed: {report.summary.result} ({report.summary.totalErrors} errors)");

                Debug.Log($"FC 2026: {(appBundle ? "AAB" : "APK")} built at {outputPath} ({report.summary.totalSize / 1024f / 1024f:F1} MB)");
            }
            finally
            {
                // Keep keystore passwords out of a ProjectSettings commit.
                if (requireSigning)
                {
                    ClearSigning();
                    SaveProjectSettings();
                }
            }
        }

        private static List<string> CollectReleaseProblems()
        {
            var problems = new List<string>();
            if (!File.Exists(Path.Combine(ProjectRoot, ScenePath)))
                problems.Add("Bootstrap scene is missing: " + ScenePath);
            if (PlayerSettings.GetApplicationIdentifier(NamedBuildTarget.Android) != PackageId)
                problems.Add("Android package id must be " + PackageId + ".");
            if ((int)PlayerSettings.Android.minSdkVersion != MinimumApiLevel)
                problems.Add("Minimum API level must be " + MinimumApiLevel + ".");
            if ((int)PlayerSettings.Android.targetSdkVersion != TargetApiLevel)
                problems.Add("Target API level must be " + TargetApiLevel + ".");
            if (PlayerSettings.GetScriptingBackend(NamedBuildTarget.Android) != ScriptingImplementation.IL2CPP)
                problems.Add("Scripting backend must be IL2CPP.");
            if ((PlayerSettings.Android.targetArchitectures & AndroidArchitecture.ARM64) == 0)
                problems.Add("ARM64 must be enabled.");
            if (!PlayerSettings.Android.useCustomKeystore)
                problems.Add("A custom release keystore must be configured.");
            if (PlayerSettings.Android.bundleVersionCode < 1)
                problems.Add("Bundle version code must be at least 1.");
            return problems;
        }

        private static string NormalizeVersionName(string value)
        {
            var trimmed = value.Trim().TrimStart('v', 'V');
            return System.Version.TryParse(trimmed, out _) ? trimmed : DefaultVersionName;
        }

        private static string ToProjectRelative(string path)
        {
            var fullPath = Path.GetFullPath(path);
            var root = ProjectRoot + Path.DirectorySeparatorChar;
            return fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase)
                ? fullPath.Substring(root.Length).Replace('\\', '/')
                : fullPath;
        }

        private const string SigningHelp =
            "Release signing requires FC2026_KEYSTORE_PATH (or FC2026_KEYSTORE_BASE64), " +
            "FC2026_KEYSTORE_PASS, FC2026_KEY_ALIAS and FC2026_KEY_PASS.";
    }
}
