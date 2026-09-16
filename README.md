# FC 2026 Soccer

A responsive, high-performance web and Android soccer game built with React, TypeScript, Tailwind CSS, and HTML5 Canvas. Experience complete offline play, realistic 2D match simulation, physics-based ball mechanics, tactical formations, dynamic career mode with transfer market, dynamic news feed reporting on league-wide transfers and injuries, and an integrated player editor with custom SVG face cards.

---

## Key Features

### ⚽ Gameplay & Match Engine
- **Physics-Driven 2D Pitch Engine**: Real-time ball trajectory, swerve, rebound physics, sprint stamina, sliding tackles, shooting power bars, and chip shots.
- **Dynamic AI & Tactics**: AI opponents adjust pressing intensity, defensive blocks, and attacking counter-runs based on difficulty and scoreline.
- **Multiple Game Modes**:
  - **Kickoff**: Quick exhibition matches with full club & league crest selector.
  - **Career Mode**: Full season management across European leagues, table progression, prize money, fixture schedule, and squad rotation.
  - **Champions Tournament**: Knockout cup bracket with quarter-finals, semi-finals, and finals.
  - **Penalty Shootout**: High-pressure goalkeeper duels with direction and power indicators.
  - **Tactical Squad Management**: Custom formation creator (4-3-3, 4-2-3-1, 3-5-2, etc.), starter/bench drag-and-drop, and role assignments.

### 🎨 Visual Identity & Authentic Crests
- **High-Fidelity Club & League Emblems**: Authentic SVG vector crests for top clubs across Premier League, La Liga, Bundesliga, and International teams.
- **Procedural Player Face Cards**: Dynamic ultimate-team style player cards featuring procedural facial likenesses (skin tone, hair style, facial hair, boot colors, jersey kits, and dynamic card themes).
- **Player Creator & Attribute Editor**: In-depth creator modal allowing managers to edit player stats (Pace, Shooting, Passing, Dribbling, Defending, Physicality) and customize facial likenesses in real time.

### 📰 Dynamic League News & Medical Room
- **Dynamic News Feed**: Real-time reporting on league-wide blockbusters, breaking transfer rumors, injury reports, and fitness recovery updates.
- **Physio Room**: Active tracker monitoring injured players across the league with weeks remaining, severity levels, and clinical diagnoses.

### 📱 Android APK & PWA Compatibility
- **WebAPK 1-Tap Installation**: Installs directly onto any Android device home screen as a standalone application.
- **Bubblewrap / TWA Ready**: Manifest and asset bundle structured for native Android `.apk` generation using `@bubblewrap/cli` or PWABuilder.
- **Touch-Optimized Virtual Controls**: Dual virtual thumbstick and touch action buttons (Pass, Shoot, Sprint, Tackle) engineered for mobile ergonomics.

---

## Project Structure

```
fc-2026-soccer/
├── public/
│   ├── icon.svg                     # Primary app icon
│   ├── manifest.webmanifest         # PWA & WebAPK manifest
│   └── pwa-192x192.png              # Android launcher icon
├── src/
│   ├── components/
│   │   ├── AndroidAPKModal.tsx      # APK build & 1-tap install modal
│   │   ├── CareerMode.tsx           # Full Career Mode dashboard & squad hub
│   │   ├── ClubEmblem.tsx           # Vector SVG club badges
│   │   ├── FCInboxModal.tsx         # Dynamic news feed & Physio Room
│   │   ├── LeagueEmblem.tsx         # League crests (PL, La Liga, Bundesliga)
│   │   ├── MatchEngine.tsx          # Canvas 2D soccer match simulation
│   │   ├── PenaltyShootout.tsx      # Penalty shootout minigame
│   │   ├── PlayerEditorModal.tsx    # Player creator & attribute editor
│   │   ├── PlayerFaceCard.tsx       # Procedural SVG player face cards & avatars
│   │   ├── SquadManagement.tsx      # Pitch tactical formation builder
│   │   └── TournamentBracket.tsx    # Knockout tournament system
│   ├── data/
│   │   ├── emblems.ts               # Club & league emblem vector data
│   │   └── teams.ts                 # Full player rosters, ratings, and kits
│   ├── services/
│   │   ├── careerNewsService.ts     # Matchday transfer & injury news engine
│   │   └── careerService.ts         # Career league tables & fixture manager
│   ├── types/
│   │   └── soccer.ts                # TypeScript interfaces & domain types
│   ├── App.tsx                      # Root application entry
│   └── main.tsx                     # React DOM entry
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/fc-2026-soccer.git
cd fc-2026-soccer

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Production Build

```bash
npm run build
```

The static bundle will be output to the `dist/` directory.

### Code Validation

```bash
npm run lint
```

---

## Android APK Generation

To package the game as a native Android APK:

### Option 1: Using Google Bubblewrap CLI (Recommended)
```bash
# 1. Install CLI
npm install -g @bubblewrap/cli

# 2. Initialize project from your deployment manifest
bubblewrap init --manifest="https://your-domain.com/manifest.webmanifest"

# 3. Build native Android APK & AAB
bubblewrap build
```

### Option 2: PWABuilder (No local Android SDK needed)
1. Deploy your build to any public URL or Netlify/Vercel/Cloud Run.
2. Go to [PWABuilder.com](https://www.pwabuilder.com).
3. Enter your site URL and click **Package for Android**.
4. Download the signed or unsigned `.apk` file directly to test on your phone.

---

## License
Apache-2.0
