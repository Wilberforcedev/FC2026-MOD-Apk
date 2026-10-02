import { FacialHair, HairStyle, Player, PlayerLikeness } from '../types/soccer';

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

function keyFor(player: Player): string {
  return `${player.id}:${player.name}:${player.shortName}`.toLowerCase();
}

function namedAppearance(player: Player): Partial<PlayerLikeness> | null {
  const key = keyFor(player);

  if (key.includes('mbapp')) return { skinTone: '#9a6546', hairStyle: 'buzz', hairColor: '#17110d', bootColor: '#facc15', facialHair: 'none' };
  if (key.includes('vinícius') || key.includes('vinicius') || key.includes('vini')) return { skinTone: '#5d3b28', hairStyle: 'fade', hairColor: '#140d08', bootColor: '#22d3ee', facialHair: 'none' };
  if (key.includes('bellingham')) return { skinTone: '#956847', hairStyle: 'fade', hairColor: '#17100c', bootColor: '#f8fafc', facialHair: 'none' };
  if (key.includes('haaland')) return { skinTone: '#edc1a4', hairStyle: 'slick', hairColor: '#d0aa71', bootColor: '#facc15', facialHair: 'none' };
  if (key.includes('messi')) return { skinTone: '#d9a17d', hairStyle: 'short', hairColor: '#3a281c', bootColor: '#f8fafc', facialHair: 'beard' };
  if (key.includes('ronaldo')) return { skinTone: '#c58a65', hairStyle: 'slick', hairColor: '#16110e', bootColor: '#f8fafc', facialHair: 'stubble' };
  if (key.includes('salah')) return { skinTone: '#956144', hairStyle: 'curly', hairColor: '#15100c', bootColor: '#22c55e', facialHair: 'beard' };
  if (key.includes('saliba')) return { skinTone: '#795038', hairStyle: 'buzz', hairColor: '#100b08', bootColor: '#06b6d4', facialHair: 'none' };
  if (key.includes('wirtz')) return { skinTone: '#e3b99f', hairStyle: 'short', hairColor: '#5a3822', bootColor: '#ef4444', facialHair: 'none' };
  if (key.includes('yamal')) return { skinTone: '#a67655', hairStyle: 'fade', hairColor: '#17100b', bootColor: '#a855f7', facialHair: 'none' };
  if (key.includes('foden')) return { skinTone: '#e0b194', hairStyle: 'fade', hairColor: '#5a3824', bootColor: '#f8fafc', facialHair: 'none' };
  if (key.includes('doku')) return { skinTone: '#5b3a27', hairStyle: 'dreads', hairColor: '#120c08', bootColor: '#f43f5e', facialHair: 'none' };
  if (key.includes('rodri')) return { skinTone: '#d3a17f', hairStyle: 'short', hairColor: '#2a211b', bootColor: '#111827', facialHair: 'stubble' };
  if (key.includes('de bruyne')) return { skinTone: '#e5b99d', hairStyle: 'short', hairColor: '#b47c55', bootColor: '#f8fafc', facialHair: 'stubble' };
  if (key.includes('saka')) return { skinTone: '#68442d', hairStyle: 'fade', hairColor: '#120c08', bootColor: '#facc15', facialHair: 'none' };
  if (key.includes('palmer')) return { skinTone: '#ddb297', hairStyle: 'short', hairColor: '#65432c', bootColor: '#f8fafc', facialHair: 'none' };
  if (key.includes('musiala')) return { skinTone: '#9a6746', hairStyle: 'curly', hairColor: '#17100c', bootColor: '#22d3ee', facialHair: 'none' };
  if (key.includes('kane')) return { skinTone: '#deb197', hairStyle: 'short', hairColor: '#81583b', bootColor: '#f8fafc', facialHair: 'stubble' };
  if (key.includes('sané') || key.includes('sane')) return { skinTone: '#87583b', hairStyle: 'afro', hairColor: '#16100c', bootColor: '#22c55e', facialHair: 'goatee' };
  if (key.includes('courtois')) return { skinTone: '#e0b094', hairStyle: 'short', hairColor: '#5b3825', bootColor: '#f97316', facialHair: 'stubble' };
  if (key.includes('maignan')) return { skinTone: '#503422', hairStyle: 'buzz', hairColor: '#100b08', bootColor: '#facc15', facialHair: 'beard' };
  if (key.includes('ederson')) return { skinTone: '#b9805e', hairStyle: 'short', hairColor: '#16110d', bootColor: '#ef4444', facialHair: 'stubble' };
  if (key.includes('martínez') || key.includes('martinez')) {
    if (key.includes('emiliano') || key.includes('dibu')) return { skinTone: '#d5a27e', hairStyle: 'slick', hairColor: '#31231b', bootColor: '#84cc16', facialHair: 'stubble' };
  }
  if (key.includes('griezmann')) return { skinTone: '#ddb095', hairStyle: 'short', hairColor: '#a77b5d', bootColor: '#f43f5e', facialHair: 'stubble' };
  if (key.includes('dembélé') || key.includes('dembele')) return { skinTone: '#553621', hairStyle: 'fade', hairColor: '#100a06', bootColor: '#22d3ee', facialHair: 'none' };
  if (key.includes('camavinga')) return { skinTone: '#4f321f', hairStyle: 'dreads', hairColor: '#100a06', bootColor: '#a855f7', facialHair: 'none' };
  if (key.includes('tchouam')) return { skinTone: '#5e3d27', hairStyle: 'fade', hairColor: '#120c08', bootColor: '#f8fafc', facialHair: 'none' };
  if (key.includes('valverde')) return { skinTone: '#c58d68', hairStyle: 'short', hairColor: '#241a14', bootColor: '#f8fafc', facialHair: 'stubble' };
  if (key.includes('rüdiger') || key.includes('rudiger')) return { skinTone: '#53351f', hairStyle: 'buzz', hairColor: '#0f0a06', bootColor: '#f8fafc', facialHair: 'beard' };
  if (key.includes('güler') || key.includes('guler')) return { skinTone: '#d5a989', hairStyle: 'short', hairColor: '#251a13', bootColor: '#22d3ee', facialHair: 'none' };
  if (key.includes('modri')) return { skinTone: '#d6a789', hairStyle: 'slick', hairColor: '#9d734f', bootColor: '#f8fafc', facialHair: 'stubble' };
  if (key.includes('kound')) return { skinTone: '#60402b', hairStyle: 'dreads', hairColor: '#130d09', bootColor: '#facc15', facialHair: 'goatee' };
  if (key.includes('garnacho')) return { skinTone: '#d2a084', hairStyle: 'slick', hairColor: '#b78b68', bootColor: '#f8fafc', facialHair: 'none' };

  return null;
}

