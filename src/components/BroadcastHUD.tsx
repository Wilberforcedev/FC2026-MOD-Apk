import React from 'react';
import { MatchEngine } from '../game/engine';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Zap, Target, AlertCircle } from 'lucide-react';
import { ClubEmblem } from './ClubEmblem';

interface BroadcastHUDProps {
  engine: MatchEngine;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const BroadcastHUD: React.FC<BroadcastHUDProps> = ({
  engine,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  const userPlayer = engine.homePlayers.find(p => p.id === engine.userControlledId);
  const matchMin = Math.floor(engine.matchTimeSec);
  const matchSec = Math.floor((engine.matchTimeSec % 1) * 60);
  const timeFormatted = `${matchMin.toString().padStart(2, '0')}:${matchSec.toString().padStart(2, '0')}`;

  const celebration = engine.activeCelebration;

  // Recent match notifications
  const lastGoal = engine.goalEvents[engine.goalEvents.length - 1];
  const isRecentGoal = lastGoal && engine.matchTimeSec - lastGoal.time < 8;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-6 select-none">
      {/* =========================================================================
          TOP BROADCAST BAR: TV Scorebug, Dynamic Stamina, Event Pill, Controls
      ========================================================================= */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Modern Angled TV Broadcast Scorebug */}
        <div className="flex items-stretch bg-slate-950/90 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.15)] overflow-hidden pointer-events-auto">
          {/* Home Team Bar */}
          <div 
            className="w-2.5 shrink-0" 
            style={{ backgroundColor: engine.homeTeam.kit.primaryColor }}
          />

          {/* Home Team Badge & Name */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60">
            <ClubEmblem teamId={engine.homeTeam.id} shortName={engine.homeTeam.shortName} size="xs" />
            <span className="font-black text-white text-xs md:text-sm tracking-wider font-['Chakra_Petch']">
              {engine.homeTeam.shortName}
            </span>
          </div>

          {/* Center Scores */}
          <div className="flex items-center px-3.5 py-2 bg-black/70 border-x border-cyan-500/20 gap-2 font-['Chakra_Petch'] font-black text-base md:text-lg">
            <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              {engine.stats.homeScore}
            </span>
            <span className="text-cyan-400/40 text-xs">-</span>
            <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              {engine.stats.awayScore}
            </span>
          </div>

          {/* Away Team Badge & Name */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60">
            <span className="font-black text-white text-xs md:text-sm tracking-wider font-['Chakra_Petch']">
              {engine.awayTeam.shortName}
            </span>
            <ClubEmblem teamId={engine.awayTeam.id} shortName={engine.awayTeam.shortName} size="xs" />
          </div>

          {/* Away Team Bar */}
          <div 
            className="w-2.5 shrink-0" 
            style={{ backgroundColor: engine.awayTeam.kit.primaryColor }}
          />

          {/* Match Time & Stoppage */}
          <div className="bg-cyan-950/80 text-cyan-300 border-l border-cyan-500/30 px-3 py-2 font-['Chakra_Petch'] font-black text-xs md:text-sm tracking-widest flex items-center gap-1.5">
            <span>{timeFormatted}</span>
            {engine.matchTimeSec >= 45 && engine.matchTimeSec < 47 && (
              <span className="text-[10px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black">+2</span>
            )}
            {engine.matchTimeSec >= 90 && (
              <span className="text-[10px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black">+{engine.addedTimeMinutes}</span>
            )}
          </div>
        </div>

        {/* Center: Real-Time Dynamic Stamina & Match Event Pill (as seen in image.png) */}
        <div className="hidden md:flex flex-col items-center gap-2 pointer-events-auto">
          {/* Dynamic Stamina Indicator */}
          {userPlayer && (
            <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
              <span className="text-[11px] font-['Chakra_Petch'] font-black text-cyan-300 tracking-wider uppercase">
                DYNAMIC STAMINA
              </span>
              <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden border border-white/10 ml-1">
                <div 
                  className={`h-full transition-all duration-150 ${
                    userPlayer.stamina > 55
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-400 shadow-[0_0_8px_#06b6d4]'
                      : userPlayer.stamina > 25
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${userPlayer.stamina}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-white/70">
                {Math.round(userPlayer.stamina)}%
              </span>
            </div>
          )}

          {/* Dynamic Event Badges (Shot on target / Yellow card / Goal) */}
          <div className="flex items-center gap-2">
            {engine.stats.homeShots > 0 && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-slate-900 border border-amber-400/40 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] font-['Chakra_Petch'] font-black text-amber-300 tracking-wider uppercase">
                  SHOT ON TARGET
                </span>
              </div>
            )}

            {isRecentGoal && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/25 to-slate-900 border border-emerald-400/50 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse">
                <span className="text-xs">⚽</span>
                <span className="text-[10px] font-['Chakra_Petch'] font-black text-emerald-300 tracking-wider uppercase">
                  GOAL! 104 KM/H
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Instant Replay, Audio & Pause Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Instant Replay Button */}
          <button
            id="instant-replay-btn"
            onClick={() => engine.startInstantReplay()}
            className="h-9 px-3 rounded-xl bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 flex items-center gap-1.5 text-cyan-300 hover:text-white hover:bg-slate-900 hover:border-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.15)] text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider"
            title="Instant Replay"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Replay</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={onToggleMute}
            className="w-9 h-9 rounded-xl bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center text-white/80 hover:text-white hover:bg-slate-900 hover:border-cyan-400 transition shadow"
            title={isMuted ? 'Unmute Stadium Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause Match */}
          <button
            id="pause-match-btn"
            onClick={onPause}
            className="w-9 h-9 rounded-xl bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center text-white/80 hover:text-white hover:bg-slate-900 hover:border-cyan-400 transition shadow"
            title="Pause Match"
          >
            {engine.isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          CENTER: GOAL CELEBRATION BANNER (HyperMotion Broadcast)
      ========================================================================= */}
      {celebration && (
        <div className="self-center my-auto flex flex-col items-center animate-bounce z-40">
          <div className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 px-8 py-3 rounded-2xl font-['Chakra_Petch'] font-black text-3xl md:text-5xl uppercase tracking-widest shadow-[0_0_50px_rgba(6,182,212,0.6)] border-2 border-white scale-105">
            GOOOAAAL!
          </div>
          <div className="mt-2 bg-slate-950/95 border border-cyan-400/50 px-6 py-2 rounded-xl text-white font-bold text-lg md:text-xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <span className="text-cyan-300 font-['Chakra_Petch'] font-black">★ {celebration.scorer}</span>
            <span className="text-white/60 text-xs">
              ({celebration.team === 'home' ? engine.homeTeam.name : engine.awayTeam.name})
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          BOTTOM BAR: Active Player Card & Controls Helper
      ========================================================================= */}
      <div className="flex items-end justify-between pointer-events-auto">
        {userPlayer ? (
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)] flex items-center gap-3.5 max-w-xs">
            {/* OVR Rating Badge */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-500 p-0.5 shadow-md flex flex-col items-center justify-center text-slate-950 font-['Chakra_Petch'] font-black">
              <span className="text-base leading-none">{userPlayer.player.rating}</span>
              <span className="text-[9px] font-bold uppercase">{userPlayer.player.position}</span>
            </div>

            {/* Player Info & Stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ClubEmblem teamId={engine.homeTeam.id} shortName={engine.homeTeam.shortName} size="xs" />
                  <span className="text-white font-bold text-xs md:text-sm truncate font-['Outfit']">
                    #{userPlayer.player.number} {userPlayer.player.name}
                  </span>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono font-bold shrink-0 ml-1">
                  {Math.round(userPlayer.stamina)}%
                </span>
              </div>

              {/* Mini Stamina Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden border border-white/5">
                <div 
                  className={`h-full transition-all duration-100 ${
                    userPlayer.stamina > 50 ? 'bg-cyan-400' : userPlayer.stamina > 20 ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${userPlayer.stamina}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-cyan-400/90 mt-1 font-mono font-bold">
                <span>PAC {userPlayer.player.stats.pace}</span>
                <span>SHO {userPlayer.player.stats.shooting}</span>
                <span>PAS {userPlayer.player.stats.passing}</span>
                <span>DRI {userPlayer.player.stats.dribbling}</span>
              </div>
            </div>
          </div>
        ) : <div />}

        {/* Tactical Key Assist Banner */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/85 backdrop-blur-xl border border-cyan-500/20 px-4 py-2 rounded-xl text-xs text-white/70 font-mono shadow-lg">
          <span className="text-cyan-400 font-bold">WASD</span> Move
          <span className="text-amber-400 font-bold">K</span> Pass
          <span className="text-teal-400 font-bold">L</span> Through
          <span className="text-red-400 font-bold">J (Hold)</span> Shoot
          <span className="text-yellow-400 font-bold">U</span> Chip
          <span className="text-purple-400 font-bold">Shift</span> Sprint/Skill
          <span className="text-white font-bold">Q</span> Switch
        </div>
      </div>
    </div>
  );
};
