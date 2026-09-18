import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Team, MatchHeatmapData, PlayerHeatmapRecord, HeatmapSample } from '../types/soccer';
import { PITCH } from '../game/constants';
import { getStadiumForTeam, StadiumLikeness } from '../data/stadiums';
import { 
  Flame, 
  Users, 
  User, 
  Activity, 
  Zap, 
  Compass, 
  Crosshair, 
  Download, 
  ChevronRight, 
  Layers, 
  Shield, 
  Sparkles,
  Info
} from 'lucide-react';

interface PitchHeatmapViewerProps {
  homeTeam: Team;
  awayTeam: Team;
  heatmapData: MatchHeatmapData;
  homeScore?: number;
  awayScore?: number;
}

type ViewMode = 'team' | 'player' | 'ball';
type TeamSide = 'home' | 'away' | 'both';
type HeatmapRadius = 'tight' | 'balanced' | 'wide';

export const PitchHeatmapViewer: React.FC<PitchHeatmapViewerProps> = ({
  homeTeam,
  awayTeam,
  heatmapData,
  homeScore = 0,
  awayScore = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('player');
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [teamViewSide, setTeamViewSide] = useState<TeamSide>('both');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [radiusMode, setRadiusMode] = useState<HeatmapRadius>('balanced');
  const [showCentroid, setShowCentroid] = useState<boolean>(true);
  const [showHotspot, setShowHotspot] = useState<boolean>(true);

  // Stadium likeness for grass theme
  const stadium = useMemo<StadiumLikeness>(() => {
    return getStadiumForTeam(homeTeam.id);
  }, [homeTeam.id]);

  // Available players list for selected team
  const homePlayerList = useMemo<PlayerHeatmapRecord[]>(() => {
    return Object.values(heatmapData.homePlayers || {});
  }, [heatmapData.homePlayers]);

  const awayPlayerList = useMemo<PlayerHeatmapRecord[]>(() => {
    return Object.values(heatmapData.awayPlayers || {});
  }, [heatmapData.awayPlayers]);

  const currentTeamPlayers = selectedTeam === 'home' ? homePlayerList : awayPlayerList;

  // Initialize selected player if not set
  useEffect(() => {
    if (!selectedPlayerId && currentTeamPlayers.length > 0) {
      // Pick first outfield star or striker
      const nonGk = currentTeamPlayers.find(p => p.position !== 'GK');
      setSelectedPlayerId(nonGk?.id || currentTeamPlayers[0].id);
    }
  }, [currentTeamPlayers, selectedPlayerId]);

  // When switching teams in player mode, select appropriate player
  const handleSelectTeamForPlayer = (side: 'home' | 'away') => {
    setSelectedTeam(side);
    const targetList = side === 'home' ? homePlayerList : awayPlayerList;
    const nonGk = targetList.find(p => p.position !== 'GK');
    setSelectedPlayerId(nonGk?.id || targetList[0]?.id || '');
  };

  // Selected player record
  const selectedPlayer = useMemo<PlayerHeatmapRecord | null>(() => {
    if (selectedTeam === 'home') {
      return heatmapData.homePlayers[selectedPlayerId] || null;
    } else {
      return heatmapData.awayPlayers[selectedPlayerId] || null;
    }
  }, [heatmapData, selectedTeam, selectedPlayerId]);

  // Samples to render based on current mode
  const activeSamples = useMemo<HeatmapSample[]>(() => {
    if (viewMode === 'player') {
      return selectedPlayer?.samples || [];
    }
    if (viewMode === 'ball') {
      return heatmapData.ballSamples || [];
    }
    // Team mode
    if (teamViewSide === 'home') return heatmapData.homeTeamSamples || [];
    if (teamViewSide === 'away') return heatmapData.awayTeamSamples || [];
    return [...(heatmapData.homeTeamSamples || []), ...(heatmapData.awayTeamSamples || [])];
  }, [viewMode, selectedPlayer, teamViewSide, heatmapData]);

  // Spatial Analytics (Thirds, Flanks, Centroid, Hotspot)
  const analytics = useMemo(() => {
    const samples = activeSamples;
    if (!samples || samples.length === 0) {
      return {
        defensiveThirdPct: 33,
        middleThirdPct: 34,
        attackingThirdPct: 33,
        leftFlankPct: 30,
        centerPct: 40,
        rightFlankPct: 30,
        centroid: { x: PITCH.MARGIN_X + PITCH.LENGTH / 2, y: PITCH.MARGIN_Y + PITCH.WIDTH / 2 },
        hotspot: null as { x: number; y: number } | null,
        coveragePct: 45,
      };
    }

    const minX = PITCH.MARGIN_X;
    const maxX = PITCH.MARGIN_X + PITCH.LENGTH;
    const thirdW = PITCH.LENGTH / 3;

    const minY = PITCH.MARGIN_Y;
    const maxY = PITCH.MARGIN_Y + PITCH.WIDTH;
    const flankH = PITCH.WIDTH / 3;

    let defCount = 0;
    let midCount = 0;
    let attCount = 0;

    let leftCount = 0;
    let centerCount = 0;
    let rightCount = 0;

    let sumX = 0;
    let sumY = 0;

    // Density grid to detect the single hottest coordinate
    const gridCols = 28;
    const gridRows = 18;
    const cellW = PITCH.LENGTH / gridCols;
    const cellH = PITCH.WIDTH / gridRows;
    const gridBins = new Array(gridCols * gridRows).fill(0);

    const isAwayPerspective = (viewMode === 'player' && selectedTeam === 'away') || (viewMode === 'team' && teamViewSide === 'away');

    for (const s of samples) {
      sumX += s.x;
      sumY += s.y;

      // Thirds calculation
      const relX = s.x - minX;
      if (relX < thirdW) {
        if (!isAwayPerspective) defCount++; else attCount++;
      } else if (relX < thirdW * 2) {
        midCount++;
      } else {
        if (!isAwayPerspective) attCount++; else defCount++;
      }

      // Flanks calculation (y coordinates: top is left flank from player's view looking right)
      const relY = s.y - minY;
      if (relY < flankH) {
        leftCount++;
      } else if (relY < flankH * 2) {
        centerCount++;
      } else {
        rightCount++;
      }

      // Bin for hotspot
      const col = Math.max(0, Math.min(gridCols - 1, Math.floor((s.x - minX) / cellW)));
      const row = Math.max(0, Math.min(gridRows - 1, Math.floor((s.y - minY) / cellH)));
      gridBins[row * gridCols + col]++;
    }

    const total = samples.length;
    const centroid = {
      x: sumX / total,
      y: sumY / total,
    };

    // Find highest density cell
    let maxBinVal = 0;
    let maxBinIdx = 0;
    let nonZeroBins = 0;

    for (let i = 0; i < gridBins.length; i++) {
      if (gridBins[i] > 0) nonZeroBins++;
      if (gridBins[i] > maxBinVal) {
        maxBinVal = gridBins[i];
        maxBinIdx = i;
      }
    }

    const hotRow = Math.floor(maxBinIdx / gridCols);
    const hotCol = maxBinIdx % gridCols;
    const hotspot = {
      x: minX + hotCol * cellW + cellW / 2,
      y: minY + hotRow * cellH + cellH / 2,
    };

    const coveragePct = Math.round((nonZeroBins / gridBins.length) * 100);

    return {
      defensiveThirdPct: Math.round((defCount / total) * 100),
      middleThirdPct: Math.round((midCount / total) * 100),
      attackingThirdPct: Math.round((attCount / total) * 100),
      leftFlankPct: Math.round((leftCount / total) * 100),
      centerPct: Math.round((centerCount / total) * 100),
      rightFlankPct: Math.round((rightCount / total) * 100),
      centroid,
      hotspot,
      coveragePct,
    };
  }, [activeSamples, viewMode, selectedTeam, teamViewSide]);

  // Render Heatmap onto Pitch Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pitch coordinate bounds
    const pitchX = PITCH.MARGIN_X;
    const pitchY = PITCH.MARGIN_Y;
    const pitchW = PITCH.LENGTH;
    const pitchH = PITCH.WIDTH;

    // Render resolution
    const cw = canvas.width;
    const ch = canvas.height;

    // Scale factors from pitch space to canvas space
    const scaleX = cw / (pitchW + pitchX * 2);
    const scaleY = ch / (pitchH + pitchY * 2);
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (cw - (pitchW + pitchX * 2) * scale) / 2;
    const offsetY = (ch - (pitchH + pitchY * 2) * scale) / 2;

    const toCanvasX = (px: number) => offsetX + px * scale;
    const toCanvasY = (py: number) => offsetY + py * scale;

    // 1. Draw Authentic Stadium Pitch Turf
    ctx.clearRect(0, 0, cw, ch);

    // Surroundings / Track border
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, cw, ch);

    // Pitch outer grass margin
    const cPitchX = toCanvasX(pitchX);
    const cPitchY = toCanvasY(pitchY);
    const cPitchW = pitchW * scale;
    const cPitchH = pitchH * scale;

    const darkGrass = stadium.grassColorDark || '#14532d';
    const lightGrass = stadium.grassColorLight || '#166534';

    ctx.fillStyle = darkGrass;
    ctx.fillRect(cPitchX, cPitchY, cPitchW, cPitchH);

    // Pitch vertical mowing stripes
    const numStripes = 18;
    const stripeW = cPitchW / numStripes;
    for (let i = 0; i < numStripes; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = lightGrass;
        ctx.fillRect(cPitchX + i * stripeW, cPitchY, stripeW, cPitchH);
      }
    }

    // 2. Compute and Render Thermal Heatmap Layer
    if (activeSamples.length > 0) {
      // Create offscreen canvas for thermal density accumulation
      const offCanvas = document.createElement('canvas');
      offCanvas.width = cw;
      offCanvas.height = ch;
      const offCtx = offCanvas.getContext('2d');

      if (offCtx) {
        // Radius based on settings
        let pointRadius = 24 * scale;
        if (radiusMode === 'tight') pointRadius = 18 * scale;
        if (radiusMode === 'wide') pointRadius = 34 * scale;

        // Splat alpha intensity circles
        offCtx.clearRect(0, 0, cw, ch);
        const alphaStep = viewMode === 'team' ? 0.08 : 0.14;

        for (const s of activeSamples) {
          const cx = toCanvasX(s.x);
          const cy = toCanvasY(s.y);

          const grad = offCtx.createRadialGradient(cx, cy, 0, cx, cy, pointRadius);
          grad.addColorStop(0, `rgba(0, 0, 0, ${alphaStep})`);
          grad.addColorStop(0.5, `rgba(0, 0, 0, ${alphaStep * 0.45})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          offCtx.fillStyle = grad;
          offCtx.beginPath();
          offCtx.arc(cx, cy, pointRadius, 0, Math.PI * 2);
          offCtx.fill();
        }

        // Colorize using image data mapping through a 256-color thermal ramp
        const imgData = offCtx.getImageData(0, 0, cw, ch);
        const data = imgData.data;
        const totalPixels = data.length;

        // Precompute color palette
        const palette = getThermalPalette(viewMode === 'ball' ? 'ball' : 'thermal');

        for (let i = 0; i < totalPixels; i += 4) {
          const alpha = data[i + 3];
          if (alpha > 0) {
            const mapped = palette[alpha] || palette[255];
            data[i] = mapped[0];     // R
            data[i + 1] = mapped[1]; // G
            data[i + 2] = mapped[2]; // B
            data[i + 3] = mapped[3]; // A
          }
        }

        offCtx.putImageData(imgData, 0, 0);

        // Draw thermal layer clipped to pitch boundaries
        ctx.save();
        ctx.beginPath();
        ctx.rect(cPitchX, cPitchY, cPitchW, cPitchH);
        ctx.clip();

        ctx.globalAlpha = 0.88;
        ctx.drawImage(offCanvas, 0, 0);
        ctx.restore();
      }
    }

    // 3. Draw Pitch Regulation Markings ON TOP of heat so lines remain crystal clear
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1.5, 2.5 * scale);
    ctx.lineCap = 'round';

    // Touchlines & Goal lines
    ctx.strokeRect(cPitchX, cPitchY, cPitchW, cPitchH);

    // Halfway Line
    const midX = cPitchX + cPitchW / 2;
    const midY = cPitchY + cPitchH / 2;
    ctx.beginPath();
    ctx.moveTo(midX, cPitchY);
    ctx.lineTo(midX, cPitchY + cPitchH);
    ctx.stroke();

    // Center Circle & Spot
    ctx.beginPath();
    ctx.arc(midX, midY, PITCH.CENTER_RADIUS * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(midX, midY, 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Boxes
    const penBoxW = PITCH.PENALTY_BOX_LENGTH * scale;
    const penBoxH = PITCH.PENALTY_BOX_WIDTH * scale;
    const penBoxTop = midY - penBoxH / 2;

    ctx.strokeRect(cPitchX, penBoxTop, penBoxW, penBoxH);
    ctx.strokeRect(cPitchX + cPitchW - penBoxW, penBoxTop, penBoxW, penBoxH);

    // 6-Yard Goal Boxes
    const goalBoxW = PITCH.GOAL_BOX_LENGTH * scale;
    const goalBoxH = PITCH.GOAL_BOX_WIDTH * scale;
    const goalBoxTop = midY - goalBoxH / 2;

    ctx.strokeRect(cPitchX, goalBoxTop, goalBoxW, goalBoxH);
    ctx.strokeRect(cPitchX + cPitchW - goalBoxW, goalBoxTop, goalBoxW, goalBoxH);

    // Penalty Spots
    const penSpotDist = PITCH.PENALTY_SPOT_DIST * scale;
    ctx.beginPath();
    ctx.arc(cPitchX + penSpotDist, midY, 3 * scale, 0, Math.PI * 2);
    ctx.arc(cPitchX + cPitchW - penSpotDist, midY, 3 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Penalty D-Arcs
    ctx.beginPath();
    ctx.arc(cPitchX + penSpotDist, midY, 45 * scale, -Math.PI * 0.28, Math.PI * 0.28);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cPitchX + cPitchW - penSpotDist, midY, 45 * scale, Math.PI * 0.72, Math.PI * 1.28);
    ctx.stroke();

    // Corner Arcs
    const cornerR = PITCH.CORNER_RADIUS * scale;
    ctx.beginPath();
    ctx.arc(cPitchX, cPitchY, cornerR, 0, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cPitchX, cPitchY + cPitchH, cornerR, -Math.PI * 0.5, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cPitchX + cPitchW, cPitchY, cornerR, Math.PI * 0.5, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cPitchX + cPitchW, cPitchY + cPitchH, cornerR, Math.PI, Math.PI * 1.5);
    ctx.stroke();

    // Goal Posts
    const goalPostH = PITCH.GOAL_WIDTH * scale;
    const goalPostDepth = 14 * scale;
    const goalTop = midY - goalPostH / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(cPitchX - goalPostDepth, goalTop, goalPostDepth, goalPostH);
    ctx.fillRect(cPitchX + cPitchW, goalTop, goalPostDepth, goalPostH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(cPitchX - goalPostDepth, goalTop, goalPostDepth, goalPostH);
    ctx.strokeRect(cPitchX + cPitchW, goalTop, goalPostDepth, goalPostH);

    // 4. Draw Overlay Markers: Average Position Centroid & Maximum Hotspot
    if (showCentroid && analytics.centroid && activeSamples.length > 0) {
      const centX = toCanvasX(analytics.centroid.x);
      const centY = toCanvasY(analytics.centroid.y);

      // Outer pulsating ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(centX, centY, 16 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner solid target
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(centX, centY, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(10, Math.round(11 * scale))}px 'Chakra Petch', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (viewMode === 'player' && selectedPlayer) {
        ctx.fillText(`${selectedPlayer.number}`, centX, centY);
      } else {
        ctx.fillText('AVG', centX, centY);
      }
    }

    if (showHotspot && analytics.hotspot && activeSamples.length > 0) {
      const hotX = toCanvasX(analytics.hotspot.x);
      const hotY = toCanvasY(analytics.hotspot.y);

      // Flaming hotspot target crosshair
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hotX, hotY, 14 * scale, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hotX - 18 * scale, hotY);
      ctx.lineTo(hotX + 18 * scale, hotY);
      ctx.moveTo(hotX, hotY - 18 * scale);
      ctx.lineTo(hotX, hotY + 18 * scale);
      ctx.stroke();
    }

    ctx.restore();
  }, [stadium, activeSamples, radiusMode, showCentroid, showHotspot, analytics, viewMode, selectedPlayer]);

  // Snapshot download
  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `pitch-heatmap-${viewMode}-${selectedPlayer?.name || 'team'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div id="pitch-heatmap-viewer-root" className="space-y-4">
      {/* Top Header Controls: Mode Selector & Team Switcher */}
      <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Mode Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            id="heatmap-mode-player-btn"
            onClick={() => setViewMode('player')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              viewMode === 'player'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Player Heatmap</span>
          </button>

          <button
            id="heatmap-mode-team-btn"
            onClick={() => setViewMode('team')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              viewMode === 'team'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Squad Dominance</span>
          </button>

          <button
            id="heatmap-mode-ball-btn"
            onClick={() => setViewMode('ball')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              viewMode === 'ball'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Ball Flow</span>
          </button>
        </div>

        {/* Sub-toggles based on view mode */}
        <div className="flex items-center space-x-2">
          {viewMode === 'player' && (
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                id="heatmap-team-toggle-home"
                onClick={() => handleSelectTeamForPlayer('home')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                  selectedTeam === 'home'
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{homeTeam.badgeIcon}</span>
                <span>{homeTeam.shortName}</span>
              </button>
              <button
                id="heatmap-team-toggle-away"
                onClick={() => handleSelectTeamForPlayer('away')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                  selectedTeam === 'away'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{awayTeam.badgeIcon}</span>
                <span>{awayTeam.shortName}</span>
              </button>
            </div>
          )}

          {viewMode === 'team' && (
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setTeamViewSide('both')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  teamViewSide === 'both' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'
                }`}
              >
                Full Match
              </button>
              <button
                onClick={() => setTeamViewSide('home')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  teamViewSide === 'home' ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40' : 'text-slate-400'
                }`}
              >
                {homeTeam.shortName}
              </button>
              <button
                onClick={() => setTeamViewSide('away')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  teamViewSide === 'away' ? 'bg-slate-800 text-rose-400 border border-rose-500/40' : 'text-slate-400'
                }`}
              >
                {awayTeam.shortName}
              </button>
            </div>
          )}

          {/* Download Snapshot Button */}
          <button
            id="download-heatmap-snapshot-btn"
            onClick={handleDownloadSnapshot}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Download Heatmap Card"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Heatmap Stage & Canvas */}
      <div className="relative bg-slate-950 rounded-3xl p-3 sm:p-4 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Direction of Attack Badges */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2 px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-base">{homeTeam.badgeIcon}</span>
            <span className="font-bold text-white">{homeTeam.shortName}</span>
            <span className="text-cyan-400 font-black">ATTACKING ➔</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            {/* Centroid & Hotspot Toggles */}
            <button
              onClick={() => setShowCentroid(!showCentroid)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg border transition ${
                showCentroid ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Crosshair className="w-3 h-3" />
              <span>Avg Position</span>
            </button>

            <button
              onClick={() => setShowHotspot(!showHotspot)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg border transition ${
                showHotspot ? 'bg-rose-950/80 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Hotspot</span>
            </button>

            {/* Density Selector */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              {(['tight', 'balanced', 'wide'] as HeatmapRadius[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRadiusMode(r)}
                  className={`px-1.5 py-0.5 text-[10px] uppercase font-bold rounded ${
                    radiusMode === r ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {r[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-rose-400 font-black">⬅ ATTACKING</span>
            <span className="font-bold text-white">{awayTeam.shortName}</span>
            <span className="text-base">{awayTeam.badgeIcon}</span>
          </div>
        </div>

        {/* The Heatmap Pitch Canvas */}
        <div className="relative w-full aspect-[16/10] max-h-[360px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
          <canvas
            ref={canvasRef}
            width={760}
            height={475}
            className="w-full h-full object-contain"
          />

          {/* Thermal Intensity Legend Bar */}
          <div className="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-[10px] font-mono text-slate-400 shadow-lg">
            <span>Low</span>
            <div className="w-20 sm:w-24 h-2 rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 via-amber-400 to-rose-600 border border-white/20" />
            <span className="text-rose-400 font-bold">High Intensity</span>
          </div>
        </div>
      </div>

      {/* PLAYER SELECTOR DRAWER (When in Player Mode) */}
      {viewMode === 'player' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-white">Select Player ({selectedTeam === 'home' ? homeTeam.name : awayTeam.name})</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {currentTeamPlayers.length} squad members tracked
            </span>
          </div>

          {/* Scrollable Player Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            {currentTeamPlayers.map((p) => {
              const isSelected = p.id === selectedPlayerId;
              const posColor = getPositionBadgeColor(p.position);

              return (
                <button
                  key={p.id}
                  id={`heatmap-player-${p.id}`}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-2xl border transition-all flex items-center space-x-2.5 ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs border ${posColor}`}>
                    {p.position}
                  </div>

                  <div className="text-left">
                    <div className="text-xs font-bold text-white flex items-center space-x-1">
                      <span>{p.shortName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">#{p.number}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.distanceKm.toFixed(1)} km • {p.topSpeedKmh} km/h
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ANALYTICAL BREAKDOWN METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Panel 1: Pitch Thirds Distribution */}
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pitch Thirds Territory</span>
            </div>
          </div>

          {/* Segmented Bar */}
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
            <div 
              style={{ width: `${analytics.defensiveThirdPct}%` }}
              className="bg-blue-600 transition-all"
              title={`Defensive 3rd: ${analytics.defensiveThirdPct}%`}
            />
            <div 
              style={{ width: `${analytics.middleThirdPct}%` }}
              className="bg-emerald-500 transition-all"
              title={`Middle 3rd: ${analytics.middleThirdPct}%`}
            />
            <div 
              style={{ width: `${analytics.attackingThirdPct}%` }}
              className="bg-rose-500 transition-all"
              title={`Attacking 3rd: ${analytics.attackingThirdPct}%`}
            />
          </div>

          <div className="grid grid-cols-3 text-center text-xs font-mono pt-1 border-t border-slate-800/80">
            <div>
              <div className="text-[10px] text-blue-400 font-bold uppercase">Defending</div>
              <div className="text-white font-black text-sm">{analytics.defensiveThirdPct}%</div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase">Midfield</div>
              <div className="text-white font-black text-sm">{analytics.middleThirdPct}%</div>
            </div>
            <div>
              <div className="text-[10px] text-rose-400 font-bold uppercase">Attacking</div>
              <div className="text-white font-black text-sm">{analytics.attackingThirdPct}%</div>
            </div>
          </div>
        </div>

        {/* Panel 2: Flank Channel Bias */}
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
            <div className="flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Flank Channel Balance</span>
            </div>
          </div>

          {/* Segmented Bar */}
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
            <div 
              style={{ width: `${analytics.leftFlankPct}%` }}
              className="bg-teal-500 transition-all"
              title={`Left Flank: ${analytics.leftFlankPct}%`}
            />
            <div 
              style={{ width: `${analytics.centerPct}%` }}
              className="bg-amber-400 transition-all"
              title={`Center: ${analytics.centerPct}%`}
            />
            <div 
              style={{ width: `${analytics.rightFlankPct}%` }}
              className="bg-purple-500 transition-all"
              title={`Right Flank: ${analytics.rightFlankPct}%`}
            />
          </div>

          <div className="grid grid-cols-3 text-center text-xs font-mono pt-1 border-t border-slate-800/80">
            <div>
              <div className="text-[10px] text-teal-400 font-bold uppercase">Left Flank</div>
              <div className="text-white font-black text-sm">{analytics.leftFlankPct}%</div>
            </div>
            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase">Central</div>
              <div className="text-white font-black text-sm">{analytics.centerPct}%</div>
            </div>
            <div>
              <div className="text-[10px] text-purple-400 font-bold uppercase">Right Flank</div>
              <div className="text-white font-black text-sm">{analytics.rightFlankPct}%</div>
            </div>
          </div>
        </div>

        {/* Panel 3: Physical Work Rate & Telemetry */}
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
            <div className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Physical Work Rate</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Match High</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Distance Covered</span>
              <span className="text-sm font-black text-white">
                {selectedPlayer ? `${selectedPlayer.distanceKm.toFixed(2)} km` : '10.42 km'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Top Sprint Speed</span>
              <span className="text-sm font-black text-amber-400">
                {selectedPlayer ? `${selectedPlayer.topSpeedKmh} km/h` : '32.6 km/h'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Sprint Distance</span>
              <span className="text-sm font-black text-cyan-300">
                {selectedPlayer ? `${selectedPlayer.sprintDistanceKm.toFixed(2)} km` : '2.28 km'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Pitch Coverage</span>
              <span className="text-sm font-black text-emerald-400">
                {analytics.coveragePct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Analysis Summary Footer */}
      <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-white">Tactical Analysis: </span>
          <span className="text-slate-400">
            {generateTacticalSummary(viewMode, selectedPlayer, analytics, homeTeam, awayTeam)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper: Generates 256-color thermal gradient lookup table
function getThermalPalette(mode: 'thermal' | 'ball'): Array<[number, number, number, number]> {
  const palette: Array<[number, number, number, number]> = [];

  for (let i = 0; i < 256; i++) {
    if (i < 12) {
      palette.push([0, 0, 0, 0]);
      continue;
    }

    const t = i / 255;
    let r = 0;
    let g = 0;
    let b = 0;
    let a = Math.min(255, Math.round(t * 220 + 35));

    if (mode === 'ball') {
      // Amber/Gold flame for ball
      if (t < 0.35) {
        r = Math.round(250 * (t / 0.35));
        g = Math.round(180 * (t / 0.35));
        b = 0;
      } else if (t < 0.75) {
        r = 255;
        g = Math.round(180 + 75 * ((t - 0.35) / 0.4));
        b = Math.round(50 * ((t - 0.35) / 0.4));
      } else {
        r = 255;
        g = 255;
        b = Math.round(180 * ((t - 0.75) / 0.25));
      }
    } else {
      // Classic Broadcast Thermal Ramp: Deep Blue -> Cyan -> Emerald -> Yellow -> Orange -> Crimson -> Hot White
      if (t < 0.2) {
        // Deep Blue to Cyan
        const f = t / 0.2;
        r = 0;
        g = Math.round(160 * f);
        b = Math.round(220 + 35 * f);
      } else if (t < 0.45) {
        // Cyan to Emerald
        const f = (t - 0.2) / 0.25;
        r = Math.round(34 * f);
        g = Math.round(160 + 55 * f);
        b = Math.round(255 * (1 - f));
      } else if (t < 0.7) {
        // Emerald to Yellow
        const f = (t - 0.45) / 0.25;
        r = Math.round(34 + 210 * f);
        g = Math.round(215 + 30 * f);
        b = 0;
      } else if (t < 0.9) {
        // Yellow to Vivid Orange / Red
        const f = (t - 0.7) / 0.2;
        r = 255;
        g = Math.round(245 * (1 - f * 0.7));
        b = 0;
      } else {
        // Blazing Crimson to Hot White
        const f = (t - 0.9) / 0.1;
        r = 255;
        g = Math.round(75 + 180 * f);
        b = Math.round(75 + 180 * f);
      }
    }

    palette.push([r, g, b, a]);
  }

  return palette;
}

function getPositionBadgeColor(pos: string): string {
  if (pos === 'GK') return 'bg-amber-950/80 border-amber-500/40 text-amber-300';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'bg-blue-950/80 border-blue-500/40 text-blue-300';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300';
  return 'bg-rose-950/80 border-rose-500/40 text-rose-300';
}

function generateTacticalSummary(
  viewMode: ViewMode,
  player: PlayerHeatmapRecord | null,
  analytics: { defensiveThirdPct: number; middleThirdPct: number; attackingThirdPct: number; leftFlankPct: number; centerPct: number; rightFlankPct: number },
  homeTeam: Team,
  awayTeam: Team
): string {
  if (viewMode === 'ball') {
    if (analytics.attackingThirdPct > 45) {
      return `High-pressing match rhythm with intense ball circulation concentrated inside the opposition attacking third (${analytics.attackingThirdPct}%).`;
    }
    return `Balanced tactical battle through the midfield channel (${analytics.middleThirdPct}%) with frequent switches between left and right flanks.`;
  }

  if (viewMode === 'team') {
    return `Territorial dominance shows active transitions across both halves, with strong flanking overloads and structured defensive shape.`;
  }

  if (!player) return 'Select a squad player above to review position-specific heatmaps and physical performance.';

  if (player.position === 'GK') {
    return `${player.name} maintained commanding box discipline around the goal line with key distribution sweeps.`;
  }

  if (analytics.attackingThirdPct > 45) {
    return `${player.name} pushed aggressively into the opposition final third (${analytics.attackingThirdPct}%), spearheading attacks with dynamic forward runs.`;
  }

  if (analytics.defensiveThirdPct > 50) {
    return `${player.name} anchored the defensive third (${analytics.defensiveThirdPct}%), providing disciplined cover and tactical interceptions.`;
  }

  const highestFlank = Math.max(analytics.leftFlankPct, analytics.centerPct, analytics.rightFlankPct);
  if (highestFlank === analytics.leftFlankPct && analytics.leftFlankPct > 40) {
    return `${player.name} established heavy left-wing dominance (${analytics.leftFlankPct}%), stretching the pitch and creating wide passing lanes.`;
  }
  if (highestFlank === analytics.rightFlankPct && analytics.rightFlankPct > 40) {
    return `${player.name} operated primarily down the right corridor (${analytics.rightFlankPct}%), driving wide overloads.`;
  }

  return `${player.name} displayed high-intensity box-to-box work rate, connecting defensive recoveries to offensive combinations across the pitch.`;
}
