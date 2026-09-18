import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, Player } from '../types/soccer';
import { FORMATION_SLOTS } from '../game/formations';
import { PlayerFaceCard, PlayerFaceAvatar } from './PlayerFaceCard';
import { PlayerEditorModal } from './PlayerEditorModal';
import { 
  ChevronLeft, 
  ArrowRightLeft, 
  Sparkles, 
  Sliders, 
  Shield, 
  ChevronRight, 
  User, 
  Mail, 
  Bell, 
  Settings,
  Check,
  UserPlus,
  Edit3,
  Zap,
  TrendingUp,
  Activity,
  Maximize2
} from 'lucide-react';
import { PlayerDevelopmentModal } from './PlayerDevelopmentModal';
import { PlayerProgressionChart, TrainingIntensityLevel } from './PlayerProgressionChart';

interface SquadManagementProps {
  team: Team;
  onUpdateTeam: (updated: Team) => void;
  onBack: () => void;
  onOpenInbox?: () => void;
  onOpenSocial?: () => void;
  onOpenSettings?: () => void;
  currentMatchday?: number;
}

export const SquadManagement: React.FC<SquadManagementProps> = ({
  team,
  onUpdateTeam,
  onBack,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
  currentMatchday = 12,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(team.players[0]);
  const [swapSourceIndex, setSwapSourceIndex] = useState<number | null>(null);
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showTacticsModal, setShowTacticsModal] = useState(false);
  const [showPlaystylesModal, setShowPlaystylesModal] = useState(false);
  const [showPlayerEditor, setShowPlayerEditor] = useState(false);
  const [showDevelopmentModal, setShowDevelopmentModal] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [viewMode, setViewMode] = useState<'pitch' | 'progression'>('pitch');
  const [inspectorTab, setInspectorTab] = useState<'stats' | 'progression'>('stats');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handlePlayerDevelopmentUpdated = (updatedPlayer: Player) => {
    const updatedPlayers = team.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    onUpdateTeam({
      ...team,
      players: updatedPlayers,
    });
    setSelectedPlayer(updatedPlayer);
  };

  const handleApplyIntensity = (intensity: TrainingIntensityLevel) => {
    const updatedPlayer: Player = {
      ...selectedPlayer,
      development: {
        xp: selectedPlayer.development?.xp || 0,
        level: selectedPlayer.development?.level || 1,
        drillsCompleted: selectedPlayer.development?.drillsCompleted || 0,
        form: selectedPlayer.development?.form || 'Good',
      },
    };
    handlePlayerDevelopmentUpdated(updatedPlayer);
    setToastMessage(`Training intensity set to ${intensity.toUpperCase()} for ${selectedPlayer.shortName || selectedPlayer.name}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleEditPlayer = () => {
    setIsCreateMode(false);
    setShowPlayerEditor(true);
  };

  const handleCreatePlayer = () => {
    setIsCreateMode(true);
    setShowPlayerEditor(true);
  };

  const handleSavePlayer = (updatedOrNewPlayer: Player) => {
    if (isCreateMode) {
      // Add newly created custom player to squad
      const newPlayers = [...team.players, updatedOrNewPlayer];
      onUpdateTeam({
        ...team,
        players: newPlayers,
      });
      setSelectedPlayer(updatedOrNewPlayer);
    } else {
      // Update existing player's stats, likeness, attributes
      const newPlayers = team.players.map((p) =>
        p.id === updatedOrNewPlayer.id ? updatedOrNewPlayer : p
      );
      onUpdateTeam({
        ...team,
        players: newPlayers,
      });
      setSelectedPlayer(updatedOrNewPlayer);
    }
  };

  const formationsList = Object.keys(FORMATION_SLOTS);
  const tacticsList: Team['tactic'][] = [
    'Balanced',
    'High Press',
    'Counter Attack',
    'Tiki-Taka',
    'Park The Bus',
  ];

  const handleFormationChange = (f: string) => {
    onUpdateTeam({ ...team, formation: f });
    setShowFormationModal(false);
  };

  const handleTacticChange = (t: Team['tactic']) => {
    onUpdateTeam({ ...team, tactic: t });
    setShowTacticsModal(false);
  };

  const handlePlayerClick = (index: number) => {
    const p = team.players[index];
    setSelectedPlayer(p);

    if (swapSourceIndex === null) {
      setSwapSourceIndex(index);
    } else if (swapSourceIndex === index) {
      setSwapSourceIndex(null);
    } else {
      // Swap players
      const newPlayers = [...team.players];
      const temp = newPlayers[swapSourceIndex];
      newPlayers[swapSourceIndex] = newPlayers[index];
      newPlayers[index] = temp;
      onUpdateTeam({ ...team, players: newPlayers });
      setSwapSourceIndex(null);
    }
  };

  const formationSlots = FORMATION_SLOTS[team.formation] || FORMATION_SLOTS['4-3-3'];
  const starters = team.players.slice(0, 11);
  const substitutes = team.players.slice(11);

  return (
    <div className="h-full flex flex-col bg-[#070e17] text-white overflow-hidden select-none relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* =========================================================================
          TOP HEADER: Back, Title, Formation Badge, View Switcher & Action Icons
      ========================================================================= */}
      <div className="h-16 px-4 md:px-8 bg-slate-950/90 backdrop-blur-md border-b border-cyan-900/40 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 text-cyan-300 flex items-center justify-center transition shadow cursor-pointer"
            title="Return to Main Menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black font-['Chakra_Petch'] tracking-wide text-white">
                SQUAD MANAGEMENT
              </h1>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {team.formation}
              </span>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                OVR {team.overallRating}
              </span>
            </div>
            <p className="text-[11px] text-white/50">{team.name} • Matchday {currentMatchday}</p>
          </div>
        </div>

        {/* Central View Switcher: Pitch & Lineup vs Progression Analytics */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-cyan-500/30 shadow">
          <button
            onClick={() => setViewMode('pitch')}
            className={`px-3.5 py-1.5 rounded-xl font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'pitch'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>PITCH & LINEUP</span>
          </button>
          <button
            onClick={() => setViewMode('progression')}
            className={`px-3.5 py-1.5 rounded-xl font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'progression'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>PROGRESSION (RECHARTS)</span>
          </button>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowDevelopmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow-[0_0_12px_rgba(6,182,212,0.35)] cursor-pointer"
            title="Train Drills & Boost Attributes"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">TRAIN SQUAD</span>
          </button>
          <button
            onClick={handleCreatePlayer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 hover:bg-slate-800 text-emerald-300 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            title="Create Custom Player"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden lg:inline">CREATE</span>
          </button>
          <button
            onClick={onOpenInbox}
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 flex items-center justify-center text-cyan-300 transition"
            title="Dynamic Inbox"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSocial}
            className="relative w-9 h-9 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 flex items-center justify-center text-white/80 transition"
            title="Social Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 flex items-center justify-center text-white/70 hover:text-white transition"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around bg-slate-950 border-b border-cyan-900/30 px-3 py-1.5">
        <button
          onClick={() => setViewMode('pitch')}
          className={`flex-1 py-1 px-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs uppercase text-center transition ${
            viewMode === 'pitch' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-white/60'
          }`}
        >
          Pitch & Lineup
        </button>
        <button
          onClick={() => setViewMode('progression')}
          className={`flex-1 py-1 px-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs uppercase text-center transition flex items-center justify-center gap-1 ${
            viewMode === 'progression' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-400'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Progression (Recharts)
        </button>
      </div>

      {/* Dynamic Toast Feedback Banner */}
      {toastMessage && (
        <div className="bg-emerald-950/90 border-b border-emerald-400/50 px-6 py-2 text-emerald-200 text-xs flex items-center justify-between z-30 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Swap Alert Banner */}
      {swapSourceIndex !== null && (
        <div className="bg-gradient-to-r from-cyan-950/80 via-teal-950/80 to-slate-950 border-b border-cyan-400/40 px-6 py-2 text-cyan-300 text-xs flex items-center justify-between z-20 animate-pulse">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <span>
              Swapping <strong>{team.players[swapSourceIndex].name}</strong> ({team.players[swapSourceIndex].position}) — Click any player on pitch or bench to swap!
            </span>
          </div>
          <button
            onClick={() => setSwapSourceIndex(null)}
            className="text-white/60 hover:text-white underline font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* =========================================================================
          MAIN BODY: Pitch Lineup + Bench (Left) & Star Player Inspector (Right)
          OR Full Progression & Training Analytics Studio (Recharts)
      ========================================================================= */}
      {viewMode === 'pitch' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 md:p-6 overflow-hidden">
          {/* Left 8 Cols: 3D Tactical Pitch & Substitute Bar */}
          <div className="lg:col-span-8 flex flex-col justify-between overflow-hidden bg-slate-950/70 border border-cyan-900/40 rounded-3xl p-4 shadow-2xl relative">
          {/* Tactical Pitch Surface */}
          <div className="flex-1 w-full bg-gradient-to-b from-[#061824] via-[#05141f] to-[#04101a] border border-cyan-500/30 rounded-2xl relative overflow-hidden shadow-inner flex items-center justify-center min-h-[360px]">
            {/* Perspective Turf Grid & Glowing Lines */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px]" />
            
            {/* Pitch Markings */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-t border-cyan-400/30" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-cyan-400/30 rounded-full" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400/60 rounded-full" />
            <div className="absolute inset-x-16 top-0 h-28 border-b border-x border-cyan-400/30 rounded-b-2xl" />
            <div className="absolute inset-x-16 bottom-0 h-28 border-t border-x border-cyan-400/30 rounded-t-2xl" />

            {/* 11 Starter Slots (arranged by formation) */}
            {starters.map((player, idx) => {
              const slot = formationSlots[idx] || formationSlots[0];
              const isSelected = selectedPlayer.id === player.id;
              const isSwapping = swapSourceIndex === idx;

              const leftPercent = slot.y * 100;
              const topPercent = (1 - slot.x) * 92 + 4;

              return (
                <div
                  key={player.id}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  onClick={() => handlePlayerClick(idx)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-200 group ${
                    isSwapping
                      ? 'scale-115 z-30 animate-bounce'
                      : isSelected
                      ? 'scale-110 z-20'
                      : 'hover:scale-105 z-10'
                  }`}
                >
                  {/* Card Token (EA FC style mini player token) */}
                  <div
                    className={`w-12 h-14 md:w-14 md:h-16 rounded-xl border flex flex-col items-center justify-between p-1 transition shadow-lg backdrop-blur-md ${
                      isSwapping
                        ? 'bg-amber-500 border-white ring-4 ring-amber-400/60 text-slate-950'
                        : isSelected
                        ? 'bg-gradient-to-b from-cyan-950 via-slate-900 to-teal-950 border-cyan-300 ring-4 ring-cyan-400/50 text-white'
                        : 'bg-slate-950/85 border-cyan-500/30 text-white hover:border-cyan-400'
                    }`}
                  >
                    {/* Top Row: OVR & POS */}
                    <div className="w-full flex items-center justify-between px-1">
                      <span className={`font-['Chakra_Petch'] font-black text-xs ${isSwapping ? 'text-slate-950' : 'text-cyan-300'}`}>
                        {player.rating}
                      </span>
                      <span className="text-[9px] font-mono font-bold uppercase opacity-80">
                        {player.position}
                      </span>
                    </div>

                    {/* Likeness Portrait Avatar */}
                    <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center overflow-hidden shadow-inner bg-slate-900">
                      <PlayerFaceAvatar
                        skinTone={player.likeness?.skinTone || '#d49b6a'}
                        hairStyle={player.likeness?.hairStyle || 'short'}
                        hairColor={player.likeness?.hairColor || '#111827'}
                        facialHair={player.likeness?.facialHair || 'none'}
                        jerseyColor={team.kit.primary}
                        size={28}
                      />
                    </div>

                    {/* Surname Banner */}
                    <div className="w-full text-center">
                      <span className="text-[9px] md:text-[10px] font-bold truncate block tracking-tighter">
                        {player.shortName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =========================================================================
              BOTTOM ROW: SUBSTITUTE BENCH (matches image.png bottom shelf)
          ========================================================================= */}
          <div className="mt-3 pt-3 border-t border-cyan-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-['Chakra_Petch'] font-black text-cyan-400 uppercase tracking-wider">
                SUBSTITUTE BENCH ({substitutes.length})
              </span>
              <span className="text-[10px] text-white/40">Click any sub to swap with starter</span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {substitutes.map((player, subIdx) => {
                const actualIndex = 11 + subIdx;
                const isSelected = selectedPlayer.id === player.id;
                const isSwapping = swapSourceIndex === actualIndex;

                return (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerClick(actualIndex)}
                    className={`shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition ${
                      isSwapping
                        ? 'bg-amber-500 border-white text-slate-950 ring-2 ring-amber-400'
                        : isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900/70 border-white/10 text-white/80 hover:border-cyan-500/40 hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center overflow-hidden shadow bg-slate-950 shrink-0">
                      <PlayerFaceAvatar
                        skinTone={player.likeness?.skinTone || '#d49b6a'}
                        hairStyle={player.likeness?.hairStyle || 'short'}
                        hairColor={player.likeness?.hairColor || '#111827'}
                        facialHair={player.likeness?.facialHair || 'none'}
                        jerseyColor={team.kit.primary}
                        size={32}
                      />
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-['Outfit']">{player.shortName}</span>
                        <span className="font-['Chakra_Petch'] font-black text-cyan-300 text-xs">{player.rating}</span>
                      </div>
                      <span className="text-[9px] text-white/40 block font-mono">
                        PAC {player.stats.pace} • DRI {player.stats.dribbling}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT 4 COLS: STAR PLAYER INSPECTOR (matches image.png bottom-left)
        ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          {/* Radiant Cyan Energy Rays (similar to image.png) */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/20 via-teal-500/10 to-transparent blur-2xl pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 border border-cyan-400/20 rounded-full pointer-events-none" />
          <div className="absolute -top-6 -right-6 w-36 h-36 border border-teal-400/20 rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* Player Header Banner */}
            <div className="flex items-start justify-between border-b border-cyan-900/40 pb-3">
              <div>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  {selectedPlayer.position}
                </span>
                <h2 className="text-2xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider mt-1">
                  {selectedPlayer.name}
                </h2>
                <span className="text-xs text-white/50">{team.name} • #{selectedPlayer.number}</span>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black font-['Chakra_Petch'] text-cyan-300 leading-none block">
                  {selectedPlayer.rating}
                </span>
                <span className="text-[9px] font-mono text-cyan-400/70 uppercase">OVR RATING</span>
              </div>
            </div>

            {/* Real-time Dynamic Face Card & Edit Trigger */}
            <div className="my-3 flex flex-col items-center justify-center">
              <PlayerFaceCard
                player={selectedPlayer}
                team={team}
                size="md"
                onClick={handleEditPlayer}
                className="cursor-pointer"
              />
              <button
                onClick={handleEditPlayer}
                className="mt-2.5 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                EDIT ATTRIBUTES & FACE CARD
              </button>
            </div>

            {/* Inspector Tab Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-cyan-500/30 my-2.5">
              <button
                onClick={() => setInspectorTab('stats')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                  inspectorTab === 'stats'
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Attributes
              </button>
              <button
                onClick={() => setInspectorTab('progression')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  inspectorTab === 'progression'
                    ? 'bg-emerald-500 text-slate-950 shadow font-black'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Progression (Recharts)
              </button>
            </div>

            <AnimatePresence mode="wait">
              {inspectorTab === 'stats' ? (
                <motion.div
                  key={`inspector-stats-${selectedPlayer.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Core Stats Progress Bars (matches image.png) */}
                  <div className="space-y-1.5 py-1">
                    <StatBar label="AVR" value={selectedPlayer.rating} color="cyan" delay={0.0} />
                    <StatBar label="Pace" value={selectedPlayer.stats.pace} color="teal" delay={0.03} />
                    <StatBar label="Shooting" value={selectedPlayer.stats.shooting} color="amber" delay={0.06} />
                    <StatBar label="Passing" value={selectedPlayer.stats.passing} color="cyan" delay={0.09} />
                    <StatBar label="Dribbling" value={selectedPlayer.stats.dribbling} color="teal" delay={0.12} />
                    <StatBar label="Defending" value={selectedPlayer.stats.defending} color="emerald" delay={0.15} />
                    <StatBar label="Physical" value={selectedPlayer.stats.physicality} color="amber" delay={0.18} />
                  </div>

                  {/* Shortcut button to Full Progression Studio */}
                  <button
                    onClick={() => setViewMode('progression')}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 border border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-300 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider flex items-center justify-between transition shadow group cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      CAREER PROGRESSION (RECHARTS)
                    </span>
                    <ChevronRight className="w-4 h-4 text-emerald-400/60 group-hover:text-emerald-300 transition" />
                  </button>
                </motion.div>
              ) : (
                /* Compact Recharts Progression View in Inspector */
                <motion.div
                  key={`inspector-progression-${selectedPlayer.id}`}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="space-y-2 py-1"
                >
                  <PlayerProgressionChart
                    player={selectedPlayer}
                    team={team}
                    currentMatchday={currentMatchday}
                    onApplyIntensity={handleApplyIntensity}
                    onOpenDrills={() => setShowDevelopmentModal(true)}
                    isCompact={true}
                  />

                  <button
                    onClick={() => setViewMode('progression')}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    EXPAND FULL PROGRESSION STUDIO
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* =========================================================================
              ACTION BUTTONS: PlayStyles, Change Formation, Tactics (matches image)
          ========================================================================= */}
          <div className="pt-3 border-t border-cyan-900/40 space-y-2 relative z-10">
            <button
              onClick={() => setShowPlaystylesModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-white text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider flex items-center justify-between transition shadow group"
            >
              <span className="flex items-center gap-2 text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                CURRENT PLAYSTYLES
              </span>
              <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition" />
            </button>

            <button
              onClick={() => setShowFormationModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-white text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider flex items-center justify-between transition shadow group"
            >
              <span className="flex items-center gap-2 text-teal-300">
                <Shield className="w-4 h-4 text-teal-400" />
                CHANGE FORMATION ({team.formation})
              </span>
              <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition" />
            </button>

            <button
              onClick={() => setShowTacticsModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-white text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider flex items-center justify-between transition shadow group"
            >
              <span className="flex items-center gap-2 text-white">
                <Sliders className="w-4 h-4 text-cyan-400" />
                TACTICS ({team.tactic})
              </span>
              <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition" />
            </button>
          </div>
        </div>
      </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden gap-4">
          {/* Squad Roster Horizontal Selection Strip */}
          <div className="bg-slate-950/85 border border-cyan-900/40 rounded-2xl p-3 flex flex-col gap-2 shrink-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  SQUAD ROSTER
                </span>
                <span className="text-xs text-white/70 font-['Chakra_Petch'] font-bold">
                  Select player to analyze attribute curves & training load:
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('pitch')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Back to Pitch View
                </button>
                <span className="text-xs text-white/40 hidden sm:inline">
                  {team.players.length} Players Available
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
              {team.players.map((p, idx) => {
                const isSelected = p.id === selectedPlayer.id;
                const isStarter = idx < 11;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayer(p)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border shrink-0 transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-950 to-teal-950 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-900/90 border-white/10 text-white/70 hover:bg-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="relative">
                      <PlayerFaceAvatar player={p} team={team} size="sm" />
                      {isStarter && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-500 border border-slate-950 text-[8px] flex items-center justify-center font-black text-slate-950">
                          S
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-['Chakra_Petch'] font-bold text-white whitespace-nowrap">
                          {p.shortName || p.name}
                        </span>
                        <span className={`text-[9px] font-mono px-1 rounded font-bold ${
                          p.position === 'ST' || p.position === 'RW' || p.position === 'LW' || p.position === 'CF' ? 'bg-red-500/20 text-red-300' :
                          p.position === 'CAM' || p.position === 'CM' || p.position === 'CDM' ? 'bg-amber-500/20 text-amber-300' :
                          p.position === 'GK' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {p.position}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-white/50">
                        <span className="text-cyan-400 font-bold">OVR {p.rating}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">POT {p.potential || Math.min(99, p.rating + 8)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full-size PlayerProgressionChart using Recharts with subtle motion entry */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`studio-chart-${selectedPlayer.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <PlayerProgressionChart
                  player={selectedPlayer}
                  team={team}
                  currentMatchday={currentMatchday}
                  onApplyIntensity={handleApplyIntensity}
                  onOpenDrills={() => setShowDevelopmentModal(true)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHANGE FORMATION MODAL
      ========================================================================= */}
      {showFormationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-['Chakra_Petch'] font-black text-lg text-white mb-1 uppercase tracking-wider">
              SELECT SQUAD FORMATION
            </h3>
            <p className="text-xs text-white/50 mb-4">Choose tactical shape to adapt your on-pitch positioning.</p>

            <div className="grid grid-cols-2 gap-2">
              {formationsList.map((f) => (
                <button
                  key={f}
                  onClick={() => handleFormationChange(f)}
                  className={`p-3 rounded-2xl border text-left font-['Chakra_Petch'] font-bold text-sm transition flex items-center justify-between ${
                    team.formation === f
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-900 border-white/10 text-white/70 hover:bg-slate-800'
                  }`}
                >
                  <span>{f}</span>
                  {team.formation === f && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFormationModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 text-white/70 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHANGE TACTICS MODAL
      ========================================================================= */}
      {showTacticsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-['Chakra_Petch'] font-black text-lg text-white mb-1 uppercase tracking-wider">
              TACTICAL PHILOSOPHY
            </h3>
            <p className="text-xs text-white/50 mb-4">Set tactical instructions for offensive and defensive behavior.</p>

            <div className="space-y-2">
              {tacticsList.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTacticChange(t)}
                  className={`w-full p-3 rounded-2xl border text-left font-['Chakra_Petch'] font-bold text-sm transition flex items-center justify-between ${
                    team.tactic === t
                      ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.25)]'
                      : 'bg-slate-900 border-white/10 text-white/70 hover:bg-slate-800'
                  }`}
                >
                  <span>{t}</span>
                  {team.tactic === t && <Check className="w-4 h-4 text-teal-400" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTacticsModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 text-white/70 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PLAYSTYLES MODAL
      ========================================================================= */}
      {showPlaystylesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-['Chakra_Petch'] font-black text-lg text-white mb-1 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              {selectedPlayer.name} PLAYSTYLES
            </h3>
            <p className="text-xs text-white/50 mb-4">Signature physical and technical abilities active in-game.</p>

            <div className="space-y-2.5">
              {(selectedPlayer.playStyles && selectedPlayer.playStyles.length > 0
                ? selectedPlayer.playStyles
                : ['Rapid Pace+', 'Finesse Shot', 'Relentless Stamina']
              ).map((ps) => (
                <div
                  key={ps}
                  className="bg-slate-900/90 border border-cyan-500/30 p-3 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-['Chakra_Petch'] font-bold text-sm text-white">{ps}</h4>
                    <p className="text-[11px] text-white/50">Boosts in-game execution, ball retention, and responsiveness.</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowPlaystylesModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PLAYER ATTRIBUTE & FACE CARD CUSTOMIZER MODAL
      ========================================================================= */}
      <PlayerEditorModal
        isOpen={showPlayerEditor}
        onClose={() => setShowPlayerEditor(false)}
        onSavePlayer={handleSavePlayer}
        initialPlayer={isCreateMode ? null : selectedPlayer}
        team={team}
        isCreateMode={isCreateMode}
      />

      {/* =========================================================================
          PLAYER DEVELOPMENT & TRAINING DRILL MODAL
      ========================================================================= */}
      <PlayerDevelopmentModal
        isOpen={showDevelopmentModal}
        player={selectedPlayer}
        team={team}
        matchday={currentMatchday}
        onClose={() => setShowDevelopmentModal(false)}
        onPlayerUpdated={(updatedP) => handlePlayerDevelopmentUpdated(updatedP)}
      />
    </div>
  );
};

function StatBar({ 
  label, 
  value, 
  color, 
  delay = 0 
}: { 
  label: string; 
  value: number; 
  color: 'cyan' | 'teal' | 'amber' | 'emerald';
  delay?: number;
}) {
  const colorClasses = {
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    teal: 'bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    emerald: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
      className="flex items-center gap-3 text-xs"
    >
      <span className="w-16 text-white/60 font-medium font-mono">{label}</span>
      <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5 relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.5, delay: delay + 0.04, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full ${colorClasses[color]} rounded-full`}
        />
      </div>
      <span className="w-8 text-right font-['Chakra_Petch'] font-black text-white font-mono">
        {value}
      </span>
    </motion.div>
  );
}
