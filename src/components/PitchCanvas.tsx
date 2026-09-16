import React, { useRef, useEffect, useState } from 'react';
import { MatchEngine } from '../game/engine';
import { PITCH } from '../game/constants';
import { MatchPlayerEntity, ReplayPlayerState } from '../types/soccer';
import { Camera, FastForward, Play, Pause, X, Sparkles } from 'lucide-react';

interface PitchCanvasProps {
  engine: MatchEngine;
  weather?: 'Night' | 'Sunset' | 'Clear' | 'Rain';
}

export const PitchCanvas: React.FC<PitchCanvasProps> = ({ engine, weather = 'Night' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef({ x: PITCH.MARGIN_X + PITCH.LENGTH / 2, y: PITCH.MARGIN_Y + PITCH.WIDTH / 2, zoom: 0.95 });
  const [isReplayingState, setIsReplayingState] = useState(engine.isReplaying);
  const [replaySpeedState, setReplaySpeedState] = useState(engine.replaySpeed);
  const [cameraModeState, setCameraModeState] = useState(engine.replayCameraMode);
  const [, setRerenderTick] = useState(0);

  // Sync state with engine
  useEffect(() => {
    const timer = setInterval(() => {
      if (engine.isReplaying !== isReplayingState) {
        setIsReplayingState(engine.isReplaying);
      }
    }, 150);
    return () => clearInterval(timer);
  }, [engine, isReplayingState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Replay frame or Live match state
      const replayFrame = engine.getCurrentReplayFrame();
      const isReplay = engine.isReplaying && !!replayFrame;

      const ballPos = isReplay ? replayFrame!.ball : engine.ball.pos;
      const ballVel = isReplay ? { x: 0, y: 0 } : engine.ball.velocity;

      // Camera tracking
      let targetCamX = ballPos.x + ballVel.x * 10;
      let targetCamY = ballPos.y + ballVel.y * 10;
      let targetZoom = 0.95;

      if (isReplay) {
        if (engine.replayCameraMode === 'behindGoal') {
          // Behind goal angle looking into the pitch
          const isRight = ballPos.x > PITCH.MARGIN_X + PITCH.LENGTH / 2;
          targetCamX = isRight ? PITCH.MARGIN_X + PITCH.LENGTH + 40 : PITCH.MARGIN_X - 40;
          targetCamY = PITCH.MARGIN_Y + PITCH.WIDTH / 2;
          targetZoom = 1.08;
        } else if (engine.replayCameraMode === 'action') {
          // Tight dynamic zoom on ball and scorer
          targetCamX = ballPos.x;
          targetCamY = ballPos.y;
          targetZoom = 1.32;
        } else {
          // Broadcast replay
          targetCamX = ballPos.x;
          targetCamY = ballPos.y;
          targetZoom = 1.05;
        }
      } else {
        // Live match dynamic zoom
        const distToGoal = Math.min(
          Math.hypot(ballPos.x - PITCH.MARGIN_X, ballPos.y - (PITCH.MARGIN_Y + PITCH.WIDTH / 2)),
          Math.hypot(ballPos.x - (PITCH.MARGIN_X + PITCH.LENGTH), ballPos.y - (PITCH.MARGIN_Y + PITCH.WIDTH / 2))
        );
        targetZoom = distToGoal < 300 ? 1.05 : 0.92;
      }

      // Smooth camera lerp
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.08;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.08;
      cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * 0.04;

      // Camera Shake impact effect
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (engine.cameraShake > 0.01) {
        shakeOffsetX = (Math.random() - 0.5) * engine.cameraShake * 16;
        shakeOffsetY = (Math.random() - 0.5) * engine.cameraShake * 16;
      }

      // Background Fill (Stadium Atmosphere)
      ctx.fillStyle = weather === 'Night' ? '#070b14' : weather === 'Sunset' ? '#1c1024' : '#0d1829';
      ctx.fillRect(0, 0, width, height);

      // Center camera transformation
      ctx.save();
      ctx.translate(width / 2 + shakeOffsetX, height / 2 + shakeOffsetY);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // Draw Stadium Surroundings & Stands
      drawStadiumSurroundings(ctx, weather);

      // Draw Pitch Grass & Lines
      drawPitch(ctx);

      // Draw Goal Nets
      drawGoalNets(ctx);

      // Draw Players (Sorted by Y for correct 2.5D perspective)
      if (isReplay && replayFrame) {
        const replayPlayersSorted = [...replayFrame.players].sort((a, b) => a.y - b.y);
        for (const rp of replayPlayersSorted) {
          const original = (rp.team === 'home' ? engine.homePlayers : engine.awayPlayers).find(p => p.id === rp.id);
          if (original) {
            drawPlayerAvatar(ctx, original, rp.x, rp.y, rp.facingAngle, rp.runCycle, rp.animState, false, 0, engine);
          }
        }
        // Replay Ball
        drawBall(ctx, { pos: replayFrame.ball, velocity: { x: 0, y: 0, z: 0 }, spin: { x: 0, y: 0 }, isInGoal: false });
      } else {
        const allPlayers = [...engine.homePlayers, ...engine.awayPlayers].sort((a, b) => a.pos.y - b.pos.y);
        for (const p of allPlayers) {
          drawPlayerAvatar(
            ctx, 
            p, 
            p.pos.x, 
            p.pos.y, 
            p.facingAngle, 
            p.runCycle, 
            p.animState, 
            p.id === engine.userControlledId, 
            engine.getShootCharge(), 
            engine
          );
        }
        // Live Ball
        drawBall(ctx, engine.ball);
      }

      // Draw Corner Flags
      drawCornerFlags(ctx);

      ctx.restore();

      // Draw Tactical Mini-map Radar at bottom center (hidden during replay)
      if (!isReplay) {
        drawRadar(ctx, width, height, engine);
      }

      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [engine, weather]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block touch-none select-none"
      />

      {/* Instant Replay Interactive Broadcast Bar */}
      {isReplayingState && (
        <div className="absolute inset-x-0 bottom-6 px-4 max-w-2xl mx-auto z-40 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
            {/* Top Row: Replay Header & Camera Angles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider text-red-400">
                  HYPERMOTION INSTANT REPLAY
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-white/70">
                  {replaySpeedState === 0.5 ? '0.5x SLOW-MO' : '1.0x NORMAL'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Camera Angle Toggle */}
                <button
                  onClick={() => {
                    const modes: Array<'broadcast' | 'behindGoal' | 'action'> = ['broadcast', 'behindGoal', 'action'];
                    const nextMode = modes[(modes.indexOf(cameraModeState) + 1) % modes.length];
                    engine.setReplayCamera(nextMode);
                    setCameraModeState(nextMode);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white/80 hover:text-white rounded-lg text-xs font-['Chakra_Petch'] border border-white/15 transition"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="capitalize">{cameraModeState} Cam</span>
                </button>

                {/* Exit Replay */}
                <button
                  onClick={() => {
                    engine.exitInstantReplay();
                    setIsReplayingState(false);
                  }}
                  className="p-1 text-white/60 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Close Replay"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Scrubber & Playback Speed */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const nextSpeed = replaySpeedState === 0.5 ? 1.0 : 0.5;
                  engine.setReplaySpeed(nextSpeed);
                  setReplaySpeedState(nextSpeed);
                }}
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl border border-emerald-500/30 transition"
                title="Toggle Slow Motion"
              >
                <FastForward className="w-4 h-4" />
              </button>

              {/* Scrubber slider */}
              <input
                type="range"
                min={0}
                max={Math.max(1, engine.replayBuffer.length - 1)}
                value={Math.floor(engine.replayFrameIndex)}
                onChange={(e) => {
                  engine.replayFrameIndex = Number(e.target.value);
                  setRerenderTick(t => t + 1);
                }}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />

              <button
                onClick={() => {
                  engine.exitInstantReplay();
                  setIsReplayingState(false);
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider rounded-xl transition whitespace-nowrap shadow-lg shadow-emerald-500/20"
              >
                Resume Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// STADIUM & PITCH GRAPHICS
// -------------------------------------------------------------

function drawStadiumSurroundings(ctx: CanvasRenderingContext2D, weather: string) {
  const stadiumMargin = 170;
  const left = PITCH.MARGIN_X - stadiumMargin;
  const top = PITCH.MARGIN_Y - stadiumMargin;
  const right = PITCH.MARGIN_X + PITCH.LENGTH + stadiumMargin;
  const bottom = PITCH.MARGIN_Y + PITCH.WIDTH + stadiumMargin;

  // Outer turf/stadium apron
  ctx.fillStyle = '#143820';
  ctx.fillRect(left, top, right - left, bottom - top);

  // LED Perimeter Boards with neon animations
  const drawLedBoard = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    ctx.save();
    ctx.font = 'bold 11px "Chakra Petch", sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 6;
    const count = Math.floor(w / 180);
    for (let i = 0; i < count; i++) {
      ctx.fillText('EA SPORTS FC 26 • HYPERMOTION', x + 15 + i * 180, y + h - 4);
    }
    ctx.restore();
  };

  drawLedBoard(PITCH.MARGIN_X - 40, PITCH.MARGIN_Y - 26, PITCH.LENGTH + 80, 18);
  drawLedBoard(PITCH.MARGIN_X - 40, PITCH.MARGIN_Y + PITCH.WIDTH + 8, PITCH.LENGTH + 80, 18);

  // Stadium lights ambient glow
  if (weather === 'Night') {
    ctx.save();
    const grad = ctx.createRadialGradient(
      PITCH.MARGIN_X + PITCH.LENGTH / 2,
      PITCH.MARGIN_Y + PITCH.WIDTH / 2,
      120,
      PITCH.MARGIN_X + PITCH.LENGTH / 2,
      PITCH.MARGIN_Y + PITCH.WIDTH / 2,
      950
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(left, top, right - left, bottom - top);
    ctx.restore();
  }
}

function drawPitch(ctx: CanvasRenderingContext2D) {
  const x = PITCH.MARGIN_X;
  const y = PITCH.MARGIN_Y;
  const w = PITCH.LENGTH;
  const h = PITCH.WIDTH;

  // Authentic lawn pattern stripes
  const numStripes = 18;
  const stripeW = w / numStripes;

  for (let i = 0; i < numStripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1f7a37' : '#1a6f31';
    ctx.fillRect(x + i * stripeW, y, stripeW, h);
  }

  // Pitch boundary lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.strokeRect(x, y, w, h);

  // Halfway line & Center Circle
  const midX = x + w / 2;
  const midY = y + h / 2;
  ctx.beginPath();
  ctx.moveTo(midX, y);
  ctx.lineTo(midX, y + h);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, PITCH.CENTER_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(midX, midY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Penalty Boxes
  const penTop = midY - PITCH.PENALTY_BOX_WIDTH / 2;
  ctx.strokeRect(x, penTop, PITCH.PENALTY_BOX_LENGTH, PITCH.PENALTY_BOX_WIDTH);
  ctx.strokeRect(x + w - PITCH.PENALTY_BOX_LENGTH, penTop, PITCH.PENALTY_BOX_LENGTH, PITCH.PENALTY_BOX_WIDTH);

  // Goal Boxes
  const goalBoxTop = midY - PITCH.GOAL_BOX_WIDTH / 2;
  ctx.strokeRect(x, goalBoxTop, PITCH.GOAL_BOX_LENGTH, PITCH.GOAL_BOX_WIDTH);
  ctx.strokeRect(x + w - PITCH.GOAL_BOX_LENGTH, goalBoxTop, PITCH.GOAL_BOX_LENGTH, PITCH.GOAL_BOX_WIDTH);

  // Penalty spots & D-arcs
  ctx.beginPath();
  ctx.arc(x + PITCH.PENALTY_SPOT_DIST, midY, 4, 0, Math.PI * 2);
  ctx.arc(x + w - PITCH.PENALTY_SPOT_DIST, midY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoalNets(ctx: CanvasRenderingContext2D) {
  const goalTop = PITCH.MARGIN_Y + (PITCH.WIDTH - PITCH.GOAL_WIDTH) / 2;
  const goalH = PITCH.GOAL_WIDTH;
  const depth = 26;

  // Left Goal Net
  ctx.fillStyle = 'rgba(230, 235, 245, 0.15)';
  ctx.fillRect(PITCH.MARGIN_X - depth, goalTop, depth, goalH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let ny = goalTop; ny <= goalTop + goalH; ny += 10) {
    ctx.beginPath();
    ctx.moveTo(PITCH.MARGIN_X - depth, ny);
    ctx.lineTo(PITCH.MARGIN_X, ny);
    ctx.stroke();
  }

  // Left Posts
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4.5;
  ctx.strokeRect(PITCH.MARGIN_X - depth, goalTop, depth, goalH);

  // Right Goal Net
  const rightX = PITCH.MARGIN_X + PITCH.LENGTH;
  ctx.fillStyle = 'rgba(230, 235, 245, 0.15)';
  ctx.fillRect(rightX, goalTop, depth, goalH);
  for (let ny = goalTop; ny <= goalTop + goalH; ny += 10) {
    ctx.beginPath();
    ctx.moveTo(rightX, ny);
    ctx.lineTo(rightX + depth, ny);
    ctx.stroke();
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4.5;
  ctx.strokeRect(rightX, goalTop, depth, goalH);
}

function drawCornerFlags(ctx: CanvasRenderingContext2D) {
  const flags = [
    { x: PITCH.MARGIN_X, y: PITCH.MARGIN_Y },
    { x: PITCH.MARGIN_X + PITCH.LENGTH, y: PITCH.MARGIN_Y },
    { x: PITCH.MARGIN_X + PITCH.LENGTH, y: PITCH.MARGIN_Y + PITCH.WIDTH },
    { x: PITCH.MARGIN_X, y: PITCH.MARGIN_Y + PITCH.WIDTH },
  ];

  flags.forEach(f => {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(f.x, f.y - 16);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(f.x, f.y - 16);
    ctx.lineTo(f.x + 9, f.y - 12);
    ctx.lineTo(f.x, f.y - 8);
    ctx.closePath();
    ctx.fill();
  });
}

// -------------------------------------------------------------
// REALISTIC 2.5D PLAYER AVATAR RENDERER
// -------------------------------------------------------------

function drawPlayerAvatar(
  ctx: CanvasRenderingContext2D,
  p: MatchPlayerEntity,
  x: number,
  y: number,
  facingAngle: number,
  runCycle: number,
  animState: string,
  isUserControlled: boolean,
  shootCharge: number,
  engine: MatchEngine
) {
  const teamObj = p.team === 'home' ? engine.homeTeam : engine.awayTeam;
  const kit = teamObj.kit;
  const likeness = p.player.likeness || {
    skinTone: '#e0ac69',
    hairStyle: 'short',
    hairColor: '#261b11',
    bootColor: '#22c55e',
  };

  const isGK = p.player.isGoalkeeper;
  const isTackling = animState === 'tackling' || p.isTackling;
  const isCelebrating = animState === 'celebrating';

  // 1. Slide Tackle Skid Marks & Particles
  if (isTackling) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(facingAngle) * 32, y - Math.sin(facingAngle) * 32);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Turf kick-up specks
    ctx.fillStyle = '#155724';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Realistic Dynamic Drop Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  const shadowLength = isTackling ? 22 : 14;
  ctx.ellipse(x, y + 4, shadowLength, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Render Animated Limbs, Torso & Head
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facingAngle);

  // Leg Swing Strides based on runCycle
  const legSwing = isTackling ? 10 : isCelebrating ? 0 : Math.sin(runCycle) * 6;
  const armSwing = isTackling ? -6 : isCelebrating ? 12 : Math.cos(runCycle) * 5;

  // --- LEGS & BOOTS ---
  const drawLeg = (sideY: number, swing: number) => {
    // Shorts
    ctx.fillStyle = isGK ? '#111827' : kit.shorts;
    ctx.beginPath();
    ctx.roundRect(-4, sideY - 3, 7, 6, 2);
    ctx.fill();

    // Socks
    ctx.fillStyle = isGK ? '#eab308' : kit.socks;
    ctx.beginPath();
    ctx.roundRect(swing, sideY - 2, 8, 4, 1.5);
    ctx.fill();

    // Boots (Player Likeness Boot Color)
    ctx.fillStyle = likeness.bootColor;
    ctx.beginPath();
    ctx.roundRect(swing + 6, sideY - 2.5, 6, 5, 2);
    ctx.fill();
  };

  drawLeg(-6, legSwing);
  drawLeg(6, -legSwing);

  // --- TORSO / JERSEY ---
  ctx.save();
  const jerseyW = 18;
  const jerseyH = 20;

  // Base jersey fill
  ctx.fillStyle = isGK ? '#06b6d4' : kit.primary;
  ctx.beginPath();
  ctx.roundRect(-jerseyW / 2, -jerseyH / 2, jerseyW, jerseyH, 4);
  ctx.fill();

  // Jersey Patterns (Stripes, Hoops, Sash, Split)
  if (!isGK && kit.pattern) {
    ctx.fillStyle = kit.secondary;
    if (kit.pattern === 'stripes') {
      ctx.fillRect(-jerseyW / 2 + 4, -jerseyH / 2, 4, jerseyH);
      ctx.fillRect(-jerseyW / 2 + 11, -jerseyH / 2, 4, jerseyH);
    } else if (kit.pattern === 'hoops') {
      ctx.fillRect(-jerseyW / 2, -jerseyH / 2 + 4, jerseyW, 4);
      ctx.fillRect(-jerseyW / 2, -jerseyH / 2 + 12, jerseyW, 4);
    } else if (kit.pattern === 'split') {
      ctx.fillRect(0, -jerseyH / 2, jerseyW / 2, jerseyH);
    }
  }

  // Collar trim
  ctx.strokeStyle = isGK ? '#ffffff' : kit.secondary;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-jerseyW / 2, -jerseyH / 2, jerseyW, jerseyH);
  ctx.restore();

  // --- ARMS & HANDS / GOALIE GLOVES ---
  const drawArm = (sideY: number, swing: number) => {
    ctx.fillStyle = isGK ? '#06b6d4' : kit.primary;
    ctx.beginPath();
    ctx.roundRect(-2, sideY - 2.5, 8 + swing, 5, 2);
    ctx.fill();

    // Hand / Gloves
    if (isGK) {
      // Padded neon goalkeeper gloves
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(6 + swing, sideY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Skin tone hand
      ctx.fillStyle = likeness.skinTone;
      ctx.beginPath();
      ctx.arc(6 + swing, sideY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  drawArm(-11, armSwing);
  drawArm(11, -armSwing);

  // --- HEAD & HAIRSTYLE ---
  // Skin tone base head
  ctx.fillStyle = likeness.skinTone;
  ctx.beginPath();
  ctx.arc(2, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Hairstyle rendering (crew cut, fade, afro/curly, dreads, slick, buzz)
  ctx.fillStyle = likeness.hairColor;
  if (likeness.hairStyle === 'fade') {
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, Math.PI * 0.4, Math.PI * 1.6);
    ctx.fill();
  } else if (likeness.hairStyle === 'curly' || likeness.hairStyle === 'dreads') {
    for (let h = -4; h <= 4; h += 2.5) {
      ctx.beginPath();
      ctx.arc(-1, h, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (likeness.hairStyle === 'slick') {
    ctx.beginPath();
    ctx.ellipse(-2, 0, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Classic short/buzz cut
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
  }

  // Facing Nose/Visor indicator
  ctx.fillStyle = likeness.skinTone;
  ctx.beginPath();
  ctx.arc(7.5, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // End rotation

  // 4. Squad Number on Jersey Back
  ctx.fillStyle = kit.numberColor || '#ffffff';
  ctx.font = '900 8px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.player.number.toString(), x - 2, y);

  // 5. Overhead Indicator & Name Plate for User Controlled Player
  if (isUserControlled) {
    const overheadY = y - 26;

    // Glowing Inverted Triangle
    ctx.save();
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x, overheadY + 8);
    ctx.lineTo(x - 5, overheadY);
    ctx.lineTo(x + 5, overheadY);
    ctx.closePath();
    ctx.fill();

    // Player Pill Tag with PlayStyle Icon
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 15, 29, 0.88)';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;

    const playStyleBadge = p.player.playStyles?.[0] ? ' ⭐' : '';
    const labelText = `${p.player.shortName}${playStyleBadge}`;
    ctx.font = 'bold 9px "Outfit", sans-serif';
    const tagW = ctx.measureText(labelText).width + 16;
    ctx.roundRect(x - tagW / 2, overheadY - 16, tagW, 14, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(labelText, x, overheadY - 8);

    // Chargeable Power Shot Meter
    if (shootCharge > 0) {
      const barW = 36;
      const barH = 5;
      const barX = x - barW / 2;
      const barY = overheadY - 24;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(barX, barY, barW, barH);

      const fillW = barW * shootCharge;
      ctx.fillStyle = shootCharge > 0.85 ? '#ef4444' : shootCharge > 0.5 ? '#f59e0b' : '#22c55e';
      ctx.fillRect(barX, barY, fillW, barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    ctx.restore();
  }
}

function drawBall(ctx: CanvasRenderingContext2D, ball: { pos: { x: number; y: number; z: number }; velocity: { x: number; y: number; z: number }; spin: { x: number; y: number }; isInGoal: boolean }) {
  const x = ball.pos.x;
  const y = ball.pos.y;
  const z = ball.pos.z;
  const radius = 6.5;

  // 1. 3D Ball Shadow on Grass
  const shadowScale = Math.max(0.4, 1 - z * 0.015);
  const shadowAlpha = Math.max(0.1, 0.45 - z * 0.007);
  ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(x + z * 0.4, y + 4 + z * 0.4, radius * 1.3 * shadowScale, radius * 0.8 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. High-speed trail
  const speed = Math.hypot(ball.velocity.x, ball.velocity.y);
  if (speed > 8) {
    ctx.save();
    ctx.strokeStyle = speed > 13 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = radius * 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - ball.velocity.x * 2.5, (y - z) - ball.velocity.y * 2.5);
    ctx.lineTo(x, y - z);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Ball Body
  const ballY = y - z;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, ballY, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Pentagon pattern
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(x - 1, ballY - 1, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Specular light
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(x - 2, ballY - 2, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRadar(
  ctx: CanvasRenderingContext2D, 
  canvasW: number, 
  canvasH: number, 
  engine: MatchEngine
) {
  const radarW = 200;
  const radarH = 125;
  const radarX = canvasW / 2 - radarW / 2;
  const radarY = canvasH - radarH - 24;

  ctx.save();
  ctx.fillStyle = 'rgba(10, 15, 29, 0.75)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(radarX, radarY, radarW, radarH, 10);
  ctx.fill();
  ctx.stroke();

  // Pitch boundary on radar
  const pad = 6;
  const innerW = radarW - pad * 2;
  const innerH = radarH - pad * 2;
  const innerX = radarX + pad;
  const innerY = radarY + pad;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(innerX, innerY, innerW, innerH);

  // Halfway line & circle
  ctx.beginPath();
  ctx.moveTo(innerX + innerW / 2, innerY);
  ctx.lineTo(innerX + innerW / 2, innerY + innerH);
  ctx.stroke();

  const scaleX = innerW / PITCH.LENGTH;
  const scaleY = innerH / PITCH.WIDTH;

  const toRadarX = (px: number) => innerX + (px - PITCH.MARGIN_X) * scaleX;
  const toRadarY = (py: number) => innerY + (py - PITCH.MARGIN_Y) * scaleY;

  // Home Players (Cyan blips)
  ctx.fillStyle = '#38bdf8';
  for (const p of engine.homePlayers) {
    ctx.beginPath();
    ctx.arc(toRadarX(p.pos.x), toRadarY(p.pos.y), 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Away Players (Rose blips)
  ctx.fillStyle = '#f43f5e';
  for (const p of engine.awayPlayers) {
    ctx.beginPath();
    ctx.arc(toRadarX(p.pos.x), toRadarY(p.pos.y), 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ball (Bright Yellow Pulse)
  ctx.fillStyle = '#facc15';
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(toRadarX(engine.ball.pos.x), toRadarY(engine.ball.pos.y), 3.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
