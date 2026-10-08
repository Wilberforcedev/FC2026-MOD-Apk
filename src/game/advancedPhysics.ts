import { BallEntity, Vector2D } from '../types/soccer';
import { PHYSICS, PITCH } from './constants';

export interface BallPhysicsProfile {
  airDrag: number;
  groundDrag: number;
  magnus: number;
  restitution: number;
  rollingResistance: number;
}

const DEFAULT_PROFILE: BallPhysicsProfile = {
  airDrag: PHYSICS.BALL_FRICTION_AIR,
  groundDrag: PHYSICS.BALL_FRICTION_GROUND,
  magnus: 0.045,
  restitution: PHYSICS.BALL_BOUNCE_DAMPING,
  rollingResistance: 0.992,
};

/** Lightweight, deterministic football physics for the Canvas engine. */
export function stepBallPhysics(ball: BallEntity, deltaTime: number, profile = DEFAULT_PROFILE) {
  if (ball.isInGoal) return;
  const dt = Math.min(0.05, Math.max(0.001, deltaTime));
  const ground = ball.pos.z <= 0.01;
  const drag = Math.pow(ground ? profile.groundDrag : profile.airDrag, dt * 60);

  // Magnus effect: spin changes lateral acceleration while the ball is airborne.
  if (!ground) {
    const magnusX = -ball.spin.y * Math.abs(ball.velocity.z) * profile.magnus;
    const magnusY = ball.spin.x * Math.abs(ball.velocity.z) * profile.magnus;
    ball.velocity.x += magnusX * dt * 60;
    ball.velocity.y += magnusY * dt * 60;
  }

  ball.velocity.x *= drag;
  ball.velocity.y *= drag;
  ball.velocity.z -= PHYSICS.BALL_GRAVITY * dt * 60;

  ball.pos.x += ball.velocity.x * dt * 60;
  ball.pos.y += ball.velocity.y * dt * 60;
  ball.pos.z += ball.velocity.z * dt * 60;

  if (ball.pos.z <= 0) {
    ball.pos.z = 0;
    if (Math.abs(ball.velocity.z) > 1.15) {
      ball.velocity.z = -ball.velocity.z * profile.restitution;
      ball.velocity.x *= 0.985;
      ball.velocity.y *= 0.985;
    } else {
      ball.velocity.z = 0;
      ball.velocity.x *= profile.rollingResistance;
      ball.velocity.y *= profile.rollingResistance;
    }
    // Ground spin decays faster after contact.
    ball.spin.x *= 0.90;
    ball.spin.y *= 0.90;
  } else {
    ball.spin.x *= 0.992;
    ball.spin.y *= 0.992;
  }
}

export function reflectBall(ball: BallEntity, normal: Vector2D, restitution = 0.78) {
  const len = Math.hypot(normal.x, normal.y) || 1;
  const nx = normal.x / len;
  const ny = normal.y / len;
  const dot = ball.velocity.x * nx + ball.velocity.y * ny;
  ball.velocity.x -= (1 + restitution) * dot * nx;
  ball.velocity.y -= (1 + restitution) * dot * ny;
}

export function clampBallToPitch(ball: BallEntity) {
  ball.pos.x = Math.max(PITCH.MARGIN_X - 90, Math.min(PITCH.MARGIN_X + PITCH.LENGTH + 90, ball.pos.x));
  ball.pos.y = Math.max(PITCH.MARGIN_Y - 90, Math.min(PITCH.MARGIN_Y + PITCH.WIDTH + 90, ball.pos.y));
}
