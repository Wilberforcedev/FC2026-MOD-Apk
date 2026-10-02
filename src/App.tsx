/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { TEAMS } from './data/teams';
import { CareerState, SeasonFixture, Team, TournamentMatch } from './types/soccer';
import { MatchEngine, UserInputState } from './game/engine';
import { PitchCanvas } from './components/PitchCanvas';
import { OnPitchLikenessLayer } from './components/OnPitchLikenessLayer';
import { BroadcastHUD } from './components/BroadcastHUD';
import { MatchControlsOverlay } from './components/MatchControlsOverlay';
import { MatchEndModal } from './components/MatchEndModal';
import { MatchPauseModal } from './components/MatchPauseModal';
import { TeamSelectModal } from './components/TeamSelectModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FCBottomNav, FCNavTab } from './components/FCBottomNav';
import { FCInboxModal } from './components/FCInboxModal';
import { FCSettingsModal } from './components/FCSettingsModal';
import { MainMenu, MainMenuDestination } from './components/MainMenu';
import { soundEngine } from './services/soundEngine';
import { commentary } from './services/commentaryEngine';
import { initializeCareer, loadCareer, processMatchdayResults, saveCareer } from './services/careerService';
import {
  clearTournament,
  completeTournamentMatch,
  initializeTournament,
  loadTournament,
  saveTournament,
} from './services/tournamentService';

const CareerMode = lazy(() => import('./components/CareerMode').then(module => ({ default: module.CareerMode })));
const TournamentBracket = lazy(() => import('./components/TournamentBracket').then(module => ({ default: module.TournamentBracket })));
const PenaltyMode = lazy(() => import('./components/PenaltyMode').then(module => ({ default: module.PenaltyMode })));
const PracticeArena = lazy(() => import('./components/PracticeArena').then(module => ({ default: module.PracticeArena })));
const SquadManagement = lazy(() => import('./components/SquadManagement').then(module => ({ default: module.SquadManagement })));

type ScreenType =
  | 'main-menu'
  | 'team-select'
  | 'match'
  | 'tournament'
  | 'career'
  | 'penalties'
  | 'practice'
  | 'squad';

interface MatchContext {
  tournamentMatch?: TournamentMatch;
  careerFixture?: SeasonFixture;
}

const ModeLoading = () => (
  <div className="w-full h-full flex items-center justify-center bg-[#070e17] text-cyan-300">
    <div className="text-center">
      <div className="w-9 h-9 mx-auto rounded-full border-2 border-cyan-400/30 border-t-cyan-300 animate-spin" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.25em]">Loading mode</p>
    </div>
  </div>
);

