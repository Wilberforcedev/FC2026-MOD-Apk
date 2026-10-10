# Football World Database V1 — Presentation Script

## Audience

Engineering, game design, UI/UX, content, art, and production teams.

## Suggested length

8–10 minutes, with one minute per section.

---

## Slide 1 — Football World Database V1

**On-screen points**

- Data-driven football world for FC 2026
- Original fictional content
- Unity 6 + JSON + ScriptableObjects
- License-ready foundation

**Speaker script**

“Today I’m presenting the Football World Database V1. This is the foundation that separates the football world from the gameplay code. Instead of hard-coding clubs, leagues, players, or competitions inside individual screens, we now maintain a structured catalog that every system can consume. V1 uses original fictional content so we can build and test the game without copying protected football IP. The structure is designed to accept licensed content later without requiring a rewrite of the gameplay, career, or UI systems.”

---

## Slide 2 — What V1 contains

**On-screen points**

- 8 fictional clubs
- 2 fictional leagues
- 3 competitions
- 96 fictional players
- Persistent IDs across all records

**Speaker script**

“V1 currently contains eight fictional clubs, two fictional leagues, three competitions, and ninety-six fictional players. Each record has a stable ID. These IDs are important because names, logos, or display values may change, while systems such as transfers, saves, fixtures, and multiplayer results need a reliable reference that does not change.”

---

## Slide 3 — The four JSON catalogs

**On-screen points**

| Catalog | Responsibility |
|---|---|
| `players.json` | Attributes, position, age, value, club relationship |
| `clubs.json` | Club identity, league, stadium, colors, budget |
| `leagues.json` | Tier, country, club count, promotion rules |
| `competitions.json` | League, cup, and tournament eligibility |

**Speaker script**

“The JSON layer is split into four catalogs. Players describe football talent and their club relationship. Clubs describe the team identity and financial starting point. Leagues describe the competition hierarchy and promotion behavior. Competitions describe which leagues are eligible to participate. Splitting the data this way keeps content ownership clear: the content team can update a player or club without editing match code.”

---

## Slide 4 — Player data model

**On-screen points**

- Identity: ID, display name, club ID
- Gameplay: position, overall, pace, shooting, passing
- Supporting attributes: dribbling, defending, physicality
- Career: age, market value
- Appearance hook: likeness profile ID

**Speaker script**

“Every player record combines gameplay, career, and appearance references. The gameplay attributes are currently used as data inputs for squad and transfer systems. Age and market value support career progression and transfers. The likeness profile ID is intentionally only a hook. It lets us connect future art or licensed appearance data without claiming or embedding a real person’s likeness in the fictional catalog.”

---

## Slide 5 — ScriptableObject runtime index

**On-screen points**

- `FootballWorldDatabase`
- Fast lookup by ID
- Players by club
- Clubs by league
- Shared runtime source for systems

**Speaker script**

“Inside Unity, the runtime index is the `FootballWorldDatabase` ScriptableObject. It stores the imported lists and provides lookup methods such as finding a player by ID, finding a club by ID, retrieving all players for a club, and retrieving all clubs for a league. This gives gameplay and UI systems one consistent source of truth instead of each system loading its own copy of the data.”

---

## Slide 6 — Import pipeline

**On-screen points**

```text
JSON catalogs
      ↓
FootballWorldCatalogLoader
      ↓
FootballWorldDatabase.asset
      ↓
Career / Squad / Transfer / UI systems
```

- Runtime loader for builds
- Editor menu importer for content updates
- Validation point before release

**Speaker script**

“The pipeline supports both development and runtime use. During authoring, the editor command ‘FC 2026 → Import Football World V1’ reads the four JSON files and creates or refreshes the ScriptableObject asset. At runtime, the catalog loader can read the JSON TextAssets into a database instance. This gives the team a quick content iteration path while keeping the game systems independent from the source format.”

---

## Slide 7 — Transfer-market integration

**On-screen points**

- Transfer market reads database players
- Club name resolved by club ID
- Fee comes from market value
- Recommended flag based on overall
- Purchase adds player to squad
- Career budget is checked before signing

**Speaker script**

“The first consumer is the transfer market. When a database is assigned, the screen converts world player definitions into gameplay player records. It resolves the player’s club through the club ID, uses market value as the transfer fee, marks higher-rated players as recommended, and checks the career budget before a purchase. After a successful signing, the player is added to the current squad. The screen still supports demo listings as a fallback for scenes that have not yet been assigned a database asset.”

---

## Slide 8 — Content and licensing boundary

**On-screen points**

- V1 is original and fictional
- No real club badges or kits
- No real player likenesses
- Likeness IDs are placeholders
- Licensed data can replace catalog values later

**Speaker script**

“This boundary is important. V1 is intentionally fictional. We are not using real player names, club badges, league branding, kits, stadium likenesses, or player faces. The data model is license-ready, but a field that can hold a likeness profile is not permission to use a real person’s image. If licensing becomes available, we can replace the fictional catalog records and connect approved art, appearance, and branding assets through the same IDs.”

---

## Slide 9 — Team workflow

**On-screen points**

1. Content edits JSON
2. Importer refreshes database asset
3. Designers review in Unity
4. QA validates IDs and relationships
5. Game systems consume the same database

**Speaker script**

“The proposed team workflow is simple. Content editors update the JSON catalogs. Engineering or tools runs the importer. Design reviews the result in Unity. QA validates that IDs, club relationships, league assignments, and competition eligibility are consistent. Career, squad, transfer, and UI features then consume the same database. This reduces duplicated content and makes errors easier to find before they reach a build.”

---

## Slide 10 — Next milestones

**On-screen points**

- Add catalog validation and duplicate-ID checks
- Add season calendar and fixture generation
- Connect career tables to league definitions
- Generate transfer listings from club budgets
- Add player development and contract data
- Add kit, badge, stadium, and likeness asset references
- Expand to 20–30 clubs after V1 validation

**Speaker script**

“Next, we should strengthen the content pipeline before expanding the world. The first tool improvement is validation: duplicate IDs, missing club IDs, invalid league IDs, unsupported positions, and competition references should be reported before import. Then we can connect league definitions to season calendars, fixtures, promotion, and relegation. The transfer system can use club budgets and player values more realistically. Once V1 is stable, we can expand to twenty or thirty clubs and introduce approved art and licensed data where available.”

---

## Closing statement

“The Football World Database V1 gives FC 2026 a stable content foundation. It allows us to build the game around original fictional football content today, while keeping the architecture flexible enough for future licensed players, clubs, leagues, kits, stadiums, and likeness assets. The key principle is that gameplay systems should depend on stable IDs and structured definitions—not on hard-coded names or one-off UI data.”

---

## Team discussion prompts

- Which team owns each catalog and who approves changes?
- Do we want JSON-only source control, or a spreadsheet-to-JSON export step?
- Which player attributes should influence match simulation first?
- What is the minimum league structure required for Career Mode V1?
- Which appearance assets should be commissioned before licensed content?
- What validation errors should block a build versus appear as warnings?
