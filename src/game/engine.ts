import { 
  Team, 
  MatchPlayerEntity, 
  BallEntity, 
  MatchPhase, 
  MatchStats, 
  GoalEvent, 
  Vector2D, 
  GameDifficulty,
  ReplayFrame
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

    this.initPlayers();
    this.resetForKickoff('home');
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

    // Update match clock
    if (this.phase === 'playing' || this.phase === 'kickoff') {
      // 90 minutes mapped over matchDurationSec
      const minutesPerSec = 90 / this.matchDurationSec;
      this.matchTimeSec += deltaTimeSec * minutesPerSec;

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

    const distToBall = Math.hypot(this.ball.pos.x - gk.pos.x, this.ball.pos.y - gk.pos.y);

    // If ball is very close and inside box, GK claims ball
    if (distToBall < 28 && this.ball.pos.z < 25) {
      gk.hasBall = true;
      this.ball.velocity = { x: 0, y: 0, z: 0 };
      soundEngine.playKick(0.3);
      commentary.saveCommentary(gk.player.shortName);

      if (side === 'home') this.stats.awayShotsOnTarget++;
      else this.stats.homeShotsOnTarget++;

      // GK clears ball downfield after 1.2 seconds
      setTimeout(() => {
        if (gk.hasBall) {
          gk.hasBall = false;
          this.ball.velocity.x = side === 'home' ? 14 : -14;
          this.ball.velocity.y = (Math.random() - 0.5) * 6;
          this.ball.velocity.z = 6;
          soundEngine.playKick(0.8);
        }
      }, 1200);
      return;
    }

    // Goalkeeper tracks ball along goal mouth
    const targetY = Math.max(goalMinY + 14, Math.min(goalMaxY - 14, this.ball.pos.y));
    const dy = targetY - gk.pos.y;
    gk.velocity.x = (goalX - gk.pos.x) * 0.15;
    gk.velocity.y = Math.min(4.5, Math.max(-4.5, dy * 0.25));

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
    this.onMatchEnd?.();
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
}
