/**
 * PlayerDevelopmentModal Component
 * Interactive Player Development & Training Academy Center.
 * Managers assign players to specialized drills, observe XP progression,
 * boost core attributes, and unlock player potential.
 */

import React, { useState } from 'react';
import { Player, Team } from '../types/soccer';
import {
  TRAINING_DRILLS,
  TrainingDrill,
  executeTrainingDrill,
  createDevelopmentNewsItem,
  DrillResult,
} from '../services/playerDevelopmentService';
import { PlayerFaceCard } from './PlayerFaceCard';
import { CareerNewsItem } from '../services/careerNewsService';
import { soundEngine } from '../services/soundEngine';
import {
  X,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Shield,
  Activity,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface PlayerDevelopmentModalProps {
  isOpen: boolean;
  player: Player | null;
  team?: Team;
  matchday?: number;
  onClose: () => void;
  onPlayerUpdated: (updatedPlayer: Player, newsItem?: CareerNewsItem) => void;
}

export const PlayerDevelopmentModal: React.FC<PlayerDevelopmentModalProps> = ({
  isOpen,
  player,
  team,
  matchday = 1,
  onClose,
  onPlayerUpdated,
}) => {
  const [selectedDrill, setSelectedDrill] = useState<TrainingDrill>(TRAINING_DRILLS[0]);
  const [lastResult, setLastResult] = useState<DrillResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  if (!isOpen || !player) return null;

  const currentXp = player.development?.xp || 0;
  const level = player.development?.level || 1;
  const xpThreshold = 1000;
  const xpProgressPercent = Math.min(100, Math.round((currentXp % xpThreshold) / (xpThreshold / 100)));
  const potential = player.potential || Math.min(99, player.rating + 6);

  const handleRunTraining = () => {
    setIsTraining(true);
    soundEngine.playWhistle();

    setTimeout(() => {
      const result = executeTrainingDrill(player, selectedDrill);
      setLastResult(result);
      setIsTraining(false);

      soundEngine.playKick();

      let newsItem: CareerNewsItem | undefined;
      if (result.overallChanged && team) {
        newsItem = createDevelopmentNewsItem(
          team.name,
          team.id,
          result.player,
          result.oldOverall,
          result.newOverall,
          matchday
        );
      }

      onPlayerUpdated(result.player, newsItem);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-cyan-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow">
              <Zap className="w-5 h-5 fill-cyan-400/30" />
            </div>
            <div>
              <h3 className="font-['Chakra_Petch'] font-black text-base sm:text-lg uppercase tracking-wider text-white flex items-center gap-2">
                PLAYER DEVELOPMENT ACADEMY
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  SEASON DRILLS
                </span>
              </h3>
              <p className="text-xs text-white/50 font-['Outfit']">
                Target player attributes, accelerate potential ceiling, and hone tactical position mastery.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Player Face Card & Growth Progress (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-start bg-slate-900/60 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Ultimate Team Style Face Card */}
            <PlayerFaceCard player={player} team={team} size="md" showDetails />

            {/* Growth & Potential Capsule */}
            <div className="w-full mt-5 bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-['Chakra_Petch'] font-bold text-white/70 uppercase">
                  Current Rating
                </span>
                <span className="font-['Chakra_Petch'] font-black text-lg text-cyan-300">
                  {player.rating} OVR
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-['Chakra_Petch'] font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Potential Ceiling
                </span>
                <span className="font-['Chakra_Petch'] font-black text-lg text-amber-400">
                  {potential} POT
                </span>
              </div>

              {/* XP Level Bar */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="flex justify-between text-[11px] font-mono text-white/60">
                  <span>Academy Level {level}</span>
                  <span className="text-cyan-400 font-bold">{currentXp} XP</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_#06b6d4]"
                    style={{ width: `${xpProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Training Feedback Result Box */}
            {lastResult && (
              <div className="w-full mt-3 bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/40 rounded-2xl p-3.5 shadow-lg animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Chakra_Petch'] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Drill Completed • Grade {lastResult.grade}
                  </span>
                  <span className="text-xs font-bold text-emerald-300 font-mono">
                    +{lastResult.xpEarned} XP
                  </span>
                </div>

                <div className="text-xs text-white/80 mt-1 font-['Outfit'] leading-relaxed">
                  {lastResult.message}
                </div>

                {lastResult.statsImproved.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lastResult.statsImproved.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold"
                      >
                        +{s.delta} {s.stat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Training Drill Regimens (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-['Chakra_Petch'] font-bold text-white/60 uppercase tracking-widest">
                  SELECT SPECIALIZED DRILL
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {TRAINING_DRILLS.length} Regimens Available
                </span>
              </div>

              {/* Drills List */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {TRAINING_DRILLS.map((drill) => {
                  const isSelected = selectedDrill.id === drill.id;
                  const isRecommended = drill.targetPositions.includes(player.position);

                  return (
                    <div
                      key={drill.id}
                      onClick={() => setSelectedDrill(drill)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/90 via-slate-900 to-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-['Chakra_Petch'] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              drill.category === 'SHOOTING'
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : drill.category === 'PASSING'
                                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                                : drill.category === 'DEFENDING'
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : drill.category === 'GOALKEEPING'
                                ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                                : 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                            }`}
                          >
                            {drill.category}
                          </span>

                          {isRecommended && (
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
                              IDEAL FOR {player.position}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-mono text-cyan-400 font-bold">
                          +{drill.baseXp} XP
                        </span>
                      </div>

                      <div className="mt-1.5">
                        <h4 className="font-['Chakra_Petch'] font-black text-sm text-white uppercase">
                          {drill.name}
                        </h4>
                        <p className="text-xs text-white/60 mt-0.5 line-clamp-2 font-['Outfit']">
                          {drill.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50">
                        <span>
                          Target: <strong className="text-white uppercase">{drill.primaryStat}</strong>
                          {drill.secondaryStat && (
                            <span> + <strong className="text-white uppercase">{drill.secondaryStat}</strong></span>
                          )}
                        </span>
                        <span className="text-amber-400/80">{drill.intensity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execute Button */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={handleRunTraining}
                disabled={isTraining}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider transition shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTraining ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-slate-950" />
                    SIMULATING DRILL...
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 text-slate-950" />
                    EXECUTE {selectedDrill.name.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
