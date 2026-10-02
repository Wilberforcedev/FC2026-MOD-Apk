import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// The native APK already bundles all Vite assets locally. Running a service
// worker inside Capacitor adds cache/startup work without improving offline
// availability, so keep it for the browser/PWA build only.
if (!Capacitor.isNativePlatform()) {
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
