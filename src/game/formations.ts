import { PITCH } from './constants';
import { Vector2D } from '../types/soccer';

// Relative formations on a [0, 1] scale across length and width
export const FORMATION_SLOTS: Record<string, { role: string; x: number; y: number }[]> = {
  '4-3-3': [
    { role: 'GK', x: 0.05, y: 0.5 },
    { role: 'RB', x: 0.22, y: 0.84 },
    { role: 'CB', x: 0.17, y: 0.62 },
    { role: 'CB', x: 0.17, y: 0.38 },
    { role: 'LB', x: 0.22, y: 0.16 },
    { role: 'CDM', x: 0.34, y: 0.50 },
    { role: 'CM', x: 0.46, y: 0.34 },
    { role: 'CAM', x: 0.46, y: 0.66 },
    { role: 'RW', x: 0.68, y: 0.82 },
    { role: 'ST', x: 0.74, y: 0.50 },
    { role: 'LW', x: 0.68, y: 0.18 },
  ],
  '4-4-2': [
    { role: 'GK', x: 0.05, y: 0.5 },
    { role: 'RB', x: 0.22, y: 0.84 },
    { role: 'CB', x: 0.17, y: 0.62 },
    { role: 'CB', x: 0.17, y: 0.38 },
    { role: 'LB', x: 0.22, y: 0.16 },
    { role: 'RM', x: 0.48, y: 0.82 },
    { role: 'CM', x: 0.42, y: 0.60 },
    { role: 'CM', x: 0.42, y: 0.40 },
    { role: 'LM', x: 0.48, y: 0.18 },
    { role: 'ST', x: 0.72, y: 0.40 },
    { role: 'ST', x: 0.72, y: 0.60 },
  ],
  '3-5-2': [
    { role: 'GK', x: 0.05, y: 0.5 },
    { role: 'CB', x: 0.18, y: 0.72 },
    { role: 'CB', x: 0.16, y: 0.50 },
    { role: 'CB', x: 0.18, y: 0.28 },
    { role: 'RWB', x: 0.38, y: 0.88 },
    { role: 'CDM', x: 0.35, y: 0.50 },
    { role: 'CM', x: 0.48, y: 0.62 },
    { role: 'CM', x: 0.48, y: 0.38 },
    { role: 'LWB', x: 0.38, y: 0.12 },
    { role: 'ST', x: 0.73, y: 0.42 },
    { role: 'ST', x: 0.73, y: 0.58 },
  ],
  '4-2-3-1': [
    { role: 'GK', x: 0.05, y: 0.5 },
    { role: 'RB', x: 0.22, y: 0.84 },
    { role: 'CB', x: 0.17, y: 0.62 },
    { role: 'CB', x: 0.17, y: 0.38 },
    { role: 'LB', x: 0.22, y: 0.16 },
    { role: 'CDM', x: 0.34, y: 0.60 },
    { role: 'CDM', x: 0.34, y: 0.40 },
    { role: 'RAM', x: 0.56, y: 0.78 },
    { role: 'CAM', x: 0.54, y: 0.50 },
    { role: 'LAM', x: 0.56, y: 0.22 },
    { role: 'ST', x: 0.74, y: 0.50 },
  ],
};

/**
 * Calculates absolute pitch coordinates for a player given formation, team side, and ball position
 */
