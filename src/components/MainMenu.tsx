import React from 'react';
import { Briefcase, Play, Target, Trophy, Users } from 'lucide-react';
import { FCBottomNav, FCNavTab } from './FCBottomNav';
import { FCHeaderBar } from './FCHeaderBar';

export type MainMenuDestination = 'team-select' | 'career' | 'tournament' | 'penalties' | 'practice' | 'squad';

interface MainMenuProps {
  coins: number;
  navTab: FCNavTab;
  onNavigate: (destination: MainMenuDestination) => void;
  onSelectNavTab: (tab: FCNavTab) => void;
  onOpenInbox: () => void;
  onOpenSocial: () => void;
  onOpenSettings: () => void;
}

const tileBase = 'rounded-3xl shadow-xl transition duration-300 group cursor-pointer flex flex-col justify-between relative overflow-hidden';

export const MainMenu: React.FC<MainMenuProps> = ({
  coins,
  navTab,
  onNavigate,
  onSelectNavTab,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
}) => (
  <div className="h-full flex flex-col justify-between overflow-hidden bg-[#070e17] relative">
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

    <FCHeaderBar
      coins={coins}
      onOpenInbox={onOpenInbox}
      onOpenSocial={onOpenSocial}
      onOpenSettings={onOpenSettings}
      showTabs={false}
    />

    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-center">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 z-10">
        <div
          onClick={() => onNavigate('team-select')}
          className={`md:col-span-7 min-h-[240px] p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 ${tileBase}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30">Exhibition Match</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">⚽</div>
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-wide group-hover:text-cyan-300 transition uppercase">Kick-Off</h2>
            <p className="text-xs md:text-sm text-white/60 mt-1 max-w-md">Jump straight onto the pitch with dynamic stamina, ball curl, tactical radar and commentary.</p>
          </div>
          <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider">
            <Play className="w-3.5 h-3.5 fill-cyan-400" /> Select teams & play
          </div>
        </div>

        <div
          onClick={() => onNavigate('career')}
          className={`md:col-span-5 min-h-[240px] p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/40 border border-teal-500/30 hover:border-teal-400 ${tileBase}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-500/15 px-3 py-1 rounded-full border border-teal-500/30">Hub & Transfers</span>
            <Briefcase className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-wide group-hover:text-teal-300 transition uppercase">Career Mode</h3>
            <p className="text-xs text-white/60 mt-1">Manage finances, scout prospects, sign players and complete a full season.</p>
          </div>
          <div className="text-teal-400 font-bold text-xs uppercase tracking-wider">Manage club & season →</div>
        </div>

        <div onClick={() => onNavigate('tournament')} className={`md:col-span-3 min-h-[180px] p-5 bg-gradient-to-br from-slate-950 to-amber-950/40 border border-amber-500/30 hover:border-amber-400 ${tileBase}`}>
          <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Knockout Cup</span><Trophy className="w-5 h-5 text-amber-400" /></div>
          <div><h3 className="text-lg font-black uppercase">Champions Cup</h3><p className="text-xs text-white/50 mt-1">8-team knockout bracket with extra time and penalties.</p></div>
          <div className="text-amber-400 font-bold text-xs uppercase">Tournament bracket →</div>
        </div>

        <div onClick={() => onNavigate('penalties')} className={`md:col-span-3 min-h-[180px] p-5 bg-gradient-to-br from-slate-950 to-rose-950/40 border border-rose-500/30 hover:border-rose-400 ${tileBase}`}>
          <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">High Tension</span><span className="text-xl">🧤</span></div>
          <div><h3 className="text-lg font-black uppercase">Penalty Duel</h3><p className="text-xs text-white/50 mt-1">Aim, charge power and beat the goalkeeper.</p></div>
          <div className="text-rose-400 font-bold text-xs uppercase">Take penalties →</div>
        </div>

        <div onClick={() => onNavigate('practice')} className={`md:col-span-3 min-h-[180px] p-5 bg-gradient-to-br from-slate-950 to-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 ${tileBase}`}>
          <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Solo Drills</span><Target className="w-5 h-5 text-cyan-400" /></div>
          <div><h3 className="text-lg font-black uppercase">Practice Arena</h3><p className="text-xs text-white/50 mt-1">Precision targets and ball-curl practice.</p></div>
          <div className="text-cyan-400 font-bold text-xs uppercase">Start practice →</div>
        </div>

        <div onClick={() => onNavigate('squad')} className={`md:col-span-3 min-h-[180px] p-5 bg-gradient-to-br from-slate-950 to-teal-950/40 border border-teal-500/30 hover:border-teal-400 ${tileBase}`}>
          <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Tactical Blueprint</span><Users className="w-5 h-5 text-teal-400" /></div>
          <div><h3 className="text-lg font-black uppercase">Squad Management</h3><p className="text-xs text-white/50 mt-1">Formation, bench and player roles.</p></div>
          <div className="text-teal-300 font-bold text-xs uppercase">Customize lineup →</div>
        </div>
      </div>
    </div>

    <FCBottomNav activeTab={navTab} onSelectTab={onSelectNavTab} />
  </div>
);
