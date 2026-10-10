# FC 2026 — Unity 6

This folder is the Unity 6 implementation of the original mobile soccer game.

## Current implementation

The first playable foundation is now in place:

- Unity 6 project configuration with URP and Input System packages
- Runtime-generated 3D pitch, ball, camera, and sample footballers
- Mobile movement input surface with sprint, pass, shoot, tackle, and switch-player actions
- Ball physics with passing, shooting, lift, curve, friction, and continuous collision detection
- Footballer controller with acceleration, turning, sprint speed, and ball-control checks
- Tactical AI with formation anchors, ball influence, pressing, and marking response
- Broadcast and follow-player camera modes
- Squad management with starting XI, swaps, best-player lookup, and chemistry
- Career manager with fixtures, table points, promotion groundwork, and transfer budget
- Game mode routing for Kick-off, Career, Champions Cup, Penalty Duel, Practice, and Squad Management

## Open in Unity

1. Install **Unity 6.0 LTS** with Android Build Support and iOS Build Support as needed.
2. Open this `unity_app` folder in Unity Hub.
3. Create a scene with an empty `GameBootstrap` object and attach `Assets/Scripts/GameBootstrap.cs`.
4. Add another empty object with `Assets/Scripts/MatchArenaBootstrap.cs`.
5. Press Play. The runtime bootstrap creates a prototype pitch, ball, camera, two teams, and 22 footballers.
6. Replace runtime primitives with prefabs and art assets as the next production step.

## Runtime architecture

- `GameBootstrap` — application entry point and sample team data.
- `GameModeController` — Kick-off, Career, Champions Cup, Penalty Duel, Practice, and Squad Management routing.
- `MatchArenaBootstrap` — prototype 3D arena generation and player spawning.
- `BallController` — ball motion, passing, shooting, spin, lift, and friction.
- `FootballerController` — player movement and ball actions.
- `TacticalAI` — formation anchors, pressing, and marking response.
- `MatchCameraController` — broadcast and follow-player camera presentation.
- `MobileInputController` — UI-friendly touch input actions.
- `SquadData` / `SquadManager` — data-driven players, teams, formations, and lineups.
- `MatchManager` — match clock, scores, state changes, halftime, and full time.
- `CareerManager` — fixtures, league table, transfer budget, and season progression foundation.

## Next production milestones

1. Replace primitives with optimized player, pitch, stadium, ball, and kit assets.
2. Add Animator Controllers, locomotion blend trees, passing/shooting animations, tackles, goalkeeper saves, and celebrations.
3. Add real pitch markings, goals, net physics, match HUD, pause menu, replay camera, and goal presentation.
4. Expand tactical AI into defensive lines, offside, set pieces, fouls, cards, substitutions, and difficulty presets.
5. Add persistent career saves, transfers, player development, stadium upgrades, and Android builds.
6. Add online friend matches only after the offline match is stable at 30 FPS on target devices.
