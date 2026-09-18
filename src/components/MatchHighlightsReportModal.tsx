import React, { useState, useMemo } from 'react';
import { MatchStats, GoalEvent, Team, MatchHighlightEvent, MatchHeatmapData } from '../types/soccer';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  Trophy, 
  Target, 
  Percent, 
  Shield, 
  Activity, 
  Clock, 
  Flame, 
  Zap, 
  RefreshCw, 
  ChevronRight,
  BarChart3,
  Award,
  Users
} from 'lucide-react';

interface MatchHighlightsReportModalProps {
  homeTeam: Team;
  awayTeam: Team;
  stats: MatchStats;
  goalEvents: GoalEvent[];
  keyMatchEvents?: MatchHighlightEvent[];
  heatmapData?: MatchHeatmapData;
  onClose: () => void;
  onReplayHighlight?: (hl: MatchHighlightEvent) => void;
}

type ReportStyle = 'broadcast' | 'tactical' | 'tabloid';

export const MatchHighlightsReportModal: React.FC<MatchHighlightsReportModalProps> = ({
  homeTeam,
  awayTeam,
  stats,
  goalEvents = [],
  keyMatchEvents = [],
  heatmapData,
  onClose,
  onReplayHighlight,
}) => {
  const [reportStyle, setReportStyle] = useState<ReportStyle>('broadcast');
  const [copied, setCopied] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(1);

  // Derived key statistics
  const homeScore = stats.homeScore;
  const awayScore = stats.awayScore;
  const isHomeWin = homeScore > awayScore;
  const isAwayWin = awayScore > homeScore;
  const isDraw = homeScore === awayScore;
  const totalGoals = homeScore + awayScore;

  // Possession
  const homePoss = stats.homePossessionPercent;
  const awayPoss = stats.awayPossessionPercent;

  // Shots and Shots on Target (Shots on Goal)
  const homeShots = stats.homeShots;
  const awayShots = stats.awayShots;
  const homeSOT = stats.homeShotsOnTarget;
  const awaySOT = stats.awayShotsOnTarget;

  const homeAccuracy = homeShots > 0 ? Math.round((homeSOT / homeShots) * 100) : 0;
  const awayAccuracy = awayShots > 0 ? Math.round((awaySOT / awayShots) * 100) : 0;

  const homeConversion = homeSOT > 0 ? Math.round((homeScore / homeSOT) * 100) : 0;
  const awayConversion = awaySOT > 0 ? Math.round((awayScore / awaySOT) * 100) : 0;

  const homeSaves = Math.max(0, awaySOT - awayScore);
  const awaySaves = Math.max(0, homeSOT - homeScore);

  // Determine Man of the Match
  const manOfTheMatch = useMemo(() => {
    // Check highest goal scorer
    if (goalEvents.length > 0) {
      const scorerCounts: Record<string, { count: number; team: 'home' | 'away'; number: number }> = {};
      for (const g of goalEvents) {
        if (!scorerCounts[g.scorerName]) {
          scorerCounts[g.scorerName] = { count: 0, team: g.team, number: g.scorerNumber };
        }
        scorerCounts[g.scorerName].count++;
      }
      let topScorer = '';
      let maxGoals = 0;
      let topTeam: 'home' | 'away' = 'home';
      let topNum = 10;
      for (const [name, meta] of Object.entries(scorerCounts)) {
        if (meta.count > maxGoals) {
          maxGoals = meta.count;
          topScorer = name;
          topTeam = meta.team;
          topNum = meta.number;
        }
      }

      if (maxGoals >= 1) {
        const teamObj = topTeam === 'home' ? homeTeam : awayTeam;
        return {
          name: topScorer,
          number: topNum,
          team: teamObj.name,
          badge: teamObj.badgeIcon,
          rating: (8.4 + Math.min(1.4, maxGoals * 0.6)).toFixed(1),
          accolade: maxGoals > 1 ? `Brace Hero (${maxGoals} Goals)` : 'Match-Winning Finisher',
          description: `Decisive attacking threat who converted under pressure and proved the difference-maker.`,
        };
      }
    }

    // Goalkeeper heroics if clean sheet or many saves
    if (isHomeWin && awayScore === 0 && homeSaves >= 2) {
      return {
        name: 'Home Goalkeeper',
        number: 1,
        team: homeTeam.name,
        badge: homeTeam.badgeIcon,
        rating: '8.8',
        accolade: `Clean Sheet Specialist (${homeSaves} Saves)`,
        description: `Impenetrable wall in goal denying multiple dangerous on-target attempts to preserve the shutout.`,
      };
    }

    // Default MVP based on winning team midfield engine
    const winningTeam = isHomeWin ? homeTeam : isAwayWin ? awayTeam : homeTeam;
    return {
      name: `${winningTeam.shortName} Playmaker`,
      number: 8,
      team: winningTeam.name,
      badge: winningTeam.badgeIcon,
      rating: '8.5',
      accolade: 'Engine Room Maestro',
      description: `Controlled the tempo with crisp distribution and relentless physical work rate.`,
    };
  }, [goalEvents, isHomeWin, isAwayWin, awayScore, homeSaves, homeTeam, awayTeam]);

  // Dynamic Headline Generation
  const headline = useMemo(() => {
    const winner = isHomeWin ? homeTeam.name : awayTeam.name;
    const loser = isHomeWin ? awayTeam.name : homeTeam.name;
    const diff = Math.abs(homeScore - awayScore);

    if (isDraw) {
      if (homeScore === 0) {
        return `Defensive Stalemate: ${homeTeam.name} and ${awayTeam.name} Share the Spoils in Goalless Battle`;
      }
      return `Honours Even: Thrilling ${homeScore}-${awayScore} Draw as ${homeTeam.name} & ${awayTeam.name} Trade Blows`;
    }

    if (diff >= 3) {
      return `Total Rout: Rampant ${winner} Dismantle ${loser} in ${homeScore}-${awayScore} Masterclass`;
    }

    if (diff === 2) {
      return `Decisive Command: ${winner} Pull Clear of ${loser} in Compelling ${homeScore}-${awayScore} Victory`;
    }

    // Single goal margin
    if ((isHomeWin && homePoss < 45) || (isAwayWin && awayPoss < 45)) {
      return `Smash & Grab: Clinical ${winner} Overcome Possession Deficit to Stun ${loser} ${homeScore}-${awayScore}`;
    }

    if (totalGoals >= 4) {
      return `High-Octane Thriller: ${winner} Edge Past ${loser} ${homeScore}-${awayScore} in End-to-End Epic`;
    }

    return `Hard-Fought Triumph: ${winner} Hold Nerve to Edge ${loser} ${homeScore}-${awayScore}`;
  }, [homeScore, awayScore, isHomeWin, isAwayWin, isDraw, homeTeam, awayTeam, homePoss, awayPoss, totalGoals, seed]);

  // Dynamic Narrative Generation based on Style
  const dynamicReport = useMemo(() => {
    const winnerTeam = isHomeWin ? homeTeam : isAwayWin ? awayTeam : null;
    const winningSide = isHomeWin ? 'home' : 'away';

    // 1. Match Outcome Narrative
    let outcomeText = '';
    if (reportStyle === 'broadcast') {
      if (isDraw) {
        outcomeText = `The final whistle blows on a fiercely contested fixture between ${homeTeam.name} and ${awayTeam.name}, concluding in a ${homeScore}-${awayScore} deadlock. Both tacticians will find positives in their squads' resolve, though either side could have stolen full points in late surges.`;
      } else {
        outcomeText = `${winnerTeam?.name} secured a memorable ${homeScore}-${awayScore} triumph over ${isHomeWin ? awayTeam.name : homeTeam.name}. From the opening exchanges, the tempo was relentless as ${winnerTeam?.shortName} capitalized on decisive moments to assert their authority.`;
      }
    } else if (reportStyle === 'tactical') {
      if (isDraw) {
        outcomeText = `An equilibrium of tactical systems: ${homeTeam.name} and ${awayTeam.name} neutralized each other's primary passing channels in a ${homeScore}-${awayScore} stalemate. Both backlines maintained disciplined defensive depths to prevent decisive overloads.`;
      } else {
        outcomeText = `Tactical execution proved the determining factor as ${winnerTeam?.name} engineered a ${homeScore}-${awayScore} win against ${isHomeWin ? awayTeam.name : homeTeam.name}. Exploiting spatial transitions between defensive and midfield lines proved pivotal in generating high-quality xG opportunities.`;
      }
    } else {
      // Tabloid style
      if (isDraw) {
        outcomeText = `WHAT A SCRAP! No quarter was given and none taken as ${homeTeam.name} and ${awayTeam.name} locked horns in a dramatic ${homeScore}-${awayScore} clash that kept fans on the edge of their seats right until the dying seconds!`;
      } else {
        outcomeText = `PURE DRAMA! ${winnerTeam?.name} delivered a statement performance to claim bragging rights with a pulsating ${homeScore}-${awayScore} victory over fierce rivals ${isHomeWin ? awayTeam.name : homeTeam.name}!`;
      }
    }

    // 2. Possession & Ball Circulation Analysis
    let possessionText = '';
    const dominantPossTeam = homePoss >= awayPoss ? homeTeam : awayTeam;
    const possMargin = Math.abs(homePoss - awayPoss);

    if (possMargin < 6) {
      possessionText = `The midfield duel was remarkably balanced, with possession virtually split down the middle (${homeTeam.shortName} ${homePoss}% - ${awayTeam.shortName} ${awayPoss}%). Both midfields engaged in intense rotational pressing, rarely allowing the opposing engine room uninterrupted possession chains.`;
    } else if (dominantPossTeam.id === winnerTeam?.id) {
      possessionText = `Territorial control mirrored the final scoreline: ${dominantPossTeam.name} commanded the lion's share of the ball with a dominant ${Math.max(homePoss, awayPoss)}% possession, dictating the tempo and restricting ${dominantPossTeam.id === homeTeam.id ? awayTeam.shortName : homeTeam.shortName} to just ${Math.min(homePoss, awayPoss)}% of the ball.`;
    } else if (!isDraw) {
      // Underdog counter-attack win!
      possessionText = `In a masterclass of transitional efficiency, ${winnerTeam?.name} relinquished the ball to register only ${winningSide === 'home' ? homePoss : awayPoss}% possession against ${isHomeWin ? awayTeam.shortName : homeTeam.shortName}'s ${isHomeWin ? awayPoss : homePoss}%. Rather than controlling sterile possession, they hit with venom on rapid counter-attacks.`;
    } else {
      possessionText = `While ${dominantPossTeam.name} enjoyed greater ball retention with ${Math.max(homePoss, awayPoss)}% possession, they found it difficult to break down the disciplined low-block of their opponents (${Math.min(homePoss, awayPoss)}% possession).`;
    }

    // 3. Shots on Goal & Shooting Efficiency Analysis
    let shootingText = '';
    const totalShots = homeShots + awayShots;
    const totalSOT = homeSOT + awaySOT;

    shootingText = `Inside the penalty areas, shooting precision dictated the momentum. ${homeTeam.shortName} unleashed ${homeShots} total shots with ${homeSOT} hitting the target (${homeAccuracy}% accuracy), finding the back of the net ${homeScore} times. In response, ${awayTeam.shortName} registered ${awayShots} attempts, directing ${awaySOT} shots on goal (${awayAccuracy}% accuracy). `;

    if (homeConversion > 50 || awayConversion > 50) {
      shootingText += `The attacking units demonstrated razor-sharp finishing, punishing lapses in concentration with ruthless conversion in front of goal.`;
    } else if (homeSaves + awaySaves >= 4) {
      shootingText += `Both shot-stoppers were called into action repeatedly, producing ${homeSaves + awaySaves} combined critical saves to deny sure-fire goals.`;
    } else {
      shootingText += `Defenders threw bodies on the line to force shooters into difficult angles and speculative efforts from distance.`;
    }

    // 4. Key Goals & Highlights Breakdown
    let momentsText = '';
    if (goalEvents.length > 0) {
      const goalSummaries = goalEvents.map((g) => {
        const teamName = g.team === 'home' ? homeTeam.shortName : awayTeam.shortName;
        const assistStr = g.assistedBy ? ` after incisive service from ${g.assistedBy}` : '';
        const speedStr = g.shotSpeedKmh ? ` at a blistering ${g.shotSpeedKmh} km/h` : '';
        return `• ${g.minute}': Goal for ${teamName} scored by ${g.scorerName} (#${g.scorerNumber})${speedStr}${assistStr}`;
      });
      momentsText = `Key Goal Milestones:\n${goalSummaries.join('\n')}`;
    } else {
      momentsText = `Key Goal Milestones: None recorded — a tactical defensive clinic with clean sheets preserved by both sides.`;
    }

    return {
      outcomeText,
      possessionText,
      shootingText,
      momentsText,
    };
  }, [
    reportStyle, 
    isHomeWin, 
    isAwayWin, 
    isDraw, 
    homeTeam, 
    awayTeam, 
    homeScore, 
    awayScore, 
    homePoss, 
    awayPoss, 
    homeShots, 
    awayShots, 
    homeSOT, 
    awaySOT, 
    homeAccuracy, 
    awayAccuracy, 
    homeConversion, 
    awayConversion, 
    homeSaves, 
    awaySaves, 
    goalEvents,
    seed
  ]);

  // Copy report as clean markdown
  const handleCopyReport = () => {
    const fullText = `=== MATCH HIGHLIGHTS REPORT ===
${headline}
Final Score: ${homeTeam.name} ${homeScore} - ${awayScore} ${awayTeam.name}

[MATCH OVERVIEW]
${dynamicReport.outcomeText}

[POSSESSION & MIDFIELD DYNAMICS]
${dynamicReport.possessionText}
• ${homeTeam.name}: ${homePoss}% possession
• ${awayTeam.name}: ${awayPoss}% possession

[SHOTS ON GOAL & ATTACKING ACCURACY]
${dynamicReport.shootingText}
• ${homeTeam.name}: ${homeShots} shots (${homeSOT} on target, ${homeAccuracy}% accuracy)
• ${awayTeam.name}: ${awayShots} shots (${awaySOT} on target, ${awayAccuracy}% accuracy)
• Saves: ${homeTeam.shortName} GK (${homeSaves}) | ${awayTeam.shortName} GK (${awaySaves})

[KEY GOAL EVENTS]
${dynamicReport.momentsText}

[MAN OF THE MATCH]
⭐ ${manOfTheMatch.name} (${manOfTheMatch.team}) - Rating: ${manOfTheMatch.rating}
${manOfTheMatch.accolade}: ${manOfTheMatch.description}
===============================`;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div 
      id="match-highlights-report-overlay"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
    >
      <div 
        id="match-highlights-report-modal"
        className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white font-['Outfit'] tracking-tight">
                  Official Match Highlights Report
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold">
                  AI Editorial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Post-match narrative, key tactical metrics, possession analysis & shooting efficiency
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="regenerate-report-style-btn"
              onClick={() => setSeed(s => s + 1)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Regenerate commentary phrasing"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              id="close-highlights-report-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
              title="Close report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Style Persona Filter Tabs & Action Bar */}
        <div className="bg-slate-950/90 border-b border-white/10 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] font-bold px-2">Tone:</span>
            <button
              id="report-tone-broadcast-btn"
              onClick={() => setReportStyle('broadcast')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                reportStyle === 'broadcast'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Broadcast Pundit</span>
            </button>

            <button
              id="report-tone-tactical-btn"
              onClick={() => setReportStyle('tactical')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                reportStyle === 'tactical'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Tactical Analyst</span>
            </button>

            <button
              id="report-tone-tabloid-btn"
              onClick={() => setReportStyle('tabloid')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                reportStyle === 'tabloid'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Press Headline</span>
            </button>
          </div>

          <button
            id="copy-match-report-btn"
            onClick={handleCopyReport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition active:scale-95 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Report Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Report</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Report Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Main Headline Banner */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-white/15 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold mb-2">
              <span>FULL-TIME VERDICT</span>
              <span className="text-slate-400">90' REGULATION COMPLETED</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] leading-snug tracking-tight mb-4">
              "{headline}"
            </h1>

            {/* Scoreboard pill */}
            <div className="flex items-center justify-center space-x-4 py-2 px-4 rounded-xl bg-black/40 border border-white/10 w-fit">
              <div className="flex items-center space-x-2 font-black text-white text-sm sm:text-base">
                <span className="text-xl">{homeTeam.badgeIcon}</span>
                <span>{homeTeam.name}</span>
              </div>
              <div className="font-['Chakra_Petch'] text-2xl sm:text-3xl font-black text-cyan-400 px-2">
                {homeScore} - {awayScore}
              </div>
              <div className="flex items-center space-x-2 font-black text-white text-sm sm:text-base">
                <span>{awayTeam.name}</span>
                <span className="text-xl">{awayTeam.badgeIcon}</span>
              </div>
            </div>
          </div>

          {/* KEY METRICS COMPARISON CARDS (Focusing on Possession and Shots on Goal) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* POSSESSION RADAR CARD */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <div className="flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-cyan-400" />
                  <span>Possession & Dominance</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {homePoss > awayPoss ? `${homeTeam.shortName} +${homePoss - awayPoss}%` : `${awayTeam.shortName} +${awayPoss - homePoss}%`}
                </span>
              </div>

              {/* Visual Possession Dual Bar */}
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
                <div 
                  style={{ width: `${homePoss}%` }}
                  className="bg-cyan-500 transition-all duration-500 flex items-center justify-start pl-2 text-[10px] font-black text-slate-950 font-mono"
                >
                  {homePoss > 20 && `${homePoss}%`}
                </div>
                <div 
                  style={{ width: `${awayPoss}%` }}
                  className="bg-amber-400 transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-slate-950 font-mono"
                >
                  {awayPoss > 20 && `${awayPoss}%`}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-white font-bold">{homeTeam.shortName}</span>
                  <span className="text-cyan-400 font-black">{homePoss}%</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-amber-400 font-black">{awayPoss}%</span>
                  <span className="text-white font-bold">{awayTeam.shortName}</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                </div>
              </div>

              {/* Passes & Circulation stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                <div className="text-slate-400">
                  Completed Passes: <span className="text-white font-bold">{stats.homePasses}</span>
                </div>
                <div className="text-right text-slate-400">
                  Completed Passes: <span className="text-white font-bold">{stats.awayPasses}</span>
                </div>
              </div>
            </div>

            {/* SHOTS & SHOTS ON GOAL EFFICIENCY CARD */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Shots on Goal & Efficiency</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">
                  {homeSOT + awaySOT} Total on Target
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Home Shots Breakdown */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-cyan-400 flex items-center justify-between">
                    <span>{homeTeam.shortName}</span>
                    <span className="font-mono text-white">{homeScore} Goals</span>
                  </div>
                  <div className="text-xs font-mono text-slate-300 flex justify-between">
                    <span>Shots on Goal:</span>
                    <span className="font-bold text-white">{homeSOT} / {homeShots}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Shot Accuracy:</span>
                    <span className="font-bold text-cyan-300">{homeAccuracy}%</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>GK Saves:</span>
                    <span className="font-bold text-white">{homeSaves}</span>
                  </div>
                </div>

                {/* Away Shots Breakdown */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-amber-400 flex items-center justify-between">
                    <span>{awayTeam.shortName}</span>
                    <span className="font-mono text-white">{awayScore} Goals</span>
                  </div>
                  <div className="text-xs font-mono text-slate-300 flex justify-between">
                    <span>Shots on Goal:</span>
                    <span className="font-bold text-white">{awaySOT} / {awayShots}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Shot Accuracy:</span>
                    <span className="font-bold text-amber-300">{awayAccuracy}%</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>GK Saves:</span>
                    <span className="font-bold text-white">{awaySaves}</span>
                  </div>
                </div>
              </div>

              {/* Efficiency Insight */}
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
                Conversion Rate: {homeTeam.shortName} ({homeConversion}%) • {awayTeam.shortName} ({awayConversion}%)
              </div>
            </div>
          </div>

          {/* DYNAMIC EDITORIAL SUMMARY PARAGRAPHS */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Match Narrative & Tactical Breakdown</span>
            </div>

            <div className="space-y-3.5 text-sm text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white font-semibold">Match Synopsis: </strong>
                {dynamicReport.outcomeText}
              </p>

              <p>
                <strong className="text-white font-semibold">Midfield & Possession Control: </strong>
                {dynamicReport.possessionText}
              </p>

              <p>
                <strong className="text-white font-semibold">Attacking Threat & Shots on Goal: </strong>
                {dynamicReport.shootingText}
              </p>
            </div>
          </div>

          {/* PIVOTAL GOALS & HIGHLIGHT MOMENTS */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Pivotal Match Moments</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {goalEvents.length} Goals Recorded
              </span>
            </div>

            {goalEvents.length > 0 ? (
              <div className="space-y-2">
                {goalEvents.map((g, idx) => {
                  const isHomeGoal = g.team === 'home';
                  return (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs border ${
                          isHomeGoal ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' : 'bg-amber-950 text-amber-300 border-amber-500/40'
                        }`}>
                          {g.minute}'
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <span>{g.scorerName}</span>
                            <span className="text-slate-500 font-mono text-[11px]">#{g.scorerNumber}</span>
                            <span className="text-slate-400 text-[11px]">({isHomeGoal ? homeTeam.shortName : awayTeam.shortName})</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {g.assistedBy ? `Assisted by ${g.assistedBy} • ` : ''}
                            Shot Speed: <span className="text-amber-400 font-mono font-bold">{g.shotSpeedKmh} km/h</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-black text-xs font-mono">
                          GOAL
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 font-mono bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                No goals scored in this match. Both defenses maintained clean sheets.
              </div>
            )}
          </div>

          {/* MAN OF THE MATCH SPOTLIGHT */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 text-2xl shadow-lg shadow-amber-500/20 flex-shrink-0">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">
                    Man of the Match
                  </span>
                  <span className="text-xs">{manOfTheMatch.badge}</span>
                </div>
                <div className="text-base font-black text-white flex items-center space-x-2">
                  <span>{manOfTheMatch.name}</span>
                  <span className="text-xs font-mono text-slate-400">#{manOfTheMatch.number}</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {manOfTheMatch.accolade} — {manOfTheMatch.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 bg-black/40 px-3 py-2 rounded-xl border border-amber-500/30">
              <span className="text-xs text-slate-400 font-mono">Match Rating</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {manOfTheMatch.rating}
              </span>
              <span className="text-amber-400 text-xs">★</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Report dynamically generated from live match telemetry
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              id="report-done-close-btn"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition shadow-md shadow-cyan-500/20"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