const emptyInput: UserInputState = {
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
};

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
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [inboxInitialTab, setInboxInitialTab] = useState<'inbox' | 'news' | 'social'>('news');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [careerState, setCareerState] = useState<CareerState>(() =>
    loadCareer() || initializeCareer(TEAMS[0].id),
  );

  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>(() =>
    loadTournament() || initializeTournament(TEAMS[0], TEAMS),
  );

  const inputRef = useRef<UserInputState>({ ...emptyInput });

  const tournamentUserTeam =
    tournamentMatches.find(match => match.id === 'q1')?.homeTeam || userTeam;
  const careerUserTeam =
    TEAMS.find(team => team.id === careerState.userTeamId) || userTeam;
  const championTeam = tournamentMatches.find(
    match => match.round === 'final' && match.isCompleted,
  )?.winner;

  const handleCareerUpdate = useCallback((updated: CareerState) => {
    setCareerState(updated);
    saveCareer(updated);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(previous => {
      const next = !previous;
      soundEngine.setMuted(next);
      commentary.setMuted(next);
      return next;
    });
  }, []);

  const handleOpenInbox = () => {
    setInboxInitialTab('inbox');
    setShowInboxModal(true);
  };

  const handleOpenSocial = () => {
    setInboxInitialTab('news');
    setShowInboxModal(true);
  };

  const handleSelectNavTab = (tab: FCNavTab) => {
    setNavTab(tab);
    if (tab === 'home') setCurrentScreen('main-menu');
    else if (tab === 'play') setCurrentScreen('team-select');
    else if (tab === 'club') setCurrentScreen('squad');
    else if (tab === 'store') setCurrentScreen('career');
  };

  const handleMainMenuNavigate = (destination: MainMenuDestination) => {
    setCurrentScreen(destination);
  };

  useEffect(() => {
    if (currentScreen === 'main-menu') setNavTab('home');
    else if (currentScreen === 'team-select') setNavTab('play');
    else if (currentScreen === 'squad') setNavTab('club');
    else if (currentScreen === 'career') setNavTab('store');
  }, [currentScreen]);

  useEffect(() => {
    saveTournament(tournamentMatches);
  }, [tournamentMatches]);

  const handleTournamentMatchEnd = useCallback(
    (match: TournamentMatch, homeScore: number, awayScore: number) => {
      setTournamentMatches(previous => {
        const progress = completeTournamentMatch(
          previous,
          match,
          homeScore,
          awayScore,
          tournamentUserTeam.id,
        );
        return progress.matches;
      });
    },
    [tournamentUserTeam.id],
  );

  const handleStartMatch = useCallback((config: {
    homeTeam: Team;
    awayTeam: Team;
    difficulty: 'Beginner' | 'Semi-Pro' | 'Professional' | 'World Class' | 'Legendary';
    halfLengthMinutes: number;
    weather: 'Night' | 'Sunset' | 'Clear' | 'Rain';
  }, context: MatchContext = {}) => {
    const isTournament = Boolean(context.tournamentMatch);
    const isCareer = Boolean(context.careerFixture);

    if (!isTournament && !isCareer) {
      setUserTeam(config.homeTeam);
      setOpponentTeam(config.awayTeam);
    } else if (isTournament) {
      const opponent = config.homeTeam.id === tournamentUserTeam.id ? config.awayTeam : config.homeTeam;
      setOpponentTeam(opponent);
    } else {
      const opponent = config.homeTeam.id === careerUserTeam.id ? config.awayTeam : config.homeTeam;
      setOpponentTeam(opponent);
    }

    setWeather(config.weather);

    const engine = new MatchEngine(
      config.homeTeam,
      config.awayTeam,
      config.difficulty,
      config.halfLengthMinutes,
    );

    engine.onMatchEnd = () => {
      setShowMatchEndModal(true);

      if (context.tournamentMatch) {
        handleTournamentMatchEnd(
          context.tournamentMatch,
          engine.stats.homeScore,
          engine.stats.awayScore,
        );
      } else if (context.careerFixture) {
        const updatedCareer = processMatchdayResults(
          careerState,
          engine.stats.homeScore,
          engine.stats.awayScore,
        );
        handleCareerUpdate(updatedCareer);
      }
    };

    setMatchEngine(engine);
    setShowPauseModal(false);
    setShowMatchEndModal(false);
    setCurrentScreen('match');
  }, [careerState, careerUserTeam.id, handleCareerUpdate, handleTournamentMatchEnd, tournamentUserTeam.id]);

  const handlePlayTournamentMatch = (match: TournamentMatch) => {
    setActiveTournamentMatch(match);
    setActiveCareerFixture(null);
    handleStartMatch(
      {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        difficulty: 'Professional',
        halfLengthMinutes: 3,
        weather: 'Night',
      },
      { tournamentMatch: match },
    );
  };

  const handlePlayCareerMatch = (fixture: SeasonFixture, homeTeam: Team, awayTeam: Team) => {
    setActiveCareerFixture(fixture);
    setActiveTournamentMatch(null);
    handleStartMatch(
      {
        homeTeam,
        awayTeam,
        difficulty: 'Professional',
        halfLengthMinutes: 3,
        weather: 'Night',
      },
      { careerFixture: fixture },
    );
  };

  const handleResetTournament = () => {
    clearTournament();
    const reset = initializeTournament(tournamentUserTeam, TEAMS);
    setTournamentMatches(reset);
    saveTournament(reset);
  };

  useEffect(() => {
    if (currentScreen !== 'match' || !matchEngine) return;

    let lastTime = performance.now();
    let frameId = 0;
    const loop = (time: number) => {
      if (document.visibilityState === 'hidden') {
        lastTime = time;
        frameId = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      matchEngine.update(dt, inputRef.current);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [currentScreen, matchEngine]);

  const handlePauseMatch = () => {
    if (!matchEngine) return;
    matchEngine.togglePause();
    setShowPauseModal(matchEngine.isPaused);
  };

  const handleResumeMatch = () => {
    if (!matchEngine) return;
    matchEngine.isPaused = false;
    setShowPauseModal(false);
  };

  const handleRestartMatch = () => {
    if (!matchEngine) return;

    const context: MatchContext = {};
    if (activeTournamentMatch) context.tournamentMatch = activeTournamentMatch;
    if (activeCareerFixture) context.careerFixture = activeCareerFixture;

    handleStartMatch(
      {
        homeTeam: matchEngine.homeTeam,
        awayTeam: matchEngine.awayTeam,
        difficulty: matchEngine.difficulty,
        halfLengthMinutes: matchEngine.halfLengthMinutes,
        weather,
      },
      context,
    );
  };

  const handleExitMatch = () => {
    matchEngine?.stopAudio();
    setMatchEngine(null);
    setShowPauseModal(false);
    setShowMatchEndModal(false);
    setActiveTournamentMatch(null);
    setActiveCareerFixture(null);
    inputRef.current = { ...emptyInput };
    setCurrentScreen('main-menu');
  };

  const coinsBalance = Math.round(careerState.budget * 1_000_000);
  const lazyFallback = <ModeLoading />;

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#070e17] text-white flex flex-col select-none relative">
      <OfflineIndicator />

      {currentScreen === 'main-menu' && (
        <MainMenu
          coins={coinsBalance}
          navTab={navTab}
          onNavigate={handleMainMenuNavigate}
          onSelectNavTab={handleSelectNavTab}
          onOpenInbox={handleOpenInbox}
          onOpenSocial={handleOpenSocial}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {currentScreen === 'team-select' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <TeamSelectModal
              onStartMatch={config => handleStartMatch(config)}
              onBack={() => setCurrentScreen('main-menu')}
              onOpenInbox={handleOpenInbox}
              onOpenSocial={handleOpenSocial}
              onOpenSettings={() => setShowSettingsModal(true)}
            />
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {currentScreen === 'match' && matchEngine && (
        <div className="w-full h-full relative overflow-hidden bg-slate-950">
          <PitchCanvas engine={matchEngine} weather={weather} />
          <OnPitchLikenessLayer engine={matchEngine} />
          <BroadcastHUD
            engine={matchEngine}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={handlePauseMatch}
          />
          <MatchControlsOverlay onInputChange={newInput => { inputRef.current = newInput; }} />

          {showPauseModal && (
            <MatchPauseModal
              engine={matchEngine}
              homeTeam={matchEngine.homeTeam}
              awayTeam={matchEngine.awayTeam}
              currentTactic={matchEngine.homeTeam.tactic}
              onChangeTactic={tactic => { matchEngine.homeTeam.tactic = tactic; }}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onResume={handleResumeMatch}
              onRestart={handleRestartMatch}
              onExit={handleExitMatch}
            />
          )}

          {showMatchEndModal && (
            <MatchEndModal
              homeTeam={matchEngine.homeTeam}
              awayTeam={matchEngine.awayTeam}
              stats={matchEngine.stats}
              goalEvents={matchEngine.goalEvents}
              keyMatchEvents={matchEngine.keyMatchEvents}
              heatmapData={matchEngine.getHeatmapData()}
              engine={matchEngine}
              isTournament={Boolean(activeTournamentMatch)}
              isCareer={Boolean(activeCareerFixture)}
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
                setMatchEngine(null);
                setActiveTournamentMatch(null);
                setCurrentScreen('tournament');
              }}
            />
          )}
        </div>
      )}

      {currentScreen === 'career' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={lazyFallback}>
              <CareerMode
                career={careerState}
                onPlayNextMatch={handlePlayCareerMatch}
                onUpdateCareer={handleCareerUpdate}
                onExit={() => setCurrentScreen('main-menu')}
                onOpenInbox={handleOpenInbox}
                onOpenSocial={handleOpenSocial}
                onOpenSettings={() => setShowSettingsModal(true)}
              />
            </Suspense>
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {currentScreen === 'tournament' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={lazyFallback}>
              <TournamentBracket
                userTeam={tournamentUserTeam}
                matches={tournamentMatches}
                currentRound={tournamentMatches.find(match => match.isPlayerMatch && !match.isCompleted)?.round || 'champion'}
                championTeam={championTeam}
                onPlayMatch={handlePlayTournamentMatch}
                onResetTournament={handleResetTournament}
                onBack={() => setCurrentScreen('main-menu')}
                onOpenInbox={handleOpenInbox}
                onOpenSocial={handleOpenSocial}
                onOpenSettings={() => setShowSettingsModal(true)}
              />
            </Suspense>
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {currentScreen === 'penalties' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={lazyFallback}>
              <PenaltyMode
                homeTeam={userTeam}
                awayTeam={opponentTeam}
                onBack={() => setCurrentScreen('main-menu')}
                onOpenInbox={handleOpenInbox}
                onOpenSocial={handleOpenSocial}
                onOpenSettings={() => setShowSettingsModal(true)}
              />
            </Suspense>
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {currentScreen === 'practice' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={lazyFallback}>
              <PracticeArena
                team={userTeam}
                onBack={() => setCurrentScreen('main-menu')}
                onOpenInbox={handleOpenInbox}
                onOpenSocial={handleOpenSocial}
                onOpenSettings={() => setShowSettingsModal(true)}
              />
            </Suspense>
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      {currentScreen === 'squad' && (
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={lazyFallback}>
              <SquadManagement
                team={userTeam}
                onUpdateTeam={updated => setUserTeam(updated)}
                onBack={() => setCurrentScreen('main-menu')}
                onOpenInbox={handleOpenInbox}
                onOpenSocial={handleOpenSocial}
                onOpenSettings={() => setShowSettingsModal(true)}
                currentMatchday={careerState.currentMatchday || 1}
              />
            </Suspense>
          </div>
          <FCBottomNav activeTab={navTab} onSelectTab={handleSelectNavTab} />
        </div>
      )}

      <FCInboxModal
        isOpen={showInboxModal}
        initialTab={inboxInitialTab}
        career={careerState}
        onUpdateCareer={handleCareerUpdate}
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
