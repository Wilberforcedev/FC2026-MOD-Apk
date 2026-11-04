# FC 2026 — Unity 3D Android Version

The active football match build is the true-3D Unity version at:

```text
unity/FC2026Unity
```

The React/Canvas browser prototype and its Capacitor APK route have been retired. Unity is now the gameplay implementation.

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
- deterministic worldwide club and player database
- country/league/club career browser with a 16-club league table

Players use procedural humanoid body meshes with a tapered torso, shaped shoulders and hips, articulated limbs, hands and football boots. Each generated player supplies skin tone, hair colour, face variant, height and build, which are applied by `ProceduralHumanoidRig`; three fictional photographic face textures are loaded from `Assets/Resources/PlayerFaces`. Kits use the generated club colours and the goalkeeper kit uses the club's goalkeeper colour. The owner portrait and face map are also included for future created players; call `FootballVisualFactory.EnsureGeneratedPlayerRig` when creating those players. The current heads remain procedural, with face textures mapped onto their front; custom sculpted heads, side-profile textures and facial animation remain future upgrades.

## Worldwide fictional career

All clubs, players, cities, stadiums and kits in the Unity career are generated; no real player likenesses or club marks are used. Country names are factual so the world can be browsed by confederation.

- 6 confederations, 96 countries, one national top division per country
- 16 clubs per league (1,536 clubs) and 18-player squads (27,648 players)
- 30-matchweek double round-robin, generated deterministically from the world seed
- every AI match in the managed league is simulated, so the table is complete each week
- a 16-club national knockout cup with a seeded bracket and penalty shootouts
- an in-league transfer market, squad contracts and wage budget

The generator lives in `Assets/Scripts/World` and is plain C# (`WorldDatabase`, `WorldSimulation`) so it can be tested outside Unity. `WorldRandom` uses xorshift32 and FNV-1a instead of `System.Random` so every device produces the same world.

Career saves use schema v6 (`CareerModels.cs`, `CareerSaveSystem.cs`). Only the managed league table, the selected league/club, the calendar, the cup run, trophies, transfers, contracts and the manager's career totals are stored; everything else is regenerated. Saves from the earlier four-club Uganda prototype and from schema v4/v5 migrate automatically: the managed club maps into the generated Uganda top division when needed, career totals/season/budget/tactics/cup state are kept, and the new league table starts at matchweek 1. Contracts are generated for the existing squad on migration.

The hub (`CareerHubManager`) browses confederation → country → league → club, shows the next fixture and league position, and exposes formation, mentality, the squad and the transfer market. Launching a match uses the resolved lineups, ratings (shooting, passing, pace), height/build, appearance data (skin tone, hair colour, face variant) and club/keeper kit colours.

`CareerLeagueSystem.GetNextFixture` drives the calendar. The league fixture is played first each week; on cup weeks (8, 16, 24, 30) the round of 16, quarter-final, semi-final and final follow it, so the final closes the season. `CareerLeagueSystem.CompleteNextFixture` applies the played result to the right competition, simulates the other league fixtures, and rolls over to a new season after the final. Season rollover writes league and cup honours, a season summary and the budget reward into the save.

`CareerCupSystem` regenerates the cup bracket from the world seed and season, so only the user's results are persisted. Drawn ties are settled on a deterministic penalty shootout that is shown at full time and recorded with the result. Knockout ties are played in the same 3D match scene as league fixtures.

### Transfers and contracts

`CareerTransferSystem` keeps the generated squads authoritative. The save stores one compacted move per transferred player and the managed squad's contract end dates, so every squad is rebuilt by applying the moves to the generated world. Buying from a division club costs the market value plus a 15% premium; free agents cost nothing. Sales pay market value and the player joins a deterministically chosen club in the same division. Squads are capped at 26 and must keep at least 12 players and one goalkeeper.

Every generated player starts on a 1-3 season contract; a signing gets three seasons and renewal adds three more. At season rollover, expired contracts leave on a free transfer unless that would break the minimum squad rules. The hub's TRANSFERS screen lists the division's market and the squad, with contract expiry, value and weekly wage; the wage bill is capped by a budget derived from the club's strength.

The market currently covers the managed division plus free agents, and AI clubs only change through the user's sales. Cross-border scouting and an AI transfer window are future work.

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

## Android project settings

`Assets/Editor/AndroidBuilder.cs` is the single source of truth for Android settings. It applies them the first time the project is opened (and again from `FC2026 > Configure Android Project`), and before every build so local machines and CI produce the same package:

- Package ID `com.wilberforcedev.fc2026`, product name `FC 2026 3D Soccer`
- Minimum API level 24, target API level 35
- IL2CPP scripting backend, ARM64 only, managed stripping at Medium
- Landscape auto-rotation only, no internet or SD-card permission
- Mobile quality levels: 2 pixel lights, hard shadows at medium resolution, 2 shadow cascades, 45 m shadow distance, 2x MSAA, VSync off, no soft particles or realtime reflection probes

