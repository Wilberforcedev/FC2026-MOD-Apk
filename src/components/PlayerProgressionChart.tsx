import React, { useState, useMemo } from 'react';
import { Player, Team } from '../types/soccer';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Zap,
  Activity,
  Flame,
  ShieldAlert,
  Sparkles,
  Award,
  Calendar,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Info,
} from 'lucide-react';
import { PlayerFaceAvatar } from './PlayerFaceCard';

export type TrainingIntensityLevel = 'light' | 'balanced' | 'high' | 'masterclass';

export interface TrainingIntensityConfig {
  id: TrainingIntensityLevel;
  name: string;
  badgeColor: string;
  growthMultiplier: number;
  fatigueCostPerWeek: number;
  injuryRiskPercent: number;
  description: string;
  color: string;
  seasonDeltaOvr: string;
}

export const TRAINING_INTENSITY_CONFIGS: Record<TrainingIntensityLevel, TrainingIntensityConfig> = {
  light: {
    id: 'light',
    name: 'Light / Recovery',
    badgeColor: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
    growthMultiplier: 0.45,
    fatigueCostPerWeek: 4,
    injuryRiskPercent: 0.3,
    description: 'Focus on tactical recovery and light stretching. Preserves peak match fitness with modest development.',
    color: '#38bdf8', // Sky blue
    seasonDeltaOvr: '+1 to +2 OVR',
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced Standard',
    badgeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    growthMultiplier: 1.0,
    fatigueCostPerWeek: 12,
    injuryRiskPercent: 1.8,
    description: 'The golden mean. Controlled progression with consistent match freshness and minimal injury hazard.',
    color: '#10b981', // Emerald
    seasonDeltaOvr: '+3 to +4 OVR',
  },
  high: {
    id: 'high',
    name: 'High Intensity',
    badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    growthMultiplier: 1.55,
    fatigueCostPerWeek: 20,
    injuryRiskPercent: 4.2,
    description: 'High-tempo drills and aerobic conditioning. Accelerated stat spikes with increased midweek fatigue.',
    color: '#f59e0b', // Amber
    seasonDeltaOvr: '+5 to +6 OVR',
  },
  masterclass: {
    id: 'masterclass',
    name: 'Masterclass Overdrive',
    badgeColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    growthMultiplier: 2.1,
    fatigueCostPerWeek: 30,
    injuryRiskPercent: 8.5,
    description: 'Extreme athletic push. Unlocks peak genetic potential ceiling at the risk of physical exhaustion.',
    color: '#f43f5e', // Rose
    seasonDeltaOvr: '+7 to +8 OVR',
  },
};

interface PlayerProgressionChartProps {
  player: Player;
  team: Team;
  currentMatchday?: number;
  onApplyIntensity?: (intensity: TrainingIntensityLevel) => void;
  onOpenTrainingAcademy?: () => void;
}

