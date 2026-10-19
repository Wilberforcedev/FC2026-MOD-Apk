# FC 2026 — Native Unity Mobile Game

The canonical product is the native Unity game in:

```text
unity/FC2026Unity
```

It targets Android first, with iOS as a later platform. The game must not depend on a hosted website, browser runtime, or PWA. Keep useful browser prototype systems as migration references only; implement and release product features in Unity.

## Unity version and Android setup

Use **Unity 6.3 LTS — 6000.3.24f1**.

Install these Unity Hub modules:

- Android Build Support
- Android SDK & NDK Tools
- OpenJDK

The first playable bootstrap uses Unity's built-in 3D renderer and does not require a separate render-pipeline setup.

## Open the project

1. Install Unity Hub and Unity 6000.3.24f1 with the Android modules listed above.
2. In Unity Hub choose **Add > Add project from disk**.
3. Select `FC2026-MOD-Apk/unity/FC2026Unity`.
4. Open `Assets/Scenes/Bootstrap.unity`.
5. Press **Play**.

The scene is intentionally minimal. `FC2026Bootstrap` creates the prototype stadium and match world at runtime.

## Current mobile 3D prototype

- Regulation-scale 3D football pitch and stadium shell
- 22 physical 3D players with procedural humanoid rigs
- Rigidbody ball physics, positional team AI, goals and score handling
- Kickoff reset and dynamic broadcast camera
- Android landscape setup and touch controls
- 60 FPS target and offline runtime foundation

Player faces are loaded from `Assets/Resources/PlayerFaces`. The current heads are procedural and map face textures to the front; custom sculpted heads, side-profile textures and facial animation remain future upgrades.

## Controls

### Windows / Unity Editor

- **WASD / Arrow keys** — move
- **Shift** — sprint
- **Space** — shoot
- **E** — pass
- **Q** — through ball
- **X** — tackle
- **Tab** — switch to the nearest teammate to the ball

### Android

- **Virtual joystick (bottom left)** — move
- **Sprint / Shoot / Pass / Through / Tackle / Chip / Finesse (bottom right)** — perform an action
- **Switch** — select the nearest teammate to the ball

Passes select a teammate based on the direction of play; through balls lead the runner. Shots are aimed toward goal, with separate chip and finesse options. The match HUD shows the score and restart banner.

## Build a native Android APK

Open the Unity project and choose:

```text
FC2026 > Build Android Debug APK
```

The builder configures package ID `com.wilberforcedev.fc2026`, IL2CPP, ARM64, landscape orientation, and Gradle. The APK is written to:

```text
unity/FC2026Unity/Builds/Android/FC2026-3D-debug.apk
```

A signed release APK or AAB requires a configured Android signing key. The legacy Capacitor workflow is a WebView build of the browser prototype and is not the production APK workflow.

## Mobile-first roadmap

1. Validate the Unity APK on target Android devices and resolve build or touch-control issues.
2. Improve match movement, animation, passing, shooting, tackling, goalkeeping, and camera behavior.
3. Migrate and validate team/player data, career, tournament, and save systems in Unity.
4. Build mobile-native menus and HUD; keep all core game functions usable offline.
5. Optimize memory, battery use, frame rate, loading, and screen sizes on Android.
6. Add and test iOS support after the mobile game is stable.
7. Prepare signed release APK/AAB builds and store assets.

The React/Canvas and Flutter projects are legacy experiments only. They may be consulted for data or feature migration, but new product functionality belongs in the Unity mobile app.
