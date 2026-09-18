import React, { useEffect, useState } from 'react';
import { MatchStats, GoalEvent, Team, MatchHighlightEvent, MatchHeatmapData } from '../types/soccer';
import { MatchEngine } from '../game/engine';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  RotateCcw, 
  Home, 
  ChevronRight, 
  Play, 
  Film, 
  Bookmark, 
  BookmarkCheck, 
  BarChart2, 
  Archive, 
  Zap, 
  Trash2, 
  Sparkles,
  Shield,
  Flame
} from 'lucide-react';
import { HighlightReplayModal } from './HighlightReplayModal';
import { PitchHeatmapViewer } from './PitchHeatmapViewer';
import { 
  getSavedHighlights, 
  saveHighlightToVault, 
  removeHighlightFromVault, 
  isHighlightSaved,
  clearAllSavedHighlights 
} from '../utils/highlightStorage';

interface MatchEndModalProps {
  homeTeam: Team;
  awayTeam: Team;
  stats: MatchStats;
  goalEvents: GoalEvent[];
  keyMatchEvents?: MatchHighlightEvent[];
  heatmapData?: MatchHeatmapData;
  engine?: MatchEngine;
  isTournament: boolean;
  isCareer?: boolean;
  onRematch: () => void;
  onExit: () => void;
  onNextRound?: () => void;
  onCareerHub?: () => void;
}

type TabType = 'highlights' | 'heatmap' | 'stats' | 'vault';
type FilterType = 'all' | 'goals' | 'saves';