export const PlayerProgressionChart: React.FC<PlayerProgressionChartProps> = ({
  player,
  team,
  currentMatchday = 12,
  onApplyIntensity,
  onOpenTrainingAcademy,
}) => {
  const [selectedIntensity, setSelectedIntensity] = useState<TrainingIntensityLevel>('balanced');
  const [showAllIntensities, setShowAllIntensities] = useState<boolean>(true);
  const [viewMetric, setViewMetric] = useState<'overall' | 'attributes' | 'stamina'>('overall');
  const [activeTab, setActiveTab] = useState<'chart' | 'comparison' | 'regime'>('chart');

  const potential = player.potential || Math.min(99, player.rating + 6);
  const baselineRating = Math.max(50, player.rating - Math.floor((player.development?.drillsCompleted || 2) * 0.8));

  // Generate career season timeline progression data
  const chartData = useMemo(() => {
    // 38 matchdays in a standard top-flight league season
    const checkpoints = [1, 4, 8, 12, 16, 20, 24, 28, 32, 36, 38];

    return checkpoints.map((md) => {
      const progressFraction = (md - 1) / 37; // 0 to 1
      const isHistorical = md <= currentMatchday;

      // Base growth curve calculation based on potential ceiling and S-curve progression
      const maxPossibleGrowth = Math.max(1, potential - baselineRating);

      // S-curve logistic factor
      const sCurve = 1 / (1 + Math.exp(-6 * (progressFraction - 0.4)));

      // Individual intensities OVR projection
      const calcOvr = (level: TrainingIntensityLevel) => {
        const config = TRAINING_INTENSITY_CONFIGS[level];
        const growth = Math.min(maxPossibleGrowth, maxPossibleGrowth * sCurve * config.growthMultiplier);
        return Math.min(potential, Math.round(baselineRating + growth));
      };

      const lightOvr = calcOvr('light');
      const balancedOvr = calcOvr('balanced');
      const highOvr = calcOvr('high');
      const masterclassOvr = calcOvr('masterclass');

      const activeOvr = calcOvr(selectedIntensity);

      // Attribute breakdowns (Pace, Shooting, Passing, Dribbling, Defending, Physical)
      const baseStats = player.stats;
      const attrGrowth = (statBase: number, weight: number) => {
        const config = TRAINING_INTENSITY_CONFIGS[selectedIntensity];
        const delta = Math.min(99, Math.round(statBase + (potential - player.rating) * progressFraction * weight * config.growthMultiplier));
        return Math.max(statBase, delta);
      };

      // Stamina / Condition projection based on intensity wear & tear
      const config = TRAINING_INTENSITY_CONFIGS[selectedIntensity];
      const fatigueFactor = config.fatigueCostPerWeek;
      const projectedStamina = Math.max(45, Math.min(100, Math.round(96 - (progressFraction * fatigueFactor * 1.4) + (isHistorical ? 2 : 0))));

      return {
        matchday: `MD ${md}`,
        matchdayNum: md,
        isHistorical,
        // Selected intensity
        overall: activeOvr,
        stamina: projectedStamina,
        // Individual intensities for comparison
        Light: lightOvr,
        Balanced: balancedOvr,
        High: highOvr,
        Masterclass: masterclassOvr,
        // Specific Attributes
        pace: attrGrowth(baseStats.pace, 0.7),
        shooting: attrGrowth(baseStats.shooting, 0.9),
        passing: attrGrowth(baseStats.passing, 0.85),
        dribbling: attrGrowth(baseStats.dribbling, 0.8),
        defending: attrGrowth(baseStats.defending, 0.75),
        physicality: attrGrowth(baseStats.physicality, 0.65),
      };
    });
  }, [player, baselineRating, potential, selectedIntensity, currentMatchday]);

  const activeConfig = TRAINING_INTENSITY_CONFIGS[selectedIntensity];
  const projectedFinalOvr = chartData[chartData.length - 1]?.overall || player.rating;
  const totalGrowth = projectedFinalOvr - baselineRating;

  return (
    <div className="bg-slate-950/90 border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden backdrop-blur-md">
      {/* Background Decorative Energy Lines */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* =========================================================================
          TOP BAR: Player Identity, Current Rating, Potential & Intensity Selector
      ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-cyan-900/40 pb-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl border-2 border-cyan-400/40 bg-slate-900 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] overflow-hidden shrink-0">
            <PlayerFaceAvatar
              skinTone={player.likeness?.skinTone || '#d49b6a'}
              hairStyle={player.likeness?.hairStyle || 'short'}
              hairColor={player.likeness?.hairColor || '#111827'}
              facialHair={player.likeness?.facialHair || 'none'}
              jerseyColor={team.kit.primary}
              size={48}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold">
                {player.position}
              </span>
              <span className="text-xs text-white/50 font-mono">
                {team.shortName || team.name} • #{player.number}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                POTENTIAL: {potential} OVR
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider mt-0.5">
              {player.name}
            </h3>
          </div>
        </div>

        {/* Quick KPI Stat Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
            <span className="text-[9px] text-white/40 block font-mono uppercase">CURRENT</span>
            <span className="text-lg font-black font-['Chakra_Petch'] text-cyan-300">
              {player.rating}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
            <span className="text-[9px] text-white/40 block font-mono uppercase">PROJECTED</span>
            <span className="text-lg font-black font-['Chakra_Petch'] text-emerald-400">
              {projectedFinalOvr}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
            <span className="text-[9px] text-white/40 block font-mono uppercase">NET GAIN</span>
            <span className="text-lg font-black font-['Chakra_Petch'] text-amber-400">
              +{Math.max(0, projectedFinalOvr - player.rating)}
            </span>
          </div>

          {onOpenTrainingAcademy && (
            <button
              onClick={onOpenTrainingAcademy}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>DRILL ACADEMY</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          TRAINING INTENSITY REGIME SELECTOR CARDS
      ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-['Chakra_Petch'] font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            SELECT TRAINING INTENSITY REGIME
          </span>
          <span className="text-[11px] text-white/40 font-mono">
            Affects XP Velocity vs. Match Fitness & Fatigue
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(Object.values(TRAINING_INTENSITY_CONFIGS) as TrainingIntensityConfig[]).map((cfg) => {
            const isSelected = selectedIntensity === cfg.id;

            return (
              <button
                key={cfg.id}
                onClick={() => {
                  setSelectedIntensity(cfg.id);
                  if (onApplyIntensity) onApplyIntensity(cfg.id);
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                    : 'bg-slate-950/60 border-white/10 hover:border-white/20 hover:bg-slate-900/60'
                }`}
              >
                {isSelected && (
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-black font-['Chakra_Petch'] uppercase tracking-wider text-white flex items-center gap-1.5">
                      {cfg.name}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono font-bold block mt-0.5">
                      {cfg.seasonDeltaOvr}
                    </span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                </div>

                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50 font-mono">
                  <span>Fatigue: {cfg.fatigueCostPerWeek}%/wk</span>
                  <span className={cfg.injuryRiskPercent > 5 ? 'text-rose-400' : 'text-white/50'}>
                    Risk: {cfg.injuryRiskPercent}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          CONTROLS: VIEW METRIC (OVR / Attributes / Stamina) & TOGGLES
      ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-cyan-900/30 rounded-2xl p-2.5">
        {/* Metric Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMetric('overall')}
            className={`px-3 py-1.5 rounded-lg font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition ${
              viewMetric === 'overall'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            OVERALL RATING
          </button>
          <button
            onClick={() => setViewMetric('attributes')}
            className={`px-3 py-1.5 rounded-lg font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition ${
              viewMetric === 'attributes'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            6 CORE ATTRIBUTES
          </button>
          <button
            onClick={() => setViewMetric('stamina')}
            className={`px-3 py-1.5 rounded-lg font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition ${
              viewMetric === 'stamina'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            STAMINA & FATIGUE
          </button>
        </div>

        {/* Recharts Compare All Toggle */}
        {viewMetric === 'overall' && (
          <label className="flex items-center gap-2 text-xs text-cyan-300 font-['Chakra_Petch'] font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAllIntensities}
              onChange={(e) => setShowAllIntensities(e.target.checked)}
              className="w-4 h-4 rounded border-cyan-500/40 text-cyan-500 focus:ring-cyan-400 bg-slate-900 cursor-pointer"
            />
            <span>COMPARE ALL 4 INTENSITIES</span>
          </label>
        )}
      </div>

      {/* =========================================================================
          RECHARTS VISUALIZATION CONTAINER
      ========================================================================= */}
      <div className="w-full h-72 sm:h-80 bg-slate-950/80 border border-cyan-500/20 rounded-2xl p-2 sm:p-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
          >
            <defs>
              {/* Glowing Gradients for Areas */}
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="staminaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(6, 182, 212, 0.12)"
              vertical={false}
            />

            <XAxis
              dataKey="matchday"
              stroke="rgba(255, 255, 255, 0.4)"
              fontSize={11}
              tickLine={false}
              fontFamily="'Chakra Petch', monospace"
            />

            <YAxis
              domain={
                viewMetric === 'stamina'
                  ? [40, 100]
                  : [Math.max(40, baselineRating - 4), Math.min(99, potential + 3)]
              }
              stroke="rgba(255, 255, 255, 0.4)"
              fontSize={11}
              tickLine={false}
              fontFamily="'Chakra Petch', monospace"
            />

            <Tooltip content={<CustomChartTooltip currentMatchday={currentMatchday} />} />

            <Legend
              wrapperStyle={{
                paddingTop: '8px',
                fontSize: '11px',
                fontFamily: "'Chakra Petch', sans-serif",
                textTransform: 'uppercase',
              }}
            />

            {/* Current Matchday Vertical Marker */}
            <ReferenceLine
              x={`MD ${currentMatchday}`}
              stroke="#22d3ee"
              strokeDasharray="4 4"
              label={{
                value: 'CURRENT MATCHDAY',
                fill: '#22d3ee',
                fontSize: 9,
                position: 'top',
                fontFamily: "'Chakra Petch', monospace",
              }}
            />

            {/* Potential Ceiling Horizontal Reference Line */}
            {viewMetric !== 'stamina' && (
              <ReferenceLine
                y={potential}
                stroke="#a855f7"
                strokeDasharray="4 4"
                label={{
                  value: `POTENTIAL CEILING (${potential})`,
                  fill: '#c084fc',
                  fontSize: 9,
                  position: 'right',
                  fontFamily: "'Chakra Petch', monospace",
                }}
              />
            )}

            {/* 1. OVERALL RATING VIEW */}
            {viewMetric === 'overall' && (
              <>
                <Area
                  type="monotone"
                  dataKey="overall"
                  name={`${activeConfig.name} (Active)`}
                  stroke={activeConfig.color}
                  strokeWidth={3}
                  fill="url(#activeGradient)"
                  dot={{ r: 3, fill: activeConfig.color }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                />

                {showAllIntensities && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="Light"
                      name="Light Intensity"
                      stroke="#38bdf8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Balanced"
                      name="Balanced"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="High"
                      name="High Intensity"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Masterclass"
                      name="Masterclass"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </>
                )}
              </>
            )}

            {/* 2. CORE ATTRIBUTES VIEW */}
            {viewMetric === 'attributes' && (
              <>
                <Line
                  type="monotone"
                  dataKey="pace"
                  name="Pace (PAC)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="shooting"
                  name="Shooting (SHO)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="passing"
                  name="Passing (PAS)"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="dribbling"
                  name="Dribbling (DRI)"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="defending"
                  name="Defending (DEF)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="physicality"
                  name="Physicality (PHY)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </>
            )}

            {/* 3. STAMINA & FATIGUE TRADEOFF */}
            {viewMetric === 'stamina' && (
              <>
                <Area
                  type="monotone"
                  dataKey="stamina"
                  name="Projected Match Fitness (%)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#staminaGradient)"
                  dot={{ r: 3, fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="OVR Growth"
                  stroke={activeConfig.color}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* =========================================================================
          BOTTOM SUMMARY INSIGHTS: Manager Tactical Report
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
            PROJECTED CEILING CEILING
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black font-['Chakra_Petch'] text-white">
              {projectedFinalOvr} <span className="text-xs text-emerald-400">/ {potential} MAX</span>
            </span>
            <span className="text-xs font-bold text-emerald-400">
              +{totalGrowth} Growth
            </span>
          </div>
          <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
            Under <strong>{activeConfig.name}</strong>, {player.shortName || player.name} reaches peak form around Matchday 28.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
            FATIGUE & ROTATION IMPACT
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black font-['Chakra_Petch'] text-white">
              {activeConfig.fatigueCostPerWeek}% <span className="text-xs text-white/40">per week</span>
            </span>
            <span className="text-xs font-bold text-amber-400">
              {activeConfig.injuryRiskPercent}% Injury Risk
            </span>
          </div>
          <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
            Maintain squad rotation in cup matches to mitigate hamstring fatigue.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider block mb-1">
              PRIMARY UPGRADE VECTORS
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['SHO', 'DRI', 'PAS'].map((stat) => (
                <span
                  key={stat}
                  className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold"
                >
                  {stat} +{(totalGrowth * 1.1).toFixed(0)}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-white/40 mt-2 font-mono">
            Updated dynamically based on training intensity
          </span>
        </div>
      </div>
    </div>
  );
};

// Custom Cyber Tooltip for Recharts
interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currentMatchday: number;
}

const CustomChartTooltip: React.FC<TooltipProps> = ({ active, payload, label, currentMatchday }) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload;
  const isPast = dataPoint?.matchdayNum <= currentMatchday;

  return (
    <div className="bg-slate-950/95 border border-cyan-400/60 rounded-2xl p-3 shadow-2xl backdrop-blur-md min-w-[190px]">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-1.5 mb-2">
        <span className="text-xs font-black font-['Chakra_Petch'] text-cyan-300 tracking-wider">
          {label}
        </span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
            isPast ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }`}
        >
          {isPast ? 'RECORDED' : 'PROJECTED'}
        </span>
      </div>

      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          if (entry.value === undefined || entry.value === null) return null;
          return (
            <div key={`tooltip-${index}`} className="flex items-center justify-between text-xs gap-3">
              <span className="flex items-center gap-1.5 text-white/70 font-['Outfit']">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color || entry.stroke || '#06b6d4' }}
                />
                {entry.name}:
              </span>
              <span className="font-['Chakra_Petch'] font-black text-white">
                {entry.value}
                {entry.name?.includes('Fitness') ? '%' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
