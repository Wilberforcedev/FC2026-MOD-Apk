# Contributing to FC 2026 Soccer

Thanks for contributing.

## Development workflow

1. Fork the repository or create a feature branch.
2. Keep changes focused on one feature or bug.
3. Run:
   ```bash
   npm run typecheck
   npm run build
   ```
4. Test the affected game mode on desktop and, where applicable, a mobile viewport.
5. Open a pull request with:
   - What changed
   - Why it changed
   - How it was tested
   - Screenshots/video for significant UI changes

## Code guidelines

- Prefer TypeScript types over `any`.
- Keep game simulation logic separate from presentation components.
- Avoid unnecessary changes to the core engine when fixing UI issues.
- Preserve offline functionality unless a feature explicitly requires network access.
- Never commit API keys, signing credentials, or generated secrets.

## Commit messages

Use clear, action-oriented messages, for example:

- `feat: add career transfer filters`
- `fix: prevent duplicate match-end processing`
- `perf: reduce canvas redraw allocations`
- `docs: improve Android setup`
