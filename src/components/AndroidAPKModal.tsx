/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface AndroidAPKModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAPKModal: React.FC<AndroidAPKModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'instant' | 'manual' | 'developer'>('instant');

  if (!isOpen) return null;

  const bubblewrapCmd = `npx @bubblewrap/cli init --manifest="${window.location.origin}/manifest.webmanifest"\nnpx @bubblewrap/cli build`;

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleTriggerInstall = async () => {
    if (isInstallable) {
      await install();
    }
  };

  const downloadAndroidManifest = () => {
    const pkgConfig = {
      packageId: 'com.easports.fc2026.game',
      appVersion: '1.0.0',
      appName: 'FC 2026 Soccer',
      shortName: 'FC26',
      orientation: 'landscape-primary',
      display: 'standalone',
      themeColor: '#0a0d14',
      backgroundColor: '#0a0d14',
      url: window.location.href,
      minSdkVersion: 26,
      targetSdkVersion: 34,
      permissions: ['VIBRATE', 'ACCESS_NETWORK_STATE', 'INTERNET'],
      features: ['android.hardware.touchscreen', 'android.hardware.screen.landscape'],
    };

    const blob = new Blob([JSON.stringify(pkgConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fc26-android-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none font-['Outfit'] animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-950 border border-emerald-500/40 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Chakra_Petch'] font-black text-lg text-white tracking-wide uppercase">
                  ANDROID APK & APP INSTALL
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  WEBAPK / NATIVE
                </span>
              </div>
              <p className="text-xs text-white/50">Run FC 2026 natively on any Android phone or tablet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 text-white/70 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-1 bg-slate-900/40 border-b border-white/5 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('instant')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
              activeTab === 'instant'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            1-TAP ANDROID APK
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
              activeTab === 'manual'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            CHROME PHONE GUIDE
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
              activeTab === 'developer'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            STANDALONE APK BUILDER
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[480px]">
          {/* TAB 1: 1-Tap Android WebAPK */}
          {activeTab === 'instant' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        OFFICIAL ANDROID WEBAPK COMPLIANT
                      </span>
                    </div>
                    <h4 className="text-xl font-black font-['Chakra_Petch'] text-white">
                      Install FC 2026 Direct to Android
                    </h4>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Android automatically compiles and installs a signed <strong>WebAPK</strong> onto your phone.
                      The app launches with its own launcher icon, landscape lock, zero browser UI, and offline storage.
                    </p>
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <img src="/icon.svg" alt="FC 2026" className="w-12 h-12" />
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-white/60 font-mono">
                    <span>Package: <strong className="text-emerald-300">FC26 Soccer</strong></span>
                    <span>•</span>
                    <span>Mode: <strong className="text-emerald-300">Landscape</strong></span>
                  </div>

                  {isInstalled ? (
                    <div className="px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      INSTALLED ON DEVICE
                    </div>
                  ) : isInstallable ? (
                    <button
                      onClick={handleTriggerInstall}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition scale-105"
                    >
                      <Download className="w-4 h-4" />
                      INSTALL APK NOW
                    </button>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-white/80 font-mono text-xs flex items-center gap-2">
                      <Info className="w-4 h-4 text-emerald-400" />
                      Tap (⋮) in Chrome &gt; "Install app"
                    </div>
                  )}
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-white block font-['Chakra_Petch']">Verified WebAPK</span>
                  <span className="text-[9px] text-white/40 font-mono">Play Protect Safe</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-white block font-['Chakra_Petch']">120Hz Fast Pitch</span>
                  <span className="text-[9px] text-white/40 font-mono">Touch Joystick & Buttons</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <Layers className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-white block font-['Chakra_Petch']">100% Offline</span>
                  <span className="text-[9px] text-white/40 font-mono">No Wi-Fi Required</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Manual Chrome Guide */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
                <h4 className="text-sm font-black font-['Chakra_Petch'] text-emerald-400 uppercase">
                  How to Install on Android Phone via Google Chrome
                </h4>
                <div className="space-y-3 text-xs text-white/80">
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-white block font-medium">Open in Google Chrome or Samsung Internet</strong>
                      <span className="text-white/60">Ensure you are opening this URL in Chrome on your Android mobile device.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-white block font-medium">Tap the Menu Button (Three Dots ⋮)</strong>
                      <span className="text-white/60">In the top-right corner of Chrome, tap the menu icon.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="text-white block font-medium">Select "Install app" or "Add to Home screen"</strong>
                      <span className="text-white/60">Android generates an official WebAPK package and places the FC 2026 emblem in your app drawer.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Standalone APK Builder for Developers */}
          {activeTab === 'developer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black font-['Chakra_Petch'] text-emerald-400 uppercase">
                    Build Raw .APK / .AAB with Google Bubblewrap
                  </h4>
                  <button
                    onClick={downloadAndroidManifest}
                    className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs flex items-center gap-1.5 transition border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Download APK Config
                  </button>
                </div>

                <p className="text-xs text-white/70 leading-relaxed">
                  You can package this web app into a signed Android <code>.apk</code> ready for sideloading or Google Play Store distribution using Bubblewrap CLI:
                </p>

                <div className="bg-slate-950 p-3 rounded-xl border border-white/10 font-mono text-xs text-emerald-300 relative group">
                  <pre className="whitespace-pre-wrap overflow-x-auto">{bubblewrapCmd}</pre>
                  <button
                    onClick={() => handleCopy(bubblewrapCmd, 'bw')}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white/70 hover:text-white flex items-center gap-1 text-[10px] transition border border-white/10"
                  >
                    {copiedCmd === 'bw' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'bw' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-white/50 space-y-1 font-mono">
                  <div>• Output: <code>app-release-signed.apk</code> (Direct install on Android)</div>
                  <div>• Min Android Version: Android 8.0 (API 26+)</div>
                  <div>• Target Android Version: Android 14 (API 34)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/60 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
          <span>FC 2026 Mobile Edition</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-['Chakra_Petch'] uppercase tracking-wider transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
