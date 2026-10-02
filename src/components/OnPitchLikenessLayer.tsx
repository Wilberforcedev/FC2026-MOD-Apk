import React, { useEffect, useRef, useState } from 'react';
import { MatchEngine } from '../game/engine';
import { PITCH } from '../game/constants';
import { GoalEvent, MatchPlayerEntity, Player, Team } from '../types/soccer';
import { getOnPitchLikeness, OnPitchLikenessProfile } from '../services/onPitchLikeness';
import { PlayerFaceCard } from './PlayerFaceCard';

interface OnPitchLikenessLayerProps {
  engine: MatchEngine;
}

interface GoalMoment {
  event: GoalEvent;
  player: Player;
  team: Team;
  startedAt: number;
}

interface RenderPlayer {
  entity: MatchPlayerEntity;
  x: number;
  y: number;
  facingAngle: number;
  runCycle: number;
  animState: string;
}

const CAMERA_START = {
  x: PITCH.MARGIN_X + PITCH.LENGTH / 2,
  y: PITCH.MARGIN_Y + PITCH.WIDTH / 2,
  zoom: 0.95,
};

function findScorer(engine: MatchEngine, event: GoalEvent): { player: Player; team: Team } | null {
  const team = event.team === 'home' ? engine.homeTeam : engine.awayTeam;
  const player =
    team.players.find(candidate => candidate.number === event.scorerNumber) ||
    team.players.find(candidate => candidate.name === event.scorerName || candidate.shortName === event.scorerName);

  return player ? { player, team } : null;
}

