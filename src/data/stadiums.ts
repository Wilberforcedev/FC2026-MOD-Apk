/**
 * Authentic Stadium Likeness Registry for FC 2026 Soccer
 * Contains real-world stadium architecture, grass lawn cutting patterns,
 * crowd atmosphere colors, LED board banners, and capacity.
 */

export interface StadiumLikeness {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  homeTeamId?: string;
  lawnPattern: 'stripes' | 'checkerboard' | 'diamond' | 'diagonal' | 'concentric';
  grassColorDark: string;
  grassColorLight: string;
  turfWearLevel: number; // 0 to 1
  ledBanners: string[];
  crowdColors: string[];
  floodlightColor: string;
  ambientSky: string;
  architecturalStyle: string;
  description: string;
}

export const STADIUMS: Record<string, StadiumLikeness> = {
  bernabeu: {
    id: 'bernabeu',
    name: 'Estadio Santiago Bernabéu',
    city: 'Madrid',
    country: 'Spain',
    capacity: 85000,
    homeTeamId: 'madrid',
    lawnPattern: 'checkerboard',
    grassColorDark: '#1a6f31',
    grassColorLight: '#22833b',
    turfWearLevel: 0.05,
    ledBanners: [
      'HALA MADRID Y NADA MÁS',
      'EMIRATES • FLY BETTER',
      'REAL MADRID C.F. • 15 EUROPEAN CUPS',
      'EA SPORTS FC 26 • HYPERMOTION V',
      'ADIDAS FOOTBALL • PREDATOR 2026',
    ],
    crowdColors: ['#ffffff', '#1e3a8a', '#d4af37', '#0f172a'],
    floodlightColor: 'rgba(235, 245, 255, 0.95)',
    ambientSky: '#090d1a',
    architecturalStyle: 'Futuristic Metallic Dome & 360° Video Halo',
    description: 'The iconic modern amphitheater featuring a retractable roof and state-of-the-art 360-degree LED video ribbon.',
  },
  etihad: {
    id: 'etihad',
    name: 'Etihad Stadium',
    city: 'Manchester',
    country: 'England',
    capacity: 53400,
    homeTeamId: 'mancity',
    lawnPattern: 'diagonal',
    grassColorDark: '#16652b',
    grassColorLight: '#1f7a37',
    turfWearLevel: 0.04,
    ledBanners: [
      'CITYZENS WORLDWIDE',
      'ETIHAD AIRWAYS • CHOSEN BY THE BEST',
      'THIS IS OUR CITY • MANCHESTER',
      'PUMA FOOTBALL • FOREVER FASTER',
      'MANCHESTER CITY • TREBLE WINNERS',
    ],
    crowdColors: ['#38bdf8', '#0284c7', '#ffffff', '#0f172a'],
    floodlightColor: 'rgba(215, 240, 255, 0.95)',
    ambientSky: '#081220',
    architecturalStyle: 'Circular Spiral Ramps & Sky Blue Perimeter',
    description: 'Home of Pep Guardiola’s tactical powerhouse, featuring pristine hybrid turf cut in sharp diagonal angles.',
  },
  campnou: {
    id: 'campnou',
    name: 'Spotify Camp Nou',
    city: 'Barcelona',
    country: 'Spain',
    capacity: 105000,
    homeTeamId: 'barca',
    lawnPattern: 'stripes',
    grassColorDark: '#186d34',
    grassColorLight: '#22853e',
    turfWearLevel: 0.06,
    ledBanners: [
      'MÉS QUE UN CLUB',
      'SPOTIFY • LISTEN TO FOOTBALL',
      'FC BARCELONA • LA MASIA EXCELLENCE',
      'VISCA EL BARÇA',
      'NIKE FOOTBALL • TOTAL 90',
    ],
    crowdColors: ['#831843', '#1e3a8a', '#fbbf24', '#ffffff'],
    floodlightColor: 'rgba(255, 245, 230, 0.92)',
    ambientSky: '#120f24',
    architecturalStyle: 'Open-Air Mediterranean Colosseum',
    description: 'Europe’s largest football cathedral, steeped in Johan Cruyff’s heritage with sweeping Blaugrana grandstands.',
  },
  allianz: {
    id: 'allianz',
    name: 'Allianz Arena',
    city: 'Munich',
    country: 'Germany',
    capacity: 75024,
    homeTeamId: 'bayern',
    lawnPattern: 'diamond',
    grassColorDark: '#145c27',
    grassColorLight: '#1d7433',
    turfWearLevel: 0.03,
    ledBanners: [
      'MIA SAN MIA',
      'ALLIANZ • PREPARE FOR EVERYTHING',
      'FC BAYERN MÜNCHEN • STERN DES SÜDENS',
      'DEUTSCHE TELEKOM • CONNECTED',
      'ADIDAS FOOTBALL • BAVARIAN PRIDE',
    ],
    crowdColors: ['#dc2626', '#ffffff', '#991b1b', '#1e293b'],
    floodlightColor: 'rgba(255, 230, 230, 0.95)',
    ambientSky: '#16080e',
    architecturalStyle: 'Luminous Inflated Diamond ETFE Cushions',
    description: 'World-famous glowing stadium exterior capable of complete color illumination, featuring iconic Bavarian diamond pitch patterns.',
  },
  anfield: {
    id: 'anfield',
    name: 'Anfield Stadium',
    city: 'Liverpool',
    country: 'England',
    capacity: 61276,
    homeTeamId: 'liverpool',
    lawnPattern: 'stripes',
    grassColorDark: '#16612a',
    grassColorLight: '#207c37',
    turfWearLevel: 0.07,
    ledBanners: [
      'YOU\'LL NEVER WALK ALONE',
      'STANDARD CHARTERED • HERE FOR GOOD',
      'THIS IS ANFIELD',
      'THE KOP STAND • 12TH MAN',
      'L.F.C. • WE ARE LIVERPOOL',
    ],
    crowdColors: ['#b91c1c', '#991b1b', '#ffffff', '#eab308'],
    floodlightColor: 'rgba(250, 245, 235, 0.95)',
    ambientSky: '#0f0a12',
    architecturalStyle: 'Legendary Brickwork Main Stand & Electric Kop',
    description: 'One of world football’s most atmospheric cauldrons, famous for the Spion Kop choir and tight pitch boundaries.',
  },
  emirates: {
    id: 'emirates',
    name: 'Emirates Stadium',
    city: 'London',
    country: 'England',
    capacity: 60704,
    homeTeamId: 'arsenal',
    lawnPattern: 'checkerboard',
    grassColorDark: '#186932',
    grassColorLight: '#227f3d',
    turfWearLevel: 0.04,
    ledBanners: [
      'VICTORIA CONCORDIA CRESCIT',
      'EMIRATES • FLY BETTER',
      'NORTH LONDON IS RED',
      'VISIT RWANDA',
      'ARSENAL F.C. • CANNON PRIDE',
    ],
    crowdColors: ['#dc2626', '#ffffff', '#991b1b', '#1e293b'],
    floodlightColor: 'rgba(240, 248, 255, 0.95)',
    ambientSky: '#090e18',
    architecturalStyle: 'Curved Glass Ellipse & Sculpted Red Steel',
    description: 'Mikel Arteta’s fortress featuring manicured bowling-green turf and seamless panoramic sightlines.',
  },
  parcdesprinces: {
    id: 'parcdesprinces',
    name: 'Parc des Princes',
    city: 'Paris',
    country: 'France',
    capacity: 48583,
    homeTeamId: 'psg',
    lawnPattern: 'diagonal',
    grassColorDark: '#156329',
    grassColorLight: '#1f7935',
    turfWearLevel: 0.05,
    ledBanners: [
      'ICI C\'EST PARIS',
      'QATAR AIRWAYS • OFFICIAL AIRLINE',
      'PARIS SAINT-GERMAIN • DREAM BIGGER',
      'VIRAGE AUTEUIL • ROUGE ET BLEU',
      'ACCOR LIVE LIMITLESS',
    ],
    crowdColors: ['#1e3a8a', '#dc2626', '#ffffff', '#0f172a'],
    floodlightColor: 'rgba(235, 240, 255, 0.95)',
    ambientSky: '#0a0d1c',
    architecturalStyle: 'Concrete Ribbed Cantilevers & Parisian Acoustic Cauldron',
    description: 'Intimate, electric Parisian arena known for world-class acoustics and high-octane flare choreography.',
  },
  sansiro: {
    id: 'sansiro',
    name: 'San Siro (Stadio Giuseppe Meazza)',
    city: 'Milan',
    country: 'Italy',
    capacity: 80018,
    homeTeamId: 'inter',
    lawnPattern: 'stripes',
    grassColorDark: '#17662c',
    grassColorLight: '#207d39',
    turfWearLevel: 0.08,
    ledBanners: [
      'MILANO SIAMO NOI',
      'BETSSON SPORT • OFFICIAL PARTNER',
      'INTERNAZIONALE MILANO • FORZA INTER',
      'CURVA NORD 1969',
      'SERIE A ENILIVE • PASSIONE CALCIO',
    ],
    crowdColors: ['#1d4ed8', '#000000', '#fbbf24', '#ffffff'],
    floodlightColor: 'rgba(245, 245, 230, 0.9)',
    ambientSky: '#0d101a',
    architecturalStyle: 'Monumental Red Steel Girder Towers & Cylindrical Ramps',
    description: 'The towering concrete colosseum of Italian football with sweeping steep terraces looming over the pitch.',
  },
  wembley: {
    id: 'wembley',
    name: 'Wembley Stadium',
    city: 'London',
    country: 'England',
    capacity: 90000,
    lawnPattern: 'concentric',
    grassColorDark: '#1a6f31',
    grassColorLight: '#23853e',
    turfWearLevel: 0.02,
    ledBanners: [
      'WEMBLEY STADIUM • HOME OF FOOTBALL',
      'THE FA • CONNECTING THE NATION',
      'EA SPORTS FC 26 • TOURNAMENT FINALS',
      'ENGLISH FOOTBALL HERITAGE',
      'THE ROYAL BOX • TROPHY LIFT',
    ],
    crowdColors: ['#ffffff', '#dc2626', '#1e3a8a', '#facc15'],
    floodlightColor: 'rgba(255, 255, 255, 0.98)',
    ambientSky: '#060a14',
    architecturalStyle: 'Iconic 133m Illuminated Steel Arch & Twin Royal Tiers',
    description: 'The pinnacle arena for international cup finals and European glory with flawless tournament turf.',
  },
};

/**
 * Returns authentic stadium likeness corresponding to a given team ID or tournament default
 */
export function getStadiumForTeam(teamId?: string): StadiumLikeness {
  if (!teamId) return STADIUMS.bernabeu;

  switch (teamId.toLowerCase()) {
    case 'madrid':
      return STADIUMS.bernabeu;
    case 'mancity':
      return STADIUMS.etihad;
    case 'barca':
      return STADIUMS.campnou;
    case 'bayern':
      return STADIUMS.allianz;
    case 'liverpool':
      return STADIUMS.anfield;
    case 'arsenal':
      return STADIUMS.emirates;
    case 'psg':
      return STADIUMS.parcdesprinces;
    case 'inter':
      return STADIUMS.sansiro;
    case 'tournament':
    case 'final':
      return STADIUMS.wembley;
    default:
      return STADIUMS.bernabeu;
  }
}
