import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Coins, Package, ShoppingBag, Sparkles, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player } from '../types/soccer';
import { PackDefinition, PACKS, openPack, hasWalkout } from '../services/packService';
import { haptics } from '../services/haptics';
import { soundEngine } from '../services/soundEngine';
import { FCHeaderBar } from './FCHeaderBar';
import { PlayerFaceCard } from './PlayerFaceCard';

interface PackShopModalProps {
  coins: number;
  onPurchase: (pack: PackDefinition, players: Player[]) => void;
  onBack: () => void;
  onOpenInbox?: () => void;
  onOpenSocial?: () => void;
  onOpenSettings?: () => void;
}

const PACK_ART: Record<string, { gradient: string; border: string; glow: string; icon: React.ReactNode }> = {
  bronze: {
    gradient: 'bg-gradient-to-b from-[#f3c08b] via-[#b4652a] to-[#3d2110]',
    border: 'border-orange-700/60',
    glow: 'shadow-[0_0_30px_rgba(180,101,42,0.35)]',
    icon: <Package className="w-8 h-8 text-orange-100" />,
  },
  silver: {
    gradient: 'bg-gradient-to-b from-[#f8fafc] via-[#94a3b8] to-[#1e293b]',
    border: 'border-slate-400/60',
    glow: 'shadow-[0_0_30px_rgba(148,163,184,0.4)]',
    icon: <Package className="w-8 h-8 text-slate-800" />,
  },
  gold: {
    gradient: 'bg-gradient-to-b from-[#fce988] via-[#eab308] to-[#451a03]',
    border: 'border-amber-400/70',
    glow: 'shadow-[0_0_35px_rgba(234,179,8,0.45)]',
    icon: <Sparkles className="w-8 h-8 text-amber-950" />,
  },
  premium: {
    gradient: 'bg-gradient-to-b from-[#22d3ee] via-[#4f46e5] to-[#0f172a]',
    border: 'border-cyan-300/70',
    glow: 'shadow-[0_0_45px_rgba(34,211,238,0.55)]',
    icon: <Zap className="w-8 h-8 text-white" fill="currentColor" />,
  },
};

function formatCoins(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
}

type Phase = 'store' | 'opening' | 'reveal';