export function getOnPitchAppearance(player: Player): PlayerLikeness {
  const seed = hash(`${player.id}:${player.name}`.toLowerCase());
  const skinPalette = ['#e1b79b', '#cf9874', '#b77d59', '#956244', '#72492f', '#51331f'];
  const hairPalette = ['#17110d', '#2c211a', '#533924', '#8a6548'];
  const bootPalette = ['#f8fafc', '#111827', '#22d3ee', '#facc15', '#ef4444', '#a855f7', '#22c55e'];
  const hairStyles: HairStyle[] = ['short', 'fade', 'buzz', 'curly', 'slick', 'dreads'];
  const facialHairStyles: FacialHair[] = ['none', 'none', 'none', 'stubble', 'goatee'];

  const generated: PlayerLikeness = {
    skinTone: skinPalette[seed % skinPalette.length],
    hairStyle: hairStyles[(seed >>> 3) % hairStyles.length],
    hairColor: hairPalette[(seed >>> 5) % hairPalette.length],
    bootColor: bootPalette[(seed >>> 7) % bootPalette.length],
    facialHair: facialHairStyles[(seed >>> 9) % facialHairStyles.length],
    cardTier: player.rating >= 88 ? 'special' : player.rating >= 80 ? 'gold' : 'silver',
    faceCardTheme: player.rating >= 91 ? 'tots' : 'gold',
  };

  return { ...generated, ...(namedAppearance(player) || {}), ...(player.likeness || {}) };
}

