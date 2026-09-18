import { 
  Player, 
  Team, 
  Position, 
  PlayStyle, 
  ScoutingRegionId, 
  ScoutProfilePriority, 
  PotentialTier, 
  ScoutedProspect, 
  Scout, 
  ScoutingNetworkState, 
  CareerState,
  PlayerLikeness
} from '../types/soccer';
import { createYouthPromotionNews } from './careerNewsService';

export interface RegionMetadata {
  id: ScoutingRegionId;
  name: string;
  flag: string;
  countries: string[];
  description: string;
  archetypes: string[];
  topTraits: string;
  accentGradient: string;
  badgeStyle: string;
  notableAlumni: string;
  missionCost: number; // Millions e.g. 0.6
}

export const SCOUTING_REGIONS: Record<ScoutingRegionId, RegionMetadata> = {
  south_america: {
    id: 'south_america',
    name: 'South America',
    flag: '🇧🇷 🇦🇷',
    countries: ['Brazil', 'Argentina', 'Colombia', 'Uruguay', 'Chile'],
    description: 'The global heart of samba flair, mesmerizing close-control dribbling, and instinctive attacking wonderkids.',
    archetypes: ['Samba Flair Wingers', 'Number 10 Playmakers', 'Poaching Strikers', 'Box-to-Box Engines'],
    topTraits: '5★ Skill potential, explosive acceleration, finesse curling strikes',
    accentGradient: 'from-amber-500 to-yellow-400',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    notableAlumni: 'Vinícius Jr, Lionel Messi, Neymar, Lautaro Martínez',
    missionCost: 0.8,
  },
  western_europe: {
    id: 'western_europe',
    name: 'Western Europe',
    flag: '🇪🇸 🇫🇷',
    countries: ['Spain', 'France', 'Portugal', 'Netherlands', 'Belgium'],
    description: 'Tactical academies specializing in press-resistant vision, surgical passing tempo, and high-IQ playmakers.',
    archetypes: ['Tiki-Taka Maestros', 'Inverted Wingers', 'Sweeper Keepers', 'Technical Centerbacks'],
    topTraits: 'Tiki-Taka vision, incisive through-balls, rapid cognitive decision making',
    accentGradient: 'from-cyan-500 to-blue-500',
    badgeStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    notableAlumni: 'Lamine Yamal, Kylian Mbappé, Gavi, Eduardo Camavinga',
    missionCost: 0.9,
  },
  central_europe: {
    id: 'central_europe',
    name: 'Central & Northern Europe',
    flag: '🇩🇪 🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    countries: ['England', 'Germany', 'Norway', 'Sweden', 'Denmark'],
    description: 'Renowned for towering physical power, ruthless clinical finishing, modern ball-playing CBs, and counter-pressing dynamos.',
    archetypes: ['Clinical Target Men', 'Power Headers', 'Gegenpressing Midfielders', 'Commanding Keepers'],
    topTraits: 'Physical dominance, long-distance rocket shots, tireless stamina',
    accentGradient: 'from-emerald-500 to-teal-400',
    badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    notableAlumni: 'Erling Haaland, Jude Bellingham, Florian Wirtz, Kobbie Mainoo',
    missionCost: 0.7,
  },
  southern_europe: {
    id: 'southern_europe',
    name: 'Southern Europe & Mediterranean',
    flag: '🇮🇹 🇭🇷',
    countries: ['Italy', 'Croatia', 'Serbia', 'Greece', 'Portugal'],
    description: 'Home of iconic catenaccio defending, defensive midfield anchors, composed registas, and clutch game-winners.',
    archetypes: ['Catenaccio Anchors', 'Deep-Lying Registas', 'Tenacious Fullbacks', 'Fox in the Box'],
    topTraits: 'Anticipation tackles, spatial awareness, leadership, tactical discipline',
    accentGradient: 'from-rose-500 to-red-400',
    badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    notableAlumni: 'Luka Modrić, Giorgio Scalvini, Josko Gvardiol, Nicolò Barella',
    missionCost: 0.65,
  },
  africa: {
    id: 'africa',
    name: 'Africa & Sub-Sahara',
    flag: '🇳🇬 🇸🇳',
    countries: ['Nigeria', 'Senegal', 'Ghana', 'Ivory Coast', 'Morocco'],
    description: 'Explosive raw pace, relentless 90-minute stamina, dynamic transitions, and electrifying attacking threats.',
    archetypes: ['Speed Dribblers', 'Dynamic Transitions', 'Physical Anchors', 'Explosive Finishers'],
    topTraits: '90+ Pace potential, relentless physical endurance, vertical leap',
    accentGradient: 'from-lime-400 to-emerald-500',
    badgeStyle: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
    notableAlumni: 'Victor Osimhen, Mohamed Salah, Sadio Mané, Achraf Hakimi',
    missionCost: 0.5,
  },
  asia_oceania: {
    id: 'asia_oceania',
    name: 'Asia & Oceania',
    flag: '🇯🇵 🇰🇷',
    countries: ['Japan', 'South Korea', 'Australia'],
    description: 'Extreme discipline, low center-of-gravity agility, ambidextrous two-footed passing, and hyper-energetic pressing.',
    archetypes: ['Agile Half-Space Creators', 'High-Workrate Wingers', 'Two-Footed Snipers', 'Sweeper Fullbacks'],
    topTraits: 'Quick-twitch turns, 5★ weak foot potential, tactical synchronization',
    accentGradient: 'from-purple-500 to-indigo-400',
    badgeStyle: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    notableAlumni: 'Son Heung-min, Kaoru Mitoma, Takefusa Kubo, Lee Kang-in',
    missionCost: 0.55,
  },
  north_america: {
    id: 'north_america',
    name: 'North & Central America',
    flag: '🇺🇸 🇲🇽',
    countries: ['USA', 'Mexico', 'Canada'],
    description: 'Modern athletic hybrid wingbacks, high-tempo transition sprinters, and gritty modern attackers.',
    archetypes: ['Attacking Wingbacks', 'Transition Sprinters', 'Direct Wingers', 'Agile Goalkeepers'],
    topTraits: 'Overlapping sprint endurance, aggressive pressing, direct crossing',
    accentGradient: 'from-sky-400 to-cyan-500',
    badgeStyle: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    notableAlumni: 'Christian Pulisic, Alphonso Davies, Santiago Giménez',
    missionCost: 0.5,
  },
};

