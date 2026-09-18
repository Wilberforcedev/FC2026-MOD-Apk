import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle,
  Monitor,
  Apple,
  Smartphone,
  Cpu,
  WifiOff,
  Zap,
  Layers,
  ChevronRight,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { usePWAInstall, SupportedOS } from './usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, os, browser, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<SupportedOS>(() => {
    if (os !== 'other') return os;
    return 'windows';
  });
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'dismissed'>('idle');

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setInstallStatus('installing');
    const accepted = await install();
    if (accepted) {
      setInstallStatus('success');
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setInstallStatus('dismissed');
    }
  };

  const getOSBadge = () => {
    switch (os) {
      case 'windows': return 'Windows PC';
      case 'mac': return 'macOS';
      case 'android': return 'Android Device';
      case 'ios': return 'iOS (iPhone/iPad)';
      case 'linux': return 'Linux';
      case 'chromeos': return 'ChromeOS / Chromebook';
      default: return 'Desktop / Mobile';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Strip */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900/90 border-b border-cyan-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow">
              <Download className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Chakra_Petch'] font-black text-base uppercase tracking-wider text-white">
                  INSTALL FC 2026 FOR ALL OPERATING SYSTEMS
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-[10px] font-mono font-bold text-cyan-300 uppercase">
                  PWA 60FPS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-['Outfit']">
                Install as a standalone native app on Windows, macOS, Linux, ChromeOS, Android, and iOS.
              </p>
            </div>
          </div>

          <button
            id="pwa-install-modal-close"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Quick Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-teal-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 flex-shrink-0 shadow-md">
                <img
                  src="/pwa-192x192.png"
                  alt="FC 2026 App Icon"
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                    FC 2026 Soccer Edition
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                    DETECTED: {getOSBadge().toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-['Outfit']">
                  {isInstalled
                    ? 'App is currently running in standalone installed mode with full offline cache.'
                    : 'Universal Progressive Web App: no app store required, zero storage bloat, instant updates.'}
                </p>
              </div>
            </div>

            {/* Native Install Action if ready */}
            <div>
              {isInstalled ? (
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>ALREADY INSTALLED</span>
                </div>
              ) : isInstallable ? (
                <button
                  id="pwa-modal-oneclick-install"
                  onClick={handleNativeInstall}
                  disabled={installStatus === 'installing'}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{installStatus === 'installing' ? 'PROMPTING...' : '1-CLICK INSTALL APP'}</span>
                </button>
              ) : (
                <div className="text-[11px] text-cyan-300 font-mono bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-center">
                  Select OS guide below
                </div>
              )}
            </div>
          </div>

          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 flex-shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">100% Offline Ready</div>
                <div className="text-[11px] text-white/50">Matches, audio & squads cached</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Hardware 60 FPS</div>
                <div className="text-[11px] text-white/50">Full canvas hardware acceleration</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 flex-shrink-0">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Dedicated Window</div>
                <div className="text-[11px] text-white/50">No browser address bar or tabs</div>
              </div>
            </div>
          </div>

          {/* OS Navigation Tabs */}
          <div className="space-y-3">
            <div className="text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>SELECT OPERATING SYSTEM GUIDE</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <button
                onClick={() => setActiveTab('windows')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider border transition cursor-pointer ${
                  activeTab === 'windows'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Windows</span>
              </button>

              <button
                onClick={() => setActiveTab('mac')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider border transition cursor-pointer ${
                  activeTab === 'mac'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>macOS</span>
              </button>

              <button
                onClick={() => setActiveTab('android')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider border transition cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider border transition cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iOS (iPhone)</span>
              </button>

              <button
                onClick={() => setActiveTab('linux')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider border transition cursor-pointer ${
                  activeTab === 'linux'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Linux</span>
              </button>

              <button
                onClick={() => setActiveTab('chromeos')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider border transition cursor-pointer ${
                  activeTab === 'chromeos'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>ChromeOS</span>
              </button>
            </div>

            {/* Tab Instruction Cards */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4">
              {/* WINDOWS TAB */}
              {activeTab === 'windows' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-['Chakra_Petch'] font-bold text-sm">
                    <Monitor className="w-4 h-4" />
                    <span>Windows 10 & 11 (Google Chrome, Microsoft Edge, Brave, Opera)</span>
                  </div>
                  <ol className="space-y-2 text-xs sm:text-sm text-slate-300 font-['Outfit'] list-decimal list-inside">
                    <li className="leading-relaxed">
                      Look at your browser address bar (top right). You will see an <strong>Install icon</strong> (a computer monitor with an arrow ⤓ or a ⊕ symbol).
                    </li>
                    <li className="leading-relaxed">
                      Click the <strong>Install</strong> button or open browser menu <strong>(⋮) → Cast, save, and share → Install FC 2026 Soccer</strong>.
                    </li>
                    <li className="leading-relaxed">
                      Click <strong>Install</strong> in the confirmation popup.
                    </li>
                    <li className="leading-relaxed">
                      FC 2026 will immediately launch as an isolated desktop app, pinning to your <strong>Taskbar</strong>, <strong>Start Menu</strong>, and <strong>Desktop</strong> with full keyboard controls!
                    </li>
                  </ol>
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
                    💡 <strong>Pro Tip:</strong> Supports full keyboard (WASD / Arrows, J / K / L / U) and USB/Bluetooth gamepads directly on Windows.
                  </div>
                </div>
              )}

              {/* MACOS TAB */}
              {activeTab === 'mac' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-['Chakra_Petch'] font-bold text-sm">
                    <Apple className="w-4 h-4" />
                    <span>macOS (Safari, Google Chrome, Microsoft Edge)</span>
                  </div>
                  <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-['Outfit']">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>Method 1: Apple Safari (macOS Sonoma / Sequoia 14+)</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">RECOMMENDED</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        1. Click <strong>File</strong> in the top Mac menu bar.<br />
                        2. Select <strong>Add to Dock...</strong><br />
                        3. Click <strong>Add</strong>. FC 2026 is now a standalone Mac app in your Dock and Launchpad!
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
                      <div className="font-bold text-white">Method 2: Google Chrome or Microsoft Edge on Mac</div>
                      <p className="text-xs text-slate-300">
                        Click the <strong>Install</strong> icon in the address bar, or click <strong>Settings (⋮) → Save and Share → Install FC 2026 Soccer</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ANDROID TAB */}
              {activeTab === 'android' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-['Chakra_Petch'] font-bold text-sm">
                    <Smartphone className="w-4 h-4" />
                    <span>Android Phones & Tablets (Chrome, Samsung Internet, Edge)</span>
                  </div>
                  <ol className="space-y-2 text-xs sm:text-sm text-slate-300 font-['Outfit'] list-decimal list-inside">
                    <li className="leading-relaxed">
                      Tap the <strong>1-Click Install App</strong> button at the top of this dialog (or tap the bottom banner).
                    </li>
                    <li className="leading-relaxed">
                      If not prompted automatically, tap the browser menu <strong>(⋮)</strong> in Chrome or Samsung Internet.
                    </li>
                    <li className="leading-relaxed">
                      Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </li>
                    <li className="leading-relaxed">
                      The game compiles a high-performance <strong>WebAPK</strong> and places the FC 2026 icon on your home screen and app drawer.
                    </li>
                  </ol>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                    ⚽ <strong>Mobile Controls:</strong> Features responsive virtual analog joystick and action buttons (Pass, Shoot, Through, Sprint) optimized for thumb gameplay.
                  </div>
                </div>
              )}

              {/* IOS TAB */}
              {activeTab === 'ios' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-['Chakra_Petch'] font-bold text-sm">
                    <Apple className="w-4 h-4" />
                    <span>Apple iOS (iPhone & iPad on Safari)</span>
                  </div>
                  <ol className="space-y-2 text-xs sm:text-sm text-slate-300 font-['Outfit'] list-decimal list-inside">
                    <li className="leading-relaxed">
                      Open this game in <strong>Safari</strong> (iOS requires Safari for home screen installation).
                    </li>
                    <li className="leading-relaxed">
                      Tap the <strong>Share</strong> button at the bottom of Safari (the square box with an arrow pointing up ⎋).
                    </li>
                    <li className="leading-relaxed">
                      Scroll down and tap <strong>Add to Home Screen</strong> (⊕).
                    </li>
                    <li className="leading-relaxed">
                      Tap <strong>Add</strong> in the top right corner.
                    </li>
                    <li className="leading-relaxed">
                      Launch FC 2026 from your home screen for an immersive, edge-to-edge full-screen soccer experience!
                    </li>
                  </ol>
                </div>
              )}

              {/* LINUX TAB */}
              {activeTab === 'linux' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-['Chakra_Petch'] font-bold text-sm">
                    <Laptop className="w-4 h-4" />
                    <span>Linux (Ubuntu, Debian, Fedora, Arch via Chrome / Chromium / Edge)</span>
                  </div>
                  <ol className="space-y-2 text-xs sm:text-sm text-slate-300 font-['Outfit'] list-decimal list-inside">
                    <li className="leading-relaxed">
                      In Chrome or Chromium, click the <strong>Install icon</strong> in the URL bar.
                    </li>
                    <li className="leading-relaxed">
                      Or select <strong>Menu (⋮) → Cast, save, and share → Install FC 2026 Soccer</strong>.
                    </li>
                    <li className="leading-relaxed">
                      The browser generates a desktop entry in <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">~/.local/share/applications</code> for GNOME, KDE, and XFCE application menus.
                    </li>
                  </ol>
                </div>
              )}

              {/* CHROMEOS TAB */}
              {activeTab === 'chromeos' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-['Chakra_Petch'] font-bold text-sm">
                    <Cpu className="w-4 h-4" />
                    <span>ChromeOS (Chromebooks & Chromeboxes)</span>
                  </div>
                  <ol className="space-y-2 text-xs sm:text-sm text-slate-300 font-['Outfit'] list-decimal list-inside">
                    <li className="leading-relaxed">
                      Click the <strong>Install</strong> button in the browser address bar.
                    </li>
                    <li className="leading-relaxed">
                      Confirm installation. FC 2026 will appear in your Chromebook Launcher and can be pinned to your Shelf.
                    </li>
                    <li className="leading-relaxed">
                      Supports both touch screen Chromebooks and keyboard/trackpad gameplay!
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900/80 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-white/50 font-['Outfit']">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Multi-OS Compatible • Progressive Web App Architecture</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