function namedPreset(player: Player): Partial<OnPitchLikenessProfile> | null {
  const key = keyFor(player);

  if (key.includes('mbapp')) return { bodyBuild: 'lean', runningStyle: 'explosive', celebrationStyle: 'arms-wide', heightScale: 0.99, widthScale: 0.91, shoulderScale: 0.94, legScale: 1.03, strideScale: 1.16, cadence: 1.12, forwardLean: 0.16, armDrive: 1.16, kitFit: 'tight', headScale: 0.98 };
  if (key.includes('vinícius') || key.includes('vinicius') || key.includes('vini')) return { bodyBuild: 'lean', runningStyle: 'agile', celebrationStyle: 'point-up', heightScale: 0.97, widthScale: 0.88, shoulderScale: 0.91, legScale: 1.02, strideScale: 1.10, cadence: 1.18, forwardLean: 0.18, armDrive: 1.18, kitFit: 'loose', headScale: 0.96 };
  if (key.includes('bellingham')) return { bodyBuild: 'balanced', runningStyle: 'upright', celebrationStyle: 'arms-wide', heightScale: 1.06, widthScale: 0.97, shoulderScale: 1.01, legScale: 1.08, strideScale: 1.10, cadence: 0.98, forwardLean: 0.07, armDrive: 1.02, kitFit: 'regular', headScale: 0.99 };
  if (key.includes('haaland')) return { bodyBuild: 'towering', runningStyle: 'power', celebrationStyle: 'calm', heightScale: 1.14, widthScale: 1.06, shoulderScale: 1.10, legScale: 1.13, strideScale: 1.18, cadence: 0.93, forwardLean: 0.10, armDrive: 1.08, kitFit: 'tight', headScale: 1.02 };
  if (key.includes('messi')) return { bodyBuild: 'compact', runningStyle: 'agile', celebrationStyle: 'point-up', heightScale: 0.91, widthScale: 0.92, shoulderScale: 0.93, legScale: 0.91, strideScale: 0.92, cadence: 1.20, forwardLean: 0.18, armDrive: 0.94, kitFit: 'regular', headScale: 1.02 };
  if (key.includes('ronaldo')) return { bodyBuild: 'powerful', runningStyle: 'upright', celebrationStyle: 'arms-wide', heightScale: 1.08, widthScale: 1.01, shoulderScale: 1.08, legScale: 1.08, strideScale: 1.11, cadence: 1.00, forwardLean: 0.06, armDrive: 1.13, kitFit: 'tight', headScale: 0.98 };
  if (key.includes('salah')) return { bodyBuild: 'lean', runningStyle: 'glider', celebrationStyle: 'calm', heightScale: 0.98, widthScale: 0.92, shoulderScale: 0.95, legScale: 1.00, strideScale: 1.05, cadence: 1.09, forwardLean: 0.12, armDrive: 0.96, kitFit: 'tight', headScale: 1.00 };
  if (key.includes('saliba')) return { bodyBuild: 'powerful', runningStyle: 'glider', celebrationStyle: 'fist-pump', heightScale: 1.09, widthScale: 1.06, shoulderScale: 1.10, legScale: 1.08, strideScale: 1.05, cadence: 0.96, forwardLean: 0.06, armDrive: 0.94, kitFit: 'regular', headScale: 1.00 };
  if (key.includes('wirtz')) return { bodyBuild: 'lean', runningStyle: 'glider', celebrationStyle: 'fist-pump', heightScale: 0.98, widthScale: 0.89, shoulderScale: 0.92, legScale: 1.01, strideScale: 1.02, cadence: 1.06, forwardLean: 0.09, armDrive: 0.93, kitFit: 'loose', headScale: 0.98 };
  if (key.includes('yamal')) return { bodyBuild: 'lean', runningStyle: 'agile', celebrationStyle: 'point-up', heightScale: 0.95, widthScale: 0.87, shoulderScale: 0.89, legScale: 1.00, strideScale: 1.08, cadence: 1.17, forwardLean: 0.16, armDrive: 1.08, kitFit: 'loose', headScale: 0.98 };
  if (key.includes('doku')) return { bodyBuild: 'compact', runningStyle: 'explosive', celebrationStyle: 'knee-slide', heightScale: 0.96, widthScale: 0.93, shoulderScale: 0.95, legScale: 0.98, strideScale: 1.10, cadence: 1.20, forwardLean: 0.19, armDrive: 1.20, kitFit: 'tight', headScale: 1.00 };
  if (key.includes('foden')) return { bodyBuild: 'lean', runningStyle: 'glider', celebrationStyle: 'fist-pump', heightScale: 0.96, widthScale: 0.90, shoulderScale: 0.92, legScale: 0.98, strideScale: 1.02, cadence: 1.09, forwardLean: 0.10, armDrive: 0.92, kitFit: 'tight', headScale: 0.98 };
  if (key.includes('musiala')) return { bodyBuild: 'lean', runningStyle: 'agile', celebrationStyle: 'arms-wide', heightScale: 1.01, widthScale: 0.90, shoulderScale: 0.92, legScale: 1.05, strideScale: 1.06, cadence: 1.10, forwardLean: 0.13, armDrive: 1.00, kitFit: 'loose', headScale: 0.98 };
  if (key.includes('kane')) return { bodyBuild: 'powerful', runningStyle: 'upright', celebrationStyle: 'fist-pump', heightScale: 1.06, widthScale: 1.04, shoulderScale: 1.07, legScale: 1.04, strideScale: 0.99, cadence: 0.94, forwardLean: 0.05, armDrive: 1.00, kitFit: 'regular', headScale: 1.00 };
  if (key.includes('rodri')) return { bodyBuild: 'powerful', runningStyle: 'upright', celebrationStyle: 'calm', heightScale: 1.07, widthScale: 1.03, shoulderScale: 1.06, legScale: 1.06, strideScale: 0.98, cadence: 0.92, forwardLean: 0.04, armDrive: 0.88, kitFit: 'regular', headScale: 1.00 };
  if (key.includes('valverde')) return { bodyBuild: 'balanced', runningStyle: 'power', celebrationStyle: 'fist-pump', heightScale: 1.02, widthScale: 0.98, shoulderScale: 1.00, legScale: 1.04, strideScale: 1.11, cadence: 1.05, forwardLean: 0.12, armDrive: 1.14, kitFit: 'tight', headScale: 0.98 };
  if (key.includes('camavinga')) return { bodyBuild: 'lean', runningStyle: 'agile', celebrationStyle: 'arms-wide', heightScale: 1.03, widthScale: 0.91, shoulderScale: 0.94, legScale: 1.07, strideScale: 1.08, cadence: 1.08, forwardLean: 0.13, armDrive: 1.04, kitFit: 'loose', headScale: 0.98 };
  if (key.includes('courtois')) return { bodyBuild: 'towering', runningStyle: 'upright', celebrationStyle: 'calm', heightScale: 1.17, widthScale: 1.02, shoulderScale: 1.09, legScale: 1.14, strideScale: 1.00, cadence: 0.90, forwardLean: 0.03, armDrive: 1.00, kitFit: 'regular', headScale: 0.98 };
  if (key.includes('maignan')) return { bodyBuild: 'powerful', runningStyle: 'power', celebrationStyle: 'fist-pump', heightScale: 1.10, widthScale: 1.07, shoulderScale: 1.11, legScale: 1.09, strideScale: 1.03, cadence: 0.94, forwardLean: 0.06, armDrive: 1.10, kitFit: 'tight', headScale: 1.00 };

  return null;
}

export function getOnPitchLikeness(player: Player): OnPitchLikenessProfile {
  // Lazily enrich roster players with deterministic offline appearance data.
  // This also improves the original pitch renderer because it reads player.likeness.
  if (!player.likeness) {
    player.likeness = getOnPitchAppearance(player);
  }

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
