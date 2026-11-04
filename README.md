# FC 2026 Soccer

FC 2026 is a mobile-first football game project. The active match build is the 3D Unity project in **Unity 6.3 LTS**.

## Project status

| Project | Role |
| --- | --- |
| [Unity 3D](unity/FC2026Unity) | Active football match, player movement, ball physics, match AI, camera, and Android build |
| [Football World Unity project](unity_app) | Separate career, roster, and UI experiment; it uses a different Unity version |
| [Flutter experiment](flutter_app) | Early mobile UI experiment; not used to build the active match game |

The React/TypeScript browser prototype and its Capacitor APK route have been retired. Unity 3D is the current gameplay target.

## Unity match prototype

The current 3D build includes:

- regulation-scale pitch, stadium, floodlights, and 22 physical players
- Rigidbody football physics, passing, shooting, tackling, goalkeeper behavior, and positional AI
- keyboard and Android touch controls
- dynamic broadcast camera, match score, and goal detection
- generated fictional clubs, players, and kits
- a deterministic career world with 96 national top divisions, league seasons, a national cup, transfers, contracts, and career saves

The match AI and physics are still being improved. Current work is focused on more deliberate attacking choices, better defensive shape, and less rigid ball control.

## Open and run

Use Unity **6000.3.24f1** with Android Build Support, Android SDK & NDK Tools, and OpenJDK installed.

1. Open Unity Hub.
2. Select **Add > Add project from disk**.
3. Open `unity/FC2026Unity`.
4. Open `Assets/Scenes/Bootstrap.unity` and press **Play**.

See [UNITY_3D.md](UNITY_3D.md) for Android builds and the project details.

## Android builds

The Unity Editor provides **FC2026 > Build Android Debug APK**. Unity GitHub Actions can also build the debug APK and release AAB. Release signing values belong in GitHub Actions secrets; do not commit signing keys or passwords.

## Assets and public release

The Unity career world uses generated fictional clubs, players, cities, stadiums, and kits. Generated portraits are not licensed athlete likenesses. Any release using real club names, badges, player likenesses, kits, or league branding needs the relevant rights.

## Repository map

```text
unity/FC2026Unity/   Active 3D match and Android build
unity_app/           Separate Football World Unity experiment
flutter_app/         Early mobile UI experiment
ui-previews/         Design reference captures
UNITY_3D.md          Unity setup and Android build guide
```

## License

The repository declares Apache-2.0. Third-party names, marks, likenesses, and assets remain subject to their respective rights holders.
