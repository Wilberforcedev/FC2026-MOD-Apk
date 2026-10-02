import { Player } from '../types/soccer';

export type BodyBuild = 'compact' | 'lean' | 'balanced' | 'powerful' | 'towering';
export type RunningStyle = 'agile' | 'explosive' | 'glider' | 'power' | 'upright';
export type CelebrationStyle = 'arms-wide' | 'fist-pump' | 'knee-slide' | 'point-up' | 'calm';

export interface OnPitchLikenessProfile {
  bodyBuild: BodyBuild;
  runningStyle: RunningStyle;
  celebrationStyle: CelebrationStyle;
  heightScale: number;
  widthScale: number;
  shoulderScale: number;
  legScale: number;
  strideScale: number;
  cadence: number;
  forwardLean: number;
  armDrive: number;
  kitFit: 'tight' | 'regular' | 'loose';
  headScale: number;
}

function hash(value: string): number {
  let result = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    result ^= value.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return Math.abs(result >>> 0);
}

function jitter(seed: number, salt: number, range: number): number {
  const raw = Math.sin(seed * 0.00013 + salt * 11.73) * 43758.5453;
  return ((raw - Math.floor(raw)) - 0.5) * range;
}

function namedPreset(player: Player): Partial<OnPitchLikenessProfile> | null {
  const key = `${player.id}:${player.name}:${player.shortName}`.toLowerCase();

  if (key.includes('mbapp')) {
    return { bodyBuild: 'lean', runningStyle: 'explosive', celebrationStyle: 'arms-wide', heightScale: 0.99, widthScale: 0.91, shoulderScale: 0.94, legScale: 1.03, strideScale: 1.16, cadence: 1.12, forwardLean: 0.16, armDrive: 1.16, kitFit: 'tight', headScale: 0.98 };
  }
  if (key.includes('vinícius') || key.includes('vinicius') || key.includes('vini')) {
    return { bodyBuild: 'lean', runningStyle: 'agile', celebrationStyle: 'point-up', heightScale: 0.97, widthScale: 0.88, shoulderScale: 0.91, legScale: 1.02, strideScale: 1.10, cadence: 1.18, forwardLean: 0.18, armDrive: 1.18, kitFit: 'loose', headScale: 0.96 };
  }
  if (key.includes('bellingham')) {
    return { bodyBuild: 'balanced', runningStyle: 'upright', celebrationStyle: 'arms-wide', heightScale: 1.06, widthScale: 0.97, shoulderScale: 1.01, legScale: 1.08, strideScale: 1.10, cadence: 0.98, forwardLean: 0.07, armDrive: 1.02, kitFit: 'regular', headScale: 0.99 };
  }
  if (key.includes('haaland')) {
    return { bodyBuild: 'towering', runningStyle: 'power', celebrationStyle: 'calm', heightScale: 1.14, widthScale: 1.06, shoulderScale: 1.10, legScale: 1.13, strideScale: 1.18, cadence: 0.93, forwardLean: 0.10, armDrive: 1.08, kitFit: 'tight', headScale: 1.02 };
  }
  if (key.includes('messi')) {
    return { bodyBuild: 'compact', runningStyle: 'agile', celebrationStyle: 'point-up', heightScale: 0.91, widthScale: 0.92, shoulderScale: 0.93, legScale: 0.91, strideScale: 0.92, cadence: 1.20, forwardLean: 0.18, armDrive: 0.94, kitFit: 'regular', headScale: 1.02 };
  }
  if (key.includes('ronaldo')) {
    return { bodyBuild: 'powerful', runningStyle: 'upright', celebrationStyle: 'arms-wide', heightScale: 1.08, widthScale: 1.01, shoulderScale: 1.08, legScale: 1.08, strideScale: 1.11, cadence: 1.00, forwardLean: 0.06, armDrive: 1.13, kitFit: 'tight', headScale: 0.98 };
  }
  if (key.includes('salah')) {
    return { bodyBuild: 'lean', runningStyle: 'glider', celebrationStyle: 'calm', heightScale: 0.98, widthScale: 0.92, shoulderScale: 0.95, legScale: 1.00, strideScale: 1.05, cadence: 1.09, forwardLean: 0.12, armDrive: 0.96, kitFit: 'tight', headScale: 1.00 };
  }
  if (key.includes('saliba')) {
    return { bodyBuild: 'powerful', runningStyle: 'glider', celebrationStyle: 'fist-pump', heightScale: 1.09, widthScale: 1.06, shoulderScale: 1.10, legScale: 1.08, strideScale: 1.05, cadence: 0.96, forwardLean: 0.06, armDrive: 0.94, kitFit: 'regular', headScale: 1.00 };
  }
  if (key.includes('wirtz')) {
    return { bodyBuild: 'lean', runningStyle: 'glider', celebrationStyle: 'fist-pump', heightScale: 0.98, widthScale: 0.89, shoulderScale: 0.92, legScale: 1.01, strideScale: 1.02, cadence: 1.06, forwardLean: 0.09, armDrive: 0.93, kitFit: 'loose', headScale: 0.98 };
  }

  return null;
}

