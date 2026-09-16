import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Shield } from 'lucide-react';
import { Team } from '../types/soccer';

interface MatchPauseModalProps {
  homeTeam: Team;
  awayTeam: Team;
  currentTactic: Team['tactic'];
  onChangeTactic: (tactic: Team['tactic']) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const MatchPauseModal: React.FC<MatchPauseModalProps> = ({
  homeTeam,
  awayTeam,
  currentTactic,
  onChangeTactic,
  isMuted,
  onToggleMute,
  onResume,
  onRestart,
  onExit,
}) => {
  const tacticsList: Team['tactic'][] = [
    'Balanced',
    'High Press',
    'Counter Attack',
    'Tiki-Taka',
    'Park The Bus',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white font-['Chakra_Petch'] tracking-wide">
            MATCH PAUSED
          </h2>
          <p className="text-xs text-white/50 mt-1">Adjust in-game tactics or audio</p>
        </div>

        {/* Quick Tactic Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Tactical Preset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tacticsList.map(tac => (
              <button
                key={tac}
                onClick={() => onChangeTactic(tac)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                  currentTactic === tac
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-800/80 border-white/5 text-white/70 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tac}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-white/5">
          <div className="flex items-center gap-2 text-sm text-white font-medium">
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            Stadium Audio
          </div>
          <button
            onClick={onToggleMute}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              isMuted ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isMuted ? 'MUTED' : 'ENABLED'}
          </button>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            id="pause-resume-btn"
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition font-['Chakra_Petch']"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Resume Match
          </button>

          <button
            id="pause-restart-btn"
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Match
          </button>

          <button
            id="pause-exit-btn"
            onClick={onExit}
            className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <Home className="w-3.5 h-3.5" />
            Exit to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
