# FC 2026 Soccer — Native Android Build

FC 2026 is packaged for Android with Capacitor. The Vite production build is copied into the native Android application, so the core game UI, JavaScript, CSS, data and bundled assets run from the APK rather than from a hosted website.

## Application identity

- App name: `FC 2026 Soccer`
- Android package: `com.wilberforcedev.fc2026`
- Web asset directory: `dist`

## First local Android build

Requirements:

- Node.js 22+
- Java 21
- Android Studio / Android SDK

Run:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

From Android Studio you can run the application on a connected phone/emulator or produce an APK/AAB.

## Command-line debug APK

After the Android platform has been generated:

```bash
npm run android:debug
```

The debug APK is produced at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Updating game code in the Android application

Whenever React/TypeScript code or bundled assets change, run:

```bash
npm run android:sync
```

This rebuilds `dist` and copies the current game into the native Android project.

## Offline behavior

The application shell and built game assets are packaged in the APK and do not require a web server. Career and tournament saves continue to use local device WebView storage.

Remote-only media should be treated as optional. Important gameplay assets should live under `public/` or be imported from `src/` so they are included in the APK.

## Automated APK build

The repository includes `.github/workflows/android-apk.yml`. It builds the web app, creates the Capacitor Android project, syncs the offline assets, compiles a debug APK and uploads `FC2026-Android-Debug` as a workflow artifact.

A signed production release will require a release keystore and signing configuration. Do not commit keystore passwords or private signing keys to the repository.