export const PackShopModal: React.FC<PackShopModalProps> = ({
  coins,
  onPurchase,
  onBack,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
}) => {
  const [phase, setPhase] = useState<Phase>('store');
  const [activePack, setActivePack] = useState<PackDefinition | null>(null);
  const [pulledPlayers, setPulledPlayers] = useState<Player[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startOpening = (pack: PackDefinition) => {
    if (coins < pack.cost) return;
    const players = openPack(pack);
    setActivePack(pack);
    setPulledPlayers(players);
    setRevealedCount(0);
    setPhase('opening');
    haptics.uiTap();

    timersRef.current.push(window.setTimeout(() => {
      setPhase('reveal');
      if (hasWalkout(players)) {
        soundEngine.playGoalCelebration();
        haptics.packReveal(true);
        confetti({ particleCount: 160, spread: 110, origin: { y: 0.55 }, colors: ['#00f0ff', '#ffd700', '#f472b6', '#ffffff'] });
      } else {
        soundEngine.playWhistle('double');
        haptics.packReveal(false);
      }
      players.forEach((_, idx) => {
        timersRef.current.push(window.setTimeout(() => setRevealedCount(idx + 1), 220 * idx + 120));
      });
      onPurchase(pack, players);
    }, 1400));
  };

  const revealAll = () => {
    clearTimers();
    setRevealedCount(pulledPlayers.length);
  };

  const backToStore = () => {
    clearTimers();
    setPhase('store');
    setActivePack(null);
    setPulledPlayers([]);
    setRevealedCount(0);
  };

  return (
    <div className="h-full flex flex-col bg-[#070e17] text-white overflow-hidden select-none relative font-['Outfit']">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <FCHeaderBar
        coins={coins}
        onOpenInbox={onOpenInbox}
        onOpenSocial={onOpenSocial}
        onOpenSettings={onOpenSettings}
        showTabs={false}
      />

      <div className="h-16 px-4 md:px-8 bg-slate-950/80 border-b border-cyan-900/30 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={phase === 'store' ? onBack : backToStore}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 flex items-center justify-center transition shadow"
            title={phase === 'store' ? 'Main Menu' : 'Back to Store'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl md:text-2xl font-black font-['Chakra_Petch'] tracking-wide text-white uppercase">
                {phase === 'store' ? 'ULTIMATE STORE' : activePack?.name.toUpperCase()}
              </h1>
            </div>
            <p className="text-[11px] text-white/50">
              {phase === 'store' ? 'Open packs. Pull stars. Build your dream squad.' : activePack?.tagline}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="font-['Chakra_Petch'] font-black text-sm text-amber-300">{formatCoins(coins)}</span>
        </div>
      </div>

      {phase === 'store' && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PACKS.map((pack) => {
              const art = PACK_ART[pack.id];
              const affordable = coins >= pack.cost;
              return (
                <div
                  key={pack.id}
                  className={`rounded-3xl border ${art.border} bg-slate-950/70 overflow-hidden flex flex-col transition hover:-translate-y-1 ${affordable ? '' : 'opacity-60'}`}
                >
                  <div className={`relative h-44 ${art.gradient} flex items-center justify-center ${art.glow}`}>
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px]" />
                    <div className="pack-float">{art.icon}</div>
                    <span className="absolute top-3 left-3 text-[10px] font-mono font-black uppercase tracking-widest bg-black/40 border border-white/20 rounded-full px-2.5 py-1">
                      {pack.playerCount} Players
                    </span>
                    {pack.specialChance > 0.2 && (
                      <span className="absolute top-3 right-3 text-[10px] font-mono font-black uppercase tracking-widest bg-cyan-400/30 border border-cyan-200/40 rounded-full px-2.5 py-1 text-cyan-100">
                        Rare Special
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <h3 className="font-['Chakra_Petch'] font-black text-base uppercase tracking-wide">{pack.name}</h3>
                      <p className="text-xs text-white/50 mt-0.5">{pack.tagline}</p>
                      <p className="text-[11px] text-cyan-300 font-mono mt-1">
                        Rating {pack.minRating}–{pack.maxRating}
                        {pack.specialChance > 0 && <span className="text-pink-300"> · {Math.round(pack.specialChance * 100)}% special</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => startOpening(pack)}
                      disabled={!affordable}
                      className={`mt-auto w-full py-2.5 rounded-xl font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 ${
                        affordable
                          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-600/20 cursor-pointer'
                          : 'bg-slate-800 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      {formatCoins(pack.cost)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'opening' && activePack && (
        <div className="flex-1 flex items-center justify-center z-10">
          <div className={`pack-shake w-56 h-72 rounded-3xl border-2 ${PACK_ART[activePack.id].border} ${PACK_ART[activePack.id].gradient} ${PACK_ART[activePack.id].glow} flex items-center justify-center`}>
            <div className="text-center">
              <div className="flex justify-center mb-3">{PACK_ART[activePack.id].icon}</div>
              <div className="font-['Chakra_Petch'] font-black text-lg uppercase tracking-widest text-white drop-shadow-lg">
                Opening…
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'reveal' && activePack && (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-6 p-4 z-10">
          <div className="flex flex-wrap items-end justify-center gap-3">
            {pulledPlayers.map((player, idx) => (
              <div
                key={player.id}
                className={idx < revealedCount ? 'pack-card-in' : 'pack-card-hidden'}
              >
                <PlayerFaceCard player={player} size="sm" showDetails={idx < revealedCount} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {revealedCount < pulledPlayers.length ? (
              <button
                onClick={revealAll}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white/80 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition"
              >
                Reveal All
              </button>
            ) : (
              <>
                <div className="text-xs text-white/60 font-mono uppercase tracking-widest">
                  {pulledPlayers.length} players signed to your club
                </div>
                <button
                  onClick={backToStore}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/25"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
