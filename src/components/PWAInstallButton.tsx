import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, CheckCircle, Monitor, Apple, Smartphone, Laptop, Cpu } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'compact' | 'full' | 'pill';
  className?: string;
  showIconOnlyOnMobile?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  showIconOnlyOnMobile = true,
}) => {
  const { isInstallable, isInstalled, os, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const getOSIcon = () => {
    switch (os) {
      case 'windows': return <Monitor className="w-3.5 h-3.5" />;
      case 'mac': return <Apple className="w-3.5 h-3.5" />;
      case 'ios': return <Apple className="w-3.5 h-3.5" />;
      case 'android': return <Smartphone className="w-3.5 h-3.5" />;
      case 'linux': return <Laptop className="w-3.5 h-3.5" />;
      case 'chromeos': return <Cpu className="w-3.5 h-3.5" />;
      default: return <Download className="w-3.5 h-3.5" />;
    }
  };

  const getLabel = () => {
    switch (os) {
      case 'windows': return 'INSTALL FOR WINDOWS';
      case 'mac': return 'INSTALL FOR MAC';
      case 'ios': return 'INSTALL ON IOS';
      case 'android': return 'INSTALL FOR ANDROID';
      case 'linux': return 'INSTALL FOR LINUX';
      case 'chromeos': return 'INSTALL ON CHROMEBOOK';
      default: return 'INSTALL APP (ALL OS)';
    }
  };

  return (
    <>
      {isInstalled ? (
        <button
          id="pwa-installed-badge"
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/25 transition cursor-pointer ${className}`}
          title="Running in Standalone Mode • 100% Offline Cache Active"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className={showIconOnlyOnMobile ? 'hidden sm:inline' : ''}>PWA INSTALLED</span>
          <span className={showIconOnlyOnMobile ? 'sm:hidden' : 'hidden'}>PWA</span>
        </button>
      ) : isInstallable ? (
        <button
          id="pwa-install-btn"
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition font-['Chakra_Petch'] uppercase tracking-wider cursor-pointer ${className}`}
          title="Install FC 2026 as a standalone offline desktop/mobile application"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className={showIconOnlyOnMobile ? 'hidden sm:inline' : ''}>INSTALL APP</span>
          <span className={showIconOnlyOnMobile ? 'sm:hidden' : 'hidden'}>INSTALL</span>
        </button>
      ) : (
        <button
          id="pwa-install-guide-btn"
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-['Chakra_Petch'] font-bold hover:bg-cyan-500/25 transition cursor-pointer uppercase tracking-wider ${className}`}
          title="Install FC 2026 on Windows, macOS, Linux, Android, or iOS"
        >
          {getOSIcon()}
          <span className={showIconOnlyOnMobile ? 'hidden sm:inline' : ''}>{getLabel()}</span>
          <span className={showIconOnlyOnMobile ? 'sm:hidden' : 'hidden'}>INSTALL</span>
        </button>
      )}

      {/* Cross-Platform PWA Install Modal */}
      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

