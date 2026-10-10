# Football World Database V1

The football world is data-driven and split into JSON catalogs so gameplay, career mode, transfer market, and UI do not depend on hard-coded clubs or players.

## Catalogs

- `players.json` — player IDs, club IDs, positions, attributes, age, value, and likeness profile IDs.
- `clubs.json` — club IDs, league IDs, stadium names, colors, country, and starting budgets.
- `leagues.json` — tiers, club counts, promotion flags, and country.
- `competitions.json` — league, cup, and international competition definitions.

## Unity workflow

1. Open the project in Unity 6.
2. Confirm the files exist under `Assets/Data/FootballWorld`.
3. Use **FC 2026 → Import Football World V1**.
4. Unity creates or updates `FootballWorldDatabase.asset`.
5. Assign that asset to `FootballWorldCatalogLoader` and the transfer-market services.

The V1 data is intentionally original and fictional. Real players, likenesses, club names, badges, leagues, kits, stadiums, and official competition branding require the appropriate licenses. The `likenessProfileId` field is a placeholder for future licensed or commissioned appearance data; it is not a real-person likeness by itself.