function drawHair(
  ctx: CanvasRenderingContext2D,
  entity: MatchPlayerEntity,
  headX: number,
  profile: OnPitchLikenessProfile,
) {
  const likeness = entity.player.likeness;
  const hair = likeness?.hairStyle || 'short';
  const color = likeness?.hairColor || '#18110d';
  const size = 6.1 * profile.headScale;

  ctx.fillStyle = color;
  if (hair === 'buzz') {
    ctx.beginPath();
    ctx.arc(headX - 0.8, 0, size * 0.96, Math.PI * 0.55, Math.PI * 1.45);
    ctx.fill();
  } else if (hair === 'fade') {
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(headX - 1, 0, size * 0.85, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(headX + 1.3, 0, size * 0.68, size * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (hair === 'dreads') {
    for (let i = -3; i <= 3; i += 1) {
      ctx.lineWidth = 2.1;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(headX - 1, i * 1.35);
      ctx.lineTo(headX - 6.5 - Math.abs(i) * 0.5, i * 1.9);
      ctx.stroke();
    }
  } else if (hair === 'curly' || hair === 'afro') {
    const radius = hair === 'afro' ? 2.7 : 2.1;
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(headX - 0.5 + Math.cos(angle) * size * 0.72, Math.sin(angle) * size * 0.72, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (hair === 'slick') {
    ctx.beginPath();
    ctx.ellipse(headX - 1.5, 0, size, size * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headX - 5, -2);
    ctx.lineTo(headX + 2, -1);
    ctx.stroke();
  } else if (hair === 'mohawk') {
    ctx.beginPath();
    ctx.ellipse(headX - 0.5, 0, size * 1.05, 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(headX - 0.8, 0, size, Math.PI * 0.48, Math.PI * 1.52);
    ctx.fill();
  }
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  shoulderX: number,
  shoulderY: number,
  endX: number,
  endY: number,
  sleeveColor: string,
  skinTone: string,
  gloveColor?: string,
) {
  const midX = shoulderX + (endX - shoulderX) * 0.42;
  const midY = shoulderY + (endY - shoulderY) * 0.42;

  ctx.lineCap = 'round';
  ctx.strokeStyle = sleeveColor;
  ctx.lineWidth = 6.2;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(midX, midY);
  ctx.stroke();

  ctx.strokeStyle = skinTone;
  ctx.lineWidth = 4.4;
  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.fillStyle = gloveColor || skinTone;
  ctx.beginPath();
  ctx.arc(endX, endY, gloveColor ? 3.3 : 2.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnhancedPlayer(
  ctx: CanvasRenderingContext2D,
  renderPlayer: RenderPlayer,
  homeTeam: Team,
  awayTeam: Team,
) {
  const { entity, x, y, facingAngle, runCycle, animState } = renderPlayer;
  const player = entity.player;
  const team = entity.team === 'home' ? homeTeam : awayTeam;
  const kit = team.kit;
  const profile = getOnPitchLikeness(player);
  const likeness = player.likeness;
  const skin = likeness?.skinTone || '#d49b6a';
  const boots = likeness?.bootColor || '#f8fafc';
  const isGK = Boolean(player.isGoalkeeper);
  const isSaving = isGK && (Boolean(entity.isDiving) || animState === 'saving');
  const isCelebrating = animState === 'celebrating';
  const sprintFactor = entity.isSprinting ? 1.18 : 1;
  const phase = runCycle * profile.cadence;
  const stride = Math.sin(phase) * 8.2 * profile.strideScale * sprintFactor;
  const armDrive = Math.cos(phase) * 7.2 * profile.armDrive * sprintFactor;

  ctx.save();

  // Stronger contact shadow makes differently sized bodies read clearly on grass.
  ctx.fillStyle = 'rgba(0,0,0,0.33)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 14 * profile.heightScale, 7.4 * profile.widthScale, facingAngle * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, y);
  ctx.rotate(facingAngle);

  if (isSaving && entity.diveTarget) {
    const worldDive = Math.atan2(entity.diveTarget.y - y, entity.diveTarget.x - x);
    let relative = worldDive - facingAngle;
    while (relative > Math.PI) relative -= Math.PI * 2;
    while (relative < -Math.PI) relative += Math.PI * 2;
    ctx.rotate(Math.max(-0.85, Math.min(0.85, relative * 0.45)));
  }

  ctx.scale(profile.heightScale, profile.widthScale);

  const fitExtra = profile.kitFit === 'loose' ? 1.5 : profile.kitFit === 'tight' ? -0.8 : 0;
  const shoulder = (10.5 + fitExtra) * profile.shoulderScale;
  const waist = (7.7 + fitExtra * 0.55) * profile.widthScale;
  const torsoFront = 8.8;
  const torsoBack = -9.4;
  const lean = entity.isSprinting ? profile.forwardLean * 9 : profile.forwardLean * 3;

  if (isCelebrating && profile.celebrationStyle === 'knee-slide') {
    ctx.strokeStyle = 'rgba(210,255,225,0.18)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-35, -5);
    ctx.lineTo(-5, -3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-35, 5);
    ctx.lineTo(-5, 3);
    ctx.stroke();
  }

  // Legs: long-striding players visibly cover more distance per run-cycle.
  const legBaseX = torsoBack - 2;
  const legLength = 13.5 * profile.legScale;
  const leftFootX = legBaseX - legLength + (isCelebrating && profile.celebrationStyle === 'knee-slide' ? 6 : stride);
  const rightFootX = legBaseX - legLength + (isCelebrating && profile.celebrationStyle === 'knee-slide' ? 4 : -stride);

  const drawLeg = (side: number, footX: number) => {
    ctx.strokeStyle = isGK ? '#172554' : kit.shorts;
    ctx.lineWidth = 7.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(torsoBack + 1, side * 4.4);
    ctx.lineTo(torsoBack - 5, side * 4.8);
    ctx.stroke();

    ctx.strokeStyle = isGK ? '#f59e0b' : kit.socks;
    ctx.lineWidth = 5.2;
    ctx.beginPath();
    ctx.moveTo(torsoBack - 5, side * 4.8);
    ctx.lineTo(footX, side * 5.2);
    ctx.stroke();

    ctx.fillStyle = boots;
    ctx.beginPath();
    ctx.roundRect(footX - 2, side * 5.2 - 2.8, 8.5, 5.6, 2.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillRect(footX + 1, side * 5.2 - 0.7, 3.2, 1.1);
  };

  drawLeg(-1, leftFootX);
  drawLeg(1, rightFootX);

  // Athletic fitted torso with build-specific shoulder/waist proportions.
  const jerseyColor = isGK ? '#06b6d4' : kit.primary;
  ctx.save();
  ctx.translate(lean, 0);
  ctx.fillStyle = jerseyColor;
  ctx.beginPath();
  ctx.moveTo(torsoFront, -shoulder);
  ctx.quadraticCurveTo(torsoFront + 2, 0, torsoFront, shoulder);
  ctx.lineTo(torsoBack, waist);
  ctx.quadraticCurveTo(torsoBack - 2, 0, torsoBack, -waist);
  ctx.closePath();
  ctx.fill();

  const jerseyLight = ctx.createLinearGradient(torsoBack, -shoulder, torsoFront, shoulder);
  jerseyLight.addColorStop(0, 'rgba(0,0,0,0.25)');
  jerseyLight.addColorStop(0.52, 'rgba(255,255,255,0.16)');
  jerseyLight.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = jerseyLight;
  ctx.fill();

  if (!isGK && kit.pattern === 'stripes') {
    ctx.strokeStyle = kit.secondary;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(torsoBack + 1, -3.6);
    ctx.lineTo(torsoFront - 1, -3.6);
    ctx.moveTo(torsoBack + 1, 3.6);
    ctx.lineTo(torsoFront - 1, 3.6);
    ctx.stroke();
  } else if (!isGK && kit.pattern === 'hoops') {
    ctx.strokeStyle = kit.secondary;
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(-2, -waist);
    ctx.lineTo(-2, waist);
    ctx.stroke();
  }

  // Back number stays readable when the camera pulls out.
  ctx.save();
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = kit.numberColor || '#fff';
  ctx.font = '900 8px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(player.number), 0, 1);
  ctx.restore();

  // Arms and signature celebration/GK poses.
  let leftEnd = { x: 8 + armDrive, y: -16 };
  let rightEnd = { x: 8 - armDrive, y: 16 };

  if (isSaving) {
    leftEnd = { x: 18, y: -19 };
    rightEnd = { x: 18, y: 19 };
  } else if (isCelebrating) {
    switch (profile.celebrationStyle) {
      case 'arms-wide':
        leftEnd = { x: 7, y: -23 };
        rightEnd = { x: 7, y: 23 };
        break;
      case 'point-up':
        leftEnd = { x: 19, y: -8 };
        rightEnd = { x: 7, y: 19 };
        break;
      case 'fist-pump':
        leftEnd = { x: 18, y: -11 };
        rightEnd = { x: 12, y: 12 };
        break;
      case 'knee-slide':
        leftEnd = { x: 10, y: -21 };
        rightEnd = { x: 10, y: 21 };
        break;
      case 'calm':
        leftEnd = { x: 8, y: -12 };
        rightEnd = { x: 8, y: 12 };
        break;
    }
  }

  const glove = isGK ? '#fde047' : undefined;
  drawArm(ctx, 4, -shoulder + 2, leftEnd.x, leftEnd.y, jerseyColor, skin, glove);
  drawArm(ctx, 4, shoulder - 2, rightEnd.x, rightEnd.y, jerseyColor, skin, glove);

  // Neck, head and recognizable hairstyle silhouette.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.roundRect(torsoFront - 1, -2.4, 5.5, 4.8, 2);
  ctx.fill();

  const headX = torsoFront + 8.5;
  ctx.beginPath();
  ctx.ellipse(headX, 0, 6.5 * profile.headScale, 5.8 * profile.headScale, 0, 0, Math.PI * 2);
  ctx.fill();
  drawHair(ctx, entity, headX, profile);

  // Profile nose + beard shadow help close camera/replay views read as faces.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(headX + 6.1 * profile.headScale, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (likeness?.facialHair && likeness.facialHair !== 'none') {
    ctx.fillStyle = likeness.hairColor || '#1c1917';
    ctx.globalAlpha = likeness.facialHair === 'stubble' ? 0.35 : 0.78;
    ctx.beginPath();
    ctx.ellipse(headX + 3.4, 0, 3, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  if (isCelebrating) {
    ctx.strokeStyle = 'rgba(250,204,21,0.5)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 25 + Math.sin(performance.now() / 130) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export const OnPitchLikenessLayer: React.FC<OnPitchLikenessLayerProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef({ ...CAMERA_START });
  const lastGoalCountRef = useRef(engine.goalEvents.length);
  const [goalMoment, setGoalMoment] = useState<GoalMoment | null>(null);

  useEffect(() => {
    lastGoalCountRef.current = engine.goalEvents.length;
    setGoalMoment(null);

    const poll = window.setInterval(() => {
      if (engine.goalEvents.length <= lastGoalCountRef.current) return;
      lastGoalCountRef.current = engine.goalEvents.length;
      const event = engine.goalEvents[engine.goalEvents.length - 1];
      const scorer = findScorer(engine, event);
      if (!scorer) return;

      const moment: GoalMoment = { event, ...scorer, startedAt: performance.now() };
      setGoalMoment(moment);
      window.setTimeout(() => {
        setGoalMoment(current => current?.startedAt === moment.startedAt ? null : current);
      }, 3600);
    }, 90);

    return () => window.clearInterval(poll);
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const backingW = Math.max(1, Math.round(width * dpr));
      const backingH = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== backingW || canvas.height !== backingH) {
        canvas.width = backingW;
        canvas.height = backingH;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const replayFrame = engine.getCurrentReplayFrame();
      const isReplay = engine.isReplaying && Boolean(replayFrame);
      const ballPos = isReplay && replayFrame ? replayFrame.ball : engine.ball.pos;
      const ballVel = isReplay ? { x: 0, y: 0 } : engine.ball.velocity;

      let targetCamX = ballPos.x + ballVel.x * 10;
      let targetCamY = ballPos.y + ballVel.y * 10;
      let targetZoom = 0.95;

      if (isReplay) {
        if (engine.replayCameraMode === 'behindGoal') {
          const right = ballPos.x > PITCH.MARGIN_X + PITCH.LENGTH / 2;
          targetCamX = right ? PITCH.MARGIN_X + PITCH.LENGTH + 40 : PITCH.MARGIN_X - 40;
          targetCamY = PITCH.MARGIN_Y + PITCH.WIDTH / 2;
          targetZoom = 1.08;
        } else if (engine.replayCameraMode === 'action') {
          targetCamX = ballPos.x;
          targetCamY = ballPos.y;
          targetZoom = 1.32;
        } else {
          targetCamX = ballPos.x;
          targetCamY = ballPos.y;
          targetZoom = 1.05;
        }
      } else {
        const distanceToGoal = Math.min(
          Math.hypot(ballPos.x - PITCH.MARGIN_X, ballPos.y - (PITCH.MARGIN_Y + PITCH.WIDTH / 2)),
          Math.hypot(ballPos.x - (PITCH.MARGIN_X + PITCH.LENGTH), ballPos.y - (PITCH.MARGIN_Y + PITCH.WIDTH / 2)),
        );
        targetZoom = distanceToGoal < 300 ? 1.05 : 0.92;
      }

      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.08;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.08;
      cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * 0.04;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      const players: RenderPlayer[] = [];
      if (isReplay && replayFrame) {
        for (const state of replayFrame.players) {
          const entity = (state.team === 'home' ? engine.homePlayers : engine.awayPlayers).find(candidate => candidate.id === state.id);
          if (!entity) continue;
          players.push({
            entity,
            x: state.x,
            y: state.y,
            facingAngle: state.facingAngle,
            runCycle: state.runCycle,
            animState: state.animState,
          });
        }
      } else {
        for (const entity of [...engine.homePlayers, ...engine.awayPlayers]) {
          players.push({
            entity,
            x: entity.pos.x,
            y: entity.pos.y,
            facingAngle: entity.facingAngle,
            runCycle: entity.runCycle,
            animState: entity.animState,
          });
        }
      }

      players.sort((a, b) => a.y - b.y);
      for (const player of players) {
        drawEnhancedPlayer(ctx, player, engine.homeTeam, engine.awayTeam);
      }

      ctx.restore();
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [engine]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[6] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_52%,rgba(0,0,0,0.18)_100%)]" />

      {engine.isReplaying && (
        <div className="absolute top-20 left-5 rounded-full border border-red-400/50 bg-black/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-red-300 shadow-xl">
          Broadcast Replay
        </div>
      )}

      {goalMoment && (
        <>
          <div className="absolute inset-x-0 top-0 h-[6vh] bg-black/92" />
          <div className="absolute inset-x-0 bottom-0 h-[6vh] bg-black/92" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

          <div className="absolute left-4 top-20 flex items-center gap-3 rounded-2xl border border-cyan-400/35 bg-[#07111d]/94 p-3 pr-5 shadow-2xl backdrop-blur-md">
            <PlayerFaceCard player={goalMoment.player} team={goalMoment.team} size="xs" showDetails={false} />
            <div className="min-w-[170px]">
              <div className="text-[9px] font-black uppercase tracking-[0.28em] text-cyan-300">Player Cam · Goal</div>
              <div className="mt-1 text-xl font-black uppercase leading-none text-white">{goalMoment.player.shortName}</div>
              <div className="mt-1 text-[11px] font-bold text-white/65">#{goalMoment.player.number} · {goalMoment.player.position} · {goalMoment.team.shortName}</div>
              <div className="mt-2 flex gap-2 text-[9px] font-black uppercase tracking-wider">
                <span className="rounded bg-white/10 px-2 py-1 text-white/80">{goalMoment.event.minute}'</span>
                <span className="rounded bg-cyan-400/15 px-2 py-1 text-cyan-200">{Math.round(goalMoment.event.shotSpeedKmh)} km/h</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-[7vh] left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/65 px-5 py-2 text-[10px] font-black uppercase tracking-[0.34em] text-white/85 shadow-xl backdrop-blur">
            Goal Celebration · Cinematic Broadcast
          </div>
        </>
      )}
    </div>
  );
};
