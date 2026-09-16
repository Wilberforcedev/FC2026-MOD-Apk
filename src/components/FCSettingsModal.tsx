import React from 'react';
import { X, Volume2, VolumeX, Monitor, Shield, Gamepad2 } from 'lucide-react';

interface FCSettingsModalProps {
  isOpen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
}

export const FCSettingsModal: React.FC<FCSettingsModalProps> = ({
  isOpen,
  isMuted,
  onToggleMute,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-cyan-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <h3 className="font-['Chakra_Petch'] font-black text-base uppercase tracking-wider text-white">
              GAME & AUDIO SETTINGS
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 text-white/70 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Audio */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-white">Stadium Atmospheric Sound & Commentary</div>
              <div className="text-xs text-white/50 mt-0.5">Procedural Web Audio crowd murmurs, whistles, ball strikes & commentary.</div>
            </div>
            <button
              onClick={onToggleMute}
              className={`px-4 py-2 rounded-xl text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider flex items-center gap-2 border transition ${
                !isMuted
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-red-500/20 border-red-400 text-red-300'
              }`}
            >
              {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{!isMuted ? 'ENABLED' : 'MUTED'}</span>
            </button>
          </div>

          {/* Controls Reference */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
            <div className="font-bold text-sm text-white mb-2">Controls & Skill Moves Reference</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-cyan-400 font-bold block">WASD / Arrows</span>
                <span className="text-white/60">360° Movement</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-amber-400 font-bold block">K Key</span>
                <span className="text-white/60">Ground Pass</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-cyan-400 font-bold block">L Key</span>
                <span className="text-white/60">Through Ball</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-red-400 font-bold block">J Key (Hold)</span>
                <span className="text-white/60">Power Shoot</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-yellow-400 font-bold block">U Key / Swipe Up</span>
                <span className="text-white/60">Lofted Chip Shot</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-purple-400 font-bold block">Shift / C Key</span>
                <span className="text-white/60">Sprint & Skill Move</span>
              </div>
            </div>
          </div>

          {/* Engine Quality */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-white">HyperMotion Tactical Engine</div>
              <div className="text-xs text-white/50 mt-0.5">Offline 60fps physics, authentic spin, and tactical radar.</div>
            </div>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-full font-mono font-bold">
              ULTRA 60FPS
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/60 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
