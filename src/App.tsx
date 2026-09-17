/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TEAMS } from './data/teams';
import { Team, TournamentMatch } from './types/soccer';
import { MatchEngine, UserInputState } from './game/engine';
import { PitchCanvas } from './components/PitchCanvas';
import { BroadcastHUD } from './components/BroadcastHUD';
import { MatchControlsOverlay } from './components/MatchControlsOverlay';
import { MatchEndModal } from './components/MatchEndModal';
import { MatchPauseModal } from './components/MatchPauseModal';
import { TeamSelectModal } from './components/TeamSelectModal';
import { SquadManagement } from './components/SquadManagement';
import { TournamentBracket } from './components/TournamentBracket';
import { PenaltyMode } from './components/PenaltyMode';
import { PracticeArena } from './components/PracticeArena';
import { CareerMode } from './components/CareerMode';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FCHeaderBar } from './components/FCHeaderBar';
import { FCBottomNav, FCNavTab } from './components/FCBottomNav';
import { FCInboxModal } from './components/FCInboxModal';
import { FCSettingsModal } from './components/FCSettingsModal';
import { soundEngine } from './services/soundEngine';
import { commentary } from './services/commentaryEngine';
import { initializeCareer, loadCareer, processMatchdayResults } from './services/careerService';
import { CareerState, SeasonFixture } from './types/soccer';
import {
  Play,
  Trophy,
  Target,
  Users,
  Volume2,
  VolumeX,
  Sparkles,
  Award,
  Zap,
  Gamepad2,
  Briefcase,
  ChevronRight,
  Shield,
  Clock,
  Radio,
  Flame,
} from 'lucide-react';

