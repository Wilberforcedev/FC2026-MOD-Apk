export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export type PlayStyle = 
  | 'Finesse Shot' 
  | 'Finesse Shot+' 
  | 'Rapid' 
  | 'Trivela' 
  | 'Power Header' 
  | 'Speed Dribbler' 
  | 'Whipped Cross' 
  | 'Relentless' 
  | 'Trickster' 
  | 'Anchor'
  | 'Long Ball'
  | 'Tiki Taka'
  | 'Block';

export interface PlayerStats {
  pace: number;        // Speed & acceleration (50-99)
  shooting: number;    // Shot power & accuracy (50-99)
  passing: number;     // Ground & lofted pass accuracy (50-99)
  dribbling: number;   // Ball control, agility (50-99)
  defending: number;   // Tackling & positioning (50-99)
  physicality: number; // Strength & stamina (50-99)
  physical?: number;
}

export type HairStyle = 'short' | 'fade' | 'curly' | 'dreads' | 'slick' | 'buzz' | 'afro' | 'mohawk';
export type FacialHair = 'none' | 'stubble' | 'beard' | 'goatee';
export type FaceCardTheme = 'gold' | 'tots' | 'totw' | 'future_stars' | 'icon';

export interface PlayerLikeness {
  skinTone: string;     // Hex e.g. '#f5d0b0'
  hairStyle: HairStyle;
  hairColor: string;    // Hex e.g. '#261b11'
  bootColor: string;    // Hex e.g. '#e11d48' or '#22c55e'
  facialHair?: FacialHair;
  faceCardTheme?: FaceCardTheme;
  cardTier?: 'bronze' | 'silver' | 'gold' | 'special';
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  number: number;
  position: Position;
  rating: number; // Overall rating e.g. 91
  stats: PlayerStats;
  isGoalkeeper?: boolean;
  preferredFoot?: 'Left' | 'Right';
  playStyles?: PlayStyle[];
  likeness?: PlayerLikeness;
  // Career mode stats
  marketValue?: number; // In millions e.g. 95
  wage?: number;        // In thousands e.g. 250
  form?: 'Excellent' | 'Good' | 'Average' | 'Poor';
  staminaCondition?: number; // 0 - 100 for career mode fatigue
  isInjured?: boolean;
  injuryRoundsLeft?: number;
  potential?: number;   // Potential ceiling e.g. 94
  development?: {
    xp: number;
    level: number;
    drillsCompleted: number;
    form?: string;
  };
}

export type KitPattern = 'solid' | 'stripes' | 'hoops' | 'sash' | 'split' | 'chevron';

export interface TeamKit {
  primary: string;    // Jersey color
  secondary: string;  // Accent/trim color
  shorts: string;     // Shorts color
  socks: string;      // Socks color
  numberColor: string;
  pattern?: KitPattern;
  sponsorText?: string;
  crestShape?: 'shield' | 'circle' | 'diamond' | 'hexagon';
  crestSymbol?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  country: string;
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  badgeIcon: string;
  emblemUrl?: string;
  leagueId?: string;
  attackRating: number;
  midfieldRating: number;
  defenseRating: number;
  overallRating: number;
  kit: TeamKit;
  awayKit: TeamKit;
  formation: string; // e.g. "4-3-3", "4-4-2", "3-5-2"
  tactic: 'Balanced' | 'High Press' | 'Counter Attack' | 'Tiki-Taka' | 'Park The Bus';
  stadium?: string;
  stadiumName?: string;
  sponsor?: string;
  budget?: number; // In Millions e.g. 150
  transferBudget?: number;
  rating?: number;
  players: Player[];
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number; // Height above ground
}

export interface MatchPlayerEntity {
  id: string;
  team: 'home' | 'away';
  player: Player;
  pos: Vector2D;
  targetPos: Vector2D;
  homePos: Vector2D; // Base tactical position
  velocity: Vector2D;
  facingAngle: number; // Radians
  stamina: number; // 0 - 100
  isSprinting: boolean;
  hasBall: boolean;
  isTackling: boolean;
  tackleCooldown: number;
  isDiving?: boolean;
  diveTarget?: Vector2D;
  skillMoveTime: number; // For step-overs/roulette animations
  runCycle: number; // Animation phase (0 - 2PI)
  animState: 'idle' | 'running' | 'kicking' | 'tackling' | 'celebrating' | 'saving';
  yellowCards: number;
  isRedCarded: boolean;
}

