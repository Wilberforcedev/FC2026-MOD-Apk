# FC 2026 UI style guide

The interface uses one consistent visual system across the home hub, squad management, kit selection, career, online lobby, match HUD, rewards, and settings. The attached kit-selection reference is the visual direction: a dark stadium environment, soft depth-of-field, bright overhead spotlights, collectible item cards, and clear controller/touch affordances.

## Visual rules

- Use a deep navy-black stadium shell rather than flat white pages.
- Keep the active content panel bright enough to read, but preserve the blurred stadium atmosphere behind it.
- Use uppercase, heavy white headings with short labels and generous tracking.
- Use cyan as the universal active/focus color: selected cards, focus brackets, active tabs, progress accents, and confirm actions.
- Use muted blue-gray for secondary copy and inactive controls.
- Use collectible card silhouettes for players, kits, badges, rewards, and transfer targets.
- Reserve bronze, silver, gold, and elite blue for item tier—not for unrelated buttons.
- Use the same bottom interaction rail on controller and touch layouts: back, actions, search, rotate, and confirm.
- Never introduce a new accent color for a single screen without adding it to `FC2026UITheme`.

## Layout rules

The shell uses a wide 16:9 composition for console/tablet and a responsive vertical composition for phones. The title block stays upper-left, the selected item remains the largest object on screen, and supporting cards occupy a consistent grid. Focus states use a 3 px cyan bracket or outline plus a subtle cyan glow; selection must never rely on color alone.

## Component rules

Buttons, tabs, cards, modal panels, scoreboards, tooltips, and loading states all consume the shared `FC2026UITheme` asset. Cards share the same radius, shadow, title position, rating area, and item metadata layout. The match HUD uses the same typography and cyan focus language, but is more transparent so gameplay remains visible.

## Accessibility and mobile behavior

Maintain readable contrast, support large text scaling, keep touch targets at least 44 logical pixels, avoid essential information in the screen corners, and provide both controller focus and direct touch input. Every interactive card needs a visible focused, pressed, disabled, and loading state.