export const MatchEndModal: React.FC<MatchEndModalProps> = ({
  homeTeam,
  awayTeam,
  stats,
  goalEvents,
  keyMatchEvents = [],
  heatmapData,
  engine,
  isTournament,
  isCareer,
  onRematch,
  onExit,
  onNextRound,
  onCareerHub,
}) => {
  const isUserWinner = stats.homeScore > stats.awayScore;
  const isDraw = stats.homeScore === stats.awayScore;

  // Active tab inside modal
  const [activeTab, setActiveTab] = useState<TabType>('highlights');
  const [highlightFilter, setHighlightFilter] = useState<FilterType>('all');

  // Active highlight being viewed in Replay Theater
  const [activeReplayHighlight, setActiveReplayHighlight] = useState<MatchHighlightEvent | null>(null);

  // Saved vault highlights
  const [vaultHighlights, setVaultHighlights] = useState<MatchHighlightEvent[]>(() => getSavedHighlights());
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Resolved spatial movement telemetry & heatmap data
  const resolvedHeatmapData: MatchHeatmapData = heatmapData || engine?.getHeatmapData() || {
    homePlayers: {},
    awayPlayers: {},
    ballSamples: [],
    homeTeamSamples: [],
    awayTeamSamples: [],
  };

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

  // Refresh saved highlights
  const refreshVault = () => {
    setVaultHighlights(getSavedHighlights());
  };

  const handleToggleSave = (hl: MatchHighlightEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isHighlightSaved(hl.id)) {
      removeHighlightFromVault(hl.id);
      showToast('Removed from Vault');
    } else {
      const res = saveHighlightToVault(hl);
      showToast(res.message);
    }
    refreshVault();
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Filtered match highlights
  const filteredHighlights = keyMatchEvents.filter(h => {
    if (highlightFilter === 'goals') return h.type === 'goal';
    if (highlightFilter === 'saves') return h.type === 'save';
    return true;
  });

  const goalsCount = keyMatchEvents.filter(h => h.type === 'goal').length;
  const savesCount = keyMatchEvents.filter(h => h.type === 'save').length;

  return (
    <div id="match-end-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="match-end-modal-container"
        className="w-full max-w-4xl max-h-[94vh] bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Banner Header */}
        <div className={`py-5 px-6 text-center relative overflow-hidden ${
          isUserWinner 
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600' 
            : isDraw 
            ? 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900'
            : 'bg-gradient-to-r from-rose-700 via-slate-800 to-slate-900'
        }`}>
          <div className="flex items-center justify-center gap-2 text-amber-300 font-['Chakra_Petch'] font-bold text-xs sm:text-sm tracking-widest uppercase mb-1">
            <Trophy className="w-4 h-4" />
            FULL-TIME MATCH RESULT
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Chakra_Petch'] tracking-wide">
            {isUserWinner ? 'VICTORY!' : isDraw ? 'DRAW MATCH' : 'DEFEAT'}
          </h2>

          {/* Big Scoreline Display */}
          <div className="mt-3 flex items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 sm:gap-3 text-right">
              <div>
                <div className="font-black text-white text-base sm:text-lg font-['Outfit']">{homeTeam.name}</div>
                <div className="text-xs text-white/70">Player</div>
              </div>
              <span className="text-2xl sm:text-3xl">{homeTeam.badgeIcon}</span>
            </div>

            <div className="bg-black/40 px-4 py-1.5 rounded-2xl border border-white/20 font-['Chakra_Petch'] font-black text-3xl sm:text-4xl text-white">
              {stats.homeScore} - {stats.awayScore}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-left">
              <span className="text-2xl sm:text-3xl">{awayTeam.badgeIcon}</span>
              <div>
                <div className="font-black text-white text-base sm:text-lg font-['Outfit']">{awayTeam.name}</div>
                <div className="text-xs text-white/70">CPU</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/80 border-b border-white/10 px-4 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center space-x-2">
            <button
              id="tab-match-highlights-btn"
              onClick={() => setActiveTab('highlights')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex-shrink-0 ${
                activeTab === 'highlights'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Match Highlights</span>
              {keyMatchEvents.length > 0 && (
                <span className="bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {keyMatchEvents.length}
                </span>
              )}
            </button>

            <button
              id="tab-match-heatmap-btn"
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex-shrink-0 ${
                activeTab === 'heatmap'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Pitch Heatmap</span>
              <span className="bg-orange-950 border border-orange-500/40 text-orange-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                Live
              </span>
            </button>

            <button
              id="tab-match-stats-btn"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex-shrink-0 ${
                activeTab === 'stats'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Statistics</span>
            </button>

            <button
              id="tab-saved-vault-btn"
              onClick={() => {
                refreshVault();
                setActiveTab('vault');
              }}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex-shrink-0 ${
                activeTab === 'vault'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Vault</span>
              {vaultHighlights.length > 0 && (
                <span className="bg-amber-950 border border-amber-500/40 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {vaultHighlights.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Reel Action Button if highlights exist */}
          {activeTab === 'highlights' && keyMatchEvents.length > 0 && (
            <button
              id="replay-all-reel-btn"
              onClick={() => setActiveReplayHighlight(keyMatchEvents[0])}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all active:scale-95 flex-shrink-0 ml-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Play Highlight Reel</span>
              <span className="sm:hidden">Reel</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto min-h-[280px] max-h-[580px] relative">
          {/* Toast Notification */}
          {saveToast && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-cyan-950/95 border border-cyan-400/50 text-cyan-200 text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-in fade-in">
              {saveToast}
            </div>
          )}

          {/* TAB 1: MATCH HIGHLIGHTS & REPLAYS */}
          {activeTab === 'highlights' && (
            <div className="space-y-3">
              {/* Filter Pills */}
              {keyMatchEvents.length > 0 && (
                <div className="flex items-center justify-between gap-2 pb-1">
                  <div className="flex items-center space-x-1.5 text-xs">
                    <button
                      onClick={() => setHighlightFilter('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        highlightFilter === 'all'
                          ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Events ({keyMatchEvents.length})
                    </button>
                    <button
                      onClick={() => setHighlightFilter('goals')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        highlightFilter === 'goals'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚽ Goals ({goalsCount})
                    </button>
                    <button
                      onClick={() => setHighlightFilter('saves')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        highlightFilter === 'saves'
                          ? 'bg-teal-950/60 text-teal-400 border border-teal-500/30'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🧤 Saves ({savesCount})
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    Click "Replay" to open interactive 4K replay theater
                  </span>
                </div>
              )}

              {/* Highlight Cards List */}
              {filteredHighlights.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredHighlights.map((hl) => {
                    const saved = isHighlightSaved(hl.id);
                    return (
                      <div
                        key={hl.id}
                        id={`highlight-card-${hl.id}`}
                        onClick={() => setActiveReplayHighlight(hl)}
                        className="group p-3 sm:p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                      >
                        {/* Left: Event Badge & Crest */}
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black text-xs border ${
                            hl.type === 'goal'
                              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          }`}>
                            <span className="text-sm">{hl.type === 'goal' ? '⚽' : '🧤'}</span>
                            <span className="text-[10px] font-mono leading-none">{hl.minute}'</span>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-white text-sm">
                                {hl.primaryPlayerName}
                              </span>
                              <span className="text-slate-400 text-xs font-mono">
                                #{hl.primaryPlayerNumber}
                              </span>
                              <span className="text-xs text-white/50">
                                ({hl.team === 'home' ? homeTeam.shortName : awayTeam.shortName})
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              {hl.description}
                            </p>
                          </div>
                        </div>

                        {/* Right: Telemetry & Actions */}
                        <div className="flex items-center space-x-2">
                          {hl.shotSpeedKmh && (
                            <span className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-mono text-xs">
                              <Zap className="w-3 h-3" />
                              <span>{hl.shotSpeedKmh} KM/H</span>
                            </span>
                          )}

                          {/* Save / Bookmark Button */}
                          <button
                            id={`save-highlight-${hl.id}`}
                            onClick={(e) => handleToggleSave(hl, e)}
                            className={`p-2 rounded-xl border transition-all ${
                              saved
                                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                            title={saved ? 'Saved in Vault' : 'Save to Highlights Vault'}
                          >
                            {saved ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
                          </button>

                          {/* Replay Button */}
                          <button
                            id={`replay-btn-${hl.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReplayHighlight(hl);
                            }}
                            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-600 group-hover:bg-cyan-500 text-white text-xs font-black shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Replay</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <Film className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                  <p className="text-slate-300 text-sm font-semibold">No match highlights recorded for this category</p>
                  <p className="text-slate-500 text-xs mt-1">Goals, critical saves, and dramatic strikes will appear here after matches.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PITCH HEATMAP & SPATIAL MOVEMENT VISUALIZATION */}
          {activeTab === 'heatmap' && (
            <PitchHeatmapViewer
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              heatmapData={resolvedHeatmapData}
              homeScore={stats.homeScore}
              awayScore={stats.awayScore}
            />
          )}

          {/* TAB 3: MATCH STATISTICS */}
          {activeTab === 'stats' && (
            <div className="space-y-3 font-mono text-sm">
              <StatRow label="Possession" homeVal={`${stats.homePossessionPercent}%`} awayVal={`${stats.awayPossessionPercent}%`} homeHigher={stats.homePossessionPercent > stats.awayPossessionPercent} />
              <StatRow label="Total Shots" homeVal={stats.homeShots} awayVal={stats.awayShots} homeHigher={stats.homeShots > stats.awayShots} />
              <StatRow label="Shots on Target" homeVal={stats.homeShotsOnTarget} awayVal={stats.awayShotsOnTarget} homeHigher={stats.homeShotsOnTarget > stats.awayShotsOnTarget} />
              <StatRow label="Passes" homeVal={stats.homePasses} awayVal={stats.awayPasses} homeHigher={stats.homePasses > stats.awayPasses} />
              <StatRow label="Tackles" homeVal={stats.homeTackles} awayVal={stats.awayTackles} homeHigher={stats.homeTackles > stats.awayTackles} />
              <StatRow label="Corners" homeVal={stats.homeCorners} awayVal={stats.awayCorners} homeHigher={stats.homeCorners > stats.awayCorners} />
            </div>
          )}

          {/* TAB 3: SAVED VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 text-xs">
                <div className="flex items-center space-x-2 text-slate-300 font-semibold">
                  <Archive className="w-4 h-4 text-amber-400" />
                  <span>Saved Match Highlights Vault ({vaultHighlights.length})</span>
                </div>
                {vaultHighlights.length > 0 && (
                  <button
                    id="clear-vault-btn"
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all saved highlights?')) {
                        clearAllSavedHighlights();
                        refreshVault();
                        showToast('Vault cleared');
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 text-xs flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {vaultHighlights.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {vaultHighlights.map((hl) => (
                    <div
                      key={hl.id}
                      id={`vault-highlight-${hl.id}`}
                      onClick={() => setActiveReplayHighlight(hl)}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black text-xs border ${
                          hl.type === 'goal'
                            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                            : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                        }`}>
                          <span className="text-sm">{hl.type === 'goal' ? '⚽' : '🧤'}</span>
                          <span className="text-[10px] font-mono leading-none">{hl.minute}'</span>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-white text-sm">
                              {hl.primaryPlayerName}
                            </span>
                            <span className="text-amber-400 text-xs font-mono">
                              #{hl.primaryPlayerNumber}
                            </span>
                            <span className="text-xs text-white/50">
                              ({hl.homeTeam.shortName} vs {hl.awayTeam.shortName})
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {hl.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {hl.shotSpeedKmh && (
                          <span className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-mono text-xs">
                            <Zap className="w-3 h-3" />
                            <span>{hl.shotSpeedKmh} KM/H</span>
                          </span>
                        )}

                        <button
                          id={`remove-vault-${hl.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeHighlightFromVault(hl.id);
                            refreshVault();
                            showToast('Highlight removed');
                          }}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
                          title="Remove from vault"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          id={`vault-replay-btn-${hl.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReplayHighlight(hl);
                          }}
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-[0_0_12px_rgba(245,158,11,0.3)] transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Replay</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <Bookmark className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
                  <p className="text-slate-300 text-sm font-semibold">Your Highlights Vault is empty</p>
                  <p className="text-slate-500 text-xs mt-1">Bookmark memorable goals and critical saves from the "Match Highlights" tab to save them here permanently.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            id="match-end-exit-btn"
            onClick={onExit}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="match-end-rematch-btn"
              onClick={onRematch}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Rematch
            </button>

            {isTournament && isUserWinner && onNextRound && (
              <button
                id="match-end-next-round-btn"
                onClick={onNextRound}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition font-['Chakra_Petch']"
              >
                Next Round
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {isCareer && onCareerHub && (
              <button
                id="match-end-career-hub-btn"
                onClick={onCareerHub}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition font-['Chakra_Petch']"
              >
                Career Hub & Standings
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replay Theater Modal if a highlight is selected */}
      {activeReplayHighlight && (
        <HighlightReplayModal
          highlight={activeReplayHighlight}
          allHighlights={activeTab === 'vault' ? vaultHighlights : keyMatchEvents}
          onSelectHighlight={(hl) => setActiveReplayHighlight(hl)}
          onClose={() => setActiveReplayHighlight(null)}
          engine={engine}
          onSaveStateChange={refreshVault}
        />
      )}
    </div>
  );
};

function StatRow({ label, homeVal, awayVal, homeHigher }: { label: string; homeVal: string | number; awayVal: string | number; homeHigher: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
      <span className={`w-16 text-left font-bold ${homeHigher ? 'text-emerald-400' : 'text-white/80'}`}>
        {homeVal}
      </span>
      <span className="text-white/50 text-xs uppercase tracking-wider">{label}</span>
      <span className={`w-16 text-right font-bold ${!homeHigher ? 'text-emerald-400' : 'text-white/80'}`}>
        {awayVal}
      </span>
    </div>
  );
}
