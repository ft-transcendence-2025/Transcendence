import { PaddleSide, PaddleState, degreesToRadians, getRandomAngle } from "./utils.js";
import { Paddle } from  "./Paddle.js";

export class Ball {
  private color: string = "#fe019a";

  // line around the circle
  private strokeWidth: number = 2;
  private strokeColor: string = "#253031";

  public x: number;
  public y: number;
  public angle: number = getRandomAngle();
  public readonly radius: number = 8;
  private defaultSpeed: number = 4;
  private currentSpeed: number;
  private speedUpTime: number = 5000; // 5 seconds in milliseconds

  private firstHit: boolean = true;
  private startTime: DOMHighResTimeStamp;

  constructor(canvas: HTMLCanvasElement) {
    this.startTime = performance.now();
    this.currentSpeed = this.defaultSpeed/2;
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
  }

  // Check if a player scored a point
  // call updateScore to update the score
  public pointScored(canvas: HTMLCanvasElement): boolean {
    if (this.x + this.radius < 0) { // Player 2 Scored
      this.updateScore(2);
      return true;
    }
    else if (this.x - this.radius > canvas.width) { // Player 1 Scored
      this.updateScore(1);
      return true;
    }
    return false;
  }

  private updateScore(player: 1 | 2): void {
    const playerScoreElement = document.getElementById(`player${player}-score`) as HTMLSpanElement;
    if (playerScoreElement) {
      const currentScore = parseInt(playerScoreElement.innerHTML);
        playerScoreElement.innerHTML = (currentScore + 1).toString();
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Full circle
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.stroke();
  }

  public move(canvas: HTMLCanvasElement): void {
    if (this.firstHit === false)
      this.currentSpeed = this.defaultSpeed/2; // Ball start slow before hiting the first paddle
    else if (this.firstHit === true && this.currentSpeed < this.defaultSpeed)
      this.currentSpeed = this.defaultSpeed;

    // Every 5 seconds the ball increases speed 10%
    if (performance.now() - this.startTime >= this.speedUpTime) {
      this.currentSpeed += this.currentSpeed / 10;
      this.startTime = performance.now();
    }

    this.x += Math.cos(this.angle) * this.currentSpeed;
    this.y += Math.sin(this.angle) * this.currentSpeed;
  }

  public reset(canvas: HTMLCanvasElement): void {
    this.startTime = performance.now();
    this.firstHit = false;
    this.x = canvas.width/2;
    this.y = canvas.height/2;
  }

  public checkCeilingFloorCollision(canvas: HTMLCanvasElement): void {
    if (this.y - this.radius <= 0){
      this.y = this.radius;
      this.angle *= -1;
    } else if (this.y + this.radius >= canvas.height) {
      this.y = canvas.height - this.radius;
      this.angle *= -1;
    }
  }

  // The ball angle change arcordingly to where it hit the paddle
  public checkPaddleCollision(paddle: Paddle): void {
    if (this.x + this.radius >= paddle.x &&
      this.x - this.radius <= paddle.x + paddle.width &&
      this.y + this.radius >= paddle.y &&
      this.y - this.radius <= paddle.y + paddle.height) {

      this.firstHit = true;

      const relativeY = this.y - paddle.y - paddle.height/2; // Calculate relative Y position on the paddle
      const normalized = relativeY / (paddle.height / 2);
      const clamped = Math.max(-1, Math.min(1, normalized)); // Make sure value is between [-1, 1];
      const maxBounceAngle = degreesToRadians(60); // 60 degrees in radians

      // Adjust ball position to avoid sticking
      if (paddle.side === PaddleSide.Left) {
        if (this.x - this.radius < paddle.x) // When the ball passed the paddle or hit the top or bottom
          return ;
        this.angle = clamped * maxBounceAngle;
      } else if (paddle.side === PaddleSide.Right){
        if (this.x > paddle.x) // When the ball passed the paddle or hit the top or bottom
          return ;
        this.angle = Math.PI - clamped * maxBounceAngle; // Set angle to PI - bounceAngle (leftward)
      }
    }
  }
}
