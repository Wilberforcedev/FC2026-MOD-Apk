import React, { useState, useEffect, useRef } from 'react';
import { Team, Player } from '../types/soccer';
import { soundEngine } from '../services/soundEngine';
import { commentary } from '../services/commentaryEngine';
import { ChevronLeft, RotateCcw, Target, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FCHeaderBar } from './FCHeaderBar';

interface PenaltyModeProps {
  homeTeam: Team;
  awayTeam: Team;
  onBack: () => void;
  onOpenInbox?: () => void;
  onOpenSocial?: () => void;
  onOpenSettings?: () => void;
}

export const PenaltyMode: React.FC<PenaltyModeProps> = ({
  homeTeam,
  awayTeam,
  onBack,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
}) => {
  const [round, setRound] = useState(1);
  const [isPlayerShooting, setIsPlayerShooting] = useState(true); // Player kicks or Goalkeeper saves
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeKicks, setHomeKicks] = useState<boolean[]>([]);
  const [awayKicks, setAwayKicks] = useState<boolean[]>([]);
  
  const [aimPos, setAimPos] = useState({ x: 0.5, y: 0.5 }); // 0 to 1 inside goal
  const [isPowering, setIsPowering] = useState(false);
  const [power, setPower] = useState(0);
  const [shotPhase, setShotPhase] = useState<'aiming' | 'shooting' | 'result' | 'gameover'>('aiming');
  const [resultText, setResultText] = useState('');
  const [keeperDive, setKeeperDive] = useState<'left' | 'right' | 'center' | 'top-left' | 'top-right'>('center');
  const [ballPos, setBallPos] = useState({ x: 50, y: 85, scale: 1 });

  const currentKicker = homeTeam.players[((round - 1) % 10) + 1] || homeTeam.players[9];
  const oppKeeper = awayTeam.players[0];

  const animRef = useRef<number | null>(null);

  // Power bar oscillation
  useEffect(() => {
    let forward = true;
    let val = 0;
    const interval = setInterval(() => {
      if (isPowering) {
        if (forward) {
          val += 0.04;
          if (val >= 1) forward = false;
        } else {
          val -= 0.04;
          if (val <= 0) forward = true;
        }
        setPower(val);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [isPowering]);

  const handleStartPower = () => {
    if (shotPhase !== 'aiming') return;
    setIsPowering(true);
  };

  const handleReleaseShot = () => {
    if (!isPowering || shotPhase !== 'aiming') return;
    setIsPowering(false);
    executePenaltyShot();
  };

  const executePenaltyShot = () => {
    setShotPhase('shooting');
    soundEngine.playWhistle('short');

    // Random AI Keeper dive
    const dives: ('left' | 'right' | 'center' | 'top-left' | 'top-right')[] = [
      'left', 'right', 'center', 'top-left', 'top-right',
    ];
    const pickedDive = dives[Math.floor(Math.random() * dives.length)];
    setKeeperDive(pickedDive);

    // Ball flight animation
    soundEngine.playPowerShot();
    const targetX = 25 + aimPos.x * 50; // Map to goal area percentage
    const targetY = 22 + aimPos.y * 32;

    setBallPos({ x: targetX, y: targetY, scale: 0.5 });

    // Determine if Saved or Scored
    setTimeout(() => {
      let isGoal = true;

      // Overhit shot
      if (power > 0.94) {
        isGoal = false;
        soundEngine.playPostHit();
        soundEngine.playCrowdGasp();
        setResultText('OVER THE BAR! TOO MUCH POWER!');
      } else if (
        (pickedDive === 'left' && aimPos.x < 0.35 && aimPos.y > 0.4) ||
        (pickedDive === 'right' && aimPos.x > 0.65 && aimPos.y > 0.4) ||
        (pickedDive === 'top-left' && aimPos.x < 0.35 && aimPos.y <= 0.4) ||
        (pickedDive === 'top-right' && aimPos.x > 0.65 && aimPos.y <= 0.4) ||
        (pickedDive === 'center' && aimPos.x >= 0.4 && aimPos.x <= 0.6)
      ) {
        // Saved by Keeper!
        isGoal = false;
        soundEngine.playKick(0.5);
        soundEngine.playCrowdGasp();
        setResultText(`SAVED BY ${oppKeeper.shortName.toUpperCase()}!`);
      } else {
        // GOAL!
        isGoal = true;
        soundEngine.playNetRipple();
        soundEngine.playGoalCelebration();
        setResultText('GOOOAAAL! PERFECT PENALTY!');
      }

      // Update score tracker
      setHomeKicks(prev => [...prev, isGoal]);
      if (isGoal) setHomeScore(s => s + 1);

      // Simulate CPU shot after 2 seconds
      setTimeout(() => {
        simulateCpuKick();
      }, 2200);

      setShotPhase('result');
    }, 700);
  };

  const simulateCpuKick = () => {
    // CPU takes shot
    const cpuScored = Math.random() < 0.72; // 72% success
    setAwayKicks(prev => [...prev, cpuScored]);
    if (cpuScored) setAwayScore(s => s + 1);

    // Check match winner condition (best of 5 or sudden death)
    const newRound = round + 1;
    if (newRound > 5 && (homeScore !== awayScore || homeKicks.length >= 5)) {
      setShotPhase('gameover');
      if (homeScore >= awayScore) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
    } else {
      setRound(newRound);
      setShotPhase('aiming');
      setBallPos({ x: 50, y: 85, scale: 1 });
      setPower(0);
      setResultText('');
    }
  };

  const restartShootout = () => {
    setRound(1);
    setHomeScore(0);
    setAwayScore(0);
    setHomeKicks([]);
    setAwayKicks([]);
    setShotPhase('aiming');
    setBallPos({ x: 50, y: 85, scale: 1 });
    setPower(0);
    setResultText('');
  };

  return (
    <div className="h-full flex flex-col bg-[#070e17] text-white select-none overflow-hidden relative font-['Outfit']">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* FC Header Bar */}
      <FCHeaderBar
        onOpenInbox={onOpenInbox}
        onOpenSocial={onOpenSocial}
        onOpenSettings={onOpenSettings}
        showTabs={false}
      />

      {/* Header */}
      <div className="px-4 md:px-8 py-3 bg-slate-950/80 border-b border-cyan-900/30 flex items-center justify-between z-10">
        <button
          onClick={onBack}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 transition flex items-center gap-1.5 text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider"
        >
          <ChevronLeft className="w-4 h-4" />
          Exit Arena
        </button>

        {/* Penalty Scoreboard Pill */}
        <div className="flex items-center gap-6 bg-slate-900/90 border border-cyan-500/30 px-6 py-2 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">{homeTeam.badgeIcon}</span>
            <span className="font-['Chakra_Petch'] font-bold text-sm text-white">{homeTeam.shortName}</span>
            <span className="font-['Chakra_Petch'] font-black text-2xl text-cyan-300">{homeScore}</span>
          </div>

          {/* Kicks Dots */}
          <div className="flex flex-col gap-1 items-center font-mono text-[10px]">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(idx => (
                <span key={idx} className={`w-2.5 h-2.5 rounded-full ${
                  homeKicks[idx] === true ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' : homeKicks[idx] === false ? 'bg-rose-500' : 'bg-slate-700'
                }`} />
              ))}
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(idx => (
                <span key={idx} className={`w-2.5 h-2.5 rounded-full ${
                  awayKicks[idx] === true ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' : awayKicks[idx] === false ? 'bg-rose-500' : 'bg-slate-700'
                }`} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-['Chakra_Petch'] font-black text-2xl text-rose-400">{awayScore}</span>
            <span className="font-['Chakra_Petch'] font-bold text-sm text-white">{awayTeam.shortName}</span>
            <span className="text-xl">{awayTeam.badgeIcon}</span>
          </div>
        </div>

        <button
          onClick={restartShootout}
          className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 transition flex items-center gap-1.5 text-xs shadow"
          title="Restart Shootout"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Penalty Stage */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Stadium turf perspective */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#112419] via-[#1a4a28] to-[#143e22] overflow-hidden">
          {/* Pitch lines */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-4/5 h-64 border-2 border-white/25 rounded-t-3xl pointer-events-none" />
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow" />
        </div>

        {/* Goal Frame & Net (Centered 3D View) */}
        <div 
          onClick={(e) => {
            if (shotPhase !== 'aiming') return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setAimPos({ x: Math.max(0.1, Math.min(0.9, x)), y: Math.max(0.1, Math.min(0.9, y)) });
          }}
          className="relative w-full max-w-xl aspect-[16/9] border-4 border-white rounded-t-lg bg-slate-950/20 shadow-2xl backdrop-blur-xs cursor-crosshair group"
        >
          {/* Net grid */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />

          {/* Goalkeeper Entity */}
          <div
            className={`absolute bottom-0 w-16 h-28 -translate-x-1/2 flex flex-col items-center justify-end transition-all duration-300 ${
              shotPhase === 'shooting' || shotPhase === 'result'
                ? keeperDive === 'left'
                  ? 'left-1/4 -translate-y-4 -rotate-45'
                  : keeperDive === 'right'
                  ? 'left-3/4 -translate-y-4 rotate-45'
                  : keeperDive === 'top-left'
                  ? 'left-1/5 -translate-y-16 -rotate-60'
                  : keeperDive === 'top-right'
                  ? 'left-4/5 -translate-y-16 rotate-60'
                  : 'left-1/2 -translate-y-2'
                : 'left-1/2'
            }`}
          >
            {/* Goalkeeper Head & Kit */}
            <div className="w-8 h-8 rounded-full bg-amber-400 border border-slate-900 shadow" />
            <div className="w-12 h-14 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-lg border-2 border-slate-900 flex items-center justify-center font-bold text-xs text-slate-950">
              1
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-8 bg-slate-900 rounded-b" />
              <div className="w-3 h-8 bg-slate-900 rounded-b" />
            </div>
            <span className="text-[10px] font-bold bg-black/60 px-1.5 rounded mt-1">{oppKeeper.shortName}</span>
          </div>

          {/* Aim Reticle Target */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 border-2 border-emerald-400 rounded-full flex items-center justify-center pointer-events-none transition-all duration-75 shadow-lg shadow-emerald-400/50"
            style={{
              left: `${aimPos.x * 100}%`,
              top: `${aimPos.y * 100}%`,
            }}
          >
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
        </div>

        {/* Soccer Ball (Animated flight to net) */}
        <div
          className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 pointer-events-none z-20"
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transform: `translate(-50%, -50%) scale(${ballPos.scale})`,
          }}
        >
          <div className="w-full h-full rounded-full bg-white border-2 border-slate-900 shadow-2xl flex items-center justify-center text-xl">
            ⚽
          </div>
        </div>

        {/* Result Callout Banner */}
        {resultText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-slate-950/95 border-2 border-amber-400 text-white px-8 py-3 rounded-2xl font-['Chakra_Petch'] font-black text-2xl tracking-wide shadow-2xl z-30 animate-bounce">
            {resultText}
          </div>
        )}

        {/* Game Over Screen */}
        {shotPhase === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-40 p-6">
            <h2 className="text-4xl font-black font-['Chakra_Petch'] text-amber-400">
              {homeScore > awayScore ? '🏆 SHOOTOUT VICTORY!' : 'SHOOTOUT DEFEAT'}
            </h2>
            <div className="text-5xl font-black font-['Chakra_Petch'] text-white my-4">
              {homeScore} - {awayScore}
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={restartShootout}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-['Chakra_Petch'] uppercase tracking-wider text-sm transition"
              >
                Play Again
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition"
              >
                Return to Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Kicking Controls */}
      <div className="p-4 bg-slate-900/90 border border-white/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 z-10 max-w-4xl mx-auto w-full">
        {/* Kicker Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-['Chakra_Petch'] font-black flex items-center justify-center text-lg">
            #{currentKicker.number}
          </div>
          <div>
            <div className="font-bold text-sm text-white font-['Outfit']">{currentKicker.name}</div>
            <div className="text-xs text-white/50 font-mono">SHO: {currentKicker.stats.shooting} | PENALTY TAKER</div>
          </div>
        </div>

        {/* Power Gauge Bar */}
        <div className="flex-1 max-w-sm w-full">
          <div className="flex justify-between text-xs font-mono font-bold text-white/70 mb-1">
            <span>SHOT POWER</span>
            <span className={power > 0.85 ? 'text-rose-400' : 'text-emerald-400'}>
              {Math.round(power * 100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/10 relative">
            <div 
              className={`h-full transition-all duration-75 ${
                power > 0.85 ? 'bg-rose-500' : power > 0.5 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${power * 100}%` }}
            />
            {/* Sweet spot notch */}
            <div className="absolute top-0 bottom-0 left-[70%] w-1 bg-white opacity-60" />
          </div>
        </div>

        {/* Shoot Button (Hold & Release) */}
        <button
          id="penalty-shoot-button"
          onMouseDown={handleStartPower}
          onMouseUp={handleReleaseShot}
          onTouchStart={handleStartPower}
          onTouchEnd={handleReleaseShot}
          disabled={shotPhase !== 'aiming'}
          className={`px-8 py-3 rounded-xl font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider shadow-lg transition ${
            shotPhase === 'aiming'
              ? 'bg-rose-500 hover:bg-rose-400 text-white cursor-pointer active:scale-95'
              : 'bg-slate-800 text-white/30 cursor-not-allowed'
          }`}
        >
          {isPowering ? 'RELEASE TO SHOOT!' : 'HOLD TO POWER SHOT'}
        </button>
      </div>
    </div>
  );
};
