import React, { useState, useMemo } from 'react';
import { 
  Play, 
  RotateCcw, 
  Home, 
  Volume2, 
  VolumeX, 
  Shield, 
  Zap, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Sliders, 
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';
import { Team, Player, MatchPlayerEntity } from '../types/soccer';
import { MatchEngine } from '../game/engine';
import { PlayerFaceAvatar } from './PlayerFaceCard';
import { ClubEmblem } from './ClubEmblem';
import { soundEngine } from '../services/soundEngine';

interface MatchPauseModalProps {
  engine?: MatchEngine;
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
  engine,
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
  const [activeTab, setActiveTab] = useState<'subs' | 'tactics'>('subs');
  const [selectedPitchPlayerId, setSelectedPitchPlayerId] = useState<string | null>(null);
  const [selectedBenchPlayerId, setSelectedBenchPlayerId] = useState<string | null>(null);
  const [subFeedback, setSubFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // Force re-render on state changes in engine
  const [version, setVersion] = useState(0);

  const tacticsList: Array<{ id: Team['tactic']; label: string; desc: string; staminaImpact: string }> = [
    { id: 'Balanced', label: 'Balanced', desc: 'Standard tactical shape & measured pressing.', staminaImpact: 'Normal stamina drain' },
    { id: 'High Press', label: 'High Press', desc: 'Aggressive suffocating front-foot press.', staminaImpact: 'High stamina drain (+30%)' },
    { id: 'Counter Attack', label: 'Counter Attack', desc: 'Deep compact lines with blistering transitions.', staminaImpact: 'Conserves stamina for bursts' },
    { id: 'Tiki-Taka', label: 'Tiki-Taka', desc: 'Short possession passing to run opponents ragged.', staminaImpact: 'Moderate steady drain' },
    { id: 'Park The Bus', label: 'Park The Bus', desc: 'Low defensive block protecting the penalty area.', staminaImpact: 'Lowest stamina drain' },
  ];

  const subsUsed = engine?.subsUsed ?? 0;
  const maxSubs = engine?.maxSubs ?? 5;
  const subsRemaining = Math.max(0, maxSubs - subsUsed);

  // Get current on-pitch players and available bench substitutes
  const onPitchPlayers = useMemo(() => {
    if (!engine) return [];
    return engine.getOnPitchPlayers('home');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, version]);

  const benchPlayers = useMemo(() => {
    if (!engine) return [];
    return engine.getBenchPlayers('home');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, version]);

  // Get smart quick sub recommendations
  const recommendations = useMemo(() => {
    if (!engine || subsRemaining <= 0) return [];
    return engine.getQuickSubRecommendations('home');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, version, subsRemaining]);

  // Execute a substitution
  const handleExecuteSub = (playerOutId: string, playerInId: string) => {
    if (!engine) return;
    const result = engine.substitutePlayer(playerOutId, playerInId, 'home');
    if (result.success) {
      const outP = onPitchPlayers.find(p => p.id === playerOutId)?.player.shortName || 'Starter';
      const inP = benchPlayers.find(p => p.id === playerInId)?.shortName || 'Substitute';
      setSubFeedback({
        message: `Substituted: ${inP} is now on the pitch replacing ${outP}!`,
        type: 'success',
      });
      setSelectedPitchPlayerId(null);
      setSelectedBenchPlayerId(null);
      setVersion(v => v + 1);
    } else {
      setSubFeedback({
        message: result.reason || 'Substitution failed.',
        type: 'error',
      });
    }

    // Clear feedback after 4 seconds
    setTimeout(() => {
      setSubFeedback(null);
    }, 4000);
  };

  const getStaminaColor = (stamina: number) => {
    if (stamina > 65) return 'from-emerald-400 to-teal-400';
    if (stamina > 38) return 'from-yellow-400 to-amber-500';
    return 'from-rose-500 to-red-600 animate-pulse';
  };

  const getStaminaBadge = (stamina: number) => {
    if (stamina > 65) return { text: 'FRESH', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (stamina > 38) return { text: 'TIRING', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { text: 'EXHAUSTED', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  };

  const selectedPitchPlayer = onPitchPlayers.find(p => p.id === selectedPitchPlayerId);
  const selectedBenchPlayer = benchPlayers.find(p => p.id === selectedBenchPlayerId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* =========================================================================
            HEADER BAR: Match Pause, Live Match Scorebug, and Subs Counter
        ========================================================================= */}
        <div className="bg-slate-950/90 border-b border-white/10 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Zap className="w-5 h-5 fill-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white font-['Chakra_Petch'] tracking-wide">
                  MATCH PAUSED
                </h2>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {engine ? `${Math.floor(engine.matchTimeSec)}'` : '45\''}
                </span>
              </div>
              <p className="text-xs text-white/50">
                {homeTeam.name} vs {awayTeam.name}
                {engine && ` • ${homeTeam.shortName} ${engine.stats.homeScore} - ${engine.stats.awayScore} ${awayTeam.shortName}`}
              </p>
            </div>
          </div>

          {/* Substitutions Allowance Badge */}
          <div className="flex items-center gap-3 bg-slate-900/80 border border-cyan-500/30 px-3.5 py-1.5 rounded-2xl shadow-inner">
            <div className="text-right">
              <span className="text-[10px] text-white/60 uppercase tracking-wider block font-semibold">
                Substitutions
              </span>
              <span className="text-xs font-['Chakra_Petch'] font-black text-cyan-300">
                {subsRemaining} of {maxSubs} REMAINING
              </span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: maxSubs }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-6 rounded-full transition-all ${
                    i < subsRemaining
                      ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-[0_0_8px_#10b981]'
                      : 'bg-slate-800 border border-white/10'
                  }`}
                  title={i < subsRemaining ? 'Available Sub' : 'Used Sub'}
                />
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            NAVIGATION TABS: Quick Substitution vs Tactics & Match Settings
        ========================================================================= */}
        <div className="flex border-b border-white/10 bg-slate-950/40 px-5 pt-2 gap-2 shrink-0">
          <button
            id="tab-subs"
            onClick={() => setActiveTab('subs')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-['Chakra_Petch'] font-black uppercase tracking-wider flex items-center gap-2 transition border-t border-x ${
              activeTab === 'subs'
                ? 'bg-slate-900 border-cyan-500/40 text-cyan-300 shadow-[0_-5px_15px_rgba(6,182,212,0.1)]'
                : 'border-transparent text-white/60 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            Quick Substitution & Squad
          </button>
          
          <button
            id="tab-tactics"
            onClick={() => setActiveTab('tactics')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-['Chakra_Petch'] font-black uppercase tracking-wider flex items-center gap-2 transition border-t border-x ${
              activeTab === 'tactics'
                ? 'bg-slate-900 border-cyan-500/40 text-cyan-300 shadow-[0_-5px_15px_rgba(6,182,212,0.1)]'
                : 'border-transparent text-white/60 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            Tactical Presets & Audio
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {subFeedback && (
          <div 
            className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 transition ${
              subFeedback.type === 'success'
                ? 'bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/80 border-b border-rose-500/40 text-rose-300'
            }`}
          >
            {subFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{subFeedback.message}</span>
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT: QUICK SUBSTITUTION (Smart AI Recommendation + Manual Swapper)
        ========================================================================= */}
        {activeTab === 'subs' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-cyan-500/30">
            
            {/* 1. FEATURED QUICK SUB RECOMMENDATION CARD */}
            {recommendations.length > 0 && subsRemaining > 0 ? (
              <div className="bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 border border-cyan-500/40 rounded-2xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.15)] relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full font-['Chakra_Petch'] uppercase tracking-wider shadow">
                      RECOMMENDED QUICK SUB
                    </span>
                    <span className="text-xs text-cyan-300/80 font-mono">
                      Stamina Alert • High Impact Swap
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50 font-mono">
                    Boost: +{recommendations[0].staminaGain}% Stamina
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  
                  {/* Fatigued Starter (OUT) */}
                  <div className="md:col-span-5 bg-slate-900/90 border border-rose-500/30 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full border border-rose-500/50 flex items-center justify-center overflow-hidden bg-slate-950 shrink-0 shadow">
                      <PlayerFaceAvatar
                        skinTone={recommendations[0].playerOut.player.likeness?.skinTone || '#d49b6a'}
                        hairStyle={recommendations[0].playerOut.player.likeness?.hairStyle || 'short'}
                        hairColor={recommendations[0].playerOut.player.likeness?.hairColor || '#111827'}
                        facialHair={recommendations[0].playerOut.player.likeness?.facialHair || 'none'}
                        jerseyColor={homeTeam.kit.primary}
                        size={44}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate font-['Outfit']">
                          {recommendations[0].playerOut.player.name}
                        </span>
                        <span className="text-[10px] font-black font-['Chakra_Petch'] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          SUB OUT ⬇
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black font-['Chakra_Petch'] text-cyan-300 bg-cyan-950/80 px-1 rounded">
                          {recommendations[0].playerOut.player.position}
                        </span>
                        <span className="text-[10px] text-white/60 font-mono">
                          OVR {recommendations[0].playerOut.player.rating}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-rose-400 ml-auto">
                          {Math.round(recommendations[0].playerOut.stamina)}% Stamina
                        </span>
                      </div>

                      {/* Stamina bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden border border-white/5">
                        <div
                          className={`h-full bg-gradient-to-r ${getStaminaColor(recommendations[0].playerOut.stamina)}`}
                          style={{ width: `${recommendations[0].playerOut.stamina}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Center Swap Arrow with Button */}
                  <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
                    <button
                      id="execute-quick-sub-btn"
                      onClick={() => handleExecuteSub(recommendations[0].playerOut.id, recommendations[0].recommendedSub.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 fill-slate-950" />
                      Quick Sub
                    </button>
                    <span className="text-[10px] text-cyan-300/80 font-mono mt-1">1-Click Swap</span>
                  </div>

                  {/* Fresh Substitute (IN) */}
                  <div className="md:col-span-5 bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full border border-emerald-500/50 flex items-center justify-center overflow-hidden bg-slate-950 shrink-0 shadow">
                      <PlayerFaceAvatar
                        skinTone={recommendations[0].recommendedSub.likeness?.skinTone || '#d49b6a'}
                        hairStyle={recommendations[0].recommendedSub.likeness?.hairStyle || 'short'}
                        hairColor={recommendations[0].recommendedSub.likeness?.hairColor || '#111827'}
                        facialHair={recommendations[0].recommendedSub.likeness?.facialHair || 'none'}
                        jerseyColor={homeTeam.kit.primary}
                        size={44}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate font-['Outfit']">
                          {recommendations[0].recommendedSub.name}
                        </span>
                        <span className="text-[10px] font-black font-['Chakra_Petch'] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          SUB IN ⬆
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black font-['Chakra_Petch'] text-cyan-300 bg-cyan-950/80 px-1 rounded">
                          {recommendations[0].recommendedSub.position}
                        </span>
                        <span className="text-[10px] text-white/60 font-mono">
                          OVR {recommendations[0].recommendedSub.rating}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 ml-auto flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          100% Fresh
                        </span>
                      </div>

                      {/* Stamina bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-300"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/60">
                  <p className="italic">💡 {recommendations[0].reason}</p>
                  <span className="text-cyan-400 font-mono text-[10px] font-semibold shrink-0 ml-2">
                    Role Match: {recommendations[0].roleMatch}
                  </span>
                </div>
              </div>
            ) : subsRemaining <= 0 ? (
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                <h4 className="text-sm font-['Chakra_Petch'] font-black text-amber-300 uppercase">
                  Substitution Limit Reached
                </h4>
                <p className="text-xs text-white/60 mt-1">
                  You have used all {maxSubs} substitutions permitted for this match.
                </p>
              </div>
            ) : null}

            {/* 2. ALTERNATIVE QUICK SUB TILES (If other players also fatigue) */}
            {recommendations.length > 1 && subsRemaining > 0 && (
              <div>
                <span className="text-xs font-['Chakra_Petch'] font-black text-cyan-400 uppercase tracking-wider block mb-2">
                  Other Fatigue Recommendations
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recommendations.slice(1, 3).map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/70 border border-white/10 hover:border-cyan-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                          {Math.round(rec.playerOut.stamina)}%
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{rec.playerOut.player.shortName}</p>
                          <p className="text-[10px] text-white/50">For {rec.recommendedSub.shortName} ({rec.recommendedSub.position})</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleExecuteSub(rec.playerOut.id, rec.recommendedSub.id)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/30 text-[10px] font-['Chakra_Petch'] font-black uppercase tracking-wider shrink-0 transition"
                      >
                        Sub In
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. FULL SQUAD & BENCH TACTICAL SWAPPER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-['Chakra_Petch'] font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Squad Stamina & Bench Swapper
                  </h3>
                  <p className="text-[11px] text-white/50">
                    Select any fatigued player on the pitch, then choose a fresh bench player to swap.
                  </p>
                </div>

                {/* Active Selection Indicator */}
                {(selectedPitchPlayer || selectedBenchPlayer) && (
                  <button
                    onClick={() => {
                      setSelectedPitchPlayerId(null);
                      setSelectedBenchPlayerId(null);
                    }}
                    className="text-[11px] text-white/50 hover:text-white underline"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Grid: Starters On Pitch (Left) vs Substitutes Bench (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* COLUMN 1: ON-PITCH STARTERS */}
                <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs font-['Chakra_Petch'] font-black text-white/80 uppercase tracking-wider">
                      STARTERS ON PITCH ({onPitchPlayers.length})
                    </span>
                    <span className="text-[10px] text-white/40">Select player to sub OUT</span>
                  </div>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {onPitchPlayers.map((p) => {
                      const isSelected = selectedPitchPlayerId === p.id;
                      const badge = getStaminaBadge(p.stamina);
                      const isGK = p.player.isGoalkeeper;

                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPitchPlayerId(isSelected ? null : p.id)}
                          className={`w-full text-left p-2 rounded-xl border transition flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-rose-950/60 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)] ring-1 ring-rose-400'
                              : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-900'
                          }`}
                        >
                          {/* Face Avatar */}
                          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center overflow-hidden bg-slate-950 shrink-0">
                            <PlayerFaceAvatar
                              skinTone={p.player.likeness?.skinTone || '#d49b6a'}
                              hairStyle={p.player.likeness?.hairStyle || 'short'}
                              hairColor={p.player.likeness?.hairColor || '#111827'}
                              facialHair={p.player.likeness?.facialHair || 'none'}
                              jerseyColor={homeTeam.kit.primary}
                              size={32}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate font-['Outfit']">
                                #{p.player.number} {p.player.shortName}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                                  {badge.text}
                                </span>
                                <span className="font-['Chakra_Petch'] font-black text-xs text-cyan-300">
                                  {p.player.rating}
                                </span>
                              </div>
                            </div>

                            {/* Position & Stamina Bar */}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1 rounded">
                                {p.player.position}
                              </span>
                              
                              <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden border border-white/5">
                                <div
                                  className={`h-full bg-gradient-to-r ${getStaminaColor(p.stamina)}`}
                                  style={{ width: `${p.stamina}%` }}
                                />
                              </div>

                              <span className="text-[10px] font-mono font-bold text-white/70 shrink-0">
                                {Math.round(p.stamina)}%
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="text-[10px] font-black font-['Chakra_Petch'] text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/40">
                              OUT ⬇
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN 2: BENCH SUBSTITUTES */}
                <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs font-['Chakra_Petch'] font-black text-cyan-400 uppercase tracking-wider">
                      BENCH SUBSTITUTES ({benchPlayers.length})
                    </span>
                    <span className="text-[10px] text-white/40">Select player to sub IN</span>
                  </div>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {benchPlayers.map((player) => {
                      const isSelected = selectedBenchPlayerId === player.id;

                      return (
                        <button
                          key={player.id}
                          onClick={() => setSelectedBenchPlayerId(isSelected ? null : player.id)}
                          className={`w-full text-left p-2 rounded-xl border transition flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                              : 'bg-slate-900/60 border-white/5 hover:border-cyan-500/30 hover:bg-slate-900'
                          }`}
                        >
                          {/* Face Avatar */}
                          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center overflow-hidden bg-slate-950 shrink-0">
                            <PlayerFaceAvatar
                              skinTone={player.likeness?.skinTone || '#d49b6a'}
                              hairStyle={player.likeness?.hairStyle || 'short'}
                              hairColor={player.likeness?.hairColor || '#111827'}
                              facialHair={player.likeness?.facialHair || 'none'}
                              jerseyColor={homeTeam.kit.primary}
                              size={32}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate font-['Outfit']">
                                #{player.number} {player.shortName}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  100% FRESH
                                </span>
                                <span className="font-['Chakra_Petch'] font-black text-xs text-cyan-300">
                                  {player.rating}
                                </span>
                              </div>
                            </div>

                            {/* Position & Key Stats */}
                            <div className="flex items-center justify-between text-[9px] text-white/50 font-mono mt-1">
                              <span className="text-cyan-300 bg-cyan-950/80 px-1 rounded font-bold">
                                {player.position}
                              </span>
                              <span>PAC {player.stats.pace}</span>
                              <span>SHO {player.stats.shooting}</span>
                              <span>PAS {player.stats.passing}</span>
                              <span>DRI {player.stats.dribbling}</span>
                              <span>PHY {player.stats.physicality}</span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="text-[10px] font-black font-['Chakra_Petch'] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40">
                              IN ⬆
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ACTIVE SWAP CONFIRMATION BAR */}
              {selectedPitchPlayer && selectedBenchPlayer && (
                <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black font-['Chakra_Petch'] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                        OUT ⬇
                      </span>
                      <span className="text-xs font-bold text-white font-['Outfit']">
                        {selectedPitchPlayer.player.shortName} ({Math.round(selectedPitchPlayer.stamina)}% Stamina)
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-cyan-400" />

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black font-['Chakra_Petch'] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        IN ⬆
                      </span>
                      <span className="text-xs font-bold text-white font-['Outfit']">
                        {selectedBenchPlayer.shortName} (100% Fresh)
                      </span>
                    </div>
                  </div>

                  <button
                    id="confirm-custom-sub-btn"
                    disabled={subsRemaining <= 0}
                    onClick={() => handleExecuteSub(selectedPitchPlayer.id, selectedBenchPlayer.id)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Confirm Substitution
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB CONTENT: TACTICS, SOUND & MATCH CONTROLS
        ========================================================================= */}
        {activeTab === 'tactics' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 scrollbar-thin scrollbar-thumb-cyan-500/30">
            
            {/* Tactical Presets */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2 font-['Chakra_Petch']">
                <Shield className="w-4 h-4 text-emerald-400" />
                Team Tactical Philosophy
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tacticsList.map(tac => {
                  const isActive = currentTactic === tac.id;
                  return (
                    <button
                      key={tac.id}
                      onClick={() => onChangeTactic(tac.id)}
                      className={`p-3 rounded-2xl text-left transition border ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-white/5 text-white/70 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-['Chakra_Petch'] font-black text-sm text-white">
                          {tac.label}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.2 rounded font-mono">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/50">{tac.desc}</p>
                      <span className="text-[10px] text-cyan-300/80 font-mono mt-1.5 block">
                        Stamina Impact: {tac.staminaImpact}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stadium Sound Controls */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Crowd & Commentary Audio</h4>
                  <p className="text-xs text-white/50">Stadium chants, ball kick sound effects, and whistle</p>
                </div>
              </div>
              <button
                onClick={onToggleMute}
                className={`px-4 py-2 rounded-xl text-xs font-['Chakra_Petch'] font-black tracking-wider transition ${
                  isMuted 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isMuted ? 'AUDIO MUTED' : 'AUDIO ENABLED'}
              </button>
            </div>

            {/* Match Restart & Exit Options */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="pause-restart-btn"
                onClick={onRestart}
                className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-white/10 text-white font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                Restart Match
              </button>

              <button
                id="pause-exit-btn"
                onClick={onExit}
                className="py-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
              >
                <Home className="w-3.5 h-3.5" />
                Exit to Main Menu
              </button>
            </div>

          </div>
        )}

        {/* =========================================================================
            BOTTOM FOOTER: RESUME MATCH
        ========================================================================= */}
        <div className="bg-slate-950/90 border-t border-white/10 p-4 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-white/50 hidden sm:block">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white/80 font-mono text-[10px] border border-white/10">ESC</kbd> or click Resume to continue playing
          </div>

          <button
            id="pause-resume-btn"
            onClick={onResume}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 ml-auto"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Resume Match
          </button>
        </div>

      </div>
    </div>
  );
};
