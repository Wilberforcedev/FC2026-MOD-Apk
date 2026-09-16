import React, { useEffect } from 'react';
import { MatchStats, GoalEvent, Team } from '../types/soccer';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, ChevronRight } from 'lucide-react';

interface MatchEndModalProps {
  homeTeam: Team;
  awayTeam: Team;
  stats: MatchStats;
  goalEvents: GoalEvent[];
  isTournament: boolean;
  isCareer?: boolean;
  onRematch: () => void;
  onExit: () => void;
  onNextRound?: () => void;
  onCareerHub?: () => void;
}

export const MatchEndModal: React.FC<MatchEndModalProps> = ({
  homeTeam,
  awayTeam,
  stats,
  goalEvents,
  isTournament,
  isCareer,
  onRematch,
  onExit,
  onNextRound,
  onCareerHub,
}) => {
  const isUserWinner = stats.homeScore > stats.awayScore;
  const isDraw = stats.homeScore === stats.awayScore;

  useEffect(() => {
    if (isUserWinner) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#facc15', '#38bdf8', '#ffffff'],
      });
    }
  }, [isUserWinner]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner Header */}
        <div className={`py-6 px-8 text-center relative overflow-hidden ${
          isUserWinner 
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600' 
            : isDraw 
            ? 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900'
            : 'bg-gradient-to-r from-rose-700 via-slate-800 to-slate-900'
        }`}>
          <div className="flex items-center justify-center gap-2 text-amber-300 font-['Chakra_Petch'] font-bold text-sm tracking-widest uppercase mb-1">
            <Trophy className="w-4 h-4" />
            FULL-TIME MATCH RESULT
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white font-['Chakra_Petch'] tracking-wide">
            {isUserWinner ? 'VICTORY!' : isDraw ? 'DRAW MATCH' : 'DEFEAT'}
          </h2>

          {/* Big Scoreline Display */}
          <div className="mt-4 flex items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="font-black text-white text-lg md:text-xl font-['Outfit']">{homeTeam.name}</div>
                <div className="text-xs text-white/70">Player</div>
              </div>
              <span className="text-3xl">{homeTeam.badgeIcon}</span>
            </div>

            <div className="bg-black/40 px-5 py-2 rounded-2xl border border-white/20 font-['Chakra_Petch'] font-black text-4xl text-white">
              {stats.homeScore} - {stats.awayScore}
            </div>

            <div className="flex items-center gap-3 text-left">
              <span className="text-3xl">{awayTeam.badgeIcon}</span>
              <div>
                <div className="font-black text-white text-lg md:text-xl font-['Outfit']">{awayTeam.name}</div>
                <div className="text-xs text-white/70">CPU</div>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Scorers Timeline */}
        {goalEvents.length > 0 && (
          <div className="px-6 py-3 bg-slate-950/60 border-b border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-white/80">
            {goalEvents.map((g, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-amber-400">⚽ {g.minute}'</span>
                <span className="font-bold">{g.scorerName}</span>
                <span className="text-white/40">({g.team === 'home' ? homeTeam.shortName : awayTeam.shortName})</span>
              </div>
            ))}
          </div>
        )}

        {/* Match Statistics Table */}
        <div className="p-6 overflow-y-auto max-h-64 space-y-3 font-mono text-sm">
          <StatRow label="Possession" homeVal={`${stats.homePossessionPercent}%`} awayVal={`${stats.awayPossessionPercent}%`} homeHigher={stats.homePossessionPercent > stats.awayPossessionPercent} />
          <StatRow label="Total Shots" homeVal={stats.homeShots} awayVal={stats.awayShots} homeHigher={stats.homeShots > stats.awayShots} />
          <StatRow label="Shots on Target" homeVal={stats.homeShotsOnTarget} awayVal={stats.awayShotsOnTarget} homeHigher={stats.homeShotsOnTarget > stats.awayShotsOnTarget} />
          <StatRow label="Passes" homeVal={stats.homePasses} awayVal={stats.awayPasses} homeHigher={stats.homePasses > stats.awayPasses} />
          <StatRow label="Tackles" homeVal={stats.homeTackles} awayVal={stats.awayTackles} homeHigher={stats.homeTackles > stats.awayTackles} />
          <StatRow label="Corners" homeVal={stats.homeCorners} awayVal={stats.awayCorners} homeHigher={stats.homeCorners > stats.awayCorners} />
        </div>

        {/* Actions Footer */}
        <div className="p-5 bg-slate-950/90 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            id="match-end-exit-btn"
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>

          <div className="flex items-center gap-3">
            <button
              id="match-end-rematch-btn"
              onClick={onRematch}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Rematch
            </button>

            {isTournament && isUserWinner && onNextRound && (
              <button
                id="match-end-next-round-btn"
                onClick={onNextRound}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition font-['Chakra_Petch']"
              >
                Next Round
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {isCareer && onCareerHub && (
              <button
                id="match-end-career-hub-btn"
                onClick={onCareerHub}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition font-['Chakra_Petch']"
              >
                Career Hub & Standings
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function StatRow({ label, homeVal, awayVal, homeHigher }: { label: string; homeVal: string | number; awayVal: string | number; homeHigher: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5">
      <span className={`w-14 text-left font-bold ${homeHigher ? 'text-emerald-400' : 'text-white/80'}`}>
        {homeVal}
      </span>
      <span className="text-white/50 text-xs uppercase tracking-wider">{label}</span>
      <span className={`w-14 text-right font-bold ${!homeHigher ? 'text-emerald-400' : 'text-white/80'}`}>
        {awayVal}
      </span>
    </div>
  );
}
