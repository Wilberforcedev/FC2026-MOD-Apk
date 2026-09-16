import React, { useState, useEffect, useRef } from 'react';
import { Team, Player } from '../types/soccer';
import { soundEngine } from '../services/soundEngine';
import { ChevronLeft, RotateCcw, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FCHeaderBar } from './FCHeaderBar';

interface PracticeArenaProps {
  team: Team;
  onBack: () => void;
  onOpenInbox?: () => void;
  onOpenSocial?: () => void;
  onOpenSettings?: () => void;
}

export const PracticeArena: React.FC<PracticeArenaProps> = ({ 
  team, 
  onBack,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [aimPos, setAimPos] = useState({ x: 0.5, y: 0.4 });
  const [curve, setCurve] = useState(0); // -1 (left) to +1 (right)
  const [isCharging, setIsCharging] = useState(false);
  const [chargePower, setChargePower] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Aim at the target rings and charge your shot!');
  const [ballState, setBallState] = useState({ x: 50, y: 84, scale: 1 });
  const [isShotInFlight, setIsShotInFlight] = useState(false);

  // Targets in the goal: Top-Left (90 pts), Top-Right (90 pts), Low-Corners (50 pts)
  const targets = [
    { id: 'tl', x: 0.22, y: 0.26, radius: 0.08, points: 100, label: 'TOP BIN' },
    { id: 'tr', x: 0.78, y: 0.26, radius: 0.08, points: 100, label: 'TOP BIN' },
    { id: 'bl', x: 0.24, y: 0.75, radius: 0.09, points: 50, label: 'LOW CORNER' },
    { id: 'br', x: 0.76, y: 0.75, radius: 0.09, points: 50, label: 'LOW CORNER' },
  ];

  const starPlayer = team.players[9] || team.players[0]; // Striker

  // Charging animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCharging) {
      interval = setInterval(() => {
        setChargePower(p => {
          if (p >= 1) return 0;
          return p + 0.05;
        });
      }, 25);
    }
    return () => clearInterval(interval);
  }, [isCharging]);

  const handleShoot = () => {
    if (isShotInFlight) return;
    setIsCharging(false);
    setIsShotInFlight(true);

    soundEngine.playPowerShot();

    // Flight target with curve calculation
    const targetX = 22 + (aimPos.x + curve * 0.15) * 56;
    const targetY = 18 + aimPos.y * 36;

    setBallState({ x: targetX, y: targetY, scale: 0.52 });

    setTimeout(() => {
      // Check target hits
      const finalX = aimPos.x + curve * 0.15;
      const finalY = aimPos.y;

      let hitTarget = null;
      for (const t of targets) {
        const d = Math.hypot(finalX - t.x, finalY - t.y);
        if (d < t.radius) {
          hitTarget = t;
          break;
        }
      }

      if (chargePower > 0.92) {
        soundEngine.playPostHit();
        setStatusMsg('Crossbar hit! Too much power!');
        setStreak(0);
      } else if (hitTarget) {
        soundEngine.playNetRipple();
        soundEngine.playGoalCelebration();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setScore(s => s + hitTarget.points);
        setStreak(s => s + 1);
        setStatusMsg(`BULLSEYE! ${hitTarget.label} (+${hitTarget.points} PTS)`);
      } else if (finalX >= 0.15 && finalX <= 0.85 && finalY <= 0.9) {
        soundEngine.playNetRipple();
        setScore(s => s + 25);
        setStreak(s => s + 1);
        setStatusMsg('GOAL! Clean finish into the net (+25 PTS)');
      } else {
        soundEngine.playCrowdGasp();
        setStreak(0);
        setStatusMsg('Missed! Drifting wide of the post.');
      }

      setTimeout(() => {
        setBallState({ x: 50, y: 84, scale: 1 });
        setIsShotInFlight(false);
        setChargePower(0);
      }, 1500);
    }, 700);
  };

  return (
    <div className="h-full flex flex-col bg-[#070e17] text-white select-none relative overflow-hidden font-['Outfit']">
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

      {/* Top Bar */}
      <div className="px-4 md:px-8 py-3 bg-slate-950/80 border-b border-cyan-900/30 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 transition flex items-center gap-1.5 text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            Menu
          </button>
          <div>
            <h2 className="font-['Chakra_Petch'] font-black text-xl flex items-center gap-2 text-white">
              <Target className="w-5 h-5 text-cyan-400" />
              FREE-KICK PRACTICE ARENA
            </h2>
            <p className="text-[11px] text-white/50">Master curve, power, and target accuracy</p>
          </div>
        </div>

        {/* Score & Streak counter */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-cyan-500/30 px-5 py-2 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="text-right">
            <span className="text-[10px] text-cyan-400 uppercase font-mono block">Score</span>
            <span className="font-['Chakra_Petch'] font-black text-xl text-amber-300">{score}</span>
          </div>
          <div className="w-px h-6 bg-cyan-500/20" />
          <div>
            <span className="text-[10px] text-teal-400 uppercase font-mono block">Streak</span>
            <span className="font-['Chakra_Petch'] font-black text-xl text-cyan-300">x{streak}</span>
          </div>
        </div>
      </div>

      {/* Practice Stage */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Stadium turf perspective */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e2115] via-[#143e22] to-[#102b19] overflow-hidden" />

        {/* Goal Frame with Precision Targets */}
        <div 
          onClick={(e) => {
            if (isShotInFlight) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setAimPos({ x: Math.max(0.1, Math.min(0.9, x)), y: Math.max(0.1, Math.min(0.9, y)) });
          }}
          className="relative w-full max-w-xl aspect-[16/9] border-4 border-white rounded-t-lg bg-slate-950/25 shadow-2xl cursor-crosshair"
        >
          {/* Net */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />

          {/* Precision Target Rings */}
          {targets.map(t => (
            <div
              key={t.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/20 flex flex-col items-center justify-center shadow-lg shadow-amber-400/30 animate-pulse"
              style={{
                left: `${t.x * 100}%`,
                top: `${t.y * 100}%`,
                width: `${t.radius * 200}%`,
                height: `${t.radius * 200}%`,
              }}
            >
              <span className="font-['Chakra_Petch'] font-black text-[11px] text-amber-300 leading-none">{t.points}</span>
              <span className="text-[8px] font-bold text-white/80">{t.label}</span>
            </div>
          ))}

          {/* Aim Reticle Indicator */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-emerald-400 rounded-full flex items-center justify-center pointer-events-none transition-all duration-75 shadow-lg shadow-emerald-400/50"
            style={{
              left: `${aimPos.x * 100}%`,
              top: `${aimPos.y * 100}%`,
            }}
          >
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
        </div>

        {/* Soccer Ball */}
        <div
          className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 pointer-events-none z-20"
          style={{
            left: `${ballState.x}%`,
            top: `${ballState.y}%`,
            transform: `translate(-50%, -50%) scale(${ballState.scale})`,
          }}
        >
          <div className="w-full h-full rounded-full bg-white border-2 border-slate-900 shadow-2xl flex items-center justify-center text-xl">
            ⚽
          </div>
        </div>

        {/* Status Callout Banner */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-white/20 px-6 py-2 rounded-xl text-white font-['Outfit'] font-bold text-sm shadow-xl backdrop-blur-md">
          {statusMsg}
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-4 bg-slate-900/90 border border-white/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 z-10 max-w-4xl mx-auto w-full">
        {/* Kicker Tag */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-['Chakra_Petch'] font-black flex items-center justify-center text-lg">
            #{starPlayer.number}
          </div>
          <div>
            <div className="font-bold text-sm text-white">{starPlayer.name}</div>
            <div className="text-xs text-white/50 font-mono">Specialist: Curve & Power Shots</div>
          </div>
        </div>

        {/* Curve Adjuster Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/60">CURVE:</span>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={curve}
            onChange={(e) => setCurve(parseFloat(e.target.value))}
            className="w-28 accent-emerald-400 cursor-pointer"
          />
          <span className="text-xs font-mono text-emerald-400 font-bold w-10">
            {curve < 0 ? `◀ ${Math.abs(curve)}` : curve > 0 ? `▶ ${curve}` : 'FLAT'}
          </span>
        </div>

        {/* Power Bar */}
        <div className="flex-1 max-w-xs w-full">
          <div className="flex justify-between text-xs font-mono font-bold text-white/70 mb-1">
            <span>POWER</span>
            <span>{Math.round(chargePower * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/10">
            <div 
              className={`h-full transition-all duration-75 ${
                chargePower > 0.85 ? 'bg-rose-500' : chargePower > 0.5 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${chargePower * 100}%` }}
            />
          </div>
        </div>

        {/* Shoot Button */}
        <button
          onMouseDown={() => setIsCharging(true)}
          onMouseUp={handleShoot}
          onTouchStart={() => setIsCharging(true)}
          onTouchEnd={handleShoot}
          disabled={isShotInFlight}
          className="px-8 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          {isCharging ? 'RELEASE!' : 'HOLD TO SHOOT'}
        </button>
      </div>
    </div>
  );
};
