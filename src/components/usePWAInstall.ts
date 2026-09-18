import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type SupportedOS = 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'chromeos' | 'other';
export type DetectedBrowser = 'chrome' | 'edge' | 'safari' | 'firefox' | 'opera' | 'brave' | 'other';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [os, setOS] = useState<SupportedOS>('other');
  const [browser, setBrowser] = useState<DetectedBrowser>('other');

  useEffect(() => {
    // Detect standalone mode (running as installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Detect operating system
    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    const platform = ((window.navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || window.navigator.platform || '').toLowerCase();

    let detectedOS: SupportedOS = 'other';
    if (/cros/.test(userAgent)) {
      detectedOS = 'chromeos';
    } else if (/android/.test(userAgent)) {
      detectedOS = 'android';
    } else if (/iphone|ipad|ipod/.test(userAgent) || (platform.includes('mac') && navigator.maxTouchPoints > 1)) {
      detectedOS = 'ios';
    } else if (/win/.test(userAgent) || /win/.test(platform)) {
      detectedOS = 'windows';
    } else if (/mac/.test(userAgent) || /mac/.test(platform)) {
      detectedOS = 'mac';
    } else if (/linux/.test(userAgent) || /linux/.test(platform)) {
      detectedOS = 'linux';
    }
    setOS(detectedOS);

    // Detect browser
    let detectedBrowser: DetectedBrowser = 'other';
    if (/edg\//.test(userAgent)) {
      detectedBrowser = 'edge';
    } else if (/opr\/|opera/.test(userAgent)) {
      detectedBrowser = 'opera';
    } else if ((window.navigator as unknown as { brave?: unknown }).brave !== undefined) {
      detectedBrowser = 'brave';
    } else if (/chrome|crios/.test(userAgent)) {
      detectedBrowser = 'chrome';
    } else if (/firefox|fxios/.test(userAgent)) {
      detectedBrowser = 'firefox';
    } else if (/safari/.test(userAgent) && !/chrome|crios|android/.test(userAgent)) {
      detectedBrowser = 'safari';
    }
    setBrowser(detectedBrowser);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('Error invoking PWA install prompt:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS: os === 'ios',
    os,
    browser,
    install,
    hasDeferredPrompt: !!deferredPrompt,
  };
}

