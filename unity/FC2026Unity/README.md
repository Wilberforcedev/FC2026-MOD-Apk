# FC 2026 Unity 3D

This folder contains the active Unity 3D match and career project for FC 2026.

## Requirements

Use Unity **6000.3.24f1** with these modules installed:

- Android Build Support
- Android SDK & NDK Tools
- OpenJDK

## Open and play

1. Open Unity Hub and choose **Add project from disk**.
2. Select this `FC2026Unity` folder.
3. Open `Assets/Scenes/Bootstrap.unity`.
4. Press **Play**.

The bootstrap scene creates the prototype stadium and match world at runtime.

## Controls

### Windows and Unity Editor

- **WASD / Arrow keys** — move
- **Shift** — sprint
- **Space** — shoot
- **E** — pass
- **Q** — through ball
- **X** — tackle
- **Tab** — switch to the nearest teammate to the ball

### Android

Use the virtual joystick to move and the on-screen action buttons to sprint, shoot, pass, play a through ball, tackle, chip, or finesse. The **Switch** button selects the nearest teammate to the ball.

## Build Android

In the Unity Editor, use **FC2026 > Build Android Debug APK**. Release APK and AAB build steps require signing values; keep keystores and passwords out of the repository.

## Project notes

- [Repository overview and current priorities](../../README.md)
- [Full Unity setup, Android build, and gameplay guide](../../UNITY_3D.md)
- [Gameplay and Android backlog](../../TODO.md)
