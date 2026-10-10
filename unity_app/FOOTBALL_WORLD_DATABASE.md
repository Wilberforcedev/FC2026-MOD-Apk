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

## Parser and validation behavior

`FootballWorldCatalogParser` is the shared parser used by both runtime loading and the Unity Editor importer. It parses each wrapped JSON catalog with `JsonUtility`, reports missing files, empty files, invalid JSON, and null parse results, and returns a `FootballWorldValidationReport`.

`FootballWorldDatabase.Validate()` checks duplicate and empty IDs, player-to-club references, club-to-league references, competition eligibility references, rating ranges, unusual ages, missing likeness profile IDs, negative club budgets, and league club-count mismatches. Editor imports abort without replacing the existing asset when errors are found. Runtime loads retain the existing database when the incoming catalog is invalid and log the errors for diagnostics.
