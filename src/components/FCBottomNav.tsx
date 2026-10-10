import React from 'react';
import { Home, Play, Shield, ShoppingBag } from 'lucide-react';

export type FCNavTab = 'home' | 'play' | 'club' | 'store';

interface FCBottomNavProps {
  activeTab: FCNavTab;
  onSelectTab: (tab: FCNavTab) => void;
}

export const FCBottomNav: React.FC<FCBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const items: { id: FCNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" aria-hidden="true" /> },
    { id: 'play', label: 'Play', icon: <Play className="h-4 w-4" aria-hidden="true" /> },
    { id: 'club', label: 'Club', icon: <Shield className="h-4 w-4" aria-hidden="true" /> },
    { id: 'store', label: 'Store', icon: <ShoppingBag className="h-4 w-4" aria-hidden="true" /> },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className="z-30 flex w-full shrink-0 justify-center px-3 pt-2 pointer-events-none"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/90 p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.65),0_0_20px_rgba(6,182,212,0.12)] backdrop-blur-xl sm:gap-2">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`flex min-h-11 min-w-[4.25rem] items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.12em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 active:scale-95 touch-manipulation sm:min-w-[5.5rem] sm:px-4 sm:text-xs ${
                isActive
                  ? 'bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.28)]'
                  : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