export function getTacticalTarget(
  slotIndex: number,
  formationName: string,
  teamSide: 'home' | 'away',
  ballPos: Vector2D,
  hasBallTeam: 'home' | 'away' | null,
  tactic: string = 'Balanced'
): Vector2D {
  const formation = FORMATION_SLOTS[formationName] || FORMATION_SLOTS['4-3-3'];
  const slot = formation[slotIndex] || formation[0];

  let relX = slot.x;
  let relY = slot.y;

  // Ball influence: dynamic shift based on ball x & y
  const ballRelX = (ballPos.x - PITCH.MARGIN_X) / PITCH.LENGTH;
  const ballRelY = (ballPos.y - PITCH.MARGIN_Y) / PITCH.WIDTH;

  if (slot.role === 'GK') {
    // Goalkeeper tracks goal line and ball angle
    if (teamSide === 'home') {
      const targetX = PITCH.MARGIN_X + 28;
      // GK follows ball Y along the goal mouth
      const goalMinY = PITCH.MARGIN_Y + (PITCH.WIDTH - PITCH.GOAL_WIDTH) / 2;
      const goalMaxY = goalMinY + PITCH.GOAL_WIDTH;
      const targetY = Math.max(goalMinY + 12, Math.min(goalMaxY - 12, ballPos.y));
      return { x: targetX, y: targetY };
    } else {
      const targetX = PITCH.MARGIN_X + PITCH.LENGTH - 28;
      const goalMinY = PITCH.MARGIN_Y + (PITCH.WIDTH - PITCH.GOAL_WIDTH) / 2;
      const goalMaxY = goalMinY + PITCH.GOAL_WIDTH;
      const targetY = Math.max(goalMinY + 12, Math.min(goalMaxY - 12, ballPos.y));
      return { x: targetX, y: targetY };
    }
  }

  // Tactic modifiers
  let shiftX = 0;
  if (tactic === 'High Press') {
    shiftX += 0.07;
  } else if (tactic === 'Park The Bus') {
    shiftX -= 0.08;
  } else if (tactic === 'Counter Attack') {
    if (hasBallTeam === teamSide) shiftX += 0.1;
    else shiftX -= 0.05;
  }

  // Dynamic push forward when attacking, drop back when defending.
  // The amount of movement now depends on the player's role so the team keeps
  // its shape instead of every player collapsing onto the same tactical line.
  if (hasBallTeam === teamSide) {
    shiftX += 0.08;
  } else if (hasBallTeam && hasBallTeam !== teamSide) {
    shiftX -= 0.06;
  }

  const defensiveRoles = ['CB', 'LB', 'RB', 'LWB', 'RWB'];
  const midfieldRoles = ['CDM', 'CM', 'CAM', 'RM', 'LM', 'RAM', 'LAM'];
  const attackingRoles = ['ST', 'LW', 'RW'];

  let roleShiftMultiplier = 1;
  if (defensiveRoles.includes(slot.role)) {
    roleShiftMultiplier = 0.55;
  } else if (midfieldRoles.includes(slot.role)) {
    roleShiftMultiplier = 0.9;
  } else if (attackingRoles.includes(slot.role)) {
    roleShiftMultiplier = 1.15;
  }

  shiftX *= roleShiftMultiplier;

  // Follow the ball horizontally, but preserve the depth of each line.
  shiftX += (ballRelX - 0.5) * (0.15 * roleShiftMultiplier);

  // Keep wide players wider while central players track the ball more closely.
  const isWideRole = ['LB', 'RB', 'LWB', 'RWB', 'LW', 'RW', 'LM', 'RM', 'LAM', 'RAM'].includes(slot.role);
  const lateralTracking = isWideRole ? 0.08 : 0.16;
  let finalRelX = Math.max(0.08, Math.min(0.92, relX + shiftX));
  let finalRelY = relY + (ballRelY - 0.5) * lateralTracking;

  // When defending, compress the midfield/defensive block around the ball.
  // When attacking, give forwards extra depth without dragging defenders out.
  if (hasBallTeam === teamSide && attackingRoles.includes(slot.role)) {
    finalRelX += teamSide === 'home' ? 0.025 : -0.025;
  } else if (hasBallTeam && hasBallTeam !== teamSide && defensiveRoles.includes(slot.role)) {
    finalRelX += teamSide === 'home' ? -0.02 : 0.02;
  }

  finalRelX = Math.max(0.08, Math.min(0.92, finalRelX));
  finalRelY = Math.max(0.08, Math.min(0.92, finalRelY));

  if (teamSide === 'away') {
    finalRelX = 1 - finalRelX;
    finalRelY = 1 - finalRelY;
  }

  return {
    x: PITCH.MARGIN_X + finalRelX * PITCH.LENGTH,
    y: PITCH.MARGIN_Y + finalRelY * PITCH.WIDTH,
  };
}
