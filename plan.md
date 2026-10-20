# FC26-inspired Kit Room

## Scope
Keep the FC 2026 experience mobile-only and add a functional Kit Room screen to the React/TypeScript prototype that is packaged through the existing Capacitor Android route. The screen is inspired by the supplied FC26 kit-selection reference, but uses the repository's existing original data, player portraits, stadium background, and shared FC2026 cyan-focus visual language.

## Design direction
- **Design movement:** cinematic sports broadcast UI with collectible-card inventory.
- **Core principles:** selected kit is the dominant object; secondary kits read as collectible items; stadium atmosphere sits behind a readable dark glass panel; every focus state is visible through cyan brackets/glow, not color alone.
- **Color philosophy:** deep navy/black for the stadium shell, cyan for focus and actions, tier colors only for card rarity, and warm white for information hierarchy.
- **Layout paradigm:** split composition with a left inventory rail and right player/kit stage, plus a persistent bottom interaction rail.
- **Signature elements:** cyan selection brackets, shield-shaped kit cards, blurred stadium with a spotlighted preview stage.
- **Interaction:** click a card to select it, use Previous/Next to cycle, activate the selected kit, rotate the preview, and search/filter kit cards.
- **Typography:** existing system/Chakra Petch/uppercase heavy labels inherited from the project.

## Implementation
- Add `src/components/KitSelectionScreen.tsx`.
- Add a `kits` screen state and lazy route in `src/App.tsx`.
- Add Kit Room entry point to `MainMenu.tsx`.
- Add scoped `.kit-room-*` CSS to `src/index.css`.
- Keep `public/manus-routes.json` aligned with the repository's existing single-page route model.
- Reuse `TEAMS`, `TeamKit`, `ClubEmblem`, and `PlayerPortrait`; no new external assets required.

## Acceptance
- The app builds and typechecks.
- The Kit Room shows a selected large front/back kit preview, a selectable inventory of kit cards, exact team/kit metadata, visible cyan focus state, functional Previous/Next, Activate, Rotate, Search, and Back actions.
- The new screen is reachable from the home hub without breaking existing routes.
- The style matches the supplied reference's 16:9 stadium/item-selection composition while remaining original to FC 2026.