export const INITIAL_SCOUT_POOL: Scout[] = [
  {
    id: 'scout_marco_benetti',
    name: 'Marco Benetti',
    nationality: 'Italy',
    flag: '🇮🇹',
    experience: 5,
    judgement: 4,
    hired: true,
    hiringCost: 1.2,
    wage: 14,
    status: 'available',
    specialty: 'Wonderkid Hunter & Technical Profiles',
  },
  {
    id: 'scout_mateo_hernandez',
    name: 'Mateo Hernandez',
    nationality: 'Argentina',
    flag: '🇦🇷',
    experience: 4,
    judgement: 5,
    hired: true,
    hiringCost: 1.1,
    wage: 12,
    status: 'available',
    specialty: 'South American Flair & Dribbling Phenoms',
  },
  {
    id: 'scout_jean_dubois',
    name: 'Jean-Luc Dubois',
    nationality: 'France',
    flag: '🇫🇷',
    experience: 4,
    judgement: 4,
    hired: false,
    hiringCost: 0.9,
    wage: 10,
    status: 'available',
    specialty: 'Tactical Midfield Maestros & Passing IQ',
  },
  {
    id: 'scout_henrik_lind',
    name: 'Henrik Lindqvist',
    nationality: 'Sweden',
    flag: '🇸🇪',
    experience: 5,
    judgement: 5,
    hired: false,
    hiringCost: 2.0,
    wage: 20,
    status: 'available',
    specialty: 'Generational Striker & Physical Prodigies',
  },
  {
    id: 'scout_kwame_mensah',
    name: 'Kwame Mensah',
    nationality: 'Ghana',
    flag: '🇬🇭',
    experience: 4,
    judgement: 4,
    hired: false,
    hiringCost: 0.8,
    wage: 9,
    status: 'available',
    specialty: 'Electric Pace, Acceleration & Stamina Dynamos',
  },
];

