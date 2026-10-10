# FC 2026 — Unity 6

This folder is the Unity 6 implementation of the original mobile soccer game.

## Current implementation

The first playable foundation includes a runtime-generated 3D pitch, match ball, sample footballers, mobile input, ball physics, tactical positioning, broadcast/follow cameras, squad chemistry, and a career foundation with fixtures, league points, matchweeks, and transfer budget.

The project now also includes a **Unity Netcode for GameObjects multiplayer baseline**. It supports host/client sessions over Unity Transport, synchronized match clock and score, networked player identity, ready state, server-authoritative goal events, and a simple mobile-friendly online session panel.

## Open in Unity

1. Install **Unity 6.0 LTS** with Android Build Support and iOS Build Support as needed.
2. Open this `unity_app` folder in Unity Hub.
3. Create a scene with an empty `GameBootstrap` object and attach `Assets/Scripts/GameBootstrap.cs`.
4. Add `MatchArenaBootstrap` to another empty object for the prototype arena.
5. Add a `NetworkManager` object with `UnityTransport`, `NetworkSessionManager`, `NetworkMatchState`, and `NetworkSessionPanel`.
6. Create a networked player prefab with `NetworkObject` and `NetworkPlayerIdentity`, then register it in the NetworkManager's Player Prefab field.
7. Press Play twice for a local host/client test. Enter the host machine's LAN address on the client device.

## Multiplayer architecture

`NetworkSessionManager` owns host/client lifecycle and Unity Transport configuration. `NetworkMatchState` keeps the score, match clock, running state, and goal events server-authoritative. `NetworkPlayerIdentity` synchronizes display name, team side, and ready state. `NetworkSessionPanel` provides a temporary touch-friendly test panel for hosting, joining, readying up, starting, and leaving a match.

For production internet matchmaking, connect the project to **Unity Gaming Services** and replace direct IP joining with Lobby plus Relay. Relay is required for most mobile users because direct inbound connections are blocked by carrier NAT and home routers. Add authentication, lobby discovery, reconnect handling, server validation, lag compensation, anti-cheat rules, and rate limits before ranked play.

## Runtime architecture

- `GameBootstrap` — application entry point and sample team data.
- `GameModeController` — Kick-off, Career, Champions Cup, Penalty Duel, Practice, and Squad Management routing.
- `MatchArenaBootstrap` — prototype 3D arena generation and player spawning.
- `BallController` — ball motion, passing, shooting, spin, lift, and friction.
- `FootballerController` — player movement and ball actions.
- `TacticalAI` — formation anchors, pressing, and marking response.
- `MatchCameraController` — broadcast and follow-player camera presentation.
- `MobileInputController` — UI-friendly touch input.
- `SquadData` / `SquadManager` — data-driven players, teams, formations, and lineups.
- `MatchManager` — offline match clock, scores, state changes, halftime, and full time.
- `CareerManager` — fixtures, league table, transfer budget, and season progression foundation.
- `NetworkSessionManager` — host/client session lifecycle.
- `NetworkMatchState` — synchronized server-authoritative score and match clock.
- `NetworkPlayerIdentity` — synchronized player identity and ready state.
- `NetworkSessionPanel` — prototype online session controls.

## Next production milestones

1. Replace primitives with optimized player, pitch, stadium, ball, and kit assets.
2. Add Animator Controllers, locomotion blend trees, passing/shooting animations, tackles, goalkeeper saves, and celebrations.
3. Add real pitch markings, goals, net physics, match HUD, pause menu, replay camera, and goal presentation.
4. Expand tactical AI into defensive lines, offside, set pieces, fouls, cards, substitutions, and difficulty presets.
5. Connect Unity Authentication, Lobby, and Relay for internet matches.
6. Add interpolation, client prediction, server reconciliation, reconnect flow, host migration, anti-cheat, and match results validation.
7. Add persistent career saves, transfers, player development, stadium upgrades, and Android builds.
8. Add online friend matches only after the offline match is stable at 30 FPS on target devices.
