import { FaceCardTheme, HairStyle, FacialHair, Player, Position } from '../types/soccer';

export type PackId = 'bronze' | 'silver' | 'gold' | 'premium';

export interface PackDefinition {
  id: PackId;
  name: string;
  tagline: string;
  cost: number;
  playerCount: number;
  minRating: number;
  maxRating: number;
  specialChance: number;
}

export const PACKS: PackDefinition[] = [
  { id: 'bronze', name: 'Bronze Pack', tagline: '3 bronze-rated talents looking for a break', cost: 250_000, playerCount: 3, minRating: 55, maxRating: 64, specialChance: 0 },
  { id: 'silver', name: 'Silver Pack', tagline: '3 silver prospects with room to grow', cost: 600_000, playerCount: 3, minRating: 60, maxRating: 70, specialChance: 0.05 },
  { id: 'gold', name: 'Gold Pack', tagline: '5 established senior pros', cost: 1_500_000, playerCount: 5, minRating: 66, maxRating: 79, specialChance: 0.1 },
  { id: 'premium', name: 'Ultimate Pack', tagline: '5 elite stars — chance of a TOTY-level special', cost: 4_000_000, playerCount: 5, minRating: 74, maxRating: 89, specialChance: 0.35 },
];

const FIRST_NAMES = ['Luca', 'Mateo', 'Thiago', 'Yusuf', 'Kofi', 'Hiro', 'Diego', 'Andres', 'Jamal', 'Noah', 'Santiago', 'Amara', 'Erik', 'Rafael', 'Omar', 'Kenji', 'Pavel', 'Andre', 'Malik', 'Emre'];
const LAST_NAMES = ['Moretti', 'Okafor', 'Silva', 'Tanaka', 'Mensah', 'Rodriguez', 'Kovac', 'Traore', 'Fernandes', 'Nakamura', 'Aliyev', 'Santos', 'Dembele', 'Varga', 'Rahman', 'Costa', 'Muller', 'Diallo', 'Petrov', 'Adeyemi'];

const SKIN_TONES = ['#f5d0b0', '#e8b88a', '#d49b6a', '#b57b4a', '#8d5524', '#6b4226', '#4a2c17'];
const HAIR_COLORS = ['#1f2937', '#111827', '#3b2416', '#5c3a21', '#8a6d3b', '#c2a878', '#7f1d1d'];
const HAIR_STYLES: HairStyle[] = ['short', 'fade', 'curly', 'dreads', 'slick', 'buzz', 'afro', 'mohawk'];
const FACIAL_HAIR: FacialHair[] = ['none', 'none', 'stubble', 'goatee', 'beard'];
const BOOT_COLORS = ['#e11d48', '#22c55e', '#f59e0b', '#06b6d4', '#a855f7', '#f8fafc', '#111827'];
const POSITIONS: Position[] = ['ST', 'CAM', 'LW', 'RW', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
const SPECIAL_THEMES: FaceCardTheme[] = ['tots', 'totw', 'future_stars', 'icon'];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function statFor(rating: number, bias: number): number {
  return Math.min(99, Math.max(40, rating + bias + rand(-4, 4)));
}

function marketValueFor(rating: number): number {
  return Math.max(0.1, Math.round(Math.pow(1.28, rating - 60) * 0.4 * 10) / 10);
}

function generatePackPlayer(rating: number, isSpecial: boolean, index: number): Player {
  const firstName = FIRST_NAMES[rand(0, FIRST_NAMES.length - 1)];
  const lastName = LAST_NAMES[rand(0, LAST_NAMES.length - 1)];
  const position = POSITIONS[rand(0, POSITIONS.length - 1)];
  const isGK = position === 'GK';

  const att = isGK ? -18 : 0;
  const stats = {
    pace: statFor(rating, isGK ? -20 : position === 'CB' || position === 'CDM' ? -4 : 3),
    shooting: statFor(rating, att + (['ST', 'LW', 'RW', 'CAM'].includes(position) ? 4 : -2)),
    passing: statFor(rating, att + (['CAM', 'CM', 'CDM'].includes(position) ? 5 : 0)),
    dribbling: statFor(rating, att + (['LW', 'RW', 'CAM', 'ST'].includes(position) ? 4 : -1)),
    defending: statFor(rating, isGK ? -10 : ['CB', 'LB', 'RB', 'CDM'].includes(position) ? 8 : -8),
    physicality: statFor(rating, isGK ? -6 : ['CB', 'CDM', 'ST'].includes(position) ? 5 : -2),
  };

  const marketValue = marketValueFor(rating);

  return {
    id: `pack-${Date.now().toString(36)}-${index}-${rand(1000, 9999)}`,
    name: `${firstName} ${lastName}`,
    shortName: `${firstName[0]}. ${lastName}`,
    number: rand(2, 49),
    position,
    rating,
    stats,
    isGoalkeeper: isGK,
    preferredFoot: Math.random() < 0.22 ? 'Left' : 'Right',
    potential: Math.min(99, rating + rand(0, isSpecial ? 4 : 8)),
    marketValue,
    wage: Math.max(5, Math.round(marketValue * 2000)),
    form: ['Excellent', 'Good', 'Average'][rand(0, 2)] as Player['form'],
    likeness: {
      skinTone: SKIN_TONES[rand(0, SKIN_TONES.length - 1)],
      hairStyle: HAIR_STYLES[rand(0, HAIR_STYLES.length - 1)],
      hairColor: HAIR_COLORS[rand(0, HAIR_COLORS.length - 1)],
      bootColor: BOOT_COLORS[rand(0, BOOT_COLORS.length - 1)],
      facialHair: FACIAL_HAIR[rand(0, FACIAL_HAIR.length - 1)],
      faceCardTheme: isSpecial ? SPECIAL_THEMES[rand(0, SPECIAL_THEMES.length - 1)] : undefined,
    },
  };
}

export function openPack(pack: PackDefinition): Player[] {
  const players: Player[] = [];
  for (let i = 0; i < pack.playerCount; i += 1) {
    let rating = rand(pack.minRating, pack.maxRating);
    let isSpecial = false;
    if (pack.specialChance > 0 && Math.random() < pack.specialChance) {
      isSpecial = true;
      rating = Math.min(94, Math.max(rating, pack.maxRating - 3));
    }
    players.push(generatePackPlayer(rating, isSpecial, i));
  }
  return players.sort((a, b) => a.rating - b.rating);
}

export function hasWalkout(players: Player[]): boolean {
  return players.some((p) => p.rating >= 84 || (p.likeness?.faceCardTheme && p.likeness.faceCardTheme !== 'gold'));
}