export interface ReplayPlayerState {
  id: string;
  team: 'home' | 'away';
  x: number;
  y: number;
  facingAngle: number;
  animState: 'idle' | 'running' | 'kicking' | 'tackling' | 'celebrating' | 'saving';
  runCycle: number;
}

export interface ReplayFrame {
  timestamp: number;
  ball: { x: number; y: number; z: number };
  players: ReplayPlayerState[];
}

export interface LeagueTableRow {
  teamId: string;
  teamName: string;
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface SeasonFixture {
  id: string;
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  isPlayed: boolean;
}

export type NewsCategory = 'TRANSFER' | 'INJURY' | 'RECOVERY' | 'RUMOR' | 'LEAGUE' | 'DEVELOPMENT';

export interface PlayerInjury {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  injuryName: string;
  weeksRemaining: number;
  severity: 'Minor' | 'Moderate' | 'Severe';
}

export interface CareerNewsItem {
  id: string;
  type: 'transfer' | 'injury' | 'recovery' | 'headline' | 'rumor' | 'development';
  title: string;
  summary: string;
  fullBody: string;
  date: string;
  matchday: number;
  category: NewsCategory;
  importance: 'breaking' | 'high' | 'normal';
  author: string;
  handle?: string;
  verified?: boolean;
  avatarText?: string;
  teamId?: string;
  secondaryTeamId?: string;
  playerName?: string;
  playerPosition?: string;
  playerRating?: number;
  transferFee?: number;
  injuryType?: string;
  recoveryWeeks?: number;
  likes?: string;
  retweets?: string;
  isRead?: boolean;
}

export type ScoutingRegionId = 
  | 'south_america' 
  | 'western_europe' 
  | 'central_europe' 
  | 'southern_europe' 
  | 'africa' 
  | 'asia_oceania' 
  | 'north_america';

export type ScoutProfilePriority = 
  | 'any' 
  | 'technically_gifted' 
  | 'pace_winger' 
  | 'physically_strong' 
  | 'playmaker' 
  | 'defensive_minded' 
  | 'goalkeeper';

export type PotentialTier = 
  | 'generational' // 91-95 "Has Potential to be Special"
  | 'exciting'     // 86-90 "An Exciting Prospect"
  | 'great'        // 81-85 "Showing Great Potential"
  | 'rotation';    // 75-80 "Solid Squad Prospect"

export interface ScoutedProspect extends Player {
  age: number;
  nationality: string;
  flag: string;
  region: ScoutingRegionId;
  potentialMin: number;
  potentialMax: number;
  potentialTier: PotentialTier;
  weakFoot: number; // 1-5
  skillMoves: number; // 1-5
  workRate: string; // e.g. 'High/Med'
  scoutComment: string;
  scoutedAtMatchday: number;
  scoutId: string;
  scoutName: string;
  status: 'scouted' | 'signed_to_academy' | 'promoted' | 'rejected';
}

export interface ScoutMission {
  region: ScoutingRegionId;
  priority: ScoutProfilePriority;
  matchdaysRemaining: number;
  totalMatchdays: number;
  cost: number;
}

export interface Scout {
  id: string;
  name: string;
  nationality: string;
  flag: string;
  experience: number; // 1-5 stars
  judgement: number;  // 1-5 stars
  hired: boolean;
  hiringCost: number; // Millions e.g. 0.8
  wage: number;       // Thousands per week
  status: 'available' | 'scouting';
  specialty: string;
  currentMission?: ScoutMission;
}

export interface ScoutingNetworkState {
  scouts: Scout[];
  activeReports: ScoutedProspect[];
  totalDiscovered: number;
  promotedCount: number;
}

export interface CareerState {
  userTeamId: string;
  seasonYear: number;
  currentMatchday: number;
  totalMatchdays: number;
  budget: number; // Millions
  table: LeagueTableRow[];
  fixtures: SeasonFixture[];
  transferMarket: Player[];
  youthAcademy: Player[];
  newsFeed?: CareerNewsItem[];
  activeInjuries?: PlayerInjury[];
  scoutingNetwork?: ScoutingNetworkState;
}

export interface BallEntity {
  pos: Vector3D;
  velocity: Vector3D;
  spin: Vector2D; // Curve effect
  lastTouchedBy?: string; // Player ID
  lastTouchedTeam?: 'home' | 'away';
  isInGoal: boolean;
}

export type MatchPhase = 
  | 'kickoff'
  | 'playing'
  | 'goal'
  | 'throwin'
  | 'corner'
  | 'goalkick'
  | 'halftime'
  | 'fulltime'
  | 'extratime'
  | 'penalties';

export interface MatchStats {
  homeScore: number;
  awayScore: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePossessionPercent: number;
  awayPossessionPercent: number;
  homePasses: number;
  awayPasses: number;
  homePassSuccess: number;
  awayPassSuccess: number;
  homeTackles: number;
  awayTackles: number;
  homeFouls: number;
  awayFouls: number;
  homeCorners: number;
  awayCorners: number;
}

export interface GoalEvent {
  minute: number;
  scorerName: string;
  scorerNumber: number;
  team: 'home' | 'away';
  assistedBy?: string;
  shotSpeedKmh: number;
}

export interface HighlightPlayerMeta {
  id: string;
  team: 'home' | 'away';
  name: string;
  shortName: string;
  number: number;
  likeness?: PlayerLikeness;
}

export interface HeatmapSample {
  x: number;
  y: number;
}

export interface PlayerHeatmapRecord {
  id: string;
  name: string;
  shortName: string;
  number: number;
  position: string;
  team: 'home' | 'away';
  samples: HeatmapSample[];
  distanceKm: number;
  sprintDistanceKm: number;
  topSpeedKmh: number;
}

export interface MatchHeatmapData {
  homePlayers: Record<string, PlayerHeatmapRecord>;
  awayPlayers: Record<string, PlayerHeatmapRecord>;
  ballSamples: HeatmapSample[];
  homeTeamSamples: HeatmapSample[];
  awayTeamSamples: HeatmapSample[];
}

export interface MatchHighlightEvent {
  id: string;
  type: 'goal' | 'save';
  minute: number;
  matchTimeSec: number;
  team: 'home' | 'away';
  primaryPlayerName: string;
  primaryPlayerNumber: number;
  secondaryPlayerName?: string;
  shotSpeedKmh?: number;
  description: string;
  frames: ReplayFrame[];
  timestamp: number;
  homeTeam: {
    id?: string;
    name: string;
    shortName: string;
    badgeIcon: string;
    badgeBg: string;
    badgeBorder: string;
    badgeTextColor: string;
    kit: TeamKit;
  };
  awayTeam: {
    id?: string;
    name: string;
    shortName: string;
    badgeIcon: string;
    badgeBg: string;
    badgeBorder: string;
    badgeTextColor: string;
    kit: TeamKit;
  };
  playersMeta?: HighlightPlayerMeta[];
  weather?: string;
}

export interface TournamentMatch {
  id: string;
  round: 'quarter' | 'semi' | 'final';
  roundName: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  winner?: Team;
  isPlayerMatch: boolean;
  isCompleted: boolean;
}

export interface CommentaryMessage {
  id: string;
  text: string;
  type: 'goal' | 'save' | 'shot' | 'tackle' | 'foul' | 'general' | 'whistle';
  timestamp: number;
}

export type GameDifficulty = 'Beginner' | 'Amateur' | 'Semi-Pro' | 'Professional' | 'World Class' | 'Legendary';
export type MatchDuration = 2 | 4 | 6 | 10; // Minutes total match length
export type WeatherType = 'Night' | 'Sunset' | 'Clear' | 'Rain';
