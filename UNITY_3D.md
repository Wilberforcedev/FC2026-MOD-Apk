# FC 2026 — Unity 3D Android Version

The repository now contains a separate true-3D Unity version at:

```text
unity/FC2026Unity
```

The existing React/Canvas game remains in the repository as a reference while systems are migrated into Unity.

## Unity version

Use **Unity 6.3 LTS — 6000.3.24f1**.

In Unity Hub, install these modules with the editor:

- Android Build Support
- Android SDK & NDK Tools
- OpenJDK

The project uses URP 17.3 for the 3D rendering foundation.

## Open the project

1. Install Unity Hub.
2. Install Unity 6000.3.24f1 with the Android modules listed above.
3. In Unity Hub choose **Add > Add project from disk**.
4. Select:

```text
FC2026-MOD-Apk/unity/FC2026Unity
```

5. Open `Assets/Scenes/Bootstrap.unity`.
6. Press **Play**.

The scene is intentionally minimal. `FC2026Bootstrap` creates the prototype stadium and match world at runtime.

## Current 3D prototype

The first Unity migration includes:

- regulation-scale 3D football pitch
- stadium shell and floodlights
- 22 physical 3D players
- different player body heights/builds
- Rigidbody football physics
- positional team AI
- goal posts and physical goal detection
- score handling and kickoff reset
- dynamic broadcast camera
- Android landscape setup
- keyboard and Android touch control
- 60 FPS target
- fully offline runtime foundation

The player bodies are currently procedural prototype meshes. Rigged/licensed player models, skeletal animation, facial meshes, detailed kits, stadium assets, crowds and motion-captured animation will replace them progressively.

## Controls

### Windows/Editor

- **WASD / Arrow keys** — move
- **Shift** — sprint
- **Space** — kick

### Android

- **Drag on left half of screen** — move
- Push the drag farther from the starting point to sprint
- **Tap right half of screen** — kick

## Build an APK from the Unity Editor

Open the Unity project and use:

```text
FC2026 > Build Android Debug APK
```

The builder configures:

- Package ID: `com.wilberforcedev.fc2026`
- IL2CPP scripting backend
- ARM64
- landscape autorotation only
- Gradle Android build

The debug APK is created at:

```text
unity/FC2026Unity/Builds/Android/FC2026-3D-debug.apk
```

## Command-line Android build

Unity can also build the APK without opening the editor UI.

Example on Windows from the repository root:

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.24f1\Editor\Unity.exe" `
  -batchmode `
  -quit `
  -projectPath "$PWD\unity\FC2026Unity" `
  -buildTarget Android `
  -executeMethod FC2026.EditorTools.AndroidBuilder.BuildAndroid `
  -logFile "$PWD\unity-build.log"
```

## Migration direction

The Unity version will progressively take over these systems from the existing project:

1. core 3D match engine and player movement
2. rigged players and animation blending
3. shooting, passing, dribbling, tackling and goalkeeper animation
4. broadcast/replay/cinematic camera system
5. team and player database migration
6. tournament mode
7. career mode, transfers and saves
8. menus/HUD
9. Android optimization and device quality presets
10. signed release APK/AAB

The React version should not be deleted until its career/tournament/player data has been migrated and validated in Unity.
