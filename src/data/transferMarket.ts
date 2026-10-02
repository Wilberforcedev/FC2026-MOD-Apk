import { Player } from '../types/soccer';

const INITIAL_TRANSFER_MARKET: Player[] = [
  {
    id: 'tm_1',
    name: 'Kylian Mbappé',
    shortName: 'Mbappé',
    number: 9,
    position: 'ST',
    rating: 91,
    stats: { pace: 97, shooting: 90, passing: 80, dribbling: 92, defending: 36, physicality: 78, physical: 78 },
    playStyles: ['Speed Dribbler', 'Power Header'],
    marketValue: 120,
    likeness: { skinTone: '#b57b54', hairStyle: 'buzz', hairColor: '#1a110b', bootColor: '#facc15' },
  },
  {
    id: 'tm_2',
    name: 'Vinícius Júnior',
    shortName: 'Vinícius',
    number: 7,
    position: 'LW',
    rating: 90,
    stats: { pace: 95, shooting: 84, passing: 81, dribbling: 91, defending: 32, physicality: 69, physical: 69 },
    playStyles: ['Speed Dribbler', 'Trickster'],
    marketValue: 105,
    likeness: { skinTone: '#66432b', hairStyle: 'fade', hairColor: '#1a110b', bootColor: '#22c55e' },
  },
  {
    id: 'tm_3',
    name: 'Jude Bellingham',
    shortName: 'Bellingham',
    number: 5,
    position: 'CAM',
    rating: 90,
    stats: { pace: 80, shooting: 87, passing: 84, dribbling: 88, defending: 78, physicality: 83, physical: 83 },
    playStyles: ['Relentless', 'Finesse Shot'],
    marketValue: 98,
    likeness: { skinTone: '#a26f49', hairStyle: 'fade', hairColor: '#1c130c', bootColor: '#ffffff' },
  },
  {
    id: 'tm_4',
    name: 'Florian Wirtz',
    shortName: 'Wirtz',
    number: 10,
    position: 'CAM',
    rating: 88,
    stats: { pace: 82, shooting: 81, passing: 87, dribbling: 89, defending: 54, physicality: 70, physical: 70 },
    playStyles: ['Tiki Taka', 'Finesse Shot'],
    marketValue: 80,
    likeness: { skinTone: '#f3cbb4', hairStyle: 'short', hairColor: '#53341b', bootColor: '#ef4444' },
  },
  {
    id: 'tm_5',
    name: 'William Saliba',
    shortName: 'Saliba',
    number: 2,
    position: 'CB',
    rating: 87,
    stats: { pace: 82, shooting: 40, passing: 72, dribbling: 74, defending: 88, physicality: 84, physical: 84 },
    playStyles: ['Anchor', 'Block'],
    marketValue: 72,
    likeness: { skinTone: '#6e472a', hairStyle: 'buzz', hairColor: '#140c06', bootColor: '#06b6d4' },
  },
];

export function createInitialTransferMarket(): Player[] {
  return INITIAL_TRANSFER_MARKET.map(player => ({
    ...player,
    stats: { ...player.stats },
    playStyles: player.playStyles ? [...player.playStyles] : undefined,
    likeness: player.likeness ? { ...player.likeness } : undefined,
  }));
}
