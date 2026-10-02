# FC 2026 Native Android Build

FC 2026 now supports a native Android APK through Capacitor. The Vite production bundle is packaged inside the Android application, so the core game can boot and remain playable without a hosted website or active internet connection.

## Native package

- Application ID: `com.wilberforcedev.fc2026`
- App name: `FC 2026 Soccer`
- Web bundle: `dist/`
- Android runtime: Capacitor
- Orientation: sensor landscape
- Display: immersive fullscreen
- Hardware acceleration: enabled
- Keep screen awake during play: enabled

## Offline behavior

The Android APK packages the built React/TypeScript game locally. Club and league badge graphics are generated locally as SVG data rather than fetched from remote servers, and the app no longer depends on Google Fonts at launch.

Remote/online features should be treated as optional enhancements. Core menus, gameplay, career saves, tournament saves and locally bundled visual assets should remain usable without connectivity.

## Create the native project

```bash
npm install
npm run android:add
```

This builds the web app, creates the Android project, applies the FC 2026 native Android configuration and synchronizes the offline assets.

## Re-sync after source changes

```bash
npm run android:sync
```

## Build a debug APK

```bash
npm run android:debug
```

Expected output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Open in Android Studio

```bash
npm run android:open
```

From Android Studio you can run the game on a connected phone/emulator and configure signing for release builds.

## Release build

```bash
npm run android:release
```

A production release still requires an Android signing key before distribution.

## GitHub Actions

`.github/workflows/android-apk.yml` builds the native debug APK on the Android improvement branch, pull requests to `main`, and manual workflow dispatch. Successful runs upload an artifact named `FC2026-Android-Debug`.
