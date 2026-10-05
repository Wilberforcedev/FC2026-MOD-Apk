import React from 'react';
import {
  ArrowUpRight,
  Briefcase,
  Play,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { FCBottomNav, FCNavTab } from './FCBottomNav';
import { FCHeaderBar } from './FCHeaderBar';

export type MainMenuDestination =
  | 'team-select'
  | 'career'
  | 'tournament'
  | 'penalties'
  | 'practice'
  | 'squad';

interface MainMenuProps {
  coins: number;
  navTab: FCNavTab;
  onNavigate: (destination: MainMenuDestination) => void;
  onSelectNavTab: (tab: FCNavTab) => void;
  onOpenInbox: () => void;
  onOpenSocial: () => void;
  onOpenSettings: () => void;
}

const modeCard =
  'group relative flex min-h-[156px] w-full flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left shadow-lg transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.99] touch-manipulation';

export const MainMenu: React.FC<MainMenuProps> = ({
  coins,
  navTab,
  onNavigate,
  onSelectNavTab,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
}) => (
  <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[#070e17] text-white">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-36 -top-36 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
    />

    <FCHeaderBar
      coins={coins}
      onOpenInbox={onOpenInbox}
      onOpenSocial={onOpenSocial}
      onOpenSettings={onOpenSettings}
      showTabs={false}
    />

    <main className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-5 md:px-8 md:pb-8 md:pt-7">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300 sm:text-xs">
              FC 26 · Matchday
            </p>
            <h1 className="mt-1 font-['Chakra_Petch'] text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
              Choose your next challenge
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/55 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Offline ready
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
          <button
            type="button"
            onClick={() => onNavigate('team-select')}
            aria-label="Play a Kick-Off match: choose your teams and match settings"
            className="group relative flex min-h-[276px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-[#101f2c] via-[#0a1723] to-[#063a40] p-6 text-left shadow-[0_24px_70px_rgba(0,0,0,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.99] touch-manipulation md:col-span-8 md:min-h-[300px] md:p-8"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-white/10 bg-emerald-400/[0.04] shadow-[0_0_90px_rgba(34,211,238,0.15)] sm:-right-3 sm:h-80 sm:w-80"
            >
              <div className="absolute inset-5 rounded-full border border-white/10" />
              <div className="absolute left-1/2 top-0 h-full border-l border-white/10" />
              <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 sm:h-28 sm:w-28" />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
            </div>
            <div className="relative flex w-full items-start justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />
                Quick match
              </span>
              <span className="rounded-xl border border-white/15 bg-black/20 p-2.5 text-cyan-100">
                <Play className="h-5 w-5 fill-current" />
              </span>
            </div>
            <div className="relative max-w-lg">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/70">
                Make it count
              </p>
              <h2 className="font-['Chakra_Petch'] text-4xl font-black uppercase leading-none tracking-wide text-white sm:text-6xl">
                Kick-Off
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
                Pick your clubs, set the conditions and take control of the match.
              </p>
            </div>
            <div className="relative inline-flex min-h-11 items-center gap-2 self-start rounded-xl bg-cyan-300 px-5 text-xs font-black uppercase tracking-[0.16em] text-slate-950 shadow-[0_8px_28px_rgba(34,211,238,0.18)] transition group-hover:bg-cyan-200">
              Select teams
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('career')}
            aria-label="Open Career Mode to manage your club and season"
            className="group relative flex min-h-[220px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-[#111c1d] via-[#0b1717] to-[#15352b] p-5 text-left shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.99] touch-manipulation md:col-span-4 md:min-h-[300px] md:p-6"
          >
            <div className="flex w-full items-start justify-between gap-3">
              <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">
                Build your legacy
              </span>
              <Briefcase className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="font-['Chakra_Petch'] text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
                Career Mode
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Shape your squad, work the transfer market and chase the title.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-200">
              Enter career <ArrowUpRight className="h-4 w-4" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('tournament')}
            aria-label="Open the Champions Cup knockout tournament"
            className={`${modeCard} border-amber-300/20 bg-gradient-to-br from-slate-950 to-amber-950/45 hover:border-amber-200/60`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Knockout stage</span>
              <Trophy className="h-5 w-5 text-amber-200" />
            </div>
            <div>
              <h2 className="font-['Chakra_Petch'] text-lg font-black uppercase tracking-wide">Champions Cup</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/55">Eight clubs. One trophy. No second chances.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">View bracket →</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('penalties')}
            aria-label="Start a penalty duel"
            className={`${modeCard} border-rose-300/20 bg-gradient-to-br from-slate-950 to-rose-950/45 hover:border-rose-200/60`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">Pressure moment</span>
              <span aria-hidden="true" className="text-xl">🧤</span>
            </div>
            <div>
              <h2 className="font-['Chakra_Petch'] text-lg font-black uppercase tracking-wide">Penalty Duel</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/55">Read the keeper, pick your spot and finish.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-200">Take the shot →</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('practice')}
            aria-label="Open Practice Arena for skill drills"
            className={`${modeCard} border-cyan-300/20 bg-gradient-to-br from-slate-950 to-cyan-950/45 hover:border-cyan-200/60`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Sharpen your game</span>
              <Target className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <h2 className="font-['Chakra_Petch'] text-lg font-black uppercase tracking-wide">Practice Arena</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/55">Build your touch with focused ball-control drills.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200">Start training →</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('squad')}
            aria-label="Open Squad Management to adjust formation and lineup"
            className={`${modeCard} border-violet-300/20 bg-gradient-to-br from-slate-950 to-violet-950/45 hover:border-violet-200/60`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">Tactics & lineup</span>
              <Users className="h-5 w-5 text-violet-200" />
            </div>
            <div>
              <h2 className="font-['Chakra_Petch'] text-lg font-black uppercase tracking-wide">Squad Hub</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/55">Set your shape, starters, bench and player roles.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-200">Manage squad →</span>
          </button>
        </div>

        <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
          Your club. Your match. Your story.
        </p>
      </div>
    </main>

    <FCBottomNav activeTab={navTab} onSelectTab={onSelectNavTab} />
  </div>
);
