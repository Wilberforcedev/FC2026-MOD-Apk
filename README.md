# FC 2026 Soccer

A mobile-first soccer game built with **React, TypeScript, Vite, Tailwind CSS, HTML5 Canvas, and Capacitor**. FC 2026 is designed for responsive web play, offline/PWA installation, and Android packaging.

> **Project status:** Active development. The game engine and major game modes are implemented; Android packaging and gameplay polish continue to evolve.

## Highlights

- ⚽ Physics-based 2D match engine with passing, shooting, sprinting, tackling, stamina and ball movement
- 🤖 AI opponents with difficulty levels and tactical behavior
- 🏆 Kick Off, Career, Tournament, Penalty and Practice modes
- 📋 Squad management, formations, player editing and player development
- 📰 Career news, transfers, injuries and matchday updates
- 📱 Touch controls for mobile devices
- 📦 PWA/offline support with installable Android-friendly web app
- 🤖 Capacitor Android shell for native APK builds
- 🎨 SVG club/league artwork and procedural player face cards
- 💾 Local persistence for career and tournament progress

## Tech Stack

| Layer | Technology |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| Game rendering | HTML5 Canvas |
| Animation | Motion |
| Charts | Recharts |
| Icons | Lucide React |
| PWA | vite-plugin-pwa |
| Android | Capacitor 8 |
| Runtime tooling | Node.js 18+ / npm 9+ |

## Project Structure

```text
FC2026-MOD-Apk/
├── .github/workflows/       # CI and Android build automation
├── public/                  # PWA icons and static assets
├── scripts/                 # Android/build configuration scripts
├── src/
│   ├── components/          # Game UI and screens
│   ├── data/                # Teams, players and emblem data
│   ├── game/                # Core match engine and formations
│   ├── services/            # Career, tournament, audio and commentary logic
│   ├── types/               # Shared TypeScript domain types
│   └── utils/               # Shared helpers
├── unity/                   # Unity/3D integration resources
├── capacitor.config.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Run Locally

### Requirements

- Node.js 18+ (Node.js 20 or 22 recommended)
- npm 9+
- Android Studio + Android SDK for native Android development

### Install

```bash
git clone https://github.com/Wilberforcedev/FC2026-MOD-Apk.git
cd FC2026-MOD-Apk
npm install
```

### Development

```bash
npm run dev
```

Open **http://localhost:3000**.

### Validate and build

```bash
npm run typecheck
npm run build
```

The production web bundle is generated in `dist/`.

## Android

The project uses Capacitor to package the web game as an Android application.

### Add Android project

```bash
npm run android:add
```

### Sync an existing Android project

```bash
npm run android:sync
```

### Open in Android Studio

```bash
npm run android:open
```

### Build a debug APK

```bash
npm run android:debug
```

The debug APK is produced under:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For a release build, configure signing credentials securely outside the repository and use:

```bash
npm run android:release
```

## Environment Variables

Copy `.env.example` to `.env.local` for local configuration.

**Never commit real API keys or production secrets.** The repository ignores `.env*` files except for the safe `.env.example` template.

## Continuous Integration

GitHub Actions validates TypeScript and the production build on pushes and pull requests. The Android workflow also produces a downloadable debug APK artifact.

## Contributing

1. Create a focused branch from `main`.
2. Make a small, testable change.
3. Run `npm run typecheck` and `npm run build`.
4. Keep gameplay behavior changes separate from unrelated refactors.
5. Open a pull request with a clear summary and testing notes.

## License

Apache-2.0
