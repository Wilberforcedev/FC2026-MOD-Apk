import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  throw new Error(`AndroidManifest.xml not found at ${manifestPath}. Run \"npx cap add android\" first.`);
}

let manifest = fs.readFileSync(manifestPath, 'utf8');

// Keep the app native/offline-first. INTERNET is intentionally not added here;
// the bundled game should boot and remain playable with no connection.
manifest = manifest.replace(
  /<application\b([^>]*)>/,
  (match, attrs) => {
    let next = attrs;
    if (!/android:hardwareAccelerated=/.test(next)) {
      next += '\n        android:hardwareAccelerated="true"';
    }
    if (!/android:usesCleartextTraffic=/.test(next)) {
      next += '\n        android:usesCleartextTraffic="false"';
    }
    return `<application${next}>`;
  },
);

manifest = manifest.replace(
  /<activity\b([^>]*android:name="\.MainActivity"[^>]*)>/,
  (match, attrs) => {
    let next = attrs;
    if (!/android:screenOrientation=/.test(next)) {
      next += '\n            android:screenOrientation="sensorLandscape"';
    }
    if (!/android:configChanges=/.test(next)) {
      next += '\n            android:configChanges="orientation|screenSize|keyboardHidden|keyboard|smallestScreenSize|screenLayout|uiMode"';
    }
    return `<activity${next}>`;
  },
);

fs.writeFileSync(manifestPath, manifest);
console.log('Configured AndroidManifest.xml for FC 2026 offline landscape gameplay.');
