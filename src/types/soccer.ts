export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export type PlayStyle = 
  | 'Finesse Shot' 
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

export interface PlayerLikeness {
  skinTone: string;     // Hex e.g. '#f5d0b0'
  hairStyle: 'short' | 'fade' | 'curly' | 'dreads' | 'slick' | 'buzz';
  hairColor: string;    // Hex e.g. '#261b11'
  bootColor: string;    // Hex e.g. '#e11d48' or '#22c55e'
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

export type NewsCategory = 'TRANSFER' | 'INJURY' | 'RECOVERY' | 'RUMOR' | 'LEAGUE';

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
  type: 'transfer' | 'injury' | 'recovery' | 'headline' | 'rumor';
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
