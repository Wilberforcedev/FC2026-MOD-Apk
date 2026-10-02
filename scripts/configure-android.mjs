import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
const mainActivityPath = path.resolve(
  'android/app/src/main/java/com/wilberforcedev/fc2026/MainActivity.java',
);

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

if (fs.existsSync(mainActivityPath)) {
  const mainActivity = `package com.wilberforcedev.fc2026;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private void applyImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        applyImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveMode();
        }
    }
}
`;
  fs.writeFileSync(mainActivityPath, mainActivity);
}

console.log('Configured FC 2026 Android shell: offline, landscape, immersive, hardware accelerated.');
