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
    { id: 'home', label: 'HOME', icon: <Home className="w-4 h-4" /> },
    { id: 'play', label: 'PLAY', icon: <Play className="w-4 h-4" /> },
    { id: 'club', label: 'CLUB', icon: <Shield className="w-4 h-4" /> },
    { id: 'store', label: 'STORE', icon: <ShoppingBag className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full flex justify-center py-3 px-4 shrink-0 pointer-events-none z-30">
      <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-full px-6 py-2 flex items-center gap-6 sm:gap-10 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.2)]">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-200 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105'
                  : 'text-white/60 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              {item.icon}
              <span className="font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
