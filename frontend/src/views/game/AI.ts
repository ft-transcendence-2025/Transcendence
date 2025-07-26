import { Paddle } from "./Paddle.js";
import { PaddleSide, PaddleState, degreesToRadians, getRandomAngle } from "./utils.js";
import { Ball } from "./Ball.js";

interface Point {
  x: number;
  y: number;
}

enum BallDir {
  upLeft = 0,
  upRight = 1,
  downLeft = 2,
  downRight = 3,
  horLeft = 4,
  horRight = 5,
};

export class AI {
  private currPoint: Point = { x: 0, y: 0 };
  private prevPoint: Point = { x: 0, y: 0 };
  private angularCoeficient: number = 0;
  private linearCoeficient: number = 0;
  private targetY: number = 0;
  private ballIsMoving: boolean = false;
  public paddle: Paddle;

  constructor(canvas: HTMLCanvasElement, side: PaddleSide, ball: Ball) {
    this.paddle = new Paddle(canvas, side);

    this.prevPoint = { x: ball.x, y: ball.y };
    this.currPoint = { x: ball.x, y: ball.y };

    this.predictPossition(canvas, side, ball);
    this.move(canvas);
  }

  private move(canvas: HTMLCanvasElement): void {
    const tolerance = this.paddle.height / 8;

    setInterval(() => {
      const paddleCenter = this.paddle.y + this.paddle.height/2;

      if (paddleCenter > this.targetY - tolerance &&
        paddleCenter < this.targetY + tolerance) {
        this.paddle.state.down = false;
        this.paddle.state.up = false;
      }
      else if (paddleCenter > this.targetY + tolerance) {
        this.paddle.state.down = false;
        this.paddle.state.up = true;
      }
      else if (paddleCenter < this.targetY - tolerance) {
        this.paddle.state.up = false;
        this.paddle.state.down = true;
      }
    }, 10)
  }

  private predictPossition(canvas: HTMLCanvasElement, side: PaddleSide, ball: Ball): void {
    setInterval(() => {
      this.currPoint.x = ball.x;
      this.currPoint.y = ball.y;

      // Check if ball is moving
      if (this.prevPoint.x === this.currPoint.x && this.prevPoint.y === this.currPoint.y) {
        this.ballIsMoving = false;
        this.targetY = canvas.height/2;
        return;
      }
      else
        this.ballIsMoving = true;

      this.targetY = this.getTargetY(canvas, side);
      this.prevPoint = { ...this.currPoint };
    }, 1000);
  }

  private getTargetY(canvas: HTMLCanvasElement, side: PaddleSide): number {
    let y: number = -1;
    let x: number = 0;
    const maxBounces: number = 10;
    let nbrBounces: number = 0;
    const targetX = this.paddle.side === PaddleSide.Right ? canvas.width : 0;

    // Ball going opossite side, set tartget to center
    if (side !== this.paddle.side || this.ballIsMoving === false)
      return canvas.height / 2;

    this.angularCoeficient = this.getAngularCoeficient();
    this.linearCoeficient = this.getLinearCoeficient({x: this.currPoint.x, y: this.currPoint.y});

    y = this.getYatX(targetX);
    while ((y < 0 || y > canvas.height) && nbrBounces < maxBounces) {
      if (this.angularCoeficient > 0) {
        if (this.currPoint.x > this.prevPoint.x) { // Going bottom Right
          y = this.getYatX(canvas.width);
          if (y > canvas.height) { // Ball bouces bottom
            x = this.getXatY(canvas.height);
            this.angularCoeficient *= -1;
            this.linearCoeficient = this.getLinearCoeficient({x: x , y: canvas.height});
          }
        }
        else { // Going Top left
          y = this.getYatX(0);
          if (y < 0) { // Ball bouces top
            x = this.getXatY(0);
            this.angularCoeficient *= -1;
            this.linearCoeficient = this.getLinearCoeficient({x: x, y: 0});
          }
        }
      }
      else if (this.angularCoeficient < 0) {
        if (this.currPoint.x > this.prevPoint.x) { // Going top Right
          y = this.getYatX(canvas.width);
          if (y < 0) { // Ball bouces top
            x = this.getXatY(0);
            this.angularCoeficient *= -1;
            this.linearCoeficient = this.getLinearCoeficient({x: x, y: 0});
          }
        }
        else { // Going Bottom left
          y = this.getYatX(0);
          if (y > canvas.height) { // Ball bouces bottom
            x = this.getXatY(canvas.height);
            this.angularCoeficient *= -1;
            this.linearCoeficient = this.getLinearCoeficient({x: x, y: canvas.height});
          }
        }
      }
      else // Horizontal
        y = this.linearCoeficient;
      nbrBounces++;
    }
    return y;
  }

  private getAngularCoeficient(): number {
    const deltaX: number = this.currPoint.x - this.prevPoint.x;
    const deltaY: number = this.currPoint.y - this.prevPoint.y;

    if (deltaX < 0.01)
      return 0;

    return deltaY / deltaX;
  }

  private getLinearCoeficient(point: Point): number {
    return point.y - (point.x * this.angularCoeficient);
  }

  // y = ax + b
  private getYatX(x: number): number {
    return x * this.angularCoeficient + this.linearCoeficient;
  }

  // x = (y - b) / a;
  private getXatY(y: number): number {
    if (this.angularCoeficient < 0.01)
      return y;
    return (y - this.linearCoeficient) / this.angularCoeficient;
  }
}
