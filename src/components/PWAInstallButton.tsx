import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone } from 'lucide-react';
import { AndroidAPKModal } from './AndroidAPKModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAPKModal, setShowAPKModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowAPKModal(true);
      }
    } else {
      setShowAPKModal(true);
    }
  };

  return (
    <>
      {isInstalled ? (
        <button
          onClick={() => setShowAPKModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/25 transition cursor-pointer"
          title="Installed on Android / PWA. Click for APK details."
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>APK READY</span>
        </button>
      ) : isInstallable ? (
        <button
          id="pwa-install-btn"
          onClick={handleInstallClick}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition font-['Chakra_Petch'] uppercase tracking-wider cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>INSTALL APK</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-slate-800 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install iOS</span>
        </button>
      ) : (
        <button
          onClick={() => setShowAPKModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-['Chakra_Petch'] font-bold hover:bg-emerald-500/25 transition cursor-pointer uppercase tracking-wider"
          title="Get Android APK or install WebAPK on your phone"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>ANDROID APK</span>
        </button>
      )}

      {/* Android APK Modal */}
      <AndroidAPKModal isOpen={showAPKModal} onClose={() => setShowAPKModal(false)} />

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/20 p-6 shadow-2xl text-white">
            <h3 className="text-lg font-black font-['Chakra_Petch'] text-emerald-400">Install FC 2026 on iOS</h3>
            <p className="mt-3 text-sm text-white/80 leading-relaxed font-['Outfit']">
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
};
