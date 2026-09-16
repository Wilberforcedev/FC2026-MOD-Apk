/**
 * Player Development & Training Academy Service
 * Manages player progression, XP gains, attribute leveling, training drills,
 * and growth potential ceilings for Career Mode & Squad Management.
 */

import { Player } from '../types/soccer';
import { CareerNewsItem } from './careerNewsService';

export interface TrainingDrill {
  id: string;
  name: string;
  category: 'SHOOTING' | 'PASSING' | 'DEFENDING' | 'PHYSICAL' | 'GOALKEEPING';
  targetPositions: string[];
  description: string;
  primaryStat: 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';
  secondaryStat?: 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';
  baseXp: number;
  staminaCost: number; // Percentage of weekly stamina consumed
  intensity: 'Balanced' | 'High Intensity' | 'Masterclass';
}

export const TRAINING_DRILLS: TrainingDrill[] = [
  {
    id: 'drill_striker_finishing',
    name: 'Clinical Finishing & 1v1 Composure',
    category: 'SHOOTING',
    targetPositions: ['ST', 'LW', 'RW', 'CAM'],
    description: 'Near-post snap shots, curling finesse strikes into top corners, and first-time volleys under defensive pressure.',
    primaryStat: 'shooting',
    secondaryStat: 'dribbling',
    baseXp: 320,
    staminaCost: 15,
    intensity: 'High Intensity',
  },
  {
    id: 'drill_playmaker_vision',
    name: 'Tiki-Taka Vision & Diagonal Passing',
    category: 'PASSING',
    targetPositions: ['CAM', 'CM', 'CDM', 'LW', 'RW'],
    description: 'High-speed one-touch passing triangles, defence-splitting through balls, and lofted 40-yard switches of play.',
    primaryStat: 'passing',
    secondaryStat: 'dribbling',
    baseXp: 300,
    staminaCost: 12,
    intensity: 'Balanced',
  },
  {
    id: 'drill_speed_agility',
    name: 'Explosive Sprint & Deceleration Cones',
    category: 'PHYSICAL',
    targetPositions: ['LW', 'RW', 'LB', 'RB', 'ST'],
    description: 'Quick-twitch acceleration sprints, parachute resistance sprints, and rapid change-of-direction slalom hurdles.',
    primaryStat: 'pace',
    secondaryStat: 'physical',
    baseXp: 280,
    staminaCost: 18,
    intensity: 'High Intensity',
  },
  {
    id: 'drill_defensive_wall',
    name: 'Tactical Interceptions & Slide Tackling',
    category: 'DEFENDING',
    targetPositions: ['CB', 'LB', 'RB', 'CDM'],
    description: '1v1 jockey positioning, aerial clearance headers, and timed slide challenges cleanly separating ball from attacker.',
    primaryStat: 'defending',
    secondaryStat: 'physical',
    baseXp: 310,
    staminaCost: 14,
    intensity: 'Balanced',
  },
  {
    id: 'drill_goalkeeper_reflexes',
    name: 'Reflex Shot-Stopping & Diving Parries',
    category: 'GOALKEEPING',
    targetPositions: ['GK'],
    description: 'Rapid-fire ball cannon reactions, close-range reaction deflections, and penalty dive anticipation techniques.',
    primaryStat: 'defending',
    secondaryStat: 'physical',
    baseXp: 340,
    staminaCost: 10,
    intensity: 'Masterclass',
  },
  {
    id: 'drill_physical_conditioning',
    name: 'HyperCore Strength & Aerial Dominance',
    category: 'PHYSICAL',
    targetPositions: ['ST', 'CB', 'CDM', 'CM'],
    description: 'Shoulder-to-shoulder shielding resistance, plyometric box jumps, and 90-minute stamina endurance drills.',
    primaryStat: 'physical',
    secondaryStat: 'defending',
    baseXp: 290,
    staminaCost: 16,
    intensity: 'High Intensity',
  },
];

export interface DrillResult {
  player: Player;
  drill: TrainingDrill;
  xpEarned: number;
  grade: 'S' | 'A' | 'B';
  statsImproved: { stat: string; delta: number }[];
  overallChanged: boolean;
  oldOverall: number;
  newOverall: number;
  message: string;
}

/**
 * Executes a training session on a player, calculating performance grade,
 * attribute upgrades, and dynamic potential progression.
 */
