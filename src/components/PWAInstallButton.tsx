import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        OFFLINE READY
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition font-['Chakra_Petch'] uppercase tracking-wider"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-slate-800 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          Install on iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/20 p-6 shadow-2xl text-white">
              <h3 className="text-lg font-black font-['Chakra_Petch'] text-emerald-400">Install FC 2026 on iOS</h3>
              <p className="mt-3 text-sm text-white/80 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                2. Scroll down and select <strong>Add to Home Screen</strong>.<br />
                3. Enjoy full-screen offline gameplay!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-slate-950 uppercase tracking-wider font-['Chakra_Petch'] hover:bg-emerald-400 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      100% Offline
    </div>
  );
};
