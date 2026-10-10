# FC 2026 — Unity 6

This folder is the Unity 6 implementation of the original mobile soccer game.

## Current implementation

The project includes a runtime-generated 3D pitch, match ball, sample footballers, mobile input, ball physics, tactical positioning, broadcast/follow cameras, squad chemistry, and a career foundation with fixtures, league points, matchweeks, and transfer budget.

The project now includes internet multiplayer through **Unity Gaming Services Authentication, Lobby, and Relay**, layered on top of Netcode for GameObjects. Players can anonymously authenticate, create a public lobby, receive a short Relay invite code, join that lobby from another device, and connect through Relay without exposing a host IP address.

## Unity Gaming Services setup

1. Open the project in Unity 6 and sign in with the Unity account that owns the project.
2. Create or select a project in the Unity Dashboard at https://cloud.unity.com/.
3. Copy the project's GUID into **Edit → Project Settings → Services**.
4. Enable **Authentication**, **Lobby**, and **Relay** in the Unity Dashboard.
5. Configure the Relay regions and usage limits for the project.
6. Open the scene with a `NetworkManager` object, a `UnityTransport` component, and the networked player prefab registered in the Player Prefab field.
7. Add `UnityServicesOnlineSession` and `NetworkSessionPanel` to the scene.
8. Build the same Android or iOS app on two devices. One player selects **CREATE ONLINE LOBBY** and shares the displayed code; the second selects **JOIN ONLINE LOBBY** and enters that code.

The code uses anonymous sign-in for the prototype. Production accounts should link authentication to Apple, Google, or another durable identity provider before adding purchases, rankings, or cloud saves.

## Multiplayer architecture

`UnityServicesOnlineSession` initializes Unity Services, signs in anonymously, creates and joins Lobby records, creates and joins Relay allocations, writes the Relay join code into lobby data, sends lobby heartbeats, refreshes lobby state, updates ready state, and leaves cleanly. `NetworkSessionManager` remains available for local/LAN testing. `NetworkMatchState` keeps the score, match clock, and goal events server-authoritative. `NetworkPlayerIdentity` synchronizes display name, team side, and ready state. `NetworkSessionPanel` exposes a temporary mobile-friendly create/join interface.

Unity documents the classic Lobby + Relay workflow at https://docs.unity.com/en-us/mps-sdk/tutorials/relay-and-ngo. Unity also marks the standalone `com.unity.services.relay` package as deprecated for Unity 6; after this prototype is proven, migrate the session orchestration to the current Multiplayer Services SDK sessions API while preserving the lobby-code UX.

## Match and career systems

The runtime prototype also includes a generated pitch, ball passing and shooting, footballer movement, formation anchors, pressing and marking response, broadcast/follow cameras, squad swaps and chemistry, and a career manager with fixtures, table points, matchweeks, and transfer budget.

## Next production milestones

1. Replace primitives with optimized player, pitch, stadium, ball, and kit assets.
2. Add Animator Controllers, locomotion blend trees, passing/shooting animations, tackles, goalkeeper saves, and celebrations.
3. Add real pitch markings, goals, net physics, match HUD, pause menu, replay camera, and goal presentation.
4. Expand tactical AI into defensive lines, offside, set pieces, fouls, cards, substitutions, and difficulty presets.
5. Migrate the prototype Lobby + Relay flow to the current Multiplayer Services SDK session API.
6. Add interpolation, client prediction, server reconciliation, reconnect flow, host migration, anti-cheat, and match results validation.
7. Add durable player authentication, cloud saves, transfers, player development, stadium upgrades, and Android builds.
8. Add ranked play only after online friend matches are stable at 30 FPS on target devices.

## Shared UI direction

All screens follow one FC 2026 presentation system inspired by the supplied kit-selection reference: dark stadium backdrops, soft spotlighting, bold white uppercase headings, cyan focus brackets, muted blue-gray secondary text, collectible card silhouettes, and a consistent controller/touch interaction rail. The shared `FC2026UITheme` ScriptableObject stores the palette, card tiers, spacing, panel radius, focus treatment, and interaction colors so screens do not drift visually. See `UI_STYLE_GUIDE.md` before creating any new screen or component.

## Transfer market

`TransferMarketScreen` is the first full screen built on `FC2026UITheme`. It presents searchable collectible player cards, bronze/silver/gold/elite tier colors, position and club context, player attributes, transfer fees, focused-player details, budget checks, squad insertion after purchase, and themed success/failure states. Add it to a scene with `FC2026UITheme`, `CareerManager`, and `SquadManager` references to use the runtime screen.

## Football World Database V1

The original fictional V1 world is now stored under `Assets/Data/FootballWorld`: 8 clubs, 2 leagues, 3 competitions, and 96 players. `FootballWorldDatabase` is the ScriptableObject runtime index; `FootballWorldCatalogLoader` loads JSON at runtime; and the editor menu **FC 2026 → Import Football World V1** creates or refreshes `FootballWorldDatabase.asset`. The transfer market can consume this database directly instead of its demo listings. See `FOOTBALL_WORLD_DATABASE.md` for the schema and licensing boundary.


## Football World browser

`FootballWorldBrowserScreen` displays the ScriptableObject database through the shared `FC2026UITheme`. It provides player and club modes, catalog counts, themed cards, rating and value details, club stadium/budget details, focus states, and lightweight search filters. Add it to a scene with `FootballWorldDatabase`, `FC2026UITheme`, and a Canvas reference; it can also discover the database from `FootballWorldCatalogLoader`.

## Automated catalog tests

EditMode tests live under `Assets/Tests/Editor/FootballWorldCatalogTests.cs`. They cover wrapped JSON parsing, malformed and missing catalogs, duplicate IDs, broken cross-catalog references, successful loader replacement, and protection of an existing database after an invalid load. Run them from **Window → General → Test Runner → EditMode** or with Unity batch mode in CI.

## Career Mode season calendar

`SeasonCalendarManager` generates a deterministic double round-robin season from the Football World Database. It creates home and away fixtures, assigns matchweeks, exposes the next fixture and week queries, records results, updates wins/draws/losses/goals/points, and provides standings ordered by points, goal difference, and goals scored. EditMode coverage is in `Assets/Tests/Editor/SeasonCalendarTests.cs`.

## Career live match

`CareerMatchSimulationEngine` runs a deterministic 90-minute offline simulation from the next season fixture. It calculates team strength from database players, emits kickoff, shot, goal, card, halftime, and full-time events, supports pause/speed/skip controls, and records the final result back into `SeasonCalendarManager`. `CareerMatchLiveScreen` presents the themed scoreboard, clock, commentary feed, match details, and controls using `FC2026UITheme`.
