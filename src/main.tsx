import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

const isNativeAndroid = Capacitor.isNativePlatform();

// High-end Android phones often expose 3x-4x device pixel ratios. The pitch
// renderer uses devicePixelRatio for its backing canvas, which can create far
// more pixels than are useful on a handheld screen. Cap it at 2x in the native
// shell to reduce GPU fill-rate and memory pressure while keeping the game sharp.
if (isNativeAndroid && window.devicePixelRatio > 2) {
  const nativeDpr = window.devicePixelRatio;
  try {
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      get: () => 2,
    });
    console.log(`[Android] Render density capped from ${nativeDpr.toFixed(2)}x to 2x.`);
  } catch {
    // Some WebView versions may not allow redefining devicePixelRatio. In that
    // case the game safely falls back to the device-provided value.
  }
}

// The native APK already bundles all Vite assets locally. Running a service
// worker inside Capacitor adds cache/startup work without improving offline
// availability, so keep it for the browser/PWA build only.
if (!isNativeAndroid) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] New FC 2026 version ready; updating service worker cache.');
    },
    onOfflineReady() {
      console.log('[PWA] FC 2026 is fully cached and ready for offline gameplay.');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
