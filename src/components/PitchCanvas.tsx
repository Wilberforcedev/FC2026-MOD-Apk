import React, { useRef, useEffect, useState } from 'react';

const STATIC_SCENE_PADDING = 240;
import { MatchEngine } from '../game/engine';
import { PITCH } from '../game/constants';
import { MatchPlayerEntity, ReplayPlayerState, Team } from '../types/soccer';
import { Camera, FastForward, Play, Pause, X, Sparkles } from 'lucide-react';
import { getStadiumForTeam, StadiumLikeness } from '../data/stadiums';

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

    // Static stadium/pitch art is identical across frames. Render it once to an
    // offscreen canvas and composite it each frame instead of rebuilding hundreds
    // of paths, gradients, seats and lines at 60 FPS.
    const stadium = getStadiumForTeam(engine.homeTeam?.id);
    const staticCanvas = document.createElement('canvas');
    staticCanvas.width = Math.ceil(PITCH.LENGTH + STATIC_SCENE_PADDING * 2);
    staticCanvas.height = Math.ceil(PITCH.WIDTH + STATIC_SCENE_PADDING * 2);
    const staticCtx = staticCanvas.getContext('2d');
    if (staticCtx) {
      staticCtx.translate(STATIC_SCENE_PADDING - PITCH.MARGIN_X, STATIC_SCENE_PADDING - PITCH.MARGIN_Y);
      drawStadiumSurroundings(staticCtx, weather, stadium, engine);
      drawPitch(staticCtx, stadium);
      drawGoalNets(staticCtx);
      drawCornerFlags(staticCtx);
    }

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
      ctx.fillStyle = weather === 'Night' ? stadium.ambientSky : weather === 'Sunset' ? '#1c1024' : '#0d1829';
      ctx.fillRect(0, 0, width, height);

      // Center camera transformation
      ctx.save();
      ctx.translate(width / 2 + shakeOffsetX, height / 2 + shakeOffsetY);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // Composite the pre-rendered static stadium scene.
      ctx.drawImage(staticCanvas, PITCH.MARGIN_X - STATIC_SCENE_PADDING, PITCH.MARGIN_Y - STATIC_SCENE_PADDING);

      // Draw Players (Sorted by Y for correct 2.5D perspective)
      if (isReplay && replayFrame) {
        const replayPlayersSorted = replayFrame.players.slice().sort((a, b) => a.y - b.y);
        for (const rp of replayPlayersSorted) {
          const original = (rp.team === 'home' ? engine.homePlayers : engine.awayPlayers).find(p => p.id === rp.id);
          if (original) {
            drawPlayerAvatar(ctx, original, rp.x, rp.y, rp.facingAngle, rp.runCycle, rp.animState, false, 0, engine);
          }
        }
        // Replay Ball
        drawBall(ctx, { pos: replayFrame.ball, velocity: { x: 0, y: 0, z: 0 }, spin: { x: 0, y: 0 }, isInGoal: false });
      } else {
        const allPlayers = engine.homePlayers.concat(engine.awayPlayers);
        allPlayers.sort((a, b) => a.pos.y - b.pos.y);
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
// STADIUM & PITCH GRAPHICS (Authentic Stadium Likeness)
// -------------------------------------------------------------

export interface CanvasEngineContext {
  homeTeam: Team;
  awayTeam: Team;
}

export function drawStadiumSurroundings(
  ctx: CanvasRenderingContext2D,
  weather: string,
  stadium: StadiumLikeness,
  engine: CanvasEngineContext
) {
  const stadiumMargin = 220;
  const left = PITCH.MARGIN_X - stadiumMargin;
  const top = PITCH.MARGIN_Y - stadiumMargin;
  const right = PITCH.MARGIN_X + PITCH.LENGTH + stadiumMargin;
  const bottom = PITCH.MARGIN_Y + PITCH.WIDTH + stadiumMargin;

  // 1. Stadium Seating Tiers & Grandstands
  const crowdColors = stadium.crowdColors || ['#ffffff', '#0ea5e9', '#0284c7', '#0f172a'];
  
  // Upper Grandstand Bowl Background
  ctx.fillStyle = '#080d18';
  ctx.fillRect(left, top, right - left, bottom - top);

  // Grandstand Tier Stepping (North, South, East, West stands)
  const drawGrandstand = (gx: number, gy: number, gw: number, gh: number, orientation: 'horizontal' | 'vertical') => {
    // Stepped concrete terraces
    const numTiers = 6;
    const tierSize = orientation === 'horizontal' ? gh / numTiers : gw / numTiers;

    for (let t = 0; t < numTiers; t++) {
      ctx.fillStyle = t % 2 === 0 ? '#111827' : '#0b1120';
      if (orientation === 'horizontal') {
        ctx.fillRect(gx, gy + t * tierSize, gw, tierSize);
      } else {
        ctx.fillRect(gx + t * tierSize, gy, tierSize, gh);
      }

      // Populate supporters/spectators in seats
      const numSupporters = Math.floor((orientation === 'horizontal' ? gw : gh) / 14);
      for (let s = 0; s < numSupporters; s++) {
        const colorIdx = (t * 7 + s * 13) % crowdColors.length;
        ctx.fillStyle = crowdColors[colorIdx];
        
        // Supporter shirt & head
        if (orientation === 'horizontal') {
          const sx = gx + s * 14 + (t % 2) * 4;
          const sy = gy + t * tierSize + tierSize * 0.4;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const sx = gx + t * tierSize + tierSize * 0.4;
          const sy = gy + s * 14 + (t % 2) * 4;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  // Top North Stand
  drawGrandstand(left, top, right - left, stadiumMargin - 45, 'horizontal');
  // Bottom South Stand
  drawGrandstand(left, PITCH.MARGIN_Y + PITCH.WIDTH + 45, right - left, stadiumMargin - 45, 'horizontal');
  // Left West Stand
  drawGrandstand(left, PITCH.MARGIN_Y - 40, stadiumMargin - 45, PITCH.WIDTH + 80, 'vertical');
  // Right East Stand
  drawGrandstand(PITCH.MARGIN_X + PITCH.LENGTH + 45, PITCH.MARGIN_Y - 40, stadiumMargin - 45, PITCH.WIDTH + 80, 'vertical');

  // 2. Supporter Ultras Banners & Tifos
  const drawBanner = (bx: number, by: number, bw: number, bh: number, text: string, bgColor: string, textColor: string) => {
    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = '900 10px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + bw / 2, by + bh / 2);
    ctx.restore();
  };

  // West End Ultra Banner (Home Team)
  drawBanner(
    PITCH.MARGIN_X - 120,
    PITCH.MARGIN_Y + PITCH.WIDTH / 2 - 35,
    70,
    18,
    engine.homeTeam.shortName.toUpperCase(),
    engine.homeTeam.kit.primary,
    '#ffffff'
  );
  drawBanner(
    PITCH.MARGIN_X - 120,
    PITCH.MARGIN_Y + PITCH.WIDTH / 2 + 15,
    70,
    18,
    'ULTRAS 1902',
    '#0f172a',
    '#38bdf8'
  );

  // East End Ultra Banner (Away Team or Stadium Heritage)
  drawBanner(
    PITCH.MARGIN_X + PITCH.LENGTH + 50,
    PITCH.MARGIN_Y + PITCH.WIDTH / 2 - 10,
    70,
    18,
    engine.awayTeam.shortName.toUpperCase(),
    engine.awayTeam.kit.primary,
    '#ffffff'
  );

  // 3. Outer Turf Apron & Technical Dugouts
  ctx.fillStyle = stadium.grassColorDark || '#143820';
  ctx.fillRect(PITCH.MARGIN_X - 45, PITCH.MARGIN_Y - 35, PITCH.LENGTH + 90, PITCH.WIDTH + 70);

  // 4. Team Technical Areas & Dugouts
  const drawDugout = (dx: number, dy: number, teamName: string, teamColor: string) => {
    ctx.save();
    ctx.fillStyle = '#0a0f1d';
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(dx, dy, 70, 14, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${teamName} BENCH`, dx + 35, dy + 9);
    ctx.restore();
  };

  drawDugout(PITCH.MARGIN_X + PITCH.LENGTH * 0.28, PITCH.MARGIN_Y - 32, engine.homeTeam.shortName, engine.homeTeam.kit.primary);
  drawDugout(PITCH.MARGIN_X + PITCH.LENGTH * 0.62, PITCH.MARGIN_Y - 32, engine.awayTeam.shortName, engine.awayTeam.kit.primary);

  // 5. Authentic Stadium Animated LED Perimeter Boards
  const drawLedBoard = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, y, w, h);

    const banners = stadium.ledBanners && stadium.ledBanners.length > 0 
      ? stadium.ledBanners 
      : ['EA SPORTS FC 26', 'HYPERMOTION V', 'OFFICIAL MATCHDAY'];

    ctx.save();
    ctx.font = '900 9px "Chakra Petch", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 4;
    const bannerSpacing = 220;
    const count = Math.ceil(w / bannerSpacing) + 1;
    for (let i = 0; i < count; i++) {
      const bannerText = banners[i % banners.length];
      ctx.fillText(bannerText, x + 10 + i * bannerSpacing, y + h - 4);
    }
    ctx.restore();
  };

  // Top and Bottom LED boards
  drawLedBoard(PITCH.MARGIN_X - 40, PITCH.MARGIN_Y - 18, PITCH.LENGTH + 80, 14);
  drawLedBoard(PITCH.MARGIN_X - 40, PITCH.MARGIN_Y + PITCH.WIDTH + 4, PITCH.LENGTH + 80, 14);

  // 6. Stadium Marquee Arch (Center Top Banner)
  ctx.save();
  const marqueeW = 380;
  const marqueeH = 22;
  const marqueeX = PITCH.MARGIN_X + (PITCH.LENGTH - marqueeW) / 2;
  const marqueeY = PITCH.MARGIN_Y - stadiumMargin + 10;
  ctx.fillStyle = 'rgba(6, 10, 20, 0.92)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(marqueeX, marqueeY, marqueeW, marqueeH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 9.5px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 6;
  ctx.fillText(
    `🏟️ ${stadium.name.toUpperCase()} • ${stadium.capacity.toLocaleString()} SEATS`,
    marqueeX + marqueeW / 2,
    marqueeY + 14
  );
  ctx.restore();

  // 7. Corner Stadium Floodlight Towers with Volumetric Night Beams
  const cornerLights = [
    { x: PITCH.MARGIN_X - 60, y: PITCH.MARGIN_Y - 60, aimX: PITCH.MARGIN_X + 150, aimY: PITCH.MARGIN_Y + 150 },
    { x: PITCH.MARGIN_X + PITCH.LENGTH + 60, y: PITCH.MARGIN_Y - 60, aimX: PITCH.MARGIN_X + PITCH.LENGTH - 150, aimY: PITCH.MARGIN_Y + 150 },
    { x: PITCH.MARGIN_X - 60, y: PITCH.MARGIN_Y + PITCH.WIDTH + 60, aimX: PITCH.MARGIN_X + 150, aimY: PITCH.MARGIN_Y + PITCH.WIDTH - 150 },
    { x: PITCH.MARGIN_X + PITCH.LENGTH + 60, y: PITCH.MARGIN_Y + PITCH.WIDTH + 60, aimX: PITCH.MARGIN_X + PITCH.LENGTH - 150, aimY: PITCH.MARGIN_Y + PITCH.WIDTH - 150 },
  ];

  cornerLights.forEach(light => {
    // Pylon Base & Tower
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(light.x, light.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(light.x, light.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Night Volumetric Floodlight Cone
    if (weather === 'Night') {
      const coneGrad = ctx.createRadialGradient(light.x, light.y, 5, light.x, light.y, 320);
      coneGrad.addColorStop(0, 'rgba(235, 245, 255, 0.22)');
      coneGrad.addColorStop(0.5, 'rgba(215, 240, 255, 0.06)');
      coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(light.x, light.y);
      ctx.arc(light.x, light.y, 320, Math.atan2(light.aimY - light.y, light.aimX - light.x) - 0.5, Math.atan2(light.aimY - light.y, light.aimX - light.x) + 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });

  // Overall Stadium Night Center Glow
  if (weather === 'Night') {
    ctx.save();
    const grad = ctx.createRadialGradient(
      PITCH.MARGIN_X + PITCH.LENGTH / 2,
      PITCH.MARGIN_Y + PITCH.WIDTH / 2,
      100,
      PITCH.MARGIN_X + PITCH.LENGTH / 2,
      PITCH.MARGIN_Y + PITCH.WIDTH / 2,
      900
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(left, top, right - left, bottom - top);
    ctx.restore();
  }
}

export function drawPitch(ctx: CanvasRenderingContext2D, stadium: StadiumLikeness) {
  const x = PITCH.MARGIN_X;
  const y = PITCH.MARGIN_Y;
  const w = PITCH.LENGTH;
  const h = PITCH.WIDTH;

  const darkGrass = stadium.grassColorDark || '#16652b';
  const lightGrass = stadium.grassColorLight || '#1f7a37';
  const pattern = stadium.lawnPattern || 'stripes';

  // Base grass fill
  ctx.fillStyle = darkGrass;
  ctx.fillRect(x, y, w, h);

  // Authentic lawn mowing patterns
  if (pattern === 'checkerboard') {
    const cols = 18;
    const rows = 12;
    const cw = w / cols;
    const ch = h / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if ((c + r) % 2 === 0) {
          ctx.fillStyle = lightGrass;
          ctx.fillRect(x + c * cw, y + r * ch, cw, ch);
        }
      }
    }
  } else if (pattern === 'diagonal') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const stripeW = 45;
    const diagonalCount = Math.ceil((w + h) / stripeW);
    for (let i = 0; i < diagonalCount; i += 2) {
      ctx.fillStyle = lightGrass;
      ctx.beginPath();
      ctx.moveTo(x + i * stripeW - h, y + h);
      ctx.lineTo(x + (i + 1) * stripeW - h, y + h);
      ctx.lineTo(x + (i + 1) * stripeW, y);
      ctx.lineTo(x + i * stripeW, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (pattern === 'concentric') {
    const midX = x + w / 2;
    const midY = y + h / 2;
    const maxRadius = Math.hypot(w / 2, h / 2);
    const ringW = 40;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    for (let r = ringW; r < maxRadius; r += ringW * 2) {
      ctx.fillStyle = lightGrass;
      ctx.beginPath();
      ctx.arc(midX, midY, r + ringW, 0, Math.PI * 2);
      ctx.arc(midX, midY, r, Math.PI * 2, 0, true);
      ctx.fill();
    }
    ctx.restore();
  } else {
    // Default vertical lawn stripes
    const numStripes = 18;
    const stripeW = w / numStripes;
    for (let i = 0; i < numStripes; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = lightGrass;
        ctx.fillRect(x + i * stripeW, y, stripeW, h);
      }
    }
  }

  // Pitch boundary lines (crisp regulation white lines)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
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

export function drawGoalNets(ctx: CanvasRenderingContext2D) {
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

export function drawCornerFlags(ctx: CanvasRenderingContext2D) {
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
// REALISTIC ATHLETIC PLAYER LIKENESS RENDERER
// -------------------------------------------------------------

export function drawPlayerAvatar(
  ctx: CanvasRenderingContext2D,
  p: MatchPlayerEntity,
  x: number,
  y: number,
  facingAngle: number,
  runCycle: number,
  animState: string,
  isUserControlled: boolean,
  shootCharge: number,
  engine: CanvasEngineContext
) {
  const teamObj = p.team === 'home' ? engine.homeTeam : engine.awayTeam;
  const kit = teamObj.kit;
  const likeness = p.player.likeness || {
    skinTone: '#d49b6a',
    hairStyle: 'short',
    hairColor: '#1a1412',
    facialHair: 'none',
    bootColor: '#22c55e',
  };

  const isGK = p.player.isGoalkeeper;
  const isTackling = animState === 'tackling' || p.isTackling;
  const isCelebrating = animState === 'celebrating';

  // 1. Slide Tackle Skid Marks & Realistic Turf Kick-Up
  if (isTackling) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(facingAngle) * 34, y - Math.sin(facingAngle) * 34);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = '#14532d';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(x + (Math.random() - 0.5) * 18, y + (Math.random() - 0.5) * 12, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Realistic Anisotropic Ground Drop Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  const shadowLength = isTackling ? 24 : 15;
  ctx.ellipse(x, y + 4, shadowLength, 8, facingAngle * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Render Animated Realistic Human Athlete
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facingAngle);

  // Stride calculations
  const legSwing = isTackling ? 11 : isCelebrating ? 0 : Math.sin(runCycle) * 7;
  const armSwing = isTackling ? -7 : isCelebrating ? 14 : Math.cos(runCycle) * 6;

  // --- LEGS, SOCKS & PROFESSIONAL FOOTBALL CLEATS ---
  const drawLeg = (sideY: number, swing: number, isLeft: boolean) => {
    // Athletic Shorts with Realistic Cut
    ctx.fillStyle = isGK ? '#0f172a' : kit.shorts;
    ctx.beginPath();
    ctx.roundRect(-5, sideY - 3.5, 8, 7, 2.5);
    ctx.fill();

    // Leg shadow/inner seam
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(-1, sideY - (isLeft ? 0 : 3.5), 4, 3.5);

    // Socks with Realistic Muscle Curvature
    ctx.fillStyle = isGK ? '#f59e0b' : kit.socks;
    ctx.beginPath();
    ctx.roundRect(swing - 1, sideY - 2.5, 9, 5, 2);
    ctx.fill();

    // Sock Ring/Trim
    ctx.fillStyle = kit.secondary;
    ctx.fillRect(swing + 5, sideY - 2.5, 1.5, 5);

    // Realistic Football Boot / Cleat
    ctx.save();
    ctx.fillStyle = likeness.bootColor || '#22c55e';
    ctx.beginPath();
    // Cleat silhouette: tapered toe and heel counter
    ctx.roundRect(swing + 6, sideY - 3, 7.5, 6, [2, 4, 4, 2]);
    ctx.fill();

    // Cleat side stripes (branded aerodynamic detail)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(swing + 8, sideY - 1, 3.5, 1.2);

    // Cleat Studs shadow on turf
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(swing + 11, sideY - 2, 2, 4);
    ctx.restore();
  };

  drawLeg(-7, legSwing, true);
  drawLeg(7, -legSwing, false);

  // --- ATHLETIC TORSO & FITTED MATCH JERSEY ---
  ctx.save();
  const jerseyW = 20;
  const jerseyH = 22;

  // Base jersey fill with ergonomic fit
  ctx.fillStyle = isGK ? '#06b6d4' : kit.primary;
  ctx.beginPath();
  // Trapezius and shoulder taper
  ctx.roundRect(-jerseyW / 2, -jerseyH / 2, jerseyW, jerseyH, 4);
  ctx.fill();

  // Subtle Jersey Fabric Highlight & Crease Shading
  const jerseyShade = ctx.createLinearGradient(-jerseyW / 2, 0, jerseyW / 2, 0);
  jerseyShade.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
  jerseyShade.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
  jerseyShade.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = jerseyShade;
  ctx.beginPath();
  ctx.roundRect(-jerseyW / 2, -jerseyH / 2, jerseyW, jerseyH, 4);
  ctx.fill();

  // Jersey Patterns (Stripes, Hoops, Sash, Split)
  if (!isGK && kit.pattern) {
    ctx.fillStyle = kit.secondary;
    if (kit.pattern === 'stripes') {
      ctx.fillRect(-jerseyW / 2 + 5, -jerseyH / 2, 4, jerseyH);
      ctx.fillRect(-jerseyW / 2 + 12, -jerseyH / 2, 4, jerseyH);
    } else if (kit.pattern === 'hoops') {
      ctx.fillRect(-jerseyW / 2, -jerseyH / 2 + 5, jerseyW, 4);
      ctx.fillRect(-jerseyW / 2, -jerseyH / 2 + 13, jerseyW, 4);
    } else if (kit.pattern === 'split') {
      ctx.fillRect(0, -jerseyH / 2, jerseyW / 2, jerseyH);
    }
  }

  // Club Crest Patch on Left Chest
  ctx.fillStyle = kit.secondary;
  ctx.beginPath();
  ctx.arc(3, -5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Sponsor Branding Bar across chest
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(-1, -4, 2, 8);

  // V-Neck Collar Trim
  ctx.strokeStyle = isGK ? '#ffffff' : kit.secondary;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(jerseyW / 2 - 2, -3);
  ctx.lineTo(jerseyW / 2 + 2, 0);
  ctx.lineTo(jerseyW / 2 - 2, 3);
  ctx.stroke();
  ctx.restore();

  // --- ARMS, MUSCULATURE & HANDS / GOALKEEPER GLOVES ---
  const drawArm = (sideY: number, swing: number, isLeft: boolean) => {
    // Upper Arm Sleeve
    ctx.fillStyle = isGK ? '#06b6d4' : kit.primary;
    ctx.beginPath();
    ctx.roundRect(-3, sideY - 3, 6, 6, 2);
    ctx.fill();

    // Forearm with natural skin tone
    ctx.fillStyle = likeness.skinTone;
    ctx.beginPath();
    ctx.roundRect(2, sideY - 2.5, 7 + swing * 0.8, 5, 2);
    ctx.fill();

    // Wristband / Athletic Tape
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7 + swing * 0.8, sideY - 2.5, 1.5, 5);

    // Hands or Goalkeeper Gloves
    if (isGK) {
      // Pro Padded Goalkeeper Gloves
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(10 + swing * 0.8, sideY, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10 + swing * 0.8, sideY, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Natural Anatomical Hand
      ctx.fillStyle = likeness.skinTone;
      ctx.beginPath();
      ctx.arc(9.5 + swing * 0.8, sideY, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  drawArm(-12, armSwing, true);
  drawArm(12, -armSwing, false);

  // --- ANATOMICAL HEAD & AUTHENTIC REALISTIC HAIRSTYLE ---
  ctx.save();
  // Realistic neck connection
  ctx.fillStyle = likeness.skinTone;
  ctx.fillRect(0, -3, 5, 6);

  // Cranium base
  ctx.beginPath();
  ctx.ellipse(3, 0, 7.2, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Natural Ears
  ctx.fillStyle = likeness.skinTone;
  ctx.beginPath();
  ctx.arc(2, -6.6, 1.6, 0, Math.PI * 2);
  ctx.arc(2, 6.6, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Realistic Hairstyle with Volume, Directional Lighting & Taper Fade
  ctx.fillStyle = likeness.hairColor || '#1a1412';
  const hair = likeness.hairStyle || 'short';

  if (hair === 'fade') {
    // Scalp taper fade gradient on back & sides
    ctx.save();
    ctx.fillStyle = likeness.hairColor;
    ctx.beginPath();
    ctx.ellipse(1.5, 0, 6.2, 5.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // High textured top
    ctx.fillStyle = likeness.hairColor;
    ctx.beginPath();
    ctx.ellipse(3.5, 0, 4.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (hair === 'curly' || hair === 'dreads') {
    // Volumetric 3D curls / textured locks
    ctx.save();
    for (let angle = -Math.PI * 0.8; angle <= Math.PI * 0.8; angle += 0.35) {
      const hx = 2 + Math.cos(angle) * 5.8;
      const hy = Math.sin(angle) * 5.8;
      ctx.fillStyle = likeness.hairColor;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Crown volume
    ctx.beginPath();
    ctx.arc(1.5, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (hair === 'slick') {
    // Directional Pompadour / Swept Back
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(1, 0, 6.5, 5.8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hairline shine streak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(2, 0, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (hair === 'afro') {
    // Volumetric afro silhouette
    ctx.save();
    ctx.beginPath();
    ctx.arc(1.5, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (hair === 'mohawk') {
    // Sculpted mohawk ridge
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(3, 0, 6.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (hair === 'buzz') {
    // Buzz cut / close shave shadow
    ctx.save();
    ctx.fillStyle = likeness.hairColor;
    ctx.beginPath();
    ctx.arc(2, 0, 6.8, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    ctx.restore();
  } else {
    // Classic athletic crop with natural side parting
    ctx.save();
    ctx.beginPath();
    ctx.arc(2, 0, 6.8, Math.PI * 0.45, Math.PI * 1.55);
    ctx.fill();
    ctx.restore();
  }

  // Facial Hair (Beard, Stubble, Goatee)
  if (likeness.facialHair && likeness.facialHair !== 'none') {
    ctx.save();
    ctx.fillStyle = likeness.hairColor;
    if (likeness.facialHair === 'stubble') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    }
    // Chin and jawline beard shadow
    ctx.beginPath();
    ctx.ellipse(7.2, 0, 2.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Natural Brow & Nose Bridge (Realistic Facing Profile)
  ctx.fillStyle = likeness.skinTone;
  ctx.beginPath();
  ctx.arc(8.2, 0, 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // End head

  ctx.restore(); // End player translation/rotation

  // 4. Squad Number on Jersey Back (Crisp Athletic Typography)
  ctx.save();
  ctx.fillStyle = kit.numberColor || '#ffffff';
  ctx.font = '900 9px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.player.number.toString(), x - 2, y);
  ctx.restore();

  // 5. Overhead Tactical Indicator & Name Plate for User Controlled Player
  if (isUserControlled) {
    const overheadY = y - 26;

    // Glowing Tactical Reticle Triangle
    ctx.save();
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(x, overheadY + 8);
    ctx.lineTo(x - 5, overheadY);
    ctx.lineTo(x + 5, overheadY);
    ctx.closePath();
    ctx.fill();

    // High-Fidelity Player Name Tag with Rating & PlayStyle
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(6, 10, 20, 0.92)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.2;

    const playStyleBadge = p.player.playStyles?.[0] ? ' ⚡' : '';
    const labelText = `${p.player.shortName}${playStyleBadge}`;
    ctx.font = '900 9.5px "Chakra Petch", sans-serif';
    const tagW = ctx.measureText(labelText).width + 18;
    ctx.roundRect(x - tagW / 2, overheadY - 16, tagW, 15, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(labelText, x, overheadY - 6.5);

    // Chargeable Power Shot Meter
    if (shootCharge > 0) {
      const barW = 38;
      const barH = 5;
      const barX = x - barW / 2;
      const barY = overheadY - 24;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(barX, barY, barW, barH);

      const fillW = barW * shootCharge;
      ctx.fillStyle = shootCharge > 0.85 ? '#ef4444' : shootCharge > 0.5 ? '#f59e0b' : '#06b6d4';
      ctx.fillRect(barX, barY, fillW, barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    ctx.restore();
  }
}

export function drawBall(ctx: CanvasRenderingContext2D, ball: { pos: { x: number; y: number; z: number }; velocity: { x: number; y: number; z: number }; spin: { x: number; y: number }; isInGoal: boolean }) {
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