// Culturally rich name seeds per region
const REGION_NAMES: Record<ScoutingRegionId, { first: string[]; last: string[] }> = {
  south_america: {
    first: ['Thiago', 'Matheus', 'Gabriel', 'Lucas', 'Enzo', 'Julian', 'Felipe', 'Mateo', 'Agustin', 'Lautaro', 'Arthur', 'Rodrigo', 'Vinícius', 'Caio', 'Santiago'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Alvarez', 'Romero', 'Ferreira', 'Rodriguez', 'Benitez', 'Pereira', 'Martinez', 'Lima', 'Navarro', 'Ribeiro'],
  },
  western_europe: {
    first: ['Rayan', 'Lamine', 'Gavi', 'Bradley', 'Mathis', 'Pau', 'Fermin', 'Malo', 'Leny', 'Kylian', 'Desire', 'Yanis', 'Nico', 'Oihan', 'Warren'],
    last: ['Garcia', 'Lopez', 'Martinez', 'Navarro', 'Camara', 'Diallo', 'Mendy', 'Dembélé', 'Torres', 'Fernandez', 'Vega', 'Koné', 'Diop', 'Serrano'],
  },
  central_europe: {
    first: ['Florian', 'Archie', 'Kobbie', 'Jude', 'Noah', 'Felix', 'Finn', 'Lennart', 'Cole', 'Rico', 'Sverre', 'Maximilian', 'Lucas', 'Jonas', 'Paul'],
    last: ['Schmidt', 'Müller', 'Bellingham', 'Wharton', 'Weber', 'Lewis', 'Mainoo', 'Nypan', 'Fischer', 'Meyer', 'Bergvall', 'Wagner', 'Palmer', 'Lind'],
  },
  southern_europe: {
    first: ['Lorenzo', 'Matteo', 'Federico', 'Luka', 'Josip', 'Nikola', 'Marko', 'Gianluca', 'Alessio', 'Dario', 'Petar', 'Stipe', 'Domenico'],
    last: ['Rossi', 'Barella', 'Gvardiol', 'Modric', 'Ferrari', 'Russo', 'Maric', 'Kovacic', 'Esposito', 'Romano', 'Perisic', 'Vlasic', 'Conti'],
  },
  africa: {
    first: ['Victor', 'Ademola', 'Samuel', 'Kelechi', 'Gift', 'Chidera', 'Sadio', 'Terem', 'Ibrahim', 'Amadou', 'Sekou', 'Hakim', 'Bamba'],
    last: ['Osimhen', 'Lookman', 'Chukwueze', 'Boniface', 'Orban', 'Mendy', 'Touré', 'Koulibaly', 'Traoré', 'Diallo', 'Diatta', 'Okonkwo', 'Sow'],
  },
  asia_oceania: {
    first: ['Takefusa', 'Kaoru', 'Keito', 'Daizen', 'Ao', 'Ritsu', 'Zion', 'Min-jae', 'Kang-in', 'Heung-min', 'Jordan', 'Koki', 'Kento'],
    last: ['Tanaka', 'Suzuki', 'Endo', 'Mitoma', 'Kubo', 'Kamada', 'Nakamura', 'Kim', 'Park', 'Lee', 'Ito', 'Souttar', 'Irvine'],
  },
  north_america: {
    first: ['Christian', 'Weston', 'Timothy', 'Gio', 'Alphonso', 'Santiago', 'Caden', 'Paxten', 'Julian', 'Kevin', 'Mateo', 'Diego', 'Caelan'],
    last: ['Pulisic', 'McKennie', 'Weah', 'Reyna', 'Davies', 'Giménez', 'Clark', 'Aaronson', 'Araujo', 'Pepi', 'Lozano', 'Buchanan', 'Miller'],
  },
};

const SCOUT_NOTES_TEMPLATES = [
  'Mesmerizing close-control dribbler who glides past low blocks with blistering bursts. Shows rare maturity in decisive final-third passing.',
  'Colossal physical presence with elite aerial leap and composed distribution under high press. Natural leader with world-class upside.',
  'Electric acceleration down the flanks with surgical crossing and lethal curling finesse finishes into the far corner.',
  'High-IQ playmaker with 360-degree vision. Dictates match tempo effortlessly with first-time vertical through balls.',
  'Relentless pressing machine who covers 12km per 90. Combines crunching tackles with sudden counter-attacking transition runs.',
  'Extraordinary shot-stopping reflexes with acrobatic agility and modern sweeper-keeper distribution range.',
  'Generational wonderkid possessing explosive flair, 5★ skill potential, and fearless swagger in the penalty box.',
];

/**
 * Initializes the default scouting network for career mode
 */
export function initializeScoutingNetwork(): ScoutingNetworkState {
  const initialScouts = INITIAL_SCOUT_POOL.map((s) => ({ ...s }));
  
  // Pre-seed a couple of exciting scouting reports so the user has immediate discovery on launch!
  const starterReports: ScoutedProspect[] = [
    generateSingleProspect(
      initialScouts[0],
      'south_america',
      'technically_gifted',
      1,
      'generational'
    ),
    generateSingleProspect(
      initialScouts[1],
      'western_europe',
      'playmaker',
      1,
      'exciting'
    ),
    generateSingleProspect(
      initialScouts[0],
      'africa',
      'pace_winger',
      1,
      'exciting'
    ),
  ];

  return {
    scouts: initialScouts,
    activeReports: starterReports,
    totalDiscovered: 3,
    promotedCount: 0,
  };
}

/**
 * Generates a realistic unique youth prospect with potential ratings
 */
export function generateSingleProspect(
  scout: Scout,
  regionId: ScoutingRegionId,
  priority: ScoutProfilePriority,
  currentMatchday: number,
  forcedTier?: PotentialTier
): ScoutedProspect {
  const region = SCOUTING_REGIONS[regionId];
  const namePool = REGION_NAMES[regionId] || REGION_NAMES.south_america;
  
  const firstName = namePool.first[Math.floor(Math.random() * namePool.first.length)];
  const lastName = namePool.last[Math.floor(Math.random() * namePool.last.length)];
  const fullName = `${firstName} ${lastName}`;
  const shortName = `${firstName[0]}. ${lastName}`;

  // Age between 15 and 18
  const age = Math.floor(Math.random() * 4) + 15;

  // Position based on priority or region archetype
  let position: Position;
  if (priority === 'goalkeeper') {
    position = 'GK';
  } else if (priority === 'defensive_minded') {
    position = (['CB', 'LB', 'RB', 'CDM'] as Position[])[Math.floor(Math.random() * 4)];
  } else if (priority === 'playmaker') {
    position = (['CAM', 'CM', 'CDM'] as Position[])[Math.floor(Math.random() * 3)];
  } else if (priority === 'pace_winger') {
    position = (['LW', 'RW', 'ST', 'LB', 'RB'] as Position[])[Math.floor(Math.random() * 5)];
  } else if (priority === 'physically_strong') {
    position = (['ST', 'CB', 'CDM', 'CM'] as Position[])[Math.floor(Math.random() * 4)];
  } else if (priority === 'technically_gifted') {
    position = (['CAM', 'LW', 'RW', 'CM', 'ST'] as Position[])[Math.floor(Math.random() * 5)];
  } else {
    // Any
    const allPositions: Position[] = ['ST', 'CAM', 'LW', 'RW', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
    position = allPositions[Math.floor(Math.random() * allPositions.length)];
  }

  // Base overall rating: 63 to 75
  const rating = Math.floor(Math.random() * 12) + 64;

  // Potential generation based on Scout Experience & Judgement
  // Higher judgement = narrower, more accurate range; higher experience = better prospect chances
  let tier: PotentialTier = forcedTier || 'great';
  if (!forcedTier) {
    const roll = Math.random() * 100;
    if (roll > 80) tier = 'generational'; // 20% chance of 91-95 Wonderkid
    else if (roll > 45) tier = 'exciting'; // 35% chance of 86-90
    else if (roll > 15) tier = 'great'; // 30% chance of 81-85
    else tier = 'rotation'; // 15% chance
  }

  let potentialMin = 80;
  let potentialMax = 85;

  if (tier === 'generational') {
    potentialMin = Math.min(93, Math.max(88, rating + 18));
    potentialMax = Math.min(95, potentialMin + Math.floor(Math.random() * 4) + 3);
  } else if (tier === 'exciting') {
    potentialMin = Math.min(88, Math.max(84, rating + 14));
    potentialMax = Math.min(90, potentialMin + Math.floor(Math.random() * 4) + 3);
  } else if (tier === 'great') {
    potentialMin = Math.min(83, Math.max(79, rating + 10));
    potentialMax = Math.min(85, potentialMin + Math.floor(Math.random() * 4) + 2);
  } else {
    potentialMin = Math.max(74, rating + 5);
    potentialMax = Math.min(79, potentialMin + 4);
  }

  // Generate attribute distribution tailored to position
  const isGK = position === 'GK';
  const pace = isGK 
    ? Math.floor(Math.random() * 20) + 55 
    : ['LW', 'RW', 'ST', 'LB', 'RB'].includes(position) 
      ? Math.floor(Math.random() * 20) + 78 
      : Math.floor(Math.random() * 20) + 65;

  const shooting = isGK 
    ? 25 
    : ['ST', 'CAM', 'RW', 'LW'].includes(position) 
      ? Math.floor(Math.random() * 20) + 72 
      : Math.floor(Math.random() * 20) + 55;

  const passing = isGK 
    ? Math.floor(Math.random() * 25) + 60 
    : ['CAM', 'CM', 'CDM'].includes(position) 
      ? Math.floor(Math.random() * 20) + 74 
      : Math.floor(Math.random() * 20) + 62;

  const dribbling = isGK 
    ? 30 
    : ['CAM', 'LW', 'RW', 'ST'].includes(position) 
      ? Math.floor(Math.random() * 18) + 76 
      : Math.floor(Math.random() * 20) + 64;

  const defending = isGK 
    ? 25 
    : ['CB', 'LB', 'RB', 'CDM'].includes(position) 
      ? Math.floor(Math.random() * 18) + 72 
      : Math.floor(Math.random() * 20) + 45;

  const physicality = ['ST', 'CB', 'CDM'].includes(position) 
    ? Math.floor(Math.random() * 20) + 70 
    : Math.floor(Math.random() * 20) + 58;

  // Likeness setup
  const skinTones = ['#f5d0b0', '#d49b6a', '#b77b4c', '#8d5524', '#593617', '#3d2314'];
  const hairStyles: PlayerLikeness['hairStyle'][] = ['short', 'fade', 'curly', 'dreads', 'slick', 'buzz', 'afro', 'mohawk'];
  const hairColors = ['#111827', '#3b2f2f', '#78350f', '#d97706', '#1f2937'];
  const bootColors = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const likeness: PlayerLikeness = {
    skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
    hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
    hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
    bootColor: bootColors[Math.floor(Math.random() * bootColors.length)],
    facialHair: age <= 16 ? 'none' : Math.random() > 0.6 ? 'stubble' : 'none',
    faceCardTheme: 'future_stars',
  };

  // PlayStyles selection
  const possibleStyles: PlayStyle[] = [
    'Finesse Shot',
    'Trickster',
    'Speed Dribbler',
    'Whipped Cross',
    'Relentless',
    'Power Header',
    'Tiki Taka',
    'Long Ball',
    'Anchor',
    'Block',
  ];
  const selectedStyles: PlayStyle[] = [];
  if (['ST', 'CAM', 'LW', 'RW'].includes(position)) {
    selectedStyles.push(Math.random() > 0.5 ? 'Finesse Shot' : 'Trickster');
  } else if (['CB', 'CDM', 'LB', 'RB'].includes(position)) {
    selectedStyles.push(Math.random() > 0.5 ? 'Anchor' : 'Block');
  } else {
    selectedStyles.push(Math.random() > 0.5 ? 'Tiki Taka' : 'Relentless');
  }

  // Market Value estimation
  const marketValue = Math.round((rating * 0.12 + (potentialMax - 75) * 0.35) * 10) / 10;
  const wage = Math.round((rating * 0.15 + (potentialMax - 75) * 0.1) * 10) / 10;

  const notes = SCOUT_NOTES_TEMPLATES[Math.floor(Math.random() * SCOUT_NOTES_TEMPLATES.length)];

  return {
    id: `youth_${regionId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name: fullName,
    shortName,
    number: Math.floor(Math.random() * 40) + 50, // Youth numbers 50-99
    position,
    rating,
    age,
    nationality: region.countries[Math.floor(Math.random() * region.countries.length)],
    flag: region.flag.split(' ')[0] || '🌐',
    region: regionId,
    potentialMin,
    potentialMax,
    potentialTier: tier,
    potential: potentialMax,
    stats: {
      pace,
      shooting,
      passing,
      dribbling,
      defending,
      physicality,
    },
    isGoalkeeper: isGK,
    preferredFoot: Math.random() > 0.7 ? 'Left' : 'Right',
    weakFoot: Math.floor(Math.random() * 3) + 3, // 3 to 5 stars
    skillMoves: Math.floor(Math.random() * 3) + 3, // 3 to 5 stars
    workRate: Math.random() > 0.5 ? 'High/Med' : 'High/High',
    playStyles: selectedStyles,
    likeness,
    marketValue: Math.max(1.2, marketValue),
    wage: Math.max(2, wage),
    scoutComment: notes,
    scoutedAtMatchday: currentMatchday,
    scoutId: scout.id,
    scoutName: scout.name,
    status: 'scouted',
    development: {
      xp: 150,
      level: 1,
      drillsCompleted: 0,
      form: 'Excellent',
    },
  };
}

/**
 * Dispatches a scout on a mission
 */
export function dispatchScoutMission(
  career: CareerState,
  scoutId: string,
  regionId: ScoutingRegionId,
  priority: ScoutProfilePriority,
  isInstant: boolean
): { success: boolean; message: string; updatedCareer: CareerState; newProspects?: ScoutedProspect[] } {
  const network = career.scoutingNetwork || initializeScoutingNetwork();
  const scout = network.scouts.find((s) => s.id === scoutId);

  if (!scout) {
    return { success: false, message: 'Scout not found in club directory.', updatedCareer: career };
  }

  const region = SCOUTING_REGIONS[regionId];
  const cost = region.missionCost;

  if (career.budget < cost) {
    return { 
      success: false, 
      message: `Insufficient club funds! Scouting ${region.name} requires €${cost}M transfer budget.`, 
      updatedCareer: career 
    };
  }

  // Deduct mission cost from budget
  const newBudget = Math.max(0, Math.round((career.budget - cost) * 10) / 10);

  if (isInstant) {
    // Generate 3-5 high quality prospects immediately!
    const prospectCount = Math.min(5, Math.max(3, scout.experience));
    const newProspects: ScoutedProspect[] = [];

    for (let i = 0; i < prospectCount; i++) {
      newProspects.push(generateSingleProspect(scout, regionId, priority, career.currentMatchday));
    }

    const updatedScouts = network.scouts.map((s) => 
      s.id === scoutId ? { ...s, status: 'available' as const, currentMission: undefined } : s
    );

    const updatedReports = [...newProspects, ...network.activeReports];

    const updatedCareer: CareerState = {
      ...career,
      budget: newBudget,
      scoutingNetwork: {
        ...network,
        scouts: updatedScouts,
        activeReports: updatedReports,
        totalDiscovered: network.totalDiscovered + newProspects.length,
      },
    };

    return {
      success: true,
      message: `Scout ${scout.name} completed rapid expedition to ${region.name}! Discovered ${newProspects.length} exciting youth prospects.`,
      updatedCareer,
      newProspects,
    };
  } else {
    // Active ongoing mission (finishes after 1 matchday)
    const updatedScouts = network.scouts.map((s) => 
      s.id === scoutId ? {
        ...s,
        status: 'scouting' as const,
        currentMission: {
          region: regionId,
          priority,
          matchdaysRemaining: 1,
          totalMatchdays: 1,
          cost,
        }
      } : s
    );

    const updatedCareer: CareerState = {
      ...career,
      budget: newBudget,
      scoutingNetwork: {
        ...network,
        scouts: updatedScouts,
      },
    };

    return {
      success: true,
      message: `Scout ${scout.name} has been dispatched to ${region.name}. A talent dossier will return on the next matchday!`,
      updatedCareer,
    };
  }
}

/**
 * Promotes a discovered prospect directly to the senior first team
 */
export function promoteProspectToSenior(
  career: CareerState,
  userTeam: Team,
  prospect: ScoutedProspect
): { success: boolean; message: string; updatedCareer: CareerState } {
  // Check if player already in team
  if (userTeam.players.some((p) => p.id === prospect.id)) {
    return { success: false, message: `${prospect.name} is already in the senior squad.`, updatedCareer: career };
  }

  // Assign available jersey number
  const usedNumbers = new Set(userTeam.players.map((p) => p.number));
  let jerseyNumber = prospect.number;
  while (usedNumbers.has(jerseyNumber)) {
    jerseyNumber = Math.floor(Math.random() * 40) + 50;
  }

  const seniorPlayer: Player = {
    ...prospect,
    number: jerseyNumber,
    marketValue: prospect.marketValue,
    wage: prospect.wage,
    potential: prospect.potentialMax,
    development: {
      xp: 200,
      level: 1,
      drillsCompleted: 0,
      form: 'Excellent',
    },
  };

  // Add to senior team players
  userTeam.players = [...userTeam.players, seniorPlayer];

  // Update prospect status in scouting network
  const network = career.scoutingNetwork || initializeScoutingNetwork();
  const updatedReports = network.activeReports.map((p) => 
    p.id === prospect.id ? { ...p, status: 'promoted' as const } : p
  );

  // Remove from youth academy if was there
  const updatedYouthAcademy = (career.youthAcademy || []).filter((p) => p.id !== prospect.id);

  // Generate Breaking News
  const newsItem = createYouthPromotionNews(
    userTeam,
    seniorPlayer,
    prospect.potentialMax,
    career.currentMatchday
  );

  const updatedCareer: CareerState = {
    ...career,
    youthAcademy: updatedYouthAcademy,
    newsFeed: [newsItem, ...(career.newsFeed || [])],
    scoutingNetwork: {
      ...network,
      activeReports: updatedReports,
      promotedCount: network.promotedCount + 1,
    },
  };

  return {
    success: true,
    message: `🌟 Promoted! ${prospect.name} (#${jerseyNumber}) is now officially in the senior squad with ${prospect.potentialMax} potential!`,
    updatedCareer,
  };
}

/**
 * Signs a scouted prospect into the club's Youth Academy
 */
export function signProspectToAcademy(
  career: CareerState,
  prospect: ScoutedProspect
): { success: boolean; message: string; updatedCareer: CareerState } {
  const currentAcademy = career.youthAcademy || [];
  if (currentAcademy.some((p) => p.id === prospect.id)) {
    return { success: false, message: `${prospect.name} is already enrolled in the Youth Academy.`, updatedCareer: career };
  }

  const network = career.scoutingNetwork || initializeScoutingNetwork();
  const updatedReports = network.activeReports.map((p) => 
    p.id === prospect.id ? { ...p, status: 'signed_to_academy' as const } : p
  );

  const updatedAcademy = [...currentAcademy, prospect];

  const updatedCareer: CareerState = {
    ...career,
    youthAcademy: updatedAcademy,
    scoutingNetwork: {
      ...network,
      activeReports: updatedReports,
    },
  };

  return {
    success: true,
    message: `Signed! ${prospect.name} (${prospect.position}, Potential ${prospect.potentialMin}-${prospect.potentialMax}) enrolled in Youth Academy.`,
    updatedCareer,
  };
}

/**
 * Releases or discards a prospect from active scouting report
 */
export function releaseProspectReport(
  career: CareerState,
  prospectId: string
): CareerState {
  const network = career.scoutingNetwork || initializeScoutingNetwork();
  const updatedReports = network.activeReports.filter((p) => p.id !== prospectId);
  const updatedAcademy = (career.youthAcademy || []).filter((p) => p.id !== prospectId);

  return {
    ...career,
    youthAcademy: updatedAcademy,
    scoutingNetwork: {
      ...network,
      activeReports: updatedReports,
    },
  };
}

/**
 * Hires a new scout from the scout pool
 */
export function hireClubScout(
  career: CareerState,
  scoutId: string
): { success: boolean; message: string; updatedCareer: CareerState } {
  const network = career.scoutingNetwork || initializeScoutingNetwork();
  const scout = network.scouts.find((s) => s.id === scoutId);

  if (!scout) {
    return { success: false, message: 'Scout not found.', updatedCareer: career };
  }

  if (scout.hired) {
    return { success: false, message: `${scout.name} is already on your staff.`, updatedCareer: career };
  }

  if (career.budget < scout.hiringCost) {
    return { 
      success: false, 
      message: `Cannot afford hiring bonus! Signing ${scout.name} requires €${scout.hiringCost}M.`, 
      updatedCareer: career 
    };
  }

  const updatedScouts = network.scouts.map((s) => 
    s.id === scoutId ? { ...s, hired: true } : s
  );

  const updatedCareer: CareerState = {
    ...career,
    budget: Math.round((career.budget - scout.hiringCost) * 10) / 10,
    scoutingNetwork: {
      ...network,
      scouts: updatedScouts,
    },
  };

  return {
    success: true,
    message: `Hired! ${scout.name} (${scout.experience}★ Experience, ${scout.judgement}★ Judgement) joined your scouting network.`,
    updatedCareer,
  };
}

/**
 * Advances scouting missions when matchdays are played or simulated
 */
export function advanceScoutingMatchday(career: CareerState): { updatedCareer: CareerState; newProspectsCount: number } {
  const network = career.scoutingNetwork || initializeScoutingNetwork();
  let newProspectsCount = 0;
  const newDiscovered: ScoutedProspect[] = [];

  const updatedScouts = network.scouts.map((scout) => {
    if (scout.status === 'scouting' && scout.currentMission) {
      const remaining = scout.currentMission.matchdaysRemaining - 1;
      if (remaining <= 0) {
        // Mission finished! Generate 3-5 prospects
        const count = Math.min(5, Math.max(3, scout.experience));
        for (let i = 0; i < count; i++) {
          newDiscovered.push(
            generateSingleProspect(
              scout,
              scout.currentMission.region,
              scout.currentMission.priority,
              career.currentMatchday
            )
          );
        }
        newProspectsCount += count;
        return {
          ...scout,
          status: 'available' as const,
          currentMission: undefined,
        };
      } else {
        return {
          ...scout,
          currentMission: {
            ...scout.currentMission,
            matchdaysRemaining: remaining,
          },
        };
      }
    }
    return scout;
  });

  const updatedCareer: CareerState = {
    ...career,
    scoutingNetwork: {
      ...network,
      scouts: updatedScouts,
      activeReports: [...newDiscovered, ...network.activeReports],
      totalDiscovered: network.totalDiscovered + newProspectsCount,
    },
  };

  return { updatedCareer, newProspectsCount };
}
