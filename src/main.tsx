import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically register service worker for offline capabilities and caching across all OS
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New FC 2026 version ready; updating service worker cache.');
  },
  onOfflineReady() {
    console.log('[PWA] FC 2026 is fully cached and ready for 100% offline gameplay.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

