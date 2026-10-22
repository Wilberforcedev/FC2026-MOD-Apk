# AERO Soccer 2027

**Build your club. Own the match. Chase the trophy.**

AERO Soccer 2027 is an Android-first football-game prototype in Unity 6. The repository also retains earlier browser and Unity experiments, but the current career and 3D work is focused on **`unity_app/`**.

> **Project status:** this is an evolving prototype, not a finished commercial game and not yet at Dream League Soccer / EA SPORTS FC 26 production quality. Unity compilation, automated EditMode tests, Android APK output and physical-device profiling must pass before a release candidate can be claimed.

<p align="center">
  <img src="docs/screenshots/aero-home.svg" width="280" alt="AERO Soccer 2027 home-screen concept sample">
</p>

## Screen samples

The following designs show the intended mobile visual direction for the home hub, manager career, squad/Player Lab and match controls. They are **illustrative SVG concept samples—not screenshots captured from a running Unity build**. Replace them with actual device captures after the Unity build and playtests.

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/aero-home.svg" width="225" alt="Home screen concept"><br><strong>Home hub</strong></td>
    <td align="center"><img src="docs/screenshots/aero-career.svg" width="225" alt="Manager career concept"><br><strong>Manager career</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/aero-squad.svg" width="225" alt="Squad and Player Lab concept"><br><strong>Squad / Player Lab</strong></td>
    <td align="center"><img src="docs/screenshots/aero-matchday.svg" width="225" alt="Matchday and touch controls concept"><br><strong>Matchday controls</strong></td>
  </tr>
</table>

## Current feature set

### Career and club management

- A persistent career save under Unity's `Application.persistentDataPath`, with schema migration and a rolling backup.
- Runtime snapshot support for fixtures, league standings, squad/player attributes, the starting eleven, training/progression records, scouting assignments and scouting reports.
- A career control screen to start or resume a career, save/load, play the next fixture, train the squad, advance the week, review objectives/contracts, use scouting and manage sales.
- Transfer-budget and weekly-wage checks, contract terms and transfer-window rules.
- Live career-match results recorded against the corresponding fixture; other clubs' fixtures in the matchweek are simulated.
- Season rollover, board-confidence changes, contract expiry handling, and cup-bracket progression logic.

**Important data prerequisite:** promotion/relegation only works where a country has multiple divisions represented at distinct tiers in the catalog. The bundled catalog currently describes one top-tier league per country, so it does not yet provide complete multi-tier career pathways. The cup code uses simplified bracket and tie-break rules; extra time and penalty shoot-outs are not yet modelled as full competition rules.

### Squad and players

- A Player Lab screen linked from Squad Management.
- Create custom players and edit names, positions, overall ratings, and pace, shooting, passing, dribbling, defending and physicality.
- Club-scoped local persistence for custom/edited players and career snapshots of squad attributes and starting-eleven selection.

### 3D match presentation and controls

- Runtime-generated pitch, pitch markings, goal frames/net lattice, penalty areas, stadium stands, lighting and match camera.
- Procedural articulated footballer visuals with a basic running gait, with an optional hook for a future rigged prefab at `Assets/Resources/AERO/FootballerVisual.prefab`.
- Ball Rigidbody tuning, touch joystick, sprint, pass, shoot, tackle and switch-player controls.
- Android quality defaults that choose a provisional 30/60 FPS cap, LOD/shadow settings and skin-weight profile based on reported device resources.

The current footballers are **procedural prototype models**, not realistic skinned characters with motion-captured animation. Stadium crowds, advanced goalkeeper behaviour, authentic player likenesses, full tactics/AI depth and commercial-grade graphics remain future work. The Android quality values are starting points until profiled on real devices.

## Football World data

The bundled source catalog is in `unity_app/Assets/Data/FootballWorld/`:

| Catalog | Current records |
| --- | ---: |
| League identities | 25 |
| Club identities | 300 |
| Player profiles | 7,500 |
| Competition definitions | 26 |

Club/league identities represent real-world football entities, but the generated player profiles are **fictional sample players**, not verified current club rosters. Several stadium labels and competition structures are generic/incomplete. Do not treat this database as a verified live roster dataset.

The runtime loader uses `Resources/FootballWorld/`. Opening the Unity Editor syncs the canonical JSON files from `Assets/Data/FootballWorld` into Resources. Catalogs are validated at load time and by the Python validation command below.

## Open and run the Unity project

1. Install **Unity 6.0.1f1** through Unity Hub with **Android Build Support**, including Android SDK & NDK Tools and OpenJDK.
2. In Unity Hub, open this repository's `unity_app/` folder as a project.
3. Let package import and the Editor resource-catalog sync finish. Check the Console for `[Football World]` validation errors.
4. Open the intended application scene, verify it appears in **File → Build Profiles → Scene List**, and set Android as the build target. If the Scene List is empty, add the game's boot scene before building.
5. Enter Play Mode and check startup, career creation, save/load, the next-fixture flow, full-time score/standings, squad edits and transfer-window restrictions.

### Android APK build

In Unity, open **File → Build Profiles → Android**, switch platform, set package identifier and orientation, select the intended scene(s), and build an APK. Use a development build while testing; configure signing and release settings separately before distribution.

The repository's GitHub Actions workflow can run EditMode tests and build an APK when a valid `UNITY_LICENSE` secret is configured. Without that secret, the Unity test/build steps are skipped; the Python/source checks still run.

## Validation and tests

Run the catalog validator from the repository root:

```bash
python unity_app/Tools/validate_football_world.py
```

In Unity, run **Window → General → Test Runner → EditMode** and execute the tests under `unity_app/Assets/Tests/Editor/`. The suite includes catalog parsing, double-round-robin scheduling, table points, cup-result isolation, snapshot restore, career persistence, contract and transfer-window tests.

**Do not infer a passing Unity build from the presence of test files.** Check the [AERO Career Validation workflow](https://github.com/Wilberforcedev/FC2026-MOD-Apk/actions/workflows/aero-career-validation.yml) for run results. A physical Android device or emulator is still required to confirm touch layout, frame time, memory, thermal behaviour and save persistence on actual hardware.

## Repository layout

| Path | Purpose |
| --- | --- |
| `unity_app/` | Current Unity 6 AERO Soccer / Football World implementation |
| `unity_app/Assets/Data/FootballWorld/` | Canonical football-world JSON data |
| `unity_app/Assets/Scripts/` | Runtime career, squad, catalog, match and mobile UI systems |
| `unity_app/Assets/Tests/Editor/` | Unity EditMode tests |
| `unity_app/Tools/` | Python validation tools |
| `docs/screenshots/` | Branded SVG concept samples for documentation |
| `unity/FC2026Unity/` | Separate earlier Unity 6.3 3D experiment |
| `src/` | Earlier React/TypeScript browser prototype |
| `flutter_app/` | Experimental Flutter client |

The two Unity projects are still separate and use different Unity editor versions; features documented for `unity_app/` should not be assumed to exist in `unity/FC2026Unity/` or the browser client.

## Development priorities

1. Run Unity EditMode tests and resolve compile/runtime defects.
2. Complete multi-tier league and domestic cup data so promotion/relegation and competition calendars can operate across real divisions.
3. Replace procedural player shapes with licensed or original rigged models, authored animation clips and improved goalkeeper/AI behaviour.
4. Profile Android performance on low-, mid- and high-tier devices, then tune graphics presets using measured results.
5. Capture actual screenshots and record build/test evidence before advertising production readiness.

