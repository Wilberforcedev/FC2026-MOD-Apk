import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Bookmark, 
  BookmarkCheck, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  FastForward, 
  Zap,
  Shield,
  Gauge,
  Maximize2
} from 'lucide-react';
import { MatchHighlightEvent, MatchPlayerEntity } from '../types/soccer';
import { MatchEngine } from '../game/engine';
import { PITCH } from '../game/constants';
import { getStadiumForTeam } from '../data/stadiums';
import { 
  drawStadiumSurroundings, 
  drawPitch, 
  drawGoalNets, 
  drawCornerFlags, 
  drawPlayerAvatar, 
  drawBall 
} from './PitchCanvas';
import { saveHighlightToVault, removeHighlightFromVault, isHighlightSaved } from '../utils/highlightStorage';

interface HighlightReplayModalProps {
  highlight: MatchHighlightEvent;
  allHighlights?: MatchHighlightEvent[];
  onSelectHighlight?: (hl: MatchHighlightEvent) => void;
  onClose: () => void;
  engine?: MatchEngine;
  onSaveStateChange?: () => void;
}

export const HighlightReplayModal: React.FC<HighlightReplayModalProps> = ({
  highlight,
  allHighlights = [],
  onSelectHighlight,
  onClose,
  engine,
  onSaveStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [cameraMode, setCameraMode] = useState<'broadcast' | 'behindGoal' | 'action' | 'tactical'>('broadcast');
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(() => isHighlightSaved(highlight.id));
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const frames = highlight.frames || [];
  const totalFrames = Math.max(1, frames.length);

  // Keep a ref to the current frame index for requestAnimationFrame
  const currentFrameRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const playbackSpeedRef = useRef<number>(playbackSpeed);
  const isLoopingRef = useRef<boolean>(isLooping);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  // When highlight changes, reset frame to 0
  useEffect(() => {
    currentFrameRef.current = 0;
    setFrameIndex(0);
    setIsPlaying(true);
    setIsSaved(isHighlightSaved(highlight.id));
  }, [highlight.id]);

  // Handle saving highlight to local vault
  const handleToggleSave = () => {
    if (isSaved) {
      removeHighlightFromVault(highlight.id);
      setIsSaved(false);
      setSaveToast('Highlight removed from Vault');
      onSaveStateChange?.();
    } else {
      const res = saveHighlightToVault(highlight);
      if (res.success) {
        setIsSaved(true);
        setSaveToast('Saved to Vault!');
        onSaveStateChange?.();
      } else {
        setSaveToast(res.message);
      }
    }
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const prevFrame = Math.max(0, currentFrameRef.current - 5);
        currentFrameRef.current = prevFrame;
        setFrameIndex(prevFrame);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const nextFrame = Math.min(totalFrames - 1, currentFrameRef.current + 5);
        currentFrameRef.current = nextFrame;
        setFrameIndex(nextFrame);
      } else if (e.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalFrames, onClose]);

  // Prepare a player entity lookup
  const getPlayerEntity = useCallback((rp: { id: string; team: 'home' | 'away' }): MatchPlayerEntity | null => {
    if (engine) {
      const list = rp.team === 'home' ? engine.homePlayers : engine.awayPlayers;
      const found = list.find(p => p.id === rp.id);
      if (found) return found;
    }

    if (highlight.playersMeta) {
      const meta = highlight.playersMeta.find(m => m.id === rp.id);
      if (meta) {
        return {
          id: meta.id,
          team: meta.team,
          player: {
            id: meta.id,
            name: meta.name,
            shortName: meta.shortName,
            number: meta.number,
            position: 'ST',
            rating: 85,
            stats: { pace: 80, shooting: 80, passing: 80, dribbling: 80, defending: 80, physicality: 80 },
            likeness: meta.likeness,
          },
          pos: { x: 0, y: 0 },
          targetPos: { x: 0, y: 0 },
          homePos: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          facingAngle: 0,
          stamina: 100,
          isSprinting: false,
          hasBall: false,
          isTackling: false,
          tackleCooldown: 0,
          skillMoveTime: 0,
          runCycle: 0,
          animState: 'idle',
          yellowCards: 0,
          isRedCarded: false,
        };
      }
    }

    return null;
  }, [engine, highlight.playersMeta]);

  // Main canvas animation loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stadium = getStadiumForTeam(highlight.homeTeam.id);
    const canvasContext = {
      homeTeam: highlight.homeTeam as any,
      awayTeam: highlight.awayTeam as any,
    };

    const renderLoop = () => {
      // Step frame if playing
      if (isPlayingRef.current && totalFrames > 0) {
        currentFrameRef.current += playbackSpeedRef.current;
        if (currentFrameRef.current >= totalFrames) {
          if (isLoopingRef.current) {
            currentFrameRef.current = 0;
          } else {
            currentFrameRef.current = totalFrames - 1;
            setIsPlaying(false);
          }
        }
        setFrameIndex(Math.floor(currentFrameRef.current));
      }

      const activeFrameIndex = Math.min(totalFrames - 1, Math.floor(currentFrameRef.current));
      const currentFrame = frames[activeFrameIndex] || frames[0];

      // Resize canvas to match container
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
          canvas.width = clientWidth;
          canvas.height = clientHeight;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentFrame) {
        ctx.save();

        const ball = currentFrame.ball;
        const width = canvas.width;
        const height = canvas.height;

        // Dynamic Camera calculation based on cameraMode
        let targetX = ball.x;
        let targetY = ball.y;
        let zoom = 1.0;

        if (cameraMode === 'broadcast') {
          // Dynamic smooth broadcast cam tracking ball with wide FOV
          zoom = Math.min(width / 1300, height / 850) * 1.15;
          targetX = ball.x;
          targetY = ball.y;
        } else if (cameraMode === 'behindGoal') {
          // Behind goal angle: focus on the targeted penalty box
          const isLeftGoal = ball.x < PITCH.MARGIN_X + PITCH.LENGTH / 2;
          targetX = isLeftGoal ? PITCH.MARGIN_X + 160 : PITCH.MARGIN_X + PITCH.LENGTH - 160;
          targetY = PITCH.MARGIN_Y + PITCH.WIDTH / 2;
          zoom = Math.min(width / 950, height / 650) * 1.35;
        } else if (cameraMode === 'action') {
          // Close-up action cam on the striker/goalkeeper duel
          targetX = ball.x;
          targetY = ball.y;
          zoom = Math.min(width / 750, height / 500) * 1.5;
        } else if (cameraMode === 'tactical') {
          // Bird's eye tactical view
          targetX = PITCH.MARGIN_X + PITCH.LENGTH / 2;
          targetY = PITCH.MARGIN_Y + PITCH.WIDTH / 2;
          zoom = Math.min(width / (PITCH.LENGTH + 300), height / (PITCH.WIDTH + 300));
        }

        // Apply transform
        ctx.translate(width / 2, height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-targetX, -targetY);

        // 1. Draw Stadium Surroundings & crowd
        drawStadiumSurroundings(ctx, highlight.weather || 'Clear', stadium, canvasContext);

        // 2. Draw Pitch & grass striping
        drawPitch(ctx, stadium);

        // 3. Draw Corner Flags & Goal Nets
        drawCornerFlags(ctx);
        drawGoalNets(ctx);

        // 4. Draw Players sorted by Y for depth
        const sortedPlayers = [...currentFrame.players].sort((a, b) => a.y - b.y);
        for (const rp of sortedPlayers) {
          const original = getPlayerEntity(rp);
          if (original) {
            drawPlayerAvatar(
              ctx,
              original,
              rp.x,
              rp.y,
              rp.facingAngle,
              rp.runCycle,
              rp.animState,
              false,
              0,
              canvasContext
            );
          }
        }

        // 5. Draw Ball
        drawBall(ctx, {
          pos: ball,
          velocity: { x: 0, y: 0, z: 0 },
          spin: { x: 0, y: 0 },
          isInGoal: false,
        });

        // 6. Highlight marker on primary player (e.g. Scorer or GK)
        const primaryMeta = highlight.playersMeta?.find(p => p.number === highlight.primaryPlayerNumber);
        const activePrimaryState = currentFrame.players.find(p => p.id === primaryMeta?.id);
        if (activePrimaryState) {
          ctx.save();
          const markerColor = highlight.type === 'goal' ? '#10b981' : '#06b6d4';
          ctx.strokeStyle = markerColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(activePrimaryState.x, activePrimaryState.y + 4, 18, 0, Math.PI * 2);
          ctx.stroke();

          // Overhead pointer triangle
          ctx.fillStyle = markerColor;
          ctx.beginPath();
          ctx.moveTo(activePrimaryState.x, activePrimaryState.y - 28);
          ctx.lineTo(activePrimaryState.x - 6, activePrimaryState.y - 36);
          ctx.lineTo(activePrimaryState.x + 6, activePrimaryState.y - 36);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [frames, totalFrames, cameraMode, highlight, getPlayerEntity]);

  // Current highlight index in playlist
  const currentIndex = allHighlights.findIndex(h => h.id === highlight.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allHighlights.length - 1;

  const handlePrevHighlight = () => {
    if (hasPrev && onSelectHighlight) {
      onSelectHighlight(allHighlights[currentIndex - 1]);
    }
  };

  const handleNextHighlight = () => {
    if (hasNext && onSelectHighlight) {
      onSelectHighlight(allHighlights[currentIndex + 1]);
    }
  };

  // Format time display
  const currentTimeSec = ((frameIndex / 60)).toFixed(1);
  const totalTimeSec = ((totalFrames / 60)).toFixed(1);

  return (
    <div 
      id="highlight-replay-theater-modal"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        id="highlight-replay-container"
        className="w-full max-w-5xl h-[92vh] max-h-[820px] bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden relative"
      >
        {/* Top Broadcast Header Bug */}
        <div 
          id="replay-header-bar"
          className="bg-slate-950/80 px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between z-10"
        >
          {/* Left: Replay indicator & event title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-red-950/80 border border-red-500/50 px-2.5 py-1 rounded-full text-red-400 text-xs font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(239,68,68,0.4)]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              <span>HYPERMOTION REPLAY</span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <span className="font-extrabold text-white">
                {highlight.type === 'goal' ? '⚽ GOAL' : '🧤 CRITICAL SAVE'}
              </span>
              <span className="text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded text-xs">
                {highlight.minute}'
              </span>
              <span className="text-slate-300 font-medium hidden sm:inline">
                {highlight.primaryPlayerName} (#{highlight.primaryPlayerNumber})
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {/* Save to Vault Button */}
            <button
              id="replay-save-vault-btn"
              onClick={handleToggleSave}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSaved 
                  ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
              <span>{isSaved ? 'Saved in Vault' : 'Save Highlight'}</span>
            </button>

            {/* Close Button */}
            <button
              id="replay-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Pitch Container */}
        <div 
          ref={containerRef}
          id="replay-canvas-stage"
          className="flex-1 w-full bg-black relative overflow-hidden flex items-center justify-center cursor-pointer select-none"
          onClick={() => setIsPlaying(prev => !prev)}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Floating Save Toast */}
          {saveToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-cyan-950/90 border border-cyan-400/50 text-cyan-200 text-xs font-bold px-4 py-2 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-in fade-in slide-in-from-top-2">
              {saveToast}
            </div>
          )}

          {/* Floating On-Pitch Telemetry Banner */}
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-2xl">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white" style={{ backgroundColor: highlight.team === 'home' ? highlight.homeTeam.badgeBg : highlight.awayTeam.badgeBg }}>
              #{highlight.primaryPlayerNumber}
            </div>
            <div>
              <div className="text-white text-xs font-extrabold flex items-center space-x-1.5">
                <span>{highlight.primaryPlayerName}</span>
                {highlight.shotSpeedKmh && (
                  <span className="text-amber-400 text-[11px] font-bold flex items-center">
                    <Zap className="w-3 h-3 mr-0.5 inline" /> {highlight.shotSpeedKmh} KM/H
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[10px]">
                {highlight.team === 'home' ? highlight.homeTeam.name : highlight.awayTeam.name}
              </div>
            </div>
          </div>

          {/* Center Play/Pause feedback when paused */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/60 border border-cyan-500/50 flex items-center justify-center text-cyan-400 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                <Play className="w-8 h-8 translate-x-0.5 fill-current" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Broadcast Control Deck */}
        <div 
          id="replay-control-deck"
          className="bg-slate-950/95 border-t border-slate-800 p-3 sm:p-4 flex flex-col space-y-3 z-10"
        >
          {/* Scrubber Timeline Bar */}
          <div className="flex items-center space-x-3 w-full">
            <span className="text-xs font-mono text-slate-400 w-12 text-right">
              {currentTimeSec}s
            </span>
            <input
              id="replay-timeline-slider"
              type="range"
              min={0}
              max={totalFrames - 1}
              value={frameIndex}
              onChange={(e) => {
                const val = Number(e.target.value);
                currentFrameRef.current = val;
                setFrameIndex(val);
              }}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
            />
            <span className="text-xs font-mono text-slate-500 w-12">
              {totalTimeSec}s
            </span>
          </div>

          {/* Primary Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Play/Pause & Step Controls */}
            <div className="flex items-center space-x-2">
              <button
                id="replay-play-pause-btn"
                onClick={() => setIsPlaying(prev => !prev)}
                className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                id="replay-restart-btn"
                onClick={() => {
                  currentFrameRef.current = 0;
                  setFrameIndex(0);
                  setIsPlaying(true);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Step frame backward */}
              <button
                id="replay-step-back-btn"
                onClick={() => {
                  setIsPlaying(false);
                  const prev = Math.max(0, currentFrameRef.current - 1);
                  currentFrameRef.current = prev;
                  setFrameIndex(prev);
                }}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                title="Step backward 1 frame"
              >
                -1f
              </button>

              {/* Step frame forward */}
              <button
                id="replay-step-fwd-btn"
                onClick={() => {
                  setIsPlaying(false);
                  const next = Math.min(totalFrames - 1, currentFrameRef.current + 1);
                  currentFrameRef.current = next;
                  setFrameIndex(next);
                }}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                title="Step forward 1 frame"
              >
                +1f
              </button>

              {/* Speed Buttons */}
              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5 ml-2">
                {[0.25, 0.5, 1.0, 2.0].map(s => (
                  <button
                    key={s}
                    id={`replay-speed-${s}x`}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                      playbackSpeed === s
                        ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Camera View Angle Selector */}
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              {(
                [
                  { id: 'broadcast', label: 'Broadcast' },
                  { id: 'behindGoal', label: 'Behind Goal' },
                  { id: 'action', label: 'Action Zoom' },
                  { id: 'tactical', label: 'Tactical' },
                ] as const
              ).map(cam => (
                <button
                  key={cam.id}
                  id={`replay-camera-${cam.id}`}
                  onClick={() => setCameraMode(cam.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    cameraMode === cam.id
                      ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>

            {/* Previous / Next Event Buttons */}
            {allHighlights.length > 1 && (
              <div className="flex items-center space-x-1">
                <button
                  id="replay-prev-highlight-btn"
                  onClick={handlePrevHighlight}
                  disabled={!hasPrev}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs font-semibold transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <button
                  id="replay-next-highlight-btn"
                  onClick={handleNextHighlight}
                  disabled={!hasNext}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs font-semibold transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
