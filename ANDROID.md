# Legacy Capacitor Android Prototype

This document covers the **old WebView-based APK** that packages the React/TypeScript browser game. It is not the production mobile app build path.

FC 2026 is now maintained as a native Unity mobile game. For the supported Android APK, open [`unity/FC2026Unity`](unity/FC2026Unity) and follow [`UNITY_3D.md`](UNITY_3D.md).

## Legacy package details

- Application ID: `com.wilberforcedev.fc2026`
- App name: `FC 2026 Soccer`
- Runtime: Capacitor WebView loading a bundled Vite web build
- This route retains browser application code and must not be used for new mobile features.

The legacy project can still be built for reference with:

```bash
npm install
npm run android:debug
```

This produces `android/app/build/outputs/apk/debug/app-debug.apk`. It does **not** build the Unity game.

Do not add new product features to this route. Migrate useful gameplay and data into the canonical Unity project before retiring the prototype.
