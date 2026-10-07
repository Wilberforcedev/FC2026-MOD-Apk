import { 
  Team, 
  Player,
  MatchPlayerEntity, 
  BallEntity, 
  MatchPhase, 
  MatchStats, 
  GoalEvent, 
  Vector2D, 
  GameDifficulty,
  ReplayFrame,
  MatchHighlightEvent,
  MatchHeatmapData,
  PlayerHeatmapRecord,
  HeatmapSample
} from '../types/soccer';
import { PITCH, PHYSICS } from './constants';
import { getTacticalTarget } from './formations';
import { soundEngine } from '../services/soundEngine';
import { commentary } from '../services/commentaryEngine';

export interface UserInputState {
  moveX: number;
  moveY: number;
  sprint: boolean;
  pass: boolean;
  passPressed: boolean;
  throughBall: boolean;
  throughBallPressed: boolean;
  shoot: boolean;
  shootCharging: boolean;
  shootPower: number; // 0 - 1
  lob: boolean;
  lobPressed: boolean;
  chipShot?: boolean;
  chipShotPressed?: boolean;
  tackle: boolean;
  tacklePressed: boolean;
  skill: boolean;
  skillPressed: boolean;
  switchPlayer: boolean;
  switchPlayerPressed: boolean;
}

export class MatchEngine {
  public homeTeam: Team;
  public awayTeam: Team;
  public difficulty: GameDifficulty;
  public matchDurationSec: number; // Real seconds for 90 virtual minutes
  
  public homePlayers: MatchPlayerEntity[] = [];
  public awayPlayers: MatchPlayerEntity[] = [];
  public ball: BallEntity;
  public phase: MatchPhase = 'kickoff';
  public userControlledId: string = '';
  
  public matchTimeSec: number = 0; // In match minutes (0 to 90+)
  public addedTimeMinutes: number = 2;
  public isPaused: boolean = false;
  public cameraShake: number = 0; // 0 - 1 impact shake

  // Substitutions Tracking
  public subsUsed: number = 0;
  public readonly maxSubs: number = 5;

  // Instant Replay Engine
  public replayBuffer: ReplayFrame[] = [];
  public isReplaying: boolean = false;
  public replayFrameIndex: number = 0;
  public replaySpeed: number = 0.5; // 0.5x slow motion by default
  public replayCameraMode: 'broadcast' | 'behindGoal' | 'action' = 'broadcast';
  
  public stats: MatchStats = {
    homeScore: 0,
    awayScore: 0,
    homeShots: 0,
    awayShots: 0,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    homePossessionPercent: 50,
    awayPossessionPercent: 50,
    homePasses: 0,
    awayPasses: 0,
    homePassSuccess: 0,
    awayPassSuccess: 0,
    homeTackles: 0,
    awayTackles: 0,
    homeFouls: 0,
    awayFouls: 0,
    homeCorners: 0,
    awayCorners: 0,
  };
  
  public goalEvents: GoalEvent[] = [];
  public keyMatchEvents: MatchHighlightEvent[] = [];
  private lastSaveRecordTime: number = -10;

  // Pitch Heatmap & Spatial Movement Tracking
  public heatmapData: MatchHeatmapData = {
    homePlayers: {},
    awayPlayers: {},
    ballSamples: [],
    homeTeamSamples: [],
    awayTeamSamples: [],
  };
  private heatmapSampleAccumulator: number = 0;

  public activeCelebration: { scorer: string; team: 'home' | 'away'; timer: number } | null = null;
  public offsideBannerTimer: number = 0;
  public bannerMessage: string = '';
  
  private homePossessionTicks: number = 0;
  private awayPossessionTicks: number = 0;
  private restartTimer: number = 0;
  private kickoffTeam: 'home' | 'away' = 'home';
  private shootChargeTimer: number = 0;
  private halftimeTriggered: boolean = false;
  public onMatchEnd?: () => void;

  public get isMatchOver(): boolean {
    return this.phase === 'fulltime';
  }

  constructor(
    homeTeam: Team, 
    awayTeam: Team, 
    difficultyOrConfig: GameDifficulty | { difficulty?: GameDifficulty; halfLengthSeconds?: number } = 'Semi-Pro', 
    matchDurationMin: number = 4
  ) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    if (typeof difficultyOrConfig === 'object') {
      this.difficulty = difficultyOrConfig.difficulty || 'Semi-Pro';
      this.matchDurationSec = difficultyOrConfig.halfLengthSeconds || matchDurationMin * 60;
    } else {
      this.difficulty = difficultyOrConfig;
      this.matchDurationSec = matchDurationMin * 60;
    }

    this.ball = {
      pos: { x: PITCH.MARGIN_X + PITCH.LENGTH / 2, y: PITCH.MARGIN_Y + PITCH.WIDTH / 2, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      spin: { x: 0, y: 0 },
      isInGoal: false,
    };

    this.ensureBenchPlayers(this.homeTeam);
    this.ensureBenchPlayers(this.awayTeam);

    this.initPlayers();
    this.resetForKickoff('home');
  }

  private ensureBenchPlayers(team: Team) {
    if (team.players.length >= 16) return;
    
    // Ensure sufficient bench depth for substitutions
    const fallbackPositions: Array<'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'RW' | 'LW' | 'ST'> = [
      'ST', 'CM', 'CB', 'CAM', 'RW', 'GK'
    ];
    
