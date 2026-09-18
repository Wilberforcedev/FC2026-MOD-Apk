import React from 'react';
import { Mail, Bell, Settings, User } from 'lucide-react';
import { Team } from '../types/soccer';
import { ClubEmblem } from './ClubEmblem';
import { LeagueEmblem } from './LeagueEmblem';
import { PWAInstallButton } from './PWAInstallButton';

interface FCHeaderBarProps {
  team?: Team;
  coins?: number;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenInbox?: () => void;
  onOpenSocial?: () => void;
  onOpenSettings?: () => void;
  showTabs?: boolean;
}

export const FCHeaderBar: React.FC<FCHeaderBarProps> = ({
  team,
  coins = 1500000,
  activeTab = 'IN-HOME',
  onTabChange,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
  showTabs = true,
}) => {
  const formatCoins = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toLocaleString();
  };

  const tabs = [
    { id: 'IN-HOME', label: 'IN-HOME' },
    { id: 'DYNAMIC INBOX', label: 'DYNAMIC INBOX' },
    { id: 'SOCIAL FEEDS', label: 'SOCIAL FEEDS' },
    { id: 'SETTINGS', label: 'SETTINGS' },
  ];

  return (
    <div className="w-full shrink-0 select-none">
      {/* Top Status Strip */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 bg-slate-950/90 backdrop-blur-md border-b border-cyan-900/30">
        {/* Left: User Club Emblem & Manager Profile */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            {team ? (
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-cyan-500/40 p-1 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ClubEmblem teamId={team.id} shortName={team.shortName} size="md" glow />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-cyan-400">
                  <User className="w-5 h-5" />
                </div>
              </div>
            )}
            {/* Green Online Dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full shadow" />
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                {team ? team.name : 'MANAGER ID'}
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                LVL 42
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/50 font-['Outfit']">
              {team?.leagueId && (
                <div className="flex items-center gap-1 text-cyan-300">
                  <LeagueEmblem leagueId={team.leagueId} size="xs" />
                </div>
              )}
              <span>FC Online • Cloud Synced</span>
            </div>
          </div>
        </div>

        {/* Right: Install PWA, Currency, Inbox, Notifications, Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Universal PWA Install Button */}
          <PWAInstallButton />

          {/* Gold Coin Pill */}
          <div 
            id="fc-coin-pill"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 px-3 py-1.5 rounded-full shadow-inner shadow-amber-500/10 cursor-pointer hover:border-amber-400 transition"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-[10px] shadow">
              🪙
            </div>
            <span className="font-['Chakra_Petch'] font-black text-amber-300 text-xs sm:text-sm tracking-wide">
              {formatCoins(coins)}
            </span>
          </div>

          {/* FC Points / Gem badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 border border-teal-500/30 px-2.5 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-['Chakra_Petch'] font-bold text-cyan-300 text-xs">2,450 FP</span>
          </div>

          {/* Inbox Button with Badge */}
          <button
            id="header-inbox-btn"
            onClick={onOpenInbox}
            className="relative w-9 h-9 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 flex items-center justify-center text-cyan-300 transition shadow"
            title="Dynamic Manager Inbox"
          >
            <Mail className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow">
              3
            </span>
          </button>

          {/* Notification Bell with Pink Dot */}
          <button
            id="header-notifications-btn"
            onClick={onOpenSocial}
            className="relative w-9 h-9 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 flex items-center justify-center text-white/80 transition shadow"
            title="Social Feeds & News"
          >
            <Bell className="w-4 h-4 text-white/80" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
          </button>

          {/* Settings Button */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 flex items-center justify-center text-white/70 hover:text-white transition shadow"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub Tabs: IN-HOME | DYNAMIC INBOX | SOCIAL FEEDS | SETTINGS */}
      {showTabs && (
        <div className="flex items-center gap-2 md:gap-8 px-4 md:px-8 py-2 bg-slate-950/70 border-b border-cyan-900/20 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (onTabChange) onTabChange(tab.id);
                  if (tab.id === 'DYNAMIC INBOX' && onOpenInbox) onOpenInbox();
                  if (tab.id === 'SOCIAL FEEDS' && onOpenSocial) onOpenSocial();
                  if (tab.id === 'SETTINGS' && onOpenSettings) onOpenSettings();
                }}
                className={`relative py-1.5 px-2 font-['Chakra_Petch'] font-black text-xs md:text-sm tracking-wider uppercase whitespace-nowrap transition ${
                  isActive
                    ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 shadow-[0_0_10px_#06b6d4]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
