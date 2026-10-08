import { GameDifficulty, Team } from '../types/soccer';

export interface AdaptiveTacticalState {
  pressingIntensity: number;
  defensiveLine: number;
  transitionSpeed: number;
  risk: number;
}

const difficultyRisk: Record<GameDifficulty, number> = {
  Beginner: 0.25,
  Amateur: 0.38,
  'Semi-Pro': 0.5,
  Professional: 0.62,
  'World Class': 0.75,
  Legendary: 0.86,
};

/** Adapts AI intent from score, clock, tactic and difficulty without changing player data. */
export function getAdaptiveTactics(
  team: Team,
  ownScore: number,
  opponentScore: number,
  minute: number,
  difficulty: GameDifficulty,
): AdaptiveTacticalState {
  const trailing = ownScore < opponentScore;
  const leading = ownScore > opponentScore;
  const late = minute >= 70;
  const base = difficultyRisk[difficulty];
  let pressingIntensity = team.tactic === 'High Press' ? 0.82 : team.tactic === 'Park The Bus' ? 0.28 : 0.52;
  let defensiveLine = team.tactic === 'Park The Bus' ? 0.28 : team.tactic === 'High Press' ? 0.78 : 0.55;
  let transitionSpeed = team.tactic === 'Counter Attack' ? 0.82 : 0.56;
  let risk = base;

  if (trailing && late) {
    pressingIntensity += 0.22;
    defensiveLine += 0.14;
    transitionSpeed += 0.18;
    risk += 0.16;
  } else if (leading && late) {
    pressingIntensity -= 0.14;
    defensiveLine -= 0.16;
    transitionSpeed -= 0.08;
    risk -= 0.12;
  }

  return {
    pressingIntensity: Math.max(0.1, Math.min(1, pressingIntensity)),
    defensiveLine: Math.max(0.08, Math.min(1, defensiveLine)),
    transitionSpeed: Math.max(0.2, Math.min(1, transitionSpeed)),
    risk: Math.max(0.1, Math.min(1, risk)),
  };
}
