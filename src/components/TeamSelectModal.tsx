/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Team } from '../types/soccer';
import { TEAMS } from '../data/teams';
import { ChevronLeft, Play, ShieldCheck, Sun, Moon, CloudRain, Flame, Globe } from 'lucide-react';
import { FCHeaderBar } from './FCHeaderBar';
import { ClubEmblem } from './ClubEmblem';
import { LeagueEmblem } from './LeagueEmblem';
import { LEAGUES } from '../data/emblems';

interface TeamSelectModalProps {
  onStartMatch: (config: {
    homeTeam: Team;
    awayTeam: Team;
    difficulty: 'Beginner' | 'Semi-Pro' | 'Professional' | 'World Class' | 'Legendary';
    halfLengthMinutes: number;
    weather: 'Night' | 'Sunset' | 'Clear' | 'Rain';
  }) => void;
  onBack: () => void;
  onOpenInbox?: () => void;
  onOpenSocial?: () => void;
  onOpenSettings?: () => void;
}

export const TeamSelectModal: React.FC<TeamSelectModalProps> = ({ 
  onStartMatch, 
  onBack,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
}) => {
  const [selectedHomeId, setSelectedHomeId] = useState(TEAMS[0].id);
  const [selectedAwayId, setSelectedAwayId] = useState(TEAMS[1].id);
  const [leagueFilter, setLeagueFilter] = useState<'ALL' | 'PL' | 'PD' | 'BL1' | 'INT'>('ALL');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Semi-Pro' | 'Professional' | 'World Class' | 'Legendary'>('Professional');
  const [halfLengthMinutes, setHalfLengthMinutes] = useState(4);
  const [weather, setWeather] = useState<'Night' | 'Sunset' | 'Clear' | 'Rain'>('Night');

  const homeTeam = TEAMS.find(t => t.id === selectedHomeId) || TEAMS[0];
  const awayTeam = TEAMS.find(t => t.id === selectedAwayId) || TEAMS[1];

  const filteredTeams = TEAMS.filter(t => {
    if (leagueFilter === 'ALL') return true;
    return t.leagueId === leagueFilter;
  });

  const handleLaunch = () => {
    onStartMatch({
      homeTeam,
      awayTeam,
      difficulty,
      halfLengthMinutes,
      weather,
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#070e17] text-white overflow-hidden select-none relative font-['Outfit']">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* FC Header Bar */}
      <FCHeaderBar
        team={homeTeam}
        onOpenInbox={onOpenInbox}
        onOpenSocial={onOpenSocial}
        onOpenSettings={onOpenSettings}
        showTabs={false}
      />

      {/* Mode Sub-Header */}
      <div className="h-16 px-4 md:px-8 bg-slate-950/80 border-b border-cyan-900/30 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 flex items-center justify-center transition shadow"
            title="Main Menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-['Chakra_Petch'] tracking-wide text-white">
              KICK-OFF EXHIBITION
            </h1>
            <p className="text-[11px] text-white/50">Official Club Badges & Licensed League Competition</p>
          </div>
        </div>

        <button
          id="launch-match-btn"
          onClick={handleLaunch}
          className="px-8 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition scale-105 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          KICK OFF MATCH
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* League Category Filter Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setLeagueFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
              leagueFilter === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            ALL LEAGUES
          </button>
          {Object.entries(LEAGUES)
            .filter(([id]) => ['PL', 'PD', 'BL1', 'INT'].includes(id))
            .map(([id, l]) => (
              <button
                key={id}
                onClick={() => setLeagueFilter(id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider transition ${
                  leagueFilter === id
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/80 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                <LeagueEmblem leagueId={id} size="xs" />
                <span>{l.name}</span>
              </button>
            ))}
        </div>

        {/* Team Selection Dual Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Team (Home) */}
          <div className="bg-slate-950/80 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-['Chakra_Petch'] font-black text-cyan-300 uppercase tracking-widest bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/40">
                  HOME CLUB (YOU)
                </span>
                <ClubEmblem teamId={homeTeam.id} shortName={homeTeam.shortName} size="xl" glow />
              </div>

              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-black text-white font-['Chakra_Petch'] uppercase tracking-wider">
                    {homeTeam.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {homeTeam.leagueId && (
                    <LeagueEmblem leagueId={homeTeam.leagueId} size="xs" showName />
                  )}
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-white/50">{homeTeam.stadium}</span>
                </div>
              </div>

              {/* Ratings Bar */}
              <div className="grid grid-cols-4 gap-2 mt-4 text-center font-mono">
                <div className="p-2 bg-slate-900 rounded-xl border border-cyan-500/20">
                  <span className="text-[10px] text-white/50 block">ATT</span>
                  <span className="font-black text-cyan-300 text-lg font-['Chakra_Petch']">{homeTeam.attackRating}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-cyan-500/20">
                  <span className="text-[10px] text-white/50 block">MID</span>
                  <span className="font-black text-teal-300 text-lg font-['Chakra_Petch']">{homeTeam.midfieldRating}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-cyan-500/20">
                  <span className="text-[10px] text-white/50 block">DEF</span>
                  <span className="font-black text-amber-300 text-lg font-['Chakra_Petch']">{homeTeam.defenseRating}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-cyan-500/20">
                  <span className="text-[10px] text-white/50 block">OVR</span>
                  <span className="font-black text-white text-lg font-['Chakra_Petch']">{homeTeam.overallRating}</span>
                </div>
              </div>
            </div>

            {/* Club Grid Picker */}
            <div className="mt-6">
              <label className="text-xs font-['Chakra_Petch'] font-bold text-cyan-400 uppercase tracking-wider block mb-2">
                Choose Home Club:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {filteredTeams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedHomeId(team.id)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      selectedHomeId === team.id
                        ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                        : 'bg-slate-900/80 border-white/5 text-white/70 hover:bg-slate-800'
                    }`}
                  >
                    <ClubEmblem teamId={team.id} shortName={team.shortName} size="md" />
                    <span className="text-[10px] font-bold truncate w-full font-['Chakra_Petch']">{team.shortName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CPU Team (Away) */}
          <div className="bg-slate-950/80 border border-teal-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-['Chakra_Petch'] font-black text-rose-300 uppercase tracking-widest bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/40">
                  AWAY OPPONENT (CPU)
                </span>
                <ClubEmblem teamId={awayTeam.id} shortName={awayTeam.shortName} size="xl" glow />
              </div>

              <div className="mt-2">
                <h2 className="text-3xl font-black text-white font-['Chakra_Petch'] uppercase tracking-wider">
                  {awayTeam.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {awayTeam.leagueId && (
                    <LeagueEmblem leagueId={awayTeam.leagueId} size="xs" showName />
                  )}
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-white/50">{awayTeam.stadium}</span>
                </div>
              </div>

              {/* Ratings Bar */}
              <div className="grid grid-cols-4 gap-2 mt-4 text-center font-mono">
                <div className="p-2 bg-slate-900 rounded-xl border border-teal-500/20">
                  <span className="text-[10px] text-white/50 block">ATT</span>
                  <span className="font-black text-cyan-300 text-lg font-['Chakra_Petch']">{awayTeam.attackRating}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-teal-500/20">
                  <span className="text-[10px] text-white/50 block">MID</span>
                  <span className="font-black text-teal-300 text-lg font-['Chakra_Petch']">{awayTeam.midfieldRating}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-teal-500/20">
                  <span className="text-[10px] text-white/50 block">DEF</span>
                  <span className="font-black text-amber-300 text-lg font-['Chakra_Petch']">{awayTeam.defenseRating}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-teal-500/20">
                  <span className="text-[10px] text-white/50 block">OVR</span>
                  <span className="font-black text-white text-lg font-['Chakra_Petch']">{awayTeam.overallRating}</span>
                </div>
              </div>
            </div>

            {/* Club Grid Picker */}
            <div className="mt-6">
              <label className="text-xs font-['Chakra_Petch'] font-bold text-rose-400 uppercase tracking-wider block mb-2">
                Choose Away Club:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {filteredTeams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedAwayId(team.id)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      selectedAwayId === team.id
                        ? 'bg-rose-500/25 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] ring-1 ring-rose-400'
                        : 'bg-slate-900/80 border-white/5 text-white/70 hover:bg-slate-800'
                    }`}
                  >
                    <ClubEmblem teamId={team.id} shortName={team.shortName} size="md" />
                    <span className="text-[10px] font-bold truncate w-full font-['Chakra_Petch']">{team.shortName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Match Parameters: Difficulty, Length, Weather */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
          {/* Difficulty */}
          <div>
            <label className="text-xs font-['Chakra_Petch'] font-bold text-white/70 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-cyan-400" />
              Game Difficulty
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Semi-Pro', 'Professional', 'World Class'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] uppercase transition cursor-pointer ${
                    difficulty === diff
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-900 text-white/60 border border-white/5 hover:bg-slate-800'
                  }`}
                >
                  {diff.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Half Length */}
          <div>
            <label className="text-xs font-['Chakra_Petch'] font-bold text-white/70 uppercase tracking-wider flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Half Duration
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[3, 4, 5].map(min => (
                <button
                  key={min}
                  onClick={() => setHalfLengthMinutes(min)}
                  className={`py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] uppercase transition cursor-pointer ${
                    halfLengthMinutes === min
                      ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-900 text-white/60 border border-white/5 hover:bg-slate-800'
                  }`}
                >
                  {min} Mins
                </button>
              ))}
            </div>
          </div>

          {/* Atmosphere & Weather */}
          <div>
            <label className="text-xs font-['Chakra_Petch'] font-bold text-white/70 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Moon className="w-4 h-4 text-cyan-400" />
              Stadium Time & Weather
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Night', 'Sunset', 'Clear'] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  className={`py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] uppercase transition flex items-center justify-center gap-1 cursor-pointer ${
                    weather === w
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-900 text-white/60 border border-white/5 hover:bg-slate-800'
                  }`}
                >
                  {w === 'Night' && <Moon className="w-3.5 h-3.5" />}
                  {w === 'Sunset' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  {w === 'Clear' && <Sun className="w-3.5 h-3.5 text-yellow-300" />}
                  <span>{w}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