After the first open, use **File → Save Project** once (the builder tries this automatically) and commit the generated `ProjectSettings/*.asset` files. Until they are committed, the settings only exist after the editor applies them on load.

`FC2026 > Validate Android Release Setup` re-applies the settings, checks the release requirements and signing variables, and then clears the keystore passwords from the editor session.

## Build from the Unity Editor

Debug APK:

```text
FC2026 > Build Android Debug APK
```

Signed release builds:

```text
FC2026 > Build Android Release APK
FC2026 > Build Android Release AAB
```

Release builds read signing material and version numbers from environment variables. Set them before starting Unity, or in the shell that launches it:

| Variable | Purpose |
| --- | --- |
| `FC2026_VERSION_NAME` | Version name such as `1.2.0`. Optional; defaults to `1.0.0`. |
| `FC2026_VERSION_CODE` | Integer version code. Must increase for every Play upload. |
| `FC2026_KEYSTORE_PATH` | Path to the release keystore. Relative paths resolve from the project root. |
| `FC2026_KEYSTORE_BASE64` | Alternative to the path: base64-encoded keystore, used by CI. |
| `FC2026_KEYSTORE_PASS` | Keystore password. |
| `FC2026_KEY_ALIAS` | Key alias. |
| `FC2026_KEY_PASS` | Key password. |

Keystore passwords are cleared from `PlayerSettings` after each release build so they never end up in a committed `ProjectSettings` file. Keystores are ignored by `.gitignore` (`*.keystore`, `*.jks`, `*.p12`).

Outputs in `unity/FC2026Unity/Builds/Android`:

- `FC2026-3D-debug.apk`
- `FC2026-<version>.apk`
- `FC2026-<version>.aab`

## Command-line Android build

Unity can also build without opening the editor UI.

Debug APK example on Windows from the repository root:

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.24f1\Editor\Unity.exe" `
  -batchmode `
  -quit `
  -projectPath "$PWD\unity\FC2026Unity" `
  -buildTarget Android `
  -executeMethod FC2026.EditorTools.AndroidBuilder.BuildAndroid `
  -logFile "$PWD\unity-build.log"
```

Signed AAB example (the same variables work with `BuildAndroidReleaseApk`):

```powershell
$env:FC2026_VERSION_NAME = "1.2.0"
$env:FC2026_VERSION_CODE = "12"
$env:FC2026_KEYSTORE_PATH = "C:\keys\fc2026-release.keystore"
$env:FC2026_KEYSTORE_PASS = "..."
$env:FC2026_KEY_ALIAS = "fc2026"
$env:FC2026_KEY_PASS = "..."

& "C:\Program Files\Unity\Hub\Editor\6000.3.24f1\Editor\Unity.exe" `
  -quit `
  -projectPath "$PWD\unity\FC2026Unity" `
  -buildTarget Android `
  -executeMethod FC2026.EditorTools.AndroidBuilder.BuildAndroidReleaseAab `
  -logFile "$PWD\unity-release.log"
```

## Automated Unity Android build

`.github/workflows/unity-android.yml` builds a debug **Unity 3D** APK on Unity project changes or on demand, and uploads `FC2026-Unity-3D-Android-APK` for 14 days.

`.github/workflows/unity-android-release.yml` builds a signed AAB for the Play Console, and optionally a signed APK. It runs when a `v*` tag is pushed or manually with `version_name`/`version_code` inputs; tag pushes take the version from the tag (`v1.2.0` → `1.2.0`) and the version code from the workflow run number. Uploads `FC2026-Unity-3D-Android-Release-<version>` for 30 days.

Add these to the repository's **Settings → Secrets and variables → Actions** before running either workflow:

- `UNITY_LICENSE` — the contents of your Unity license file.
- `UNITY_EMAIL` and `UNITY_PASSWORD` — only if your Unity licensing setup requires them.
- `FC2026_KEYSTORE_BASE64` — `base64 -w0 fc2026-release.keystore` of the release keystore.
- `FC2026_KEYSTORE_PASS`, `FC2026_KEY_ALIAS`, `FC2026_KEY_PASS` — the keystore and key credentials.

Do not commit license files or keystores to the repository. A CI build confirms that the project can compile, sign and package; a real Android phone or emulator test is still needed to verify touch controls, frame rate, graphics, and save persistence.

## Migration direction

The Unity version will progressively take over these systems from the existing project:

1. core 3D match engine and player movement
2. rigged players and animation blending
3. shooting, passing, dribbling, tackling and goalkeeper animation
4. broadcast/replay/cinematic camera system
5. team and player database migration — done for the fictional world (`Assets/Scripts/World`)
6. tournament mode
7. career mode, transfers and saves — league career, cup, transfers and save v6 done
8. menus/HUD
9. URP mobile rendering profiles and Android optimization
10. signed release APK/AAB — build scripts and CI done; on-device QA remains

The React/Canvas browser prototype has been retired. Unity 3D is the active match build; keep retained career and team systems in the Unity project.