type ScreenType =
  | 'main-menu'
  | 'team-select'
  | 'match'
  | 'tournament'
  | 'career'
  | 'penalties'
  | 'practice'
  | 'squad';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('main-menu');
  const [navTab, setNavTab] = useState<FCNavTab>('home');

  const [userTeam, setUserTeam] = useState<Team>(TEAMS[0]);
  const [opponentTeam, setOpponentTeam] = useState<Team>(TEAMS[1]);
  const [matchEngine, setMatchEngine] = useState<MatchEngine | null>(null);
  const [weather, setWeather] = useState<'Night' | 'Sunset' | 'Clear' | 'Rain'>('Night');
  const [isMuted, setIsMuted] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showMatchEndModal, setShowMatchEndModal] = useState(false);
  const [activeTournamentMatch, setActiveTournamentMatch] = useState<TournamentMatch | null>(null);
  const [activeCareerFixture, setActiveCareerFixture] = useState<SeasonFixture | null>(null);

  // Global Interactive Modals
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [inboxInitialTab, setInboxInitialTab] = useState<'inbox' | 'news' | 'social'>('news');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Career state (Offline persistent save)
  const [careerState, setCareerState] = useState<CareerState>(() => {
    return loadCareer() || initializeCareer(TEAMS[0].id);
  });

  // Tournament state
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>(() => {
    const saved = localStorage.getItem('fc26_tournament');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed parsing tournament save', e);
      }
    }
    return initializeTournament(TEAMS[0]);
  });

  const [championTeam, setChampionTeam] = useState<Team | undefined>(undefined);

  // Keyboard input state ref
  const inputRef = useRef<UserInputState>({
    moveX: 0,
    moveY: 0,
    pass: false,
    throughBall: false,
    shoot: false,
    chipShot: false,
    sprint: false,
    tackle: false,
    skillMove: false,
    switchPlayer: false,
  });

  // Sound Engine mute sync
  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundEngine.setMuted(newMuted);
    commentary.setMuted(newMuted);
  }, [isMuted]);

  // Handle open modals
  const handleOpenInbox = () => {
    setInboxInitialTab('inbox');
    setShowInboxModal(true);
  };

  const handleOpenSocial = () => {
    setInboxInitialTab('news');
    setShowInboxModal(true);
  };

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  // Switch tabs from bottom nav
  const handleSelectNavTab = (tab: FCNavTab) => {
    setNavTab(tab);
    if (tab === 'home') {
      setCurrentScreen('main-menu');
    } else if (tab === 'play') {
      setCurrentScreen('team-select');
    } else if (tab === 'club') {
      setCurrentScreen('squad');
    } else if (tab === 'store') {
      setCurrentScreen('career');
    }
  };

  // Sync nav tab with screen changes
  useEffect(() => {
    if (currentScreen === 'main-menu') setNavTab('home');
    else if (currentScreen === 'team-select') setNavTab('play');
    else if (currentScreen === 'squad') setNavTab('club');
    else if (currentScreen === 'career') setNavTab('store');
  }, [currentScreen]);

  // Save tournament to localStorage
  useEffect(() => {
    localStorage.setItem('fc26_tournament', JSON.stringify(tournamentMatches));
  }, [tournamentMatches]);

  function initializeTournament(playerTeam: Team): TournamentMatch[] {
    const otherTeams = TEAMS.filter(t => t.id !== playerTeam.id);
    const shuffled = [...otherTeams].sort(() => 0.5 - Math.random());

    const q1: TournamentMatch = {
      id: 'q1',
      round: 'quarter',
      roundName: 'Quarter-Final 1',
      homeTeam: playerTeam,
      awayTeam: shuffled[0],
      homeScore: 0,
      awayScore: 0,
      isCompleted: false,
      isPlayerMatch: true,
    };

    const q2: TournamentMatch = {
      id: 'q2',
      round: 'quarter',
      roundName: 'Quarter-Final 2',
      homeTeam: shuffled[1],
      awayTeam: shuffled[2],
      homeScore: 0,
      awayScore: 0,
      isCompleted: false,
      isPlayerMatch: false,
    };

    const q3: TournamentMatch = {
      id: 'q3',
      round: 'quarter',
      roundName: 'Quarter-Final 3',
      homeTeam: shuffled[3],
      awayTeam: shuffled[4],
      homeScore: 0,
      awayScore: 0,
      isCompleted: false,
      isPlayerMatch: false,
    };

    const q4: TournamentMatch = {
      id: 'q4',
      round: 'quarter',
      roundName: 'Quarter-Final 4',
      homeTeam: shuffled[5],
      awayTeam: shuffled[6],
      homeScore: 0,
      awayScore: 0,
      isCompleted: false,
      isPlayerMatch: false,
    };

    // Simulate other quarter matches immediately
    [q2, q3, q4].forEach(m => {
      m.homeScore = Math.floor(Math.random() * 3) + (m.homeTeam.overallRating > m.awayTeam.overallRating ? 1 : 0);
      m.awayScore = Math.floor(Math.random() * 3);
      if (m.homeScore === m.awayScore) m.homeScore += 1;
      m.isCompleted = true;
      m.winner = m.homeScore > m.awayScore ? m.homeTeam : m.awayTeam;
    });

    return [q1, q2, q3, q4];
  }

  const handlePlayTournamentMatch = (match: TournamentMatch) => {
    setActiveTournamentMatch(match);
    handleStartMatch({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      difficulty: 'Professional',
      halfLengthMinutes: 3,
      weather: 'Night',
    });
  };

  const handleTournamentMatchEnd = (homeScore: number, awayScore: number) => {
    if (!activeTournamentMatch) return;

    setTournamentMatches(prev => {
      const updated = prev.map(m => {
        if (m.id === activeTournamentMatch.id) {
          const winner = homeScore >= awayScore ? m.homeTeam : m.awayTeam;
          return {
            ...m,
            homeScore,
            awayScore,
            isCompleted: true,
            winner,
          };
        }
        return m;
      });

      // Progress rounds
      if (activeTournamentMatch.round === 'quarter') {
        const q1Winner = homeScore >= awayScore ? activeTournamentMatch.homeTeam : activeTournamentMatch.awayTeam;
        const q2Winner = updated.find(m => m.id === 'q2')?.winner || TEAMS[1];
        const q3Winner = updated.find(m => m.id === 'q3')?.winner || TEAMS[2];
        const q4Winner = updated.find(m => m.id === 'q4')?.winner || TEAMS[3];

        const s1: TournamentMatch = {
          id: 's1',
          round: 'semi',
          roundName: 'Semi-Final 1',
          homeTeam: q1Winner,
          awayTeam: q2Winner,
          homeScore: 0,
          awayScore: 0,
          isCompleted: false,
          isPlayerMatch: q1Winner.id === userTeam.id,
        };

        const s2: TournamentMatch = {
          id: 's2',
          round: 'semi',
          roundName: 'Semi-Final 2',
          homeTeam: q3Winner,
          awayTeam: q4Winner,
          homeScore: Math.floor(Math.random() * 3) + 1,
          awayScore: Math.floor(Math.random() * 2),
          isCompleted: true,
          isPlayerMatch: false,
          winner: q3Winner,
        };

        return [...updated, s1, s2];
      } else if (activeTournamentMatch.round === 'semi') {
        const s1Winner = homeScore >= awayScore ? activeTournamentMatch.homeTeam : activeTournamentMatch.awayTeam;
        const s2Winner = updated.find(m => m.id === 's2')?.winner || TEAMS[3];

        const fin: TournamentMatch = {
          id: 'fin',
          round: 'final',
          roundName: 'Grand Final',
          homeTeam: s1Winner,
          awayTeam: s2Winner,
          homeScore: 0,
          awayScore: 0,
          isCompleted: false,
          isPlayerMatch: s1Winner.id === userTeam.id,
        };

        return [...updated, fin];
      } else if (activeTournamentMatch.round === 'final') {
        const champion = homeScore >= awayScore ? activeTournamentMatch.homeTeam : activeTournamentMatch.awayTeam;
        setChampionTeam(champion);
      }

      return updated;
    });
  };

  const handleResetTournament = () => {
    localStorage.removeItem('fc26_tournament');
    setChampionTeam(undefined);
    setTournamentMatches(initializeTournament(userTeam));
  };

  // Launch Match Execution
  const handleStartMatch = (config: {
    homeTeam: Team;
    awayTeam: Team;
    difficulty: 'Beginner' | 'Semi-Pro' | 'Professional' | 'World Class' | 'Legendary';
    halfLengthMinutes: number;
    weather: 'Night' | 'Sunset' | 'Clear' | 'Rain';
  }) => {
    setUserTeam(config.homeTeam);
    setOpponentTeam(config.awayTeam);
    setWeather(config.weather);

    const engine = new MatchEngine(
      config.homeTeam,
      config.awayTeam,
      config.difficulty,
      config.halfLengthMinutes
    );

    engine.onMatchEnd = () => {
      // Callback on Match End
      setShowMatchEndModal(true);
      if (activeTournamentMatch) {
        handleTournamentMatchEnd(engine.stats.homeScore, engine.stats.awayScore);
      } else if (activeCareerFixture) {
        // Process Career Matchday results
        const updatedCareer = processMatchdayResults(
          careerState,
          engine.stats.homeScore,
          engine.stats.awayScore
        );
        setCareerState(updatedCareer);
      }
    };

    setMatchEngine(engine);
    setShowPauseModal(false);
    setShowMatchEndModal(false);
    setCurrentScreen('match');
  };

  // Play next Career match
  const handlePlayCareerMatch = (fixture: SeasonFixture, hTeam: Team, aTeam: Team) => {
    setActiveCareerFixture(fixture);
    handleStartMatch({
      homeTeam: hTeam,
      awayTeam: aTeam,
      difficulty: 'Professional',
      halfLengthMinutes: 3,
      weather: 'Night',
    });
  };

  // Game Engine Loop when in Match Mode
  useEffect(() => {
    if (currentScreen !== 'match' || !matchEngine) return;

    let lastTime = performance.now();
    let frameId: number;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      matchEngine.update(dt, inputRef.current);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [currentScreen, matchEngine]);

  const handlePauseMatch = () => {
    if (matchEngine) {
      matchEngine.togglePause();
      setShowPauseModal(matchEngine.isPaused);
    }
  };

  const handleResumeMatch = () => {
    if (matchEngine) {
      matchEngine.isPaused = false;
      setShowPauseModal(false);
    }
  };

  const handleRestartMatch = () => {
    if (matchEngine) {
      handleStartMatch({
        homeTeam: matchEngine.homeTeam,
        awayTeam: matchEngine.awayTeam,
        difficulty: matchEngine.difficulty,
        halfLengthMinutes: matchEngine.halfLengthMinutes,
        weather,
      });
    }
  };

  const handleExitMatch = () => {
    if (matchEngine) {
      matchEngine.stopAudio();
    }
    setMatchEngine(null);
    setShowPauseModal(false);
    setShowMatchEndModal(false);
    setActiveTournamentMatch(null);
    setActiveCareerFixture(null);
    setCurrentScreen('main-menu');
  };

  const coinsBalance = Math.round(careerState.budget * 1000000);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#070e17] text-white flex flex-col select-none relative font-['Outfit']">
      <OfflineIndicator />

      {/* -------------------------------------------------------------
          MAIN MENU SCREEN: Unified FC 2026 Cyber-Teal Shell
      ------------------------------------------------------------- */}
      {currentScreen === 'main-menu' && (
        <div className="h-full flex flex-col justify-between overflow-hidden bg-[#070e17] relative">
          {/* Ambient Stadium Lighting Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Unified Top FC Header Bar */}
          <FCHeaderBar
            coins={coinsBalance}
            onOpenInbox={handleOpenInbox}
            onOpenSocial={handleOpenSocial}
            onOpenSettings={handleOpenSettings}
            showTabs={false}
          />

          {/* Center: Hero Game Mode Bento Grid (matches image.png style) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-center">
            <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 z-10">
              {/* Primary Tile: KICK OFF (Large Banner, 7 Cols) */}
              <div
                id="menu-kickoff-tile"
                onClick={() => setCurrentScreen('team-select')}
                className="md:col-span-7 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-6 md:p-8 shadow-2xl transition duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[240px]"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition" />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Chakra_Petch'] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30">
                    EXHIBITION MATCH
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-xl">
                    ⚽
                  </div>
                </div>

                <div className="my-2">
                  <h2 className="text-3xl md:text-5xl font-black font-['Chakra_Petch'] text-white tracking-wide group-hover:text-cyan-300 transition uppercase">
                    KICK-OFF
                  </h2>
                  <p className="text-xs md:text-sm text-white/60 mt-1 max-w-md">
                    Jump straight onto the pitch with 60fps physics, dynamic stamina, ball curl trajectories, tactical radar, and pro commentary.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-cyan-400 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider mt-2">
                  <Play className="w-3.5 h-3.5 fill-cyan-400" />
                  Select Teams & Kick Off Match
                </div>
              </div>

              {/* Tile 2: CAREER MODE (Flagship mode, 5 Cols) */}
              <div
                id="menu-career-tile"
                onClick={() => setCurrentScreen('career')}
                className="md:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/40 border border-teal-500/30 hover:border-teal-400 rounded-3xl p-6 md:p-8 shadow-2xl transition duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[240px]"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition" />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Chakra_Petch'] font-bold text-teal-400 uppercase tracking-widest bg-teal-500/15 px-3 py-1 rounded-full border border-teal-500/30">
                    HUB & TRANSFERS
                  </span>
                  <Briefcase className="w-6 h-6 text-teal-400" />
                </div>

                <div className="my-2">
                  <h3 className="text-2xl md:text-3xl font-black font-['Chakra_Petch'] text-white tracking-wide group-hover:text-teal-300 transition uppercase">
                    CAREER MODE
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    Manage club finances, scout youth academy talents, sign world-class stars on the live market, and lift the trophy.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-teal-400 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider mt-2">
                  Manage Club & Season →
                </div>
              </div>

              {/* Tile 3: CHAMPIONS KNOCKOUT CUP (3 Cols) */}
              <div
                id="menu-tournament-tile"
                onClick={() => setCurrentScreen('tournament')}
                className="md:col-span-3 bg-gradient-to-br from-slate-950 to-amber-950/40 border border-amber-500/30 hover:border-amber-400 rounded-3xl p-5 shadow-xl transition duration-300 group cursor-pointer flex flex-col justify-between min-h-[180px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-['Chakra_Petch'] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    KNOCKOUT CUP
                  </span>
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-black font-['Chakra_Petch'] text-white tracking-wide group-hover:text-amber-300 transition uppercase">
                    CHAMPIONS CUP
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    8-team knockout bracket with confetti ceremony.
                  </p>
                </div>

                <div className="text-amber-400 font-['Chakra_Petch'] font-bold text-xs uppercase">
                  Tournament Bracket →
                </div>
              </div>

              {/* Tile 4: PENALTY SHOOTOUT (3 Cols) */}
              <div
                id="menu-penalties-tile"
                onClick={() => setCurrentScreen('penalties')}
                className="md:col-span-3 bg-gradient-to-br from-slate-950 to-rose-950/40 border border-rose-500/30 hover:border-rose-400 rounded-3xl p-5 shadow-xl transition duration-300 group cursor-pointer flex flex-col justify-between min-h-[180px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-['Chakra_Petch'] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                    HIGH TENSION
                  </span>
                  <span className="text-xl">🧤</span>
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-black font-['Chakra_Petch'] text-white group-hover:text-rose-300 transition uppercase">
                    PENALTY DUEL
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Aim reticle, power charge, and diving goalkeeper.
                  </p>
                </div>

                <div className="text-rose-400 font-['Chakra_Petch'] font-bold text-xs uppercase">
                  Take the Penalty →
                </div>
              </div>

              {/* Tile 5: PRACTICE ARENA (3 Cols) */}
              <div
                id="menu-practice-tile"
                onClick={() => setCurrentScreen('practice')}
                className="md:col-span-3 bg-gradient-to-br from-slate-950 to-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-5 shadow-xl transition duration-300 group cursor-pointer flex flex-col justify-between min-h-[180px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-['Chakra_Petch'] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/15 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                    SOLO DRILLS
                  </span>
                  <Target className="w-5 h-5 text-cyan-400" />
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-black font-['Chakra_Petch'] text-white group-hover:text-cyan-300 transition uppercase">
                    PRACTICE ARENA
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Precision target rings & ball curl physics.
                  </p>
                </div>

                <div className="text-cyan-400 font-['Chakra_Petch'] font-bold text-xs uppercase">
                  Practice Free Kicks →
                </div>
              </div>

              {/* Tile 6: SQUAD MANAGEMENT (3 Cols) */}
              <div
                id="menu-squad-tile"
                onClick={() => setCurrentScreen('squad')}
                className="md:col-span-3 bg-gradient-to-br from-slate-950 to-teal-950/40 border border-teal-500/30 hover:border-teal-400 rounded-3xl p-5 shadow-xl transition duration-300 group cursor-pointer flex flex-col justify-between min-h-[180px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-['Chakra_Petch'] font-bold text-teal-400 uppercase tracking-widest bg-teal-500/15 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                    TACTICAL BLUEPRINT
                  </span>
                  <Users className="w-5 h-5 text-teal-400" />
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-black font-['Chakra_Petch'] text-white group-hover:text-teal-300 transition uppercase">
                    SQUAD MANAGEMENT
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    4-3-3 formation, sub bench & star player stats.
                  </p>
                </div>

                <div className="text-teal-300 font-['Chakra_Petch'] font-bold text-xs uppercase">
                  Customize Lineup →
                </div>
              </div>
            </div>
          </div>

          {/* Persistent Bottom Navigation Bar */}
          <FCBottomNav
            activeTab={navTab}
            onSelectTab={handleSelectNavTab}
          />
        </div>
      )}

      {/* -------------------------------------------------------------
          TEAM SELECTION MODAL (Kick-Off Setup)
      ------------------------------------------------------------- */}
      {currentScreen === 'team-select' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <TeamSelectModal
              onStartMatch={handleStartMatch}
              onBack={() => setCurrentScreen('main-menu')}
              onOpenInbox={handleOpenInbox}
              onOpenSocial={handleOpenSocial}
              onOpenSettings={handleOpenSettings}
            />
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {/* -------------------------------------------------------------
          MATCH GAMEPLAY SCREEN (With TV Broadcast HUD)
      ------------------------------------------------------------- */}
      {currentScreen === 'match' && matchEngine && (
        <div className="w-full h-full relative overflow-hidden bg-slate-950">
          {/* 2.5D Canvas Pitch Renderer */}
          <PitchCanvas engine={matchEngine} weather={weather} />

          {/* Broadcast Scorebug, Commentary Ticker, Dynamic Stamina, and Player Card HUD */}
          <BroadcastHUD
            engine={matchEngine}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={handlePauseMatch}
          />

          {/* Input & Virtual Touch Controls Layer */}
          <MatchControlsOverlay
            onInputChange={(newInput) => {
              inputRef.current = newInput;
            }}
          />

          {/* In-Game Pause Modal */}
          {showPauseModal && (
            <MatchPauseModal
              homeTeam={matchEngine.homeTeam}
              awayTeam={matchEngine.awayTeam}
              currentTactic={matchEngine.homeTeam.tactic}
              onChangeTactic={(tactic) => {
                matchEngine.homeTeam.tactic = tactic;
              }}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onResume={handleResumeMatch}
              onRestart={handleRestartMatch}
              onExit={handleExitMatch}
            />
          )}

          {/* Post-Match Full Summary Modal */}
          {showMatchEndModal && (
            <MatchEndModal
              homeTeam={matchEngine.homeTeam}
              awayTeam={matchEngine.awayTeam}
              stats={matchEngine.stats}
              goalEvents={matchEngine.goalEvents}
              isTournament={!!activeTournamentMatch}
              isCareer={!!activeCareerFixture}
              onRematch={handleRestartMatch}
              onExit={handleExitMatch}
              onCareerHub={() => {
                setShowMatchEndModal(false);
                setMatchEngine(null);
                setActiveCareerFixture(null);
                setCurrentScreen('career');
              }}
              onNextRound={() => {
                setShowMatchEndModal(false);
                setCurrentScreen('tournament');
              }}
            />
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          CAREER MODE SCREEN (League Tables, Fixtures, Transfers, Hub)
      ------------------------------------------------------------- */}
      {currentScreen === 'career' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <CareerMode
              career={careerState}
              onPlayNextMatch={handlePlayCareerMatch}
              onUpdateCareer={(updated) => setCareerState(updated)}
              onExit={() => setCurrentScreen('main-menu')}
              onOpenInbox={handleOpenInbox}
              onOpenSocial={handleOpenSocial}
              onOpenSettings={handleOpenSettings}
            />
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {/* -------------------------------------------------------------
          TOURNAMENT BRACKET SCREEN
      ------------------------------------------------------------- */}
      {currentScreen === 'tournament' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <TournamentBracket
              userTeam={userTeam}
              matches={tournamentMatches}
              currentRound={tournamentMatches.find(m => m.isPlayerMatch && !m.isCompleted)?.round || 'champion'}
              championTeam={championTeam}
              onPlayMatch={handlePlayTournamentMatch}
              onResetTournament={handleResetTournament}
              onBack={() => setCurrentScreen('main-menu')}
              onOpenInbox={handleOpenInbox}
              onOpenSocial={handleOpenSocial}
              onOpenSettings={handleOpenSettings}
            />
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {/* -------------------------------------------------------------
          PENALTY SHOOTOUT DUEL SCREEN
      ------------------------------------------------------------- */}
      {currentScreen === 'penalties' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <PenaltyMode
              homeTeam={userTeam}
              awayTeam={opponentTeam}
              onBack={() => setCurrentScreen('main-menu')}
              onOpenInbox={handleOpenInbox}
              onOpenSocial={handleOpenSocial}
              onOpenSettings={handleOpenSettings}
            />
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {/* -------------------------------------------------------------
          FREE-KICK PRACTICE ARENA SCREEN
      ------------------------------------------------------------- */}
      {currentScreen === 'practice' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <PracticeArena
              team={userTeam}
              onBack={() => setCurrentScreen('main-menu')}
              onOpenInbox={handleOpenInbox}
              onOpenSocial={handleOpenSocial}
              onOpenSettings={handleOpenSettings}
            />
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {/* -------------------------------------------------------------
          SQUAD MANAGEMENT / TACTICAL BLUEPRINT SCREEN
      ------------------------------------------------------------- */}
      {currentScreen === 'squad' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <SquadManagement
              team={userTeam}
              onUpdateTeam={(updated) => setUserTeam(updated)}
              onBack={() => setCurrentScreen('main-menu')}
              onOpenInbox={handleOpenInbox}
              onOpenSocial={handleOpenSocial}
              onOpenSettings={handleOpenSettings}
              currentMatchday={careerState?.currentMatchday || 12}
            />
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {/* -------------------------------------------------------------
          MODALS: DYNAMIC INBOX & AUDIO/GAME SETTINGS
      ------------------------------------------------------------- */}
      <FCInboxModal
        isOpen={showInboxModal}
        initialTab={inboxInitialTab}
        career={careerState}
        onUpdateCareer={setCareerState}
        onClose={() => setShowInboxModal(false)}
      />

      <FCSettingsModal
        isOpen={showSettingsModal}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