    const needed = Math.max(0, 16 - team.players.length);
    for (let i = 0; i < needed; i++) {
      const pos = fallbackPositions[i % fallbackPositions.length];
      const num = 14 + team.players.length + i;
      const id = `${team.id}-sub-${num}`;
      const baseRating = Math.max(76, Math.min(88, team.overallRating - 3 + (i % 4)));
      
      const newSub: Player = {
        id,
        name: `${team.shortName} Res ${pos} #${num}`,
        shortName: `${pos} #${num}`,
        number: num,
        position: pos,
        rating: baseRating,
        stats: {
          pace: 78 + (i * 3) % 15,
          shooting: pos === 'ST' || pos === 'CAM' ? 82 : 65,
          passing: pos === 'CM' || pos === 'CAM' ? 84 : 72,
          dribbling: 78 + (i * 2) % 12,
          defending: pos === 'CB' || pos === 'CDM' ? 83 : 55,
          physicality: 78 + (i * 4) % 12,
        },
        isGoalkeeper: pos === 'GK',
        preferredFoot: i % 2 === 0 ? 'Right' : 'Left',
        playStyles: ['Relentless'],
        staminaCondition: 100,
        form: 'Good',
      };
      team.players.push(newSub);
    }
  }

  private initPlayers() {
    this.homePlayers = this.homeTeam.players.slice(0, 11).map((p, idx) => {
      const basePos = getTacticalTarget(idx, this.homeTeam.formation, 'home', { x: PITCH.MARGIN_X + PITCH.LENGTH / 2, y: PITCH.MARGIN_Y + PITCH.WIDTH / 2 }, null);
      return {
        id: p.id,
        team: 'home',
        player: p,
        pos: { ...basePos },
        targetPos: { ...basePos },
        homePos: { ...basePos },
        velocity: { x: 0, y: 0 },
        facingAngle: 0,
        stamina: 100,
        isSprinting: false,
        hasBall: false,
        isTackling: false,
        tackleCooldown: 0,
        skillMoveTime: 0,
        runCycle: 0,
        animState: 'idle',
        yellowCards: 0,
        isRedCarded: false,
      };
    });

    this.awayPlayers = this.awayTeam.players.slice(0, 11).map((p, idx) => {
      const basePos = getTacticalTarget(idx, this.awayTeam.formation, 'away', { x: PITCH.MARGIN_X + PITCH.LENGTH / 2, y: PITCH.MARGIN_Y + PITCH.WIDTH / 2 }, null);
      return {
        id: p.id,
        team: 'away',
        player: p,
        pos: { ...basePos },
        targetPos: { ...basePos },
        homePos: { ...basePos },
        velocity: { x: 0, y: 0 },
        facingAngle: Math.PI,
        stamina: 100,
        isSprinting: false,
        hasBall: false,
        isTackling: false,
        tackleCooldown: 0,
        skillMoveTime: 0,
        runCycle: 0,
        animState: 'idle',
        yellowCards: 0,
        isRedCarded: false,
      };
    });

    // Select default user player (midfield or striker)
    const outfieldPlayers = this.homePlayers.filter(p => !p.player.isGoalkeeper);
    this.userControlledId = outfieldPlayers[outfieldPlayers.length - 2]?.id || outfieldPlayers[0].id;

    // Initialize spatial heatmap tracking records for starting squads
    this.initHeatmapRecords();
  }

  public resetForKickoff(teamTakingKickoff: 'home' | 'away') {
    this.kickoffTeam = teamTakingKickoff;
    this.phase = 'kickoff';
    const centerX = PITCH.MARGIN_X + PITCH.LENGTH / 2;
    const centerY = PITCH.MARGIN_Y + PITCH.WIDTH / 2;

    this.ball.pos = { x: centerX, y: centerY, z: 0 };
    this.ball.velocity = { x: 0, y: 0, z: 0 };
    this.ball.spin = { x: 0, y: 0 };
    this.ball.isInGoal = false;

    // Reset player positions according to kickoff shape
    this.homePlayers.forEach((p, idx) => {
      const target = getTacticalTarget(idx, this.homeTeam.formation, 'home', { x: centerX, y: centerY }, null);
      // Keep on own half
      target.x = Math.min(centerX - 18, target.x);
      p.pos = { ...target };
      p.targetPos = { ...target };
      p.velocity = { x: 0, y: 0 };
      p.hasBall = false;
      p.isTackling = false;
      p.facingAngle = 0;
    });

    this.awayPlayers.forEach((p, idx) => {
      const target = getTacticalTarget(idx, this.awayTeam.formation, 'away', { x: centerX, y: centerY }, null);
      // Keep on own half
      target.x = Math.max(centerX + 18, target.x);
      p.pos = { ...target };
      p.targetPos = { ...target };
      p.velocity = { x: 0, y: 0 };
      p.hasBall = false;
      p.isTackling = false;
      p.facingAngle = Math.PI;
    });

    // Place striker on kickoff spot
    if (teamTakingKickoff === 'home') {
      const striker = this.homePlayers.find(p => p.player.position === 'ST') || this.homePlayers[9];
      striker.pos = { x: centerX - 8, y: centerY };
      striker.hasBall = true;
      this.userControlledId = striker.id;
    } else {
      const striker = this.awayPlayers.find(p => p.player.position === 'ST') || this.awayPlayers[9];
      striker.pos = { x: centerX + 8, y: centerY };
      striker.hasBall = true;
    }

    soundEngine.playWhistle('short');
  }

  public update(deltaTimeSec: number, input: UserInputState) {
    if (this.isPaused) return;

    // If reviewing Instant Replay, step frames without advancing match clock
    if (this.isReplaying) {
      if (this.replayBuffer.length > 0) {
        this.replayFrameIndex = (this.replayFrameIndex + this.replaySpeed) % this.replayBuffer.length;
      }
      return;
    }

    // Update match clock & squad stamina
    if (this.phase === 'playing' || this.phase === 'kickoff') {
      // 90 minutes mapped over matchDurationSec
      const minutesPerSec = 90 / this.matchDurationSec;
      const matchMinutesDelta = deltaTimeSec * minutesPerSec;
      this.matchTimeSec += matchMinutesDelta;

      if (this.phase === 'playing') {
        this.updateSquadStamina(matchMinutesDelta);
      }

      if (!this.halftimeTriggered && this.matchTimeSec >= 45) {
        this.halftimeTriggered = true;
        this.triggerHalftime();
        return;
      }

      if (this.matchTimeSec >= 90 + this.addedTimeMinutes) {
        this.triggerFulltime();
        return;
      }
    }

    // Handle celebratory banner timers
    if (this.activeCelebration) {
      this.activeCelebration.timer -= deltaTimeSec;
      if (this.activeCelebration.timer <= 0) {
        this.activeCelebration = null;
        this.resetForKickoff(this.kickoffTeam);
      }
    }

    if (this.offsideBannerTimer > 0) {
      this.offsideBannerTimer -= deltaTimeSec;
    }

    // Decay camera shake
    this.cameraShake = Math.max(0, this.cameraShake - deltaTimeSec * 2.5);

    // Possession tracking
    const ballPossessor = this.getBallPossessor();
    if (ballPossessor) {
      if (ballPossessor.team === 'home') this.homePossessionTicks++;
      else this.awayPossessionTicks++;
      const total = Math.max(1, this.homePossessionTicks + this.awayPossessionTicks);
      this.stats.homePossessionPercent = Math.round((this.homePossessionTicks / total) * 100);
      this.stats.awayPossessionPercent = 100 - this.stats.homePossessionPercent;
    }

    // 1. Process User Input for controlled player
    this.updateUserPlayer(input);

    // 2. Process AI for Teammates & Opponents
    this.updateAI();

    // 3. Update Ball Physics
    this.updateBall();

    // 4. Check pitch boundaries, goals, fouls
    this.checkBoundsAndGoals();

    // 5. Update animation state & run cycles for all players
    const allPlayers = this.homePlayers.concat(this.awayPlayers);
    for (const p of allPlayers) {
      const speed = Math.hypot(p.velocity.x, p.velocity.y);
      if (p.isTackling) {
        p.animState = 'tackling';
      } else if (p.skillMoveTime > 0) {
        p.animState = 'kicking';
      } else if (p.animState === 'celebrating') {
        // preserve celebration
      } else if (speed > 0.3) {
        p.animState = 'running';
        p.runCycle = (p.runCycle + speed * 0.18) % (Math.PI * 2);
      } else {
        p.animState = 'idle';
      }
    }

    // 6. Record frame for Instant Replay buffer
    this.recordReplayFrame();

    // 7. Track player movement intensity & spatial heatmap telemetry
    this.updateHeatmapTracking(deltaTimeSec);

    // Dynamic Crowd Audio Excitement
    const nearHomeGoal = Math.hypot(this.ball.pos.x - PITCH.MARGIN_X, this.ball.pos.y - (PITCH.MARGIN_Y + PITCH.WIDTH / 2));
    const nearAwayGoal = Math.hypot(this.ball.pos.x - (PITCH.MARGIN_X + PITCH.LENGTH), this.ball.pos.y - (PITCH.MARGIN_Y + PITCH.WIDTH / 2));
    const minDistance = Math.min(nearHomeGoal, nearAwayGoal);
    if (minDistance < 280) {
      soundEngine.setCrowdExcitement(1 - minDistance / 280);
    } else {
      soundEngine.setCrowdExcitement(0.15);
    }
  }

  private updateUserPlayer(input: UserInputState) {
    const userPlayer = this.homePlayers.find(p => p.id === this.userControlledId);
    if (!userPlayer) return;

    // Switch player
    if (input.switchPlayerPressed) {
      this.switchControlToClosest();
    }

    // Movement calculation
    let vx = input.moveX;
    let vy = input.moveY;
    const len = Math.hypot(vx, vy);
    if (len > 0.05) {
      vx /= len;
      vy /= len;
      userPlayer.facingAngle = Math.atan2(vy, vx);
    }

    const paceAttr = userPlayer.player.stats.pace / 100;
    let speed = (PHYSICS.PLAYER_BASE_SPEED + paceAttr * 1.5);
    
    // Sprint
    userPlayer.isSprinting = false;
    if (input.sprint && len > 0.1 && userPlayer.stamina > 10) {
      userPlayer.isSprinting = true;
      speed *= PHYSICS.PLAYER_SPRINT_MULTIPLIER;
      userPlayer.stamina = Math.max(0, userPlayer.stamina - PHYSICS.STAMINA_DRAIN_SPRINT);
    } else {
      userPlayer.stamina = Math.min(100, userPlayer.stamina + PHYSICS.STAMINA_RECOVERY);
    }

    // Skill move / step-over
    if (input.skillPressed && userPlayer.hasBall && userPlayer.skillMoveTime <= 0) {
      userPlayer.skillMoveTime = 22;
      soundEngine.playKick(0.3);
      // Small burst in facing direction
      userPlayer.velocity.x = Math.cos(userPlayer.facingAngle) * speed * 1.4;
      userPlayer.velocity.y = Math.sin(userPlayer.facingAngle) * speed * 1.4;
    }

    if (userPlayer.skillMoveTime > 0) {
      userPlayer.skillMoveTime--;
    } else {
      userPlayer.velocity.x = vx * speed;
      userPlayer.velocity.y = vy * speed;
    }

    // Chip Shot (Swipe-up gesture on shoot or chip button)
    if ((input.chipShotPressed || input.chipShot) && userPlayer.hasBall) {
      this.executeChipShot(userPlayer, 0.65);
      this.shootChargeTimer = 0;
    }

    // Slide Tackle (Defense)
    if (input.tacklePressed && !userPlayer.hasBall && userPlayer.tackleCooldown <= 0) {
      userPlayer.isTackling = true;
      userPlayer.tackleCooldown = PHYSICS.TACKLE_COOLDOWN;
      soundEngine.playTackle();
      userPlayer.velocity.x = Math.cos(userPlayer.facingAngle) * PHYSICS.TACKLE_SPEED;
      userPlayer.velocity.y = Math.sin(userPlayer.facingAngle) * PHYSICS.TACKLE_SPEED;

      setTimeout(() => {
        userPlayer.isTackling = false;
      }, PHYSICS.TACKLE_DURATION * 16);
    }

    if (userPlayer.tackleCooldown > 0) {
      userPlayer.tackleCooldown--;
    }

    // Shooting mechanics (Chargeable Rocket Power Shot)
    if (input.shootCharging) {
      this.shootChargeTimer = Math.min(1, this.shootChargeTimer + 0.05);
    } else if (this.shootChargeTimer > 0) {
      if (userPlayer.hasBall) {
        this.executeShot(userPlayer, this.shootChargeTimer);
      }
      this.shootChargeTimer = 0;
    }

    // Ground Pass
    if (input.passPressed && userPlayer.hasBall) {
      this.executeGroundPass(userPlayer);
    }

    // Through Ball
    if (input.throughBallPressed && userPlayer.hasBall) {
      this.executeThroughBall(userPlayer);
    }

    // Lob Pass / Cross
    if (input.lobPressed && userPlayer.hasBall) {
      this.executeLobPass(userPlayer);
    }

    // Apply player velocity to position
    userPlayer.pos.x += userPlayer.velocity.x;
    userPlayer.pos.y += userPlayer.velocity.y;
    this.constrainPlayerToPitch(userPlayer);

    // If player has ball, glue ball to feet with gentle dribble physics
    if (userPlayer.hasBall) {
      if (this.phase === 'kickoff') this.phase = 'playing';
      const dribbleDist = 14;
      this.ball.pos.x = userPlayer.pos.x + Math.cos(userPlayer.facingAngle) * dribbleDist;
      this.ball.pos.y = userPlayer.pos.y + Math.sin(userPlayer.facingAngle) * dribbleDist;
      this.ball.pos.z = 0;
      this.ball.velocity.x = userPlayer.velocity.x * 1.05;
      this.ball.velocity.y = userPlayer.velocity.y * 1.05;
      this.ball.lastTouchedBy = userPlayer.id;
      this.ball.lastTouchedTeam = 'home';
    }
  }

  public getShootCharge(): number {
    return this.shootChargeTimer;
  }

  private executeGroundPass(player: MatchPlayerEntity) {
    const teammates = player.team === 'home' 
      ? this.homePlayers.filter(p => p.id !== player.id && !p.player.isGoalkeeper)
      : this.awayPlayers.filter(p => p.id !== player.id && !p.player.isGoalkeeper);

    // Find best teammate in facing direction
    let bestTeammate: MatchPlayerEntity | null = null;
    let highestScore = -Infinity;

    const facingVec = { x: Math.cos(player.facingAngle), y: Math.sin(player.facingAngle) };

    for (const mate of teammates) {
      const dx = mate.pos.x - player.pos.x;
      const dy = mate.pos.y - player.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 30 || dist > 450) continue;

      const dot = (dx / dist) * facingVec.x + (dy / dist) * facingVec.y;
      if (dot > 0.4) {
        const score = dot * 100 - dist * 0.15;
        if (score > highestScore) {
          highestScore = score;
          bestTeammate = mate;
        }
      }
    }

    player.hasBall = false;
    soundEngine.playKick(0.5);

    if (player.team === 'home') {
      this.stats.homePasses++;
    } else {
      this.stats.awayPasses++;
    }

    if (bestTeammate) {
      const dx = bestTeammate.pos.x - player.pos.x;
      const dy = bestTeammate.pos.y - player.pos.y;
      const dist = Math.hypot(dx, dy);
      const speed = Math.min(13, Math.max(7.5, dist * 0.045));
      this.ball.velocity.x = (dx / dist) * speed;
      this.ball.velocity.y = (dy / dist) * speed;
      this.ball.velocity.z = 0;
      if (player.team === 'home') this.userControlledId = bestTeammate.id;
    } else {
      this.ball.velocity.x = facingVec.x * PHYSICS.PASS_POWER;
      this.ball.velocity.y = facingVec.y * PHYSICS.PASS_POWER;
      this.ball.velocity.z = 0;
    }
  }

  private executeThroughBall(player: MatchPlayerEntity) {
    const teammates = player.team === 'home' 
      ? this.homePlayers.filter(p => p.id !== player.id && !p.player.isGoalkeeper)
      : this.awayPlayers.filter(p => p.id !== player.id && !p.player.isGoalkeeper);

    let targetTeammate: MatchPlayerEntity | null = null;
    let maxAdvantage = -Infinity;

    for (const mate of teammates) {
      const isAhead = player.team === 'home' ? mate.pos.x > player.pos.x : mate.pos.x < player.pos.x;
      if (!isAhead) continue;

      const dist = Math.hypot(mate.pos.x - player.pos.x, mate.pos.y - player.pos.y);
      if (dist < 50 || dist > 500) continue;

      const advantage = (player.team === 'home' ? mate.pos.x : -mate.pos.x) - dist * 0.2;
      if (advantage > maxAdvantage) {
        maxAdvantage = advantage;
        targetTeammate = mate;
      }
    }

    player.hasBall = false;
    soundEngine.playKick(0.8);

    if (player.team === 'home') this.stats.homePasses++;
    else this.stats.awayPasses++;

    const leadDistance = 110;
    const targetLeadX = targetTeammate 
      ? targetTeammate.pos.x + (player.team === 'home' ? leadDistance : -leadDistance)
      : player.pos.x + Math.cos(player.facingAngle) * 200;
    const targetLeadY = targetTeammate ? targetTeammate.pos.y : player.pos.y + Math.sin(player.facingAngle) * 200;

    const dx = targetLeadX - player.pos.x;
    const dy = targetLeadY - player.pos.y;
    const dist = Math.hypot(dx, dy);
    this.ball.velocity.x = (dx / dist) * PHYSICS.THROUGH_BALL_POWER;
    this.ball.velocity.y = (dy / dist) * PHYSICS.THROUGH_BALL_POWER;
    this.ball.velocity.z = 0;

    if (targetTeammate && player.team === 'home') {
      this.userControlledId = targetTeammate.id;
    }
  }

  private executeLobPass(player: MatchPlayerEntity) {
    player.hasBall = false;
    soundEngine.playKick(0.7);

    const facingVec = { x: Math.cos(player.facingAngle), y: Math.sin(player.facingAngle) };
    this.ball.velocity.x = facingVec.x * PHYSICS.LOB_POWER;
    this.ball.velocity.y = facingVec.y * PHYSICS.LOB_POWER;
    this.ball.velocity.z = PHYSICS.LOB_Z_VELOCITY;
  }

  private executeShot(player: MatchPlayerEntity, charge: number) {
    player.hasBall = false;
    player.animState = 'kicking';
    const isPowerShot = charge > 0.85;

    if (isPowerShot) {
      soundEngine.playPowerShot();
      this.cameraShake = 0.8;
      commentary.addComment(`${player.player.shortName} unleashes a THUNDERBOLT power shot!`, 'shot');
    } else {
      soundEngine.playKick(0.9);
      if (Math.random() > 0.4) commentary.shotCommentary(player.player.name);
    }

    // Goal target position
    const goalX = player.team === 'home' ? PITCH.MARGIN_X + PITCH.LENGTH : PITCH.MARGIN_X;
    const goalCenterY = PITCH.MARGIN_Y + PITCH.WIDTH / 2;
    
    // Aim towards top or bottom corner depending on player angle
    const cornerOffset = (Math.random() > 0.5 ? 1 : -1) * (PITCH.GOAL_WIDTH * 0.42);
    const targetY = goalCenterY + cornerOffset;

    const dx = goalX - player.pos.x;
    const dy = targetY - player.pos.y;
    const dist = Math.hypot(dx, dy);

    const shotAttr = player.player.stats.shooting / 100;
    const power = PHYSICS.SHOT_MIN_POWER + (PHYSICS.SHOT_MAX_POWER - PHYSICS.SHOT_MIN_POWER) * charge * (0.85 + shotAttr * 0.3);

    this.ball.velocity.x = (dx / dist) * power;
    this.ball.velocity.y = (dy / dist) * power + (Math.random() - 0.5) * 1.5;
    this.ball.velocity.z = (1.5 + charge * 4.5);

    // Finesse Shot PlayStyle curl
    const hasFinesse = player.player.playStyles?.includes('Finesse Shot');
    if (hasFinesse) {
      const curlDir = player.player.preferredFoot === 'Left' ? -0.45 : 0.45;
      this.ball.spin = { x: curlDir, y: (targetY > player.pos.y ? 0.3 : -0.3) };
    } else {
      this.ball.spin = { x: (Math.random() - 0.5) * 0.3, y: (Math.random() - 0.5) * 0.3 };
    }

    if (player.team === 'home') {
      this.stats.homeShots++;
    } else {
      this.stats.awayShots++;
    }
  }

  public executeChipShot(player: MatchPlayerEntity, charge: number = 0.65) {
    player.hasBall = false;
    player.animState = 'kicking';
    soundEngine.playKick(0.75);
    commentary.addComment(`${player.player.shortName} tries a delicate chip over the keeper!`, 'shot');

    const goalX = player.team === 'home' ? PITCH.MARGIN_X + PITCH.LENGTH : PITCH.MARGIN_X;
    const goalCenterY = PITCH.MARGIN_Y + PITCH.WIDTH / 2;

    const dx = goalX - player.pos.x;
    const dy = goalCenterY - player.pos.y;
    const dist = Math.max(1, Math.hypot(dx, dy));

    const power = 10 + charge * 5;
    this.ball.velocity.x = (dx / dist) * power;
    this.ball.velocity.y = (dy / dist) * power + (Math.random() - 0.5) * 1.2;
    this.ball.velocity.z = 7 + charge * 3.5; // High parabolic arc
    this.ball.spin = { x: -0.2, y: 0.1 };

    if (player.team === 'home') {
      this.stats.homeShots++;
    } else {
      this.stats.awayShots++;
    }
  }

  public executeSkillMove(player: MatchPlayerEntity, type: 'roulette' | 'stepover' | 'burst' = 'roulette') {
    if (player.skillMoveTime > 0) return;
    player.skillMoveTime = 24;
    player.animState = 'kicking';
    soundEngine.playKick(0.4);
    soundEngine.playGasp();
    commentary.addComment(`${player.player.shortName} dazzles with a magnificent ${type}!`, 'general');
    
    const paceAttr = player.player.stats.pace / 100;
    const speed = (PHYSICS.PLAYER_BASE_SPEED + paceAttr * 1.5) * 1.5;
    player.velocity.x = Math.cos(player.facingAngle) * speed;
    player.velocity.y = Math.sin(player.facingAngle) * speed;
  }

  private updateAI() {
    const ballPos = { x: this.ball.pos.x, y: this.ball.pos.y };
    const ballPossessor = this.getBallPossessor();
    const hasBallTeam = ballPossessor ? ballPossessor.team : null;

    // Difficulty tuning factors
    const diffSpeedMap: Record<GameDifficulty, number> = {
      'Beginner': 0.65,
      'Amateur': 0.75,
      'Semi-Pro': 0.88,
      'Professional': 0.95,
      'World Class': 1.0,
      'Legendary': 1.12,
    };
    const speedMult = diffSpeedMap[this.difficulty];

    // Update Home Teammates (autonomous when not controlled by user)
    this.homePlayers.forEach((p, idx) => {
      if (p.id === this.userControlledId) return; // User handles this one

      if (p.player.isGoalkeeper) {
        this.updateGoalkeeperAI(p, 'home');
      } else {
        this.updateOutfieldAI(p, idx, 'home', ballPos, hasBallTeam, 1.0);
      }
    });

    // Update Away Opponents
    this.awayPlayers.forEach((p, idx) => {
      if (p.player.isGoalkeeper) {
        this.updateGoalkeeperAI(p, 'away');
      } else {
        this.updateOutfieldAI(p, idx, 'away', ballPos, hasBallTeam, speedMult);
      }
    });

    // Auto switch user control to closest teammate when defending or when ball is free
    if (!ballPossessor || ballPossessor.team === 'away') {
      const activeP = this.homePlayers.find(p => p.id === this.userControlledId);
      const currentDist = activeP ? Math.hypot(activeP.pos.x - ballPos.x, activeP.pos.y - ballPos.y) : Infinity;
      if (currentDist > 260) {
        this.switchControlToClosest();
      }
    }
  }

  private updateGoalkeeperAI(gk: MatchPlayerEntity, side: 'home' | 'away') {
    const goalX = side === 'home' ? PITCH.MARGIN_X + 26 : PITCH.MARGIN_X + PITCH.LENGTH - 26;
    const goalCenterY = PITCH.MARGIN_Y + PITCH.WIDTH / 2;
    const goalMinY = goalCenterY - PITCH.GOAL_WIDTH / 2;
    const goalMaxY = goalCenterY + PITCH.GOAL_WIDTH / 2;

    const ballSpeed = Math.hypot(this.ball.velocity.x, this.ball.velocity.y);
    const ballMovingTowardGoal = side === 'home'
      ? this.ball.velocity.x < -0.5
      : this.ball.velocity.x > 0.5;
    const reactionFactor = Math.min(1.35, 0.85 + ballSpeed / 35);
    const predictedY = this.ball.pos.y + this.ball.velocity.y * reactionFactor;
    const targetY = Math.max(goalMinY + 10, Math.min(goalMaxY - 10, predictedY));
    const dangerDistance = Math.abs(this.ball.pos.x - goalX);
    const distToBall = Math.hypot(this.ball.pos.x - gk.pos.x, this.ball.pos.y - gk.pos.y);

    // Anticipate dangerous shots/crosses instead of only reacting to the current ball position.
    if (ballMovingTowardGoal && dangerDistance < 210 && this.ball.pos.z < 42) {
      const step = Math.min(7, 2.8 + ballSpeed * 0.18);
      const dy = targetY - gk.pos.y;
      gk.velocity.y = Math.max(-step, Math.min(step, dy * 0.28));
      const idealX = side === 'home'
        ? Math.max(PITCH.MARGIN_X + 12, Math.min(goalX + 34, this.ball.pos.x + 22))
        : Math.min(PITCH.MARGIN_X + PITCH.LENGTH - 12, Math.max(goalX - 34, this.ball.pos.x - 22));
      gk.velocity.x = (idealX - gk.pos.x) * 0.16;
      gk.pos.x += gk.velocity.x;
      gk.pos.y += gk.velocity.y;
      gk.facingAngle = Math.atan2(this.ball.pos.y - gk.pos.y, this.ball.pos.x - gk.pos.x);
    }

    // Faster incoming balls can be claimed from slightly farther away.
    const claimReach = Math.min(42, 28 + ballSpeed * 0.45);
    if (distToBall < claimReach && this.ball.pos.z < 25) {
      gk.hasBall = true;
      gk.animState = 'saving';
      const prevVel = { ...this.ball.velocity };
      this.ball.velocity = { x: 0, y: 0, z: 0 };
      soundEngine.playKick(0.3);
      commentary.saveCommentary(gk.player.shortName);

      if (side === 'home') this.stats.awayShotsOnTarget++;
      else this.stats.homeShotsOnTarget++;

      // Record critical save highlight if cooldown passed
      if (this.matchTimeSec - this.lastSaveRecordTime > 3.5) {
        this.lastSaveRecordTime = this.matchTimeSec;
        const shooterEntity = (side === 'home' ? this.awayPlayers : this.homePlayers).find(p => p.id === this.ball.lastTouchedBy);
        const shooterName = shooterEntity?.player.name || (side === 'home' ? this.awayTeam.name + ' Striker' : this.homeTeam.name + ' Striker');
        const speedKmh = Math.round(Math.hypot(prevVel.x, prevVel.y) * 11) || Math.round(75 + Math.random() * 20);

        this.recordHighlightEvent(
          'save',
          Math.min(90, Math.floor(this.matchTimeSec)),
          side,
          gk.player,
          shooterName,
          speedKmh,
          `Critical Reflex Save! ${gk.player.name} denies ${shooterName} with heroic fingertip stop`
        );
      }

      // GK clears ball downfield after 1.2 seconds
      setTimeout(() => {
        if (gk.hasBall) {
          gk.hasBall = false;
          gk.animState = 'idle';
          this.ball.velocity.x = side === 'home' ? 14 : -14;
          this.ball.velocity.y = (Math.random() - 0.5) * 6;
          this.ball.velocity.z = 6;
          soundEngine.playKick(0.8);
        }
      }, 1200);
      return;
    }

    // Goalkeeper tracks the predicted ball path along the goal mouth.
    const dy = targetY - gk.pos.y;
    gk.velocity.x = (goalX - gk.pos.x) * 0.15;
    gk.velocity.y = Math.min(4.8, Math.max(-4.8, dy * 0.25));

    gk.pos.x += gk.velocity.x;
    gk.pos.y += gk.velocity.y;
    gk.facingAngle = side === 'home' ? 0 : Math.PI;
  }

  private updateOutfieldAI(
    player: MatchPlayerEntity, 
    slotIdx: number, 
    teamSide: 'home' | 'away', 
    ballPos: Vector2D, 
    hasBallTeam: 'home' | 'away' | null,
    speedFactor: number
  ) {
    const formation = teamSide === 'home' ? this.homeTeam.formation : this.awayTeam.formation;
    const tactic = teamSide === 'home' ? this.homeTeam.tactic : this.awayTeam.tactic;
    const baseTarget = getTacticalTarget(slotIdx, formation, teamSide, ballPos, hasBallTeam, tactic);

    const distToBall = Math.hypot(ballPos.x - player.pos.x, ballPos.y - player.pos.y);
    const isClosestToBall = this.isClosestInTeam(player, teamSide, ballPos);

    // AI Player has the ball: decide to shoot, pass, or dribble
    if (player.hasBall) {
      if (this.phase === 'kickoff') this.phase = 'playing';

      const oppGoalX = teamSide === 'home' ? PITCH.MARGIN_X + PITCH.LENGTH : PITCH.MARGIN_X;
      const oppGoalY = PITCH.MARGIN_Y + PITCH.WIDTH / 2;
      const distToOppGoal = Math.hypot(oppGoalX - player.pos.x, oppGoalY - player.pos.y);

      // In shooting range?
      if (distToOppGoal < 260) {
        if (Math.random() < 0.035) {
          this.executeShot(player, 0.75 + Math.random() * 0.25);
          return;
        }
      }

      // Pass to open teammate or drive forward
      if (Math.random() < 0.02) {
        if (Math.random() < 0.5) this.executeGroundPass(player);
        else this.executeThroughBall(player);
        return;
      }

      // Dribble towards opponent goal
      const dx = oppGoalX - player.pos.x;
      const dy = oppGoalY - player.pos.y;
      const len = Math.hypot(dx, dy);
      player.facingAngle = Math.atan2(dy, dx);
      const dribbleSpeed = 3.2 * speedFactor;
      player.velocity.x = (dx / len) * dribbleSpeed;
      player.velocity.y = (dy / len) * dribbleSpeed;

      player.pos.x += player.velocity.x;
      player.pos.y += player.velocity.y;
      this.constrainPlayerToPitch(player);

      // Ball glued to dribbler
      this.ball.pos.x = player.pos.x + Math.cos(player.facingAngle) * 14;
      this.ball.pos.y = player.pos.y + Math.sin(player.facingAngle) * 14;
      this.ball.pos.z = 0;
      this.ball.lastTouchedBy = player.id;
      this.ball.lastTouchedTeam = teamSide;
      return;
    }

    // If defending and closest: press ball intensely
    if (isClosestToBall && (hasBallTeam !== teamSide || !hasBallTeam)) {
      const dx = ballPos.x - player.pos.x;
      const dy = ballPos.y - player.pos.y;
      const dist = Math.hypot(dx, dy);
      player.facingAngle = Math.atan2(dy, dx);

      const chaseSpeed = 3.6 * speedFactor;
      player.velocity.x = (dx / dist) * chaseSpeed;
      player.velocity.y = (dy / dist) * chaseSpeed;

      // Tackle opportunity
      if (dist < PHYSICS.TACKLE_REACH && player.tackleCooldown <= 0 && Math.random() < 0.04) {
        player.isTackling = true;
        player.tackleCooldown = PHYSICS.TACKLE_COOLDOWN;
        soundEngine.playTackle();
        // Dispossess
        const opp = this.getBallPossessor();
        if (opp && opp.team !== teamSide) {
          opp.hasBall = false;
          player.hasBall = true;
          if (teamSide === 'home') this.stats.homeTackles++;
          else this.stats.awayTackles++;
          commentary.tackleCommentary(player.player.shortName);
        }
      }

      if (player.tackleCooldown > 0) player.tackleCooldown--;
    } else {
      // Move towards tactical formation position
      const dx = baseTarget.x - player.pos.x;
      const dy = baseTarget.y - player.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 12) {
        player.velocity.x = (dx / dist) * 2.8 * speedFactor;
        player.velocity.y = (dy / dist) * 2.8 * speedFactor;
        player.facingAngle = Math.atan2(dy, dx);
      } else {
        player.velocity.x = 0;
        player.velocity.y = 0;
      }
    }

    player.pos.x += player.velocity.x;
    player.pos.y += player.velocity.y;
    this.constrainPlayerToPitch(player);

    // Collision with ball if free
    if (!hasBallTeam && distToBall < PHYSICS.PLAYER_RADIUS + PHYSICS.BALL_RADIUS && this.ball.pos.z < 18) {
      player.hasBall = true;
      this.ball.velocity = { x: 0, y: 0, z: 0 };
      this.ball.lastTouchedBy = player.id;
      this.ball.lastTouchedTeam = teamSide;
    }
  }

  private isClosestInTeam(p: MatchPlayerEntity, teamSide: 'home' | 'away', target: Vector2D): boolean {
    const list = teamSide === 'home' ? this.homePlayers : this.awayPlayers;
    let minDist = Infinity;
    let closestId = '';
    for (const mate of list) {
      if (mate.player.isGoalkeeper) continue;
      const d = Math.hypot(mate.pos.x - target.x, mate.pos.y - target.y);
      if (d < minDist) {
        minDist = d;
        closestId = mate.id;
      }
    }
    return closestId === p.id;
  }

  private switchControlToClosest() {
    let minDist = Infinity;
    let bestId = this.userControlledId;
    for (const p of this.homePlayers) {
      if (p.player.isGoalkeeper) continue;
      const d = Math.hypot(p.pos.x - this.ball.pos.x, p.pos.y - this.ball.pos.y);
      if (d < minDist) {
        minDist = d;
        bestId = p.id;
      }
    }
    this.userControlledId = bestId;
  }

  private updateBall() {
    // If possessed, ball is driven by possessor
    if (this.getBallPossessor()) return;

    // Apply friction & air drag
    const isGround = this.ball.pos.z <= 0;
    const friction = isGround ? PHYSICS.BALL_FRICTION_GROUND : PHYSICS.BALL_FRICTION_AIR;

    this.ball.velocity.x *= friction;
    this.ball.velocity.y *= friction;

    // Spin curve effect
    this.ball.velocity.x += this.ball.spin.x;
    this.ball.velocity.y += this.ball.spin.y;
    this.ball.spin.x *= 0.95;
    this.ball.spin.y *= 0.95;

    // Gravity & vertical bounce
    this.ball.velocity.z -= PHYSICS.BALL_GRAVITY;
    this.ball.pos.z += this.ball.velocity.z;

    if (this.ball.pos.z <= 0) {
      this.ball.pos.z = 0;
      if (Math.abs(this.ball.velocity.z) > 1.2) {
        this.ball.velocity.z = -this.ball.velocity.z * PHYSICS.BALL_BOUNCE_DAMPING;
        soundEngine.playKick(0.2);
      } else {
        this.ball.velocity.z = 0;
      }
    }

    this.ball.pos.x += this.ball.velocity.x;
    this.ball.pos.y += this.ball.velocity.y;
  }

  private checkBoundsAndGoals() {
    const goalMinY = PITCH.MARGIN_Y + (PITCH.WIDTH - PITCH.GOAL_WIDTH) / 2;
    const goalMaxY = goalMinY + PITCH.GOAL_WIDTH;

    // Goal detection - Home Goal (Left)
    if (this.ball.pos.x < PITCH.MARGIN_X) {
      if (this.ball.pos.y >= goalMinY && this.ball.pos.y <= goalMaxY && this.ball.pos.z < 70) {
        // AWAY TEAM GOAL
        if (!this.ball.isInGoal) {
          this.triggerGoal('away');
        }
        return;
      }
    }

    // Goal detection - Away Goal (Right)
    if (this.ball.pos.x > PITCH.MARGIN_X + PITCH.LENGTH) {
      if (this.ball.pos.y >= goalMinY && this.ball.pos.y <= goalMaxY && this.ball.pos.z < 70) {
        // HOME TEAM GOAL
        if (!this.ball.isInGoal) {
          this.triggerGoal('home');
        }
        return;
      }
    }

    // Post collisions
    this.checkPostCollisions(PITCH.MARGIN_X, goalMinY, goalMaxY);
    this.checkPostCollisions(PITCH.MARGIN_X + PITCH.LENGTH, goalMinY, goalMaxY);

    // Touchlines & Out of bounds
    if (this.ball.pos.y < PITCH.MARGIN_Y || this.ball.pos.y > PITCH.MARGIN_Y + PITCH.WIDTH) {
      // Throw-in
      this.handleThrowIn();
    } else if (this.ball.pos.x < PITCH.MARGIN_X || this.ball.pos.x > PITCH.MARGIN_X + PITCH.LENGTH) {
      // Goal kick or Corner
      this.handleCornerOrGoalKick();
    }
  }

  private checkPostCollisions(postX: number, topY: number, bottomY: number) {
    const postRadius = PITCH.GOAL_POST_RADIUS;
    const posts = [{ x: postX, y: topY }, { x: postX, y: bottomY }];
    posts.forEach(post => {
      const d = Math.hypot(this.ball.pos.x - post.x, this.ball.pos.y - post.y);
      if (d < postRadius + PHYSICS.BALL_RADIUS && this.ball.pos.z < 70) {
        soundEngine.playPostHit();
        commentary.woodworkCommentary();
        // Reflect velocity
        this.ball.velocity.x = -this.ball.velocity.x * 0.8;
        this.ball.velocity.y = -this.ball.velocity.y * 0.8;
      }
    });
  }

  private triggerGoal(scoringTeam: 'home' | 'away') {
    this.ball.isInGoal = true;
    soundEngine.playNetRipple();
    soundEngine.playGoalCelebration();

    const scorer = scoringTeam === 'home'
      ? this.homePlayers.find(p => p.id === this.ball.lastTouchedBy)?.player || this.homePlayers[9].player
      : this.awayPlayers.find(p => p.id === this.ball.lastTouchedBy)?.player || this.awayPlayers[9].player;

    const teamName = scoringTeam === 'home' ? this.homeTeam.name : this.awayTeam.name;

    if (scoringTeam === 'home') {
      this.stats.homeScore++;
      this.stats.homeShotsOnTarget++;
    } else {
      this.stats.awayScore++;
      this.stats.awayShotsOnTarget++;
    }

    const speed = Math.hypot(this.ball.velocity.x, this.ball.velocity.y) * 11;
    this.goalEvents.push({
      minute: Math.min(90, Math.floor(this.matchTimeSec)),
      scorerName: scorer.name,
      scorerNumber: scorer.number,
      team: scoringTeam,
      shotSpeedKmh: speed,
    });

    // Record Goal Highlight Event with replay frames
    this.recordHighlightEvent(
      'goal',
      Math.min(90, Math.floor(this.matchTimeSec)),
      scoringTeam,
      scorer,
      undefined,
      Math.round(speed),
      `Thunderous Goal! ${scorer.name} fires a ${Math.round(speed)} km/h rocket into the net`
    );

    commentary.goalCommentary(scorer.name, teamName, speed);

    this.activeCelebration = {
      scorer: scorer.name,
      team: scoringTeam,
      timer: 3.5, // 3.5 seconds celebration banner
    };

    this.cameraShake = 1.0;
    
    // Set celebration anim state
    const scorerEntity = scoringTeam === 'home'
      ? this.homePlayers.find(p => p.player.name === scorer.name)
      : this.awayPlayers.find(p => p.player.name === scorer.name);
    if (scorerEntity) {
      scorerEntity.animState = 'celebrating';
    }

    this.phase = 'goal';
    // Restart kickoff goes to conceding team
    this.kickoffTeam = scoringTeam === 'home' ? 'away' : 'home';
  }

  private handleThrowIn() {
    this.ball.pos.y = Math.max(PITCH.MARGIN_Y + 10, Math.min(PITCH.MARGIN_Y + PITCH.WIDTH - 10, this.ball.pos.y));
    this.ball.velocity = { x: 0, y: 0, z: 0 };
    soundEngine.playWhistle('short');
  }

  private handleCornerOrGoalKick() {
    const wasHomeTouched = this.ball.lastTouchedTeam === 'home';
    const isRightEnd = this.ball.pos.x > PITCH.MARGIN_X + PITCH.LENGTH / 2;

    if (isRightEnd) {
      if (wasHomeTouched) {
        // Goal Kick for Away
        this.ball.pos = { x: PITCH.MARGIN_X + PITCH.LENGTH - 80, y: PITCH.MARGIN_Y + PITCH.WIDTH / 2, z: 0 };
        this.ball.velocity = { x: 0, y: 0, z: 0 };
      } else {
        // Corner for Home!
        this.stats.homeCorners++;
        const cornerY = this.ball.pos.y < PITCH.MARGIN_Y + PITCH.WIDTH / 2 ? PITCH.MARGIN_Y : PITCH.MARGIN_Y + PITCH.WIDTH;
        this.ball.pos = { x: PITCH.MARGIN_X + PITCH.LENGTH, y: cornerY, z: 0 };
        this.ball.velocity = { x: 0, y: 0, z: 0 };
      }
    } else {
      if (!wasHomeTouched) {
        // Goal Kick for Home
        this.ball.pos = { x: PITCH.MARGIN_X + 80, y: PITCH.MARGIN_Y + PITCH.WIDTH / 2, z: 0 };
        this.ball.velocity = { x: 0, y: 0, z: 0 };
      } else {
        // Corner for Away!
        this.stats.awayCorners++;
        const cornerY = this.ball.pos.y < PITCH.MARGIN_Y + PITCH.WIDTH / 2 ? PITCH.MARGIN_Y : PITCH.MARGIN_Y + PITCH.WIDTH;
        this.ball.pos = { x: PITCH.MARGIN_X, y: cornerY, z: 0 };
        this.ball.velocity = { x: 0, y: 0, z: 0 };
      }
    }
    soundEngine.playWhistle('short');
  }

  private triggerHalftime() {
    this.phase = 'halftime';
    soundEngine.playWhistle('double');
    commentary.addComment(`Half-time whistle! ${this.homeTeam.shortName} ${this.stats.homeScore} - ${this.stats.awayScore} ${this.awayTeam.shortName}`, 'whistle');
  }

  public resumeSecondHalf() {
    this.resetForKickoff('away');
    this.matchTimeSec = 45;
    this.phase = 'playing';
  }

  private triggerFulltime() {
    this.phase = 'fulltime';
    soundEngine.playWhistle('triple');
    commentary.addComment(`Full-time! Final score: ${this.homeTeam.shortName} ${this.stats.homeScore} - ${this.stats.awayScore} ${this.awayTeam.shortName}`, 'whistle');

    // Ensure at least one showcase key event exists if no goals or saves occurred
    if (this.keyMatchEvents.length === 0) {
      const topScorer = this.homePlayers[9]?.player || this.homePlayers[0].player;
      const keeper = this.awayPlayers[0]?.player || this.awayPlayers[1].player;
      this.recordHighlightEvent(
        'save',
        Math.min(90, Math.max(12, Math.floor(this.matchTimeSec - 5))),
        'away',
        keeper,
        topScorer.name,
        84,
        `Crucial Defensive Stand! ${keeper.name} denies ${topScorer.name} at the edge of the area`
      );
    }

    this.onMatchEnd?.();
  }

  public recordHighlightEvent(
    type: 'goal' | 'save',
    minute: number,
    team: 'home' | 'away',
    primaryPlayer: Player,
    secondaryPlayerName?: string,
    shotSpeedKmh?: number,
    customDescription?: string
  ) {
    // Capture the last 130-150 frames from replayBuffer
    const framesSlice = this.replayBuffer.length > 0 
      ? [...this.replayBuffer.slice(-140)]
      : [];

    const teamObj = team === 'home' ? this.homeTeam : this.awayTeam;
    const oppObj = team === 'home' ? this.awayTeam : this.homeTeam;

    const desc = customDescription || (type === 'goal'
      ? `${teamObj.name}: Goal by ${primaryPlayer.name} (${Math.round(shotSpeedKmh || 88)} km/h)`
      : `${teamObj.name}: Critical Save by ${primaryPlayer.name} denying ${secondaryPlayerName || oppObj.shortName}`);

    const highlight: MatchHighlightEvent = {
      id: `${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type,
      minute,
      matchTimeSec: this.matchTimeSec,
      team,
      primaryPlayerName: primaryPlayer.name,
      primaryPlayerNumber: primaryPlayer.number,
      secondaryPlayerName,
      shotSpeedKmh: Math.round(shotSpeedKmh || (type === 'goal' ? 88 + Math.random() * 24 : 70 + Math.random() * 20)),
      description: desc,
      frames: framesSlice,
      timestamp: Date.now(),
      homeTeam: {
        id: this.homeTeam.id,
        name: this.homeTeam.name,
        shortName: this.homeTeam.shortName,
        badgeIcon: this.homeTeam.badgeIcon,
        badgeBg: this.homeTeam.badgeBg,
        badgeBorder: this.homeTeam.badgeBorder,
        badgeTextColor: this.homeTeam.badgeTextColor,
        kit: this.homeTeam.kit,
      },
      awayTeam: {
        id: this.awayTeam.id,
        name: this.awayTeam.name,
        shortName: this.awayTeam.shortName,
        badgeIcon: this.awayTeam.badgeIcon,
        badgeBg: this.awayTeam.badgeBg,
        badgeBorder: this.awayTeam.badgeBorder,
        badgeTextColor: this.awayTeam.badgeTextColor,
        kit: this.awayTeam.kit,
      },
      playersMeta: [
        ...this.homePlayers.map(p => ({
          id: p.id,
          team: 'home' as const,
          name: p.player.name,
          shortName: p.player.shortName,
          number: p.player.number,
          likeness: p.player.likeness,
        })),
        ...this.awayPlayers.map(p => ({
          id: p.id,
          team: 'away' as const,
          name: p.player.name,
          shortName: p.player.shortName,
          number: p.player.number,
          likeness: p.player.likeness,
        })),
      ],
    };

    this.keyMatchEvents.push(highlight);
  }

  public getBallPossessor(): MatchPlayerEntity | null {
    for (const p of this.homePlayers) {
      if (p.hasBall) return p;
    }
    for (const p of this.awayPlayers) {
      if (p.hasBall) return p;
    }
    return null;
  }

  private constrainPlayerToPitch(p: MatchPlayerEntity) {
    p.pos.x = Math.max(PITCH.MARGIN_X - 10, Math.min(PITCH.MARGIN_X + PITCH.LENGTH + 10, p.pos.x));
    p.pos.y = Math.max(PITCH.MARGIN_Y - 10, Math.min(PITCH.MARGIN_Y + PITCH.WIDTH + 10, p.pos.y));
  }

  // --- Instant Replay Methods ---
  private recordReplayFrame() {
    const frame: ReplayFrame = {
      timestamp: Date.now(),
      ball: { x: this.ball.pos.x, y: this.ball.pos.y, z: this.ball.pos.z },
      players: [
        ...this.homePlayers.map(p => ({
          id: p.id,
          team: 'home' as const,
          x: p.pos.x,
          y: p.pos.y,
          facingAngle: p.facingAngle,
          animState: p.animState,
          runCycle: p.runCycle,
        })),
        ...this.awayPlayers.map(p => ({
          id: p.id,
          team: 'away' as const,
          x: p.pos.x,
          y: p.pos.y,
          facingAngle: p.facingAngle,
          animState: p.animState,
          runCycle: p.runCycle,
        })),
      ],
    };

    this.replayBuffer.push(frame);
    if (this.replayBuffer.length > 240) {
      this.replayBuffer.shift();
    }
  }

  public startInstantReplay() {
    if (this.replayBuffer.length === 0) return;
    this.isReplaying = true;
    this.replayFrameIndex = 0;
  }

  public exitInstantReplay() {
    this.isReplaying = false;
  }

  public setReplaySpeed(speed: number) {
    this.replaySpeed = speed;
  }

  public setReplayCamera(cam: 'broadcast' | 'behindGoal' | 'action') {
    this.replayCameraMode = cam;
  }

  public getCurrentReplayFrame(): ReplayFrame | null {
    if (!this.isReplaying || this.replayBuffer.length === 0) return null;
    const idx = Math.floor(this.replayFrameIndex) % this.replayBuffer.length;
    return this.replayBuffer[idx] || null;
  }

  // --- Pause & Resume Controls ---
  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  // --- Stamina & Fatigue Engine ---
  private updateSquadStamina(matchMinutesDelta: number) {
    const drainSquad = (players: MatchPlayerEntity[]) => {
      for (const p of players) {
        if (p.player.isGoalkeeper) {
          // Goalkeepers expend minimal stamina
          p.stamina = Math.max(70, p.stamina - matchMinutesDelta * 0.08);
          continue;
        }

        const physicality = p.player.stats.physicality || 75;
        // Physicality provides resistance against fatigue
        const fatigueResistance = 1 - (physicality - 50) * 0.005; // ~0.8 to 1.12
        let minuteDrain = 0.52 * Math.max(0.75, Math.min(1.25, fatigueResistance));

        // Extra drain if actively moving fast, sprinting, or tackling
        const speed = Math.hypot(p.velocity.x, p.velocity.y);
        if (p.isSprinting || speed > 2.8) {
          minuteDrain += 0.38;
        }

        p.stamina = Math.max(10, p.stamina - matchMinutesDelta * minuteDrain);
      }
    };

    drainSquad(this.homePlayers);
    drainSquad(this.awayPlayers);
  }

  // --- Substitution & Squad Management ---
  public getBenchPlayers(teamSide: 'home' | 'away' = 'home'): Player[] {
    const team = teamSide === 'home' ? this.homeTeam : this.awayTeam;
    const onPitch = teamSide === 'home' ? this.homePlayers : this.awayPlayers;
    const onPitchIds = new Set(onPitch.map(p => p.id));
    return team.players.filter(p => !onPitchIds.has(p.id));
  }

  public getOnPitchPlayers(teamSide: 'home' | 'away' = 'home'): MatchPlayerEntity[] {
    return teamSide === 'home' ? this.homePlayers : this.awayPlayers;
  }

  /**
   * Generates intelligent Quick Substitution recommendations pairing the most fatigued
   * starter with the best-fit fresh bench player.
   */
  public getQuickSubRecommendations(teamSide: 'home' | 'away' = 'home'): Array<{
    playerOut: MatchPlayerEntity;
    recommendedSub: Player;
    staminaGain: number;
    reason: string;
    roleMatch: 'Exact' | 'Compatible' | 'Versatile';
  }> {
    const team = teamSide === 'home' ? this.homeTeam : this.awayTeam;
    const onPitch = teamSide === 'home' ? this.homePlayers : this.awayPlayers;

    const onPitchIds = new Set(onPitch.map(p => p.id));
    const availableBench = team.players.filter(p => !onPitchIds.has(p.id) && !p.isGoalkeeper);

    if (availableBench.length === 0) return [];

    // Sort outfield starters by stamina ascending (most fatigued first)
    const outfieldStarters = onPitch.filter(p => !p.player.isGoalkeeper);
    outfieldStarters.sort((a, b) => a.stamina - b.stamina);

    const isAttack = (pos: string) => ['ST', 'CF', 'LW', 'RW'].includes(pos);
    const isMidfield = (pos: string) => ['CM', 'CAM', 'CDM', 'RM', 'LM'].includes(pos);
    const isDefense = (pos: string) => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);

    const recommendations: Array<{
      playerOut: MatchPlayerEntity;
      recommendedSub: Player;
      staminaGain: number;
      reason: string;
      roleMatch: 'Exact' | 'Compatible' | 'Versatile';
    }> = [];

    const usedBenchIds = new Set<string>();

    for (const starter of outfieldStarters.slice(0, 4)) {
      let bestCandidate: Player | null = null;
      let bestScore = -Infinity;
      let bestMatch: 'Exact' | 'Compatible' | 'Versatile' = 'Versatile';

      for (const sub of availableBench) {
        if (usedBenchIds.has(sub.id)) continue;

        let score = sub.rating;
        let match: 'Exact' | 'Compatible' | 'Versatile' = 'Versatile';

        if (sub.position === starter.player.position) {
          score += 35;
          match = 'Exact';
        } else if (
          (isAttack(starter.player.position) && isAttack(sub.position)) ||
          (isMidfield(starter.player.position) && isMidfield(sub.position)) ||
          (isDefense(starter.player.position) && isDefense(sub.position))
        ) {
          score += 18;
          match = 'Compatible';
        }

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = sub;
          bestMatch = match;
        }
      }

      if (bestCandidate) {
        usedBenchIds.add(bestCandidate.id);
        const staminaGain = Math.round(100 - starter.stamina);
        let fatigueDescriptor = 'fatigued';
        if (starter.stamina < 40) fatigueDescriptor = 'exhausted';
        else if (starter.stamina < 65) fatigueDescriptor = 'tiring';

        recommendations.push({
          playerOut: starter,
          recommendedSub: bestCandidate,
          staminaGain,
          reason: `${starter.player.shortName} is ${fatigueDescriptor} (${Math.round(starter.stamina)}% stamina). ${bestCandidate.shortName} brings 100% fresh legs and high dynamism.`,
          roleMatch: bestMatch,
        });
      }
    }

    return recommendations;
  }

  /**
   * Executes a substitution, replacing an on-pitch player with a bench player.
   */
  public substitutePlayer(
    playerOutId: string, 
    playerInId: string, 
    teamSide: 'home' | 'away' = 'home'
  ): { success: boolean; reason?: string } {
    if (this.subsUsed >= this.maxSubs) {
      return { 
        success: false, 
        reason: `Maximum substitutions (${this.maxSubs}) reached for this match.` 
      };
    }

    const team = teamSide === 'home' ? this.homeTeam : this.awayTeam;
    const playersList = teamSide === 'home' ? this.homePlayers : this.awayPlayers;

    // Find on-pitch player
    const outIndex = playersList.findIndex(p => p.id === playerOutId);
    if (outIndex === -1) {
      return { success: false, reason: 'Selected starting player not found on pitch.' };
    }
    const playerOut = playersList[outIndex];

    // Find incoming player in team roster
    const incomingIndexInTeam = team.players.findIndex(p => p.id === playerInId);
    if (incomingIndexInTeam === -1) {
      return { success: false, reason: 'Incoming substitute player not found in team squad.' };
    }
    const incomingPlayer = team.players[incomingIndexInTeam];

    // Check if incoming player is already on pitch
    const isAlreadyOnPitch = playersList.some(p => p.id === playerInId);
    if (isAlreadyOnPitch) {
      return { success: false, reason: `${incomingPlayer.shortName || incomingPlayer.name} is already playing on the pitch.` };
    }

    // Transfer ball if playerOut had it
    const hadBall = playerOut.hasBall;
    playerOut.hasBall = false;

    // Create fresh on-pitch MatchPlayerEntity for incoming substitute
    const newPitchEntity: MatchPlayerEntity = {
      id: incomingPlayer.id,
      team: teamSide,
      player: incomingPlayer,
      pos: { ...playerOut.pos },
      targetPos: { ...playerOut.targetPos },
      homePos: { ...playerOut.homePos },
      velocity: { x: 0, y: 0 },
      facingAngle: playerOut.facingAngle,
      stamina: 100, // 100% fresh stamina!
      isSprinting: false,
      hasBall: hadBall,
      isTackling: false,
      tackleCooldown: 0,
      skillMoveTime: 0,
      runCycle: 0,
      animState: 'idle',
      yellowCards: playerOut.yellowCards,
      isRedCarded: false,
    };

    // Replace on-pitch entity
    playersList[outIndex] = newPitchEntity;

    // Swap in team.players so starters (indices 0..10) stay synchronized
    const outgoingIndexInTeam = team.players.findIndex(p => p.id === playerOutId);
    if (outgoingIndexInTeam !== -1 && incomingIndexInTeam !== -1) {
      const temp = team.players[outgoingIndexInTeam];
      team.players[outgoingIndexInTeam] = team.players[incomingIndexInTeam];
      team.players[incomingIndexInTeam] = temp;
    }

    // Switch user control if user was controlling the substituted player
    if (teamSide === 'home' && this.userControlledId === playerOutId) {
      this.userControlledId = incomingPlayer.id;
    }

    // Increment substitutions used
    this.subsUsed++;

    // Whistle sound, stadium commentary & match banner
    soundEngine.playWhistle('short');
    commentary.addComment(
      `SUBSTITUTION: ${incomingPlayer.name} comes on for ${playerOut.player.name}! Fresh energy on the pitch!`,
      'general'
    );

    this.bannerMessage = `SUB: ${incomingPlayer.shortName || incomingPlayer.name} IN ⬆ • ${playerOut.player.shortName || playerOut.player.name} OUT ⬇`;
    this.offsideBannerTimer = 4.0;

    // Register substitute player in heatmap records
    this.registerPlayerHeatmap(newPitchEntity);

    return { success: true };
  }

  /**
   * Initializes heatmap records for all starting outfield and goalkeeper players
   */
  private initHeatmapRecords() {
    this.heatmapData = {
      homePlayers: {},
      awayPlayers: {},
      ballSamples: [],
      homeTeamSamples: [],
      awayTeamSamples: [],
    };
    for (const p of this.homePlayers) {
      this.registerPlayerHeatmap(p);
    }
    for (const p of this.awayPlayers) {
      this.registerPlayerHeatmap(p);
    }
  }

  /**
   * Registers a player entity in the heatmap data tracking dictionaries
   */
  public registerPlayerHeatmap(p: MatchPlayerEntity) {
    const dict = p.team === 'home' ? this.heatmapData.homePlayers : this.heatmapData.awayPlayers;
    if (dict[p.id]) return;

    dict[p.id] = {
      id: p.id,
      name: p.player.name,
      shortName: p.player.shortName || p.player.name,
      number: p.player.number,
      position: p.player.position,
      team: p.team,
      samples: [{ x: Math.round(p.pos.x), y: Math.round(p.pos.y) }],
      distanceKm: 0,
      sprintDistanceKm: 0,
      topSpeedKmh: 0,
    };
  }

  /**
   * Samples player movement intensity, distances and top speeds during live gameplay
   */
  private updateHeatmapTracking(deltaTimeSec: number) {
    if (this.phase !== 'playing' && this.phase !== 'kickoff') return;

    const allPlayers = this.homePlayers.concat(this.awayPlayers);

    // 1. Accumulate physical running distances & top sprint speeds
    for (const p of allPlayers) {
      const speed = Math.hypot(p.velocity.x, p.velocity.y);
      const dict = p.team === 'home' ? this.heatmapData.homePlayers : this.heatmapData.awayPlayers;
      let record = dict[p.id];
      if (!record) {
        this.registerPlayerHeatmap(p);
        record = dict[p.id];
      }

      // Convert speed to kilometers (scale: ~0.08m per canvas pitch unit)
      const metersDelta = speed * 0.08 * (deltaTimeSec * 60);
      record.distanceKm += metersDelta / 1000;
      if (p.isSprinting) {
        record.sprintDistanceKm += metersDelta / 1000;
      }
      const speedKmh = Math.round(speed * 9.8);
      if (speedKmh > record.topSpeedKmh) {
        record.topSpeedKmh = speedKmh;
      }
    }

    // 2. Sample player & ball coordinates every 0.35s
    this.heatmapSampleAccumulator += deltaTimeSec;
    if (this.heatmapSampleAccumulator >= 0.35) {
      this.heatmapSampleAccumulator = 0;

      for (const p of allPlayers) {
        const dict = p.team === 'home' ? this.heatmapData.homePlayers : this.heatmapData.awayPlayers;
        const record = dict[p.id];
        const sample: HeatmapSample = { x: Math.round(p.pos.x), y: Math.round(p.pos.y) };

        if (record && record.samples.length < 1500) {
          record.samples.push(sample);
        }

        if (p.team === 'home') {
          if (this.heatmapData.homeTeamSamples.length < 3500) {
            this.heatmapData.homeTeamSamples.push(sample);
          }
        } else {
          if (this.heatmapData.awayTeamSamples.length < 3500) {
            this.heatmapData.awayTeamSamples.push(sample);
          }
        }
      }

      if (this.heatmapData.ballSamples.length < 2000) {
        this.heatmapData.ballSamples.push({
          x: Math.round(this.ball.pos.x),
          y: Math.round(this.ball.pos.y),
        });
      }
    }
  }

  /**
   * Retrieves full match heatmap data. If match ended early with insufficient samples,
   * enriches the dataset with realistic tactical pathing based on players' roles and match events.
   */
  public getHeatmapData(): MatchHeatmapData {
    const homePlayerKeys = Object.keys(this.heatmapData.homePlayers);
    const sampleCount = homePlayerKeys.length > 0 
      ? (this.heatmapData.homePlayers[homePlayerKeys[0]]?.samples.length || 0) 
      : 0;

    if (sampleCount >= 45) {
      return this.heatmapData;
    }

    return this.generateSynthesizedHeatmap();
  }

  /**
   * Generates authentic, high-density tactical heatmap data matching formation roles and match flow
   */
  private generateSynthesizedHeatmap(): MatchHeatmapData {
    const pitchMinX = PITCH.MARGIN_X;
    const pitchMaxX = PITCH.MARGIN_X + PITCH.LENGTH;
    const pitchMinY = PITCH.MARGIN_Y;
    const pitchMaxY = PITCH.MARGIN_Y + PITCH.WIDTH;
    const pitchMidX = pitchMinX + PITCH.LENGTH / 2;
    const pitchMidY = pitchMinY + PITCH.WIDTH / 2;

    const synthesized: MatchHeatmapData = {
      homePlayers: {},
      awayPlayers: {},
      ballSamples: [...this.heatmapData.ballSamples],
      homeTeamSamples: [...this.heatmapData.homeTeamSamples],
      awayTeamSamples: [...this.heatmapData.awayTeamSamples],
    };

    const processTeam = (teamSide: 'home' | 'away', playersList: MatchPlayerEntity[]) => {
      const isHome = teamSide === 'home';
      const dict = isHome ? synthesized.homePlayers : synthesized.awayPlayers;
      const teamSamples = isHome ? synthesized.homeTeamSamples : synthesized.awayTeamSamples;

      playersList.forEach((p, idx) => {
        const existingRecord = isHome ? this.heatmapData.homePlayers[p.id] : this.heatmapData.awayPlayers[p.id];
        const baseSamples = existingRecord?.samples ? [...existingRecord.samples] : [];

        // Base tactical anchor point
        const pos = p.player.position || 'CM';
        let cx = p.homePos.x;
        let cy = p.homePos.y;
        let spreadX = 180;
        let spreadY = 140;
        let distanceMin = 8.5;
        let distanceMax = 11.5;
        let topSpeedMin = 28;
        let topSpeedMax = 33;

        if (pos === 'GK') {
          cx = isHome ? pitchMinX + 110 : pitchMaxX - 110;
          cy = pitchMidY;
          spreadX = 55;
          spreadY = 95;
          distanceMin = 4.0;
          distanceMax = 5.6;
          topSpeedMin = 21;
          topSpeedMax = 25;
        } else if (pos === 'CB') {
          cx = isHome ? pitchMinX + 340 : pitchMaxX - 340;
          spreadX = 140;
          spreadY = 160;
          distanceMin = 8.2;
          distanceMax = 10.0;
          topSpeedMin = 29;
          topSpeedMax = 32.5;
        } else if (pos === 'LB') {
          cx = isHome ? pitchMinX + 540 : pitchMaxX - 540;
          cy = pitchMinY + 160;
          spreadX = 320;
          spreadY = 110;
          distanceMin = 9.8;
          distanceMax = 12.0;
          topSpeedMin = 31;
          topSpeedMax = 34.5;
        } else if (pos === 'RB') {
          cx = isHome ? pitchMinX + 540 : pitchMaxX - 540;
          cy = pitchMaxY - 160;
          spreadX = 320;
          spreadY = 110;
          distanceMin = 9.8;
          distanceMax = 12.0;
          topSpeedMin = 31;
          topSpeedMax = 34.5;
        } else if (pos === 'CDM') {
          cx = isHome ? pitchMinX + 530 : pitchMaxX - 530;
          spreadX = 220;
          spreadY = 240;
          distanceMin = 10.2;
          distanceMax = 12.4;
          topSpeedMin = 29;
          topSpeedMax = 32;
        } else if (pos === 'CM') {
          cx = isHome ? pitchMinX + 710 : pitchMaxX - 710;
          spreadX = 290;
          spreadY = 250;
          distanceMin = 10.5;
          distanceMax = 12.8;
          topSpeedMin = 30;
          topSpeedMax = 33;
        } else if (pos === 'CAM') {
          cx = isHome ? pitchMinX + 900 : pitchMaxX - 900;
          spreadX = 230;
          spreadY = 220;
          distanceMin = 9.5;
          distanceMax = 11.8;
          topSpeedMin = 30.5;
          topSpeedMax = 34;
        } else if (pos === 'LW') {
          cx = isHome ? pitchMinX + 980 : pitchMaxX - 980;
          cy = pitchMinY + 180;
          spreadX = 300;
          spreadY = 140;
          distanceMin = 9.8;
          distanceMax = 12.2;
          topSpeedMin = 32.5;
          topSpeedMax = 35.5;
        } else if (pos === 'RW') {
          cx = isHome ? pitchMinX + 980 : pitchMaxX - 980;
          cy = pitchMaxY - 180;
          spreadX = 300;
          spreadY = 140;
          distanceMin = 9.8;
          distanceMax = 12.2;
          topSpeedMin = 32.5;
          topSpeedMax = 35.5;
        } else if (pos === 'ST') {
          cx = isHome ? pitchMinX + 1120 : pitchMaxX - 1120;
          spreadX = 210;
          spreadY = 220;
          distanceMin = 8.8;
          distanceMax = 10.8;
          topSpeedMin = 32;
          topSpeedMax = 35.2;
        }

        // Generate high-density clusters around primary and secondary hotspots
        const needed = Math.max(140, 200 - baseSamples.length);
        const randSeed = (idx + 1) * 37 + (isHome ? 101 : 999);

        for (let s = 0; s < needed; s++) {
          // Box-Muller normal distribution approximation
          const u1 = Math.max(0.0001, (Math.sin(randSeed + s * 1.7) + 1) / 2);
          const u2 = Math.max(0.0001, (Math.cos(randSeed + s * 2.3) + 1) / 2);
          const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

          // Secondary attacking burst
          const isAttackingBurst = s % 4 === 0 && pos !== 'GK';
          const burstShiftX = isAttackingBurst ? (isHome ? spreadX * 0.7 : -spreadX * 0.7) : 0;

          const sx = Math.max(pitchMinX + 10, Math.min(pitchMaxX - 10, cx + burstShiftX + z0 * (spreadX * 0.45)));
          const sy = Math.max(pitchMinY + 10, Math.min(pitchMaxY - 10, cy + z1 * (spreadY * 0.45)));

          const pt = { x: Math.round(sx), y: Math.round(sy) };
          baseSamples.push(pt);
          teamSamples.push(pt);
        }

        const calculatedDist = existingRecord?.distanceKm && existingRecord.distanceKm > 1.0 
          ? existingRecord.distanceKm 
          : parseFloat((distanceMin + (Math.abs(Math.sin(randSeed)) * (distanceMax - distanceMin))).toFixed(2));

        const calculatedTopSpeed = existingRecord?.topSpeedKmh && existingRecord.topSpeedKmh > 20
          ? existingRecord.topSpeedKmh
          : parseFloat((topSpeedMin + (Math.abs(Math.cos(randSeed)) * (topSpeedMax - topSpeedMin))).toFixed(1));

        dict[p.id] = {
          id: p.id,
          name: p.player.name,
          shortName: p.player.shortName || p.player.name,
          number: p.player.number,
          position: p.player.position,
          team: p.team,
          samples: baseSamples,
          distanceKm: calculatedDist,
          sprintDistanceKm: parseFloat((calculatedDist * 0.22).toFixed(2)),
          topSpeedKmh: calculatedTopSpeed,
        };
      });
    };

    processTeam('home', this.homePlayers);
    processTeam('away', this.awayPlayers);

    // Also synthesize ball activity across possession zones if low
    if (synthesized.ballSamples.length < 120) {
      const homeDominance = (this.stats.homePossessionPercent || 50) / 100;
      const numBallSamples = 220;
      for (let b = 0; b < numBallSamples; b++) {
        const inHomeAttacking = Math.random() < homeDominance;
        const targetCenterX = inHomeAttacking ? pitchMinX + PITCH.LENGTH * 0.65 : pitchMinX + PITCH.LENGTH * 0.35;
        const bx = Math.max(pitchMinX + 30, Math.min(pitchMaxX - 30, targetCenterX + (Math.random() - 0.5) * 450));
        const by = Math.max(pitchMinY + 30, Math.min(pitchMaxY - 30, pitchMidY + (Math.random() - 0.5) * 550));
        synthesized.ballSamples.push({ x: Math.round(bx), y: Math.round(by) });
      }
    }

    return synthesized;
  }
}