export function getOnPitchLikeness(player: Player): OnPitchLikenessProfile {
  const seed = hash(`${player.id}:${player.name}`.toLowerCase());
  const physical = player.stats.physicality ?? player.stats.physical ?? 70;
  const pace = player.stats.pace ?? 70;
  const isGK = Boolean(player.isGoalkeeper);
  const isCentreBack = player.position === 'CB';
  const isWinger = player.position === 'LW' || player.position === 'RW';

  const bodyBuild: BodyBuild = isGK || isCentreBack
    ? physical >= 82 ? 'powerful' : 'towering'
    : physical >= 84 ? 'powerful'
    : isWinger || pace >= 90 ? 'lean'
    : physical <= 65 ? 'compact'
    : 'balanced';

  const runningStyle: RunningStyle = isGK
    ? 'upright'
    : pace >= 93 ? 'explosive'
    : pace >= 87 ? 'agile'
    : physical >= 86 ? 'power'
    : seed % 2 === 0 ? 'glider' : 'upright';

  const base: OnPitchLikenessProfile = {
    bodyBuild,
    runningStyle,
    celebrationStyle: (['arms-wide', 'fist-pump', 'knee-slide', 'point-up', 'calm'] as CelebrationStyle[])[seed % 5],
    heightScale: (isGK ? 1.08 : isCentreBack ? 1.05 : isWinger ? 0.98 : 1) + jitter(seed, 1, 0.08),
    widthScale: (bodyBuild === 'powerful' ? 1.07 : bodyBuild === 'compact' ? 0.94 : bodyBuild === 'lean' ? 0.91 : 1) + jitter(seed, 2, 0.05),
    shoulderScale: (bodyBuild === 'powerful' ? 1.10 : bodyBuild === 'lean' ? 0.93 : 1) + jitter(seed, 3, 0.05),
    legScale: (isGK || isCentreBack ? 1.06 : isWinger ? 1.01 : 1) + jitter(seed, 4, 0.05),
    strideScale: (pace >= 90 ? 1.10 : pace >= 82 ? 1.04 : 0.98) + jitter(seed, 5, 0.06),
    cadence: (runningStyle === 'explosive' ? 1.13 : runningStyle === 'agile' ? 1.10 : runningStyle === 'power' ? 0.94 : 1.0) + jitter(seed, 6, 0.05),
    forwardLean: runningStyle === 'explosive' ? 0.16 : runningStyle === 'agile' ? 0.13 : runningStyle === 'power' ? 0.09 : 0.06,
    armDrive: runningStyle === 'explosive' ? 1.16 : runningStyle === 'power' ? 1.10 : runningStyle === 'glider' ? 0.90 : 1.0,
    kitFit: bodyBuild === 'powerful' ? 'tight' : bodyBuild === 'lean' && seed % 2 === 0 ? 'loose' : 'regular',
    headScale: 1 + jitter(seed, 7, 0.06),
  };

  return { ...base, ...(namedPreset(player) || {}) };
}
