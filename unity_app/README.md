# FC 2026 — Unity 6

This folder is the Unity 6 implementation of the FC 2026 mobile soccer game.

## Open in Unity

1. Install **Unity 6.0 LTS** with Android Build Support and iOS Build Support as needed.
2. Open this `unity_app` folder in Unity Hub.
3. Create a URP asset through **Assets → Create → Rendering → URP Asset (with Universal Renderer)** if Unity does not generate one automatically.
4. Create a scene with an empty `GameBootstrap` object and attach `Assets/Scripts/GameBootstrap.cs`.
5. Add the `MatchArena` scene after creating a pitch, camera, ball, and player prefab.

## Runtime architecture

- `GameBootstrap` — application entry point and mode routing.
- `SquadData` — serializable player, team, formation, and stat data.
- `SquadManager` — lineup selection, chemistry, substitutions, and formation changes.
- `MatchManager` — match clock, scores, match states, and goal events.
- `MobileInputController` — touch-friendly movement, sprint, pass, shoot, tackle, and switch-player actions.
- `GameModeController` — Kick-off, Career, Champions Cup, Penalty Duel, Practice, and Squad Management.

The project is designed for a 3D match scene in Unity URP, with UI screens and data-driven systems kept separate from match presentation.
