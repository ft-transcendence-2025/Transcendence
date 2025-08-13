import { Canvas, degreesToRadians, getRandomAngle } from "./utils.js";
import { Paddle, PaddleSide } from "./Paddle.js";

export interface BallState {
  x: number,
  y: number,
  radius: number,
};

export class Ball {
  private color: string = "#FE4E00";

  // line around the circle
  private strokeWidth: number = 2;
  private strokeColor: string = "#253031";

  public state: BallState;
  public angle: number = getRandomAngle();
  public readonly radius: number = 8;
  private defaultSpeed: number = 8;
  public currentSpeed: number = this.defaultSpeed / 2;;

  private firstHit: boolean = true;
  private startTime: DOMHighResTimeStamp = performance.now();;
  public isRunning: boolean = false;

  constructor(canvas: Canvas) {
    this.state = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: this.radius,
    };
  }

  // Check if a player scored a point
  public pointScored(canvas: Canvas): boolean {
    if (this.state.x + this.radius < 0) {
      // Player 2 Scored
      return true;
    } else if (this.state.x - this.radius > canvas.width) {
      // Player 1 Scored
      return true;
    }
    return false;
  }

  public move(): void {
    if (this.firstHit === false)
      this.currentSpeed = this.defaultSpeed / 2; // Ball start slow before hiting the first paddle
    else if (this.firstHit === true && this.currentSpeed < this.defaultSpeed)
      this.currentSpeed = this.defaultSpeed;

    this.state.x += Math.cos(this.angle) * this.currentSpeed;
    this.state.y += Math.sin(this.angle) * this.currentSpeed;
  }

  private increaseBallSpeed(): void {
    const maxSpeed: number = 100;
    const speedUpTime: number = 5000;

    // Every 5 seconds the ball increases speed 5%
    if (performance.now() - this.startTime >= speedUpTime &&
      this.currentSpeed < maxSpeed) {
      this.currentSpeed += this.currentSpeed / 5;
      this.startTime = performance.now();
    }
  }

  public reset(canvas: Canvas): void {
    this.startTime = performance.now();
    this.firstHit = false;
    this.state.x = canvas.width / 2;
    this.state.y = canvas.height / 2;
  }

  public checkCeilingFloorCollision(canvas: Canvas): void {
    if (this.state.y - this.radius <= 0) {
      this.state.y = this.radius;
      this.angle *= -1;
    } else if (this.state.y + this.radius >= canvas.height) {
      this.state.y = canvas.height - this.radius;
      this.angle *= -1;
    }
  }

  // The ball angle change arcordingly to where it hit the paddle
  public checkPaddleCollision(paddle: Paddle): void {
    if ( this.state.x + this.radius >= paddle.state.position.x &&
      this.state.x - this.radius <= paddle.state.position.x + paddle.width &&
      this.state.y + this.radius >= paddle.state.position.y &&
      this.state.y - this.radius <= paddle.state.position.y + paddle.height)
    {
      this.firstHit = true;

      const relativeY = this.state.y - paddle.state.position.y - paddle.height / 2; // Calculate relative Y position on the paddle
      const normalized = relativeY / (paddle.height / 2);
      const clamped = Math.max(-1, Math.min(1, normalized)); // Make sure value is between [-1, 1];
      const maxBounceAngle = degreesToRadians(60); // 60 degrees in radians

      // Adjust ball position to avoid sticking
      if (paddle.side === PaddleSide.Left) {
        this.state.x = paddle.state.position.x + paddle.width + this.radius;
        this.angle = clamped * maxBounceAngle;
        this.increaseBallSpeed();
      }
      else if (paddle.side === PaddleSide.Right) {
        this.state.x = paddle.state.position.x - this.radius;
        this.angle = Math.PI - clamped * maxBounceAngle; // Set angle to PI - bounceAngle (leftward)
        this.increaseBallSpeed();
      }
    }
  }
}
