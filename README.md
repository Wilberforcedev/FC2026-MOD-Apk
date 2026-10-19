# FC 2026 Soccer

FC 2026 is maintained as a **mobile football game**. The production game client is the native Unity project at [`unity/FC2026Unity`](unity/FC2026Unity), built for Android first. Core play should run offline and use mobile touch controls.

**Product rule:** add and maintain game features in the Unity mobile app. Do not add browser routes, PWA installation, desktop web layouts, or website-only features to the product.

## Project status

| Project | Role | Location |
| --- | --- | --- |
| Unity 3D | Canonical mobile game and Android APK | [`unity/FC2026Unity`](unity/FC2026Unity) |
| React/TypeScript | Frozen browser prototype and migration reference; not a release target | [`src`](src) |
| Flutter | Early experiment; not the maintained game client | [`flutter_app`](flutter_app) |
| Unity Football World | Separate prototype for career, squad, catalog and online-service systems; evaluate and migrate useful systems into the canonical Unity project | [`unity_app`](unity_app) |

The repository has more than one Unity project. The canonical mobile match project uses Unity **6000.3.24f1**. The separate Football World project uses another editor version; do not treat it as the primary Android build.

## Build the mobile game

Install Unity 6.3 LTS (`6000.3.24f1`) with Android Build Support, Android SDK & NDK Tools, and OpenJDK. Open `unity/FC2026Unity` in Unity Hub, then select:

```text
FC2026 > Build Android Debug APK
```

The APK is written to:

```text
unity/FC2026Unity/Builds/Android/FC2026-3D-debug.apk
```

See [`UNITY_3D.md`](UNITY_3D.md) for setup, controls, Android build requirements, and the mobile migration roadmap.

## Mobile product requirements

- Android is the first supported platform; keep the project ready for a later iOS build.
- Build gameplay, menus, controls, saves, and visual systems in Unity.
- Keep essential single-player play and local saves usable offline.
- Treat networking as an optional mobile feature; online services must not block offline play.
- Test touch controls, performance, screen orientation, and APK builds on Android devices.
- Keep the React/PWA prototype and Flutter experiment as reference material only while their useful game data and systems are reviewed for migration.

## Rights and assets

Player portraits are generated in-game faces, not licensed athlete likenesses. Generated portraits do not grant rights to real club names, player names or likenesses, badges, kits, or league branding. Public release using third-party names, likenesses, marks, or assets requires the appropriate rights.

## License

The repository declares Apache-2.0. Third-party names, marks, likenesses, and other assets remain subject to their respective rights holders and are not granted by that license.