export function executeTrainingDrill(player: Player, drill: TrainingDrill): DrillResult {
  // Performance grade weighted toward success
  const roll = Math.random();
  const grade: 'S' | 'A' | 'B' = roll > 0.6 ? 'S' : roll > 0.2 ? 'A' : 'B';
  const gradeMultiplier = grade === 'S' ? 1.5 : grade === 'A' ? 1.2 : 0.9;
  const xpEarned = Math.round(drill.baseXp * gradeMultiplier);

  // Deep clone player
  const updatedPlayer: Player = {
    ...player,
    stats: { ...player.stats },
    development: {
      xp: (player.development?.xp || 0) + xpEarned,
      level: player.development?.level || 1,
      drillsCompleted: (player.development?.drillsCompleted || 0) + 1,
      form: grade === 'S' ? 'Excellent' : 'Good',
    },
  };

  const oldOverall = player.rating;
  const statsImproved: { stat: string; delta: number }[] = [];

  // Determine potential ceiling (default: rating + 5, or potential up to 99)
  const maxPotential = player.potential || Math.min(99, player.rating + 5);

  // Upgrade primary stat
  const getStat = (s: any, key: string): number => {
    if (key === 'physical') return s.physicality ?? s.physical ?? 70;
    return s[key] ?? 70;
  };

  const setStat = (s: any, key: string, val: number) => {
    if (key === 'physical') {
      s.physicality = val;
      s.physical = val;
    } else {
      s[key] = val;
    }
  };

  const currentPrimaryVal = getStat(updatedPlayer.stats, drill.primaryStat);
  const primaryBoost = grade === 'S' ? 2 : 1;
  const newPrimaryVal = Math.min(99, currentPrimaryVal + primaryBoost);
  
  if (newPrimaryVal > currentPrimaryVal) {
    setStat(updatedPlayer.stats, drill.primaryStat, newPrimaryVal);
    statsImproved.push({
      stat: drill.primaryStat.toUpperCase(),
      delta: newPrimaryVal - currentPrimaryVal,
    });
  }

  // Secondary stat upgrade chance
  if (drill.secondaryStat && (grade === 'S' || Math.random() > 0.4)) {
    const currentSecVal = getStat(updatedPlayer.stats, drill.secondaryStat);
    const newSecVal = Math.min(99, currentSecVal + 1);
    if (newSecVal > currentSecVal) {
      setStat(updatedPlayer.stats, drill.secondaryStat, newSecVal);
      statsImproved.push({
        stat: drill.secondaryStat.toUpperCase(),
        delta: 1,
      });
    }
  }

  // Recalculate Overall rating based on positional weightings
  const stats = updatedPlayer.stats;
  const physVal = getStat(stats, 'physical');
  let newOverallCalc = oldOverall;

  if (['ST', 'CF'].includes(player.position)) {
    newOverallCalc = Math.round(stats.shooting * 0.45 + stats.pace * 0.25 + stats.dribbling * 0.2 + physVal * 0.1);
  } else if (['LW', 'RW'].includes(player.position)) {
    newOverallCalc = Math.round(stats.pace * 0.4 + stats.dribbling * 0.3 + stats.shooting * 0.2 + stats.passing * 0.1);
  } else if (['CAM', 'CM'].includes(player.position)) {
    newOverallCalc = Math.round(stats.passing * 0.35 + stats.dribbling * 0.3 + stats.shooting * 0.2 + stats.pace * 0.15);
  } else if (['CDM'].includes(player.position)) {
    newOverallCalc = Math.round(stats.defending * 0.4 + physVal * 0.3 + stats.passing * 0.2 + stats.pace * 0.1);
  } else if (['CB'].includes(player.position)) {
    newOverallCalc = Math.round(stats.defending * 0.5 + physVal * 0.35 + stats.pace * 0.15);
  } else if (['LB', 'RB'].includes(player.position)) {
    newOverallCalc = Math.round(stats.pace * 0.35 + stats.defending * 0.35 + physVal * 0.15 + stats.passing * 0.15);
  } else if (player.position === 'GK') {
    newOverallCalc = Math.round(stats.defending * 0.6 + physVal * 0.4);
  }

  // Ensure progression stays within potential cap and doesn't decrease
  const clampedOverall = Math.max(oldOverall, Math.min(maxPotential, newOverallCalc));
  updatedPlayer.rating = clampedOverall;

  // Level up indicator
  const overallChanged = clampedOverall > oldOverall;
  if (overallChanged) {
    updatedPlayer.development!.level += (clampedOverall - oldOverall);
  }

  const message = overallChanged
    ? `BREAKTHROUGH! ${player.name} progressed to OVR ${clampedOverall} (+${clampedOverall - oldOverall})!`
    : `${player.name} earned ${xpEarned} XP with a Grade ${grade} session.`;

  return {
    player: updatedPlayer,
    drill,
    xpEarned,
    grade,
    statsImproved,
    overallChanged,
    oldOverall,
    newOverall: clampedOverall,
    message,
  };
}

/**
 * Generates an internal Dynamic News item celebrating player development breakthroughs
 */
export function createDevelopmentNewsItem(
  teamName: string,
  teamId: string,
  player: Player,
  oldRating: number,
  newRating: number,
  matchday: number
): CareerNewsItem {
  return {
    id: `news_dev_${player.id}_${Date.now()}`,
    type: 'development',
    category: 'DEVELOPMENT',
    importance: 'breaking',
    title: `TRAINING MASTERCLASS: ${player.name} Advances to ${newRating} OVR at ${teamName}!`,
    summary: `Spectacular progression recorded in training sessions as ${player.name} reaches new performance benchmarks.`,
    fullBody: `Coaching staff at ${teamName} have celebrated a major development breakthrough following intensive drills. ${player.name} demonstrated exceptional sharpness, boosting tactical ratings from ${oldRating} to an outstanding ${newRating} OVR. Club analysts praise the dedication and project world-class ceiling potential!`,
    date: `Matchday ${matchday} • Training Grounds`,
    matchday,
    author: 'FC Training Academy',
    handle: '@FCAcademy',
    verified: true,
    avatarText: 'AC',
    teamId,
    playerName: player.name,
    playerPosition: player.position,
    playerRating: newRating,
    likes: `${(Math.random() * 40 + 20).toFixed(1)}K`,
    retweets: `${(Math.random() * 12 + 5).toFixed(1)}K`,
    isRead: false,
  };
}
