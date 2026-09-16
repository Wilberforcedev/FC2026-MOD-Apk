import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-mono font-bold shadow-2xl backdrop-blur-md transition-all ${
      isOnline ? 'bg-emerald-600/90 text-white' : 'bg-amber-600/90 text-white'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>Online — FC 26 Cloud Active</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode Active — 100% Offline Game</span>
        </>
      )}
    </div>
  );
};
