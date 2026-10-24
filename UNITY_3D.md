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

The first playable bootstrap uses Unity's built-in 3D renderer so it can open and run without an additional render-pipeline setup step. URP mobile quality profiles will be added as the next rendering stage once the first Android build has been verified.

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

Players use procedural humanoid body meshes with a tapered torso, shaped shoulders and hips, articulated limbs, hands and football boots. Three fictional photographic face textures are selected across the existing match roster, with matching skin-tone variants, lightweight skin grain and a fine fabric weave on kits. Face maps are loaded from `Assets/Resources/PlayerFaces`. The owner portrait and face map are also included for future created players; call `FootballVisualFactory.EnsureGeneratedPlayerRig` when creating those players. Existing scene players keep their assigned face. The current heads remain procedural, with face textures mapped onto their front; custom sculpted heads, side-profile textures and facial animation remain future upgrades.

## Controls

### Windows/Editor

- **WASD / Arrow keys** — move
- **Shift** — sprint
- **Space** — shoot
- **E** — pass to a teammate
- **Q** — through ball
- **X** — tackle
- **Tab** — switch to the nearest teammate to the ball

### Android

- **Virtual joystick (bottom left)** — move with analog direction and speed
- **Sprint / Shoot / Pass / Through / Tackle / Chip / Finesse (bottom right)** — perform the selected action
- **Switch** — select the nearest teammate to the ball

Passes select a teammate based on the direction of play; through balls lead the runner. Shots are aimed toward goal, with separate chip and finesse options. The match HUD shows the score and restart banner. Goalkeepers use goalkeeper AI and have distinct kit colours. Balls that leave the playable area are returned to the centre for a restart.

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

## Automated Unity Android build

The separate workflow `.github/workflows/unity-android.yml` builds the **Unity 3D project**, not the legacy React/Capacitor APK. It runs on Unity project changes or can be started manually from GitHub Actions. A successful run uploads `FC2026-Unity-3D-Android-APK` for 14 days.

Before running it, add a Unity license to the repository's **Settings → Secrets and variables → Actions**:

- `UNITY_LICENSE` — the contents of your Unity license file.
- `UNITY_EMAIL` and `UNITY_PASSWORD` — only if your Unity licensing setup requires them.

Do not commit license files or credentials to the repository. The workflow checks that `UNITY_LICENSE` exists, then builds with Unity 6000.3.24f1 and the project's Android builder. A CI build confirms that the project can compile/package; a real Android phone or emulator test is still needed to verify touch controls, frame rate, graphics, and save persistence.

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
9. URP mobile rendering profiles and Android optimization
10. signed release APK/AAB

The React version should not be deleted until its career/tournament/player data has been migrated and validated in Unity.
