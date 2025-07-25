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
  private tolerance: number;
  public paddle: Paddle;

  constructor(canvas: HTMLCanvasElement, side: PaddleSide, ball: Ball) {
    this.paddle = new Paddle(canvas, side);

    this.tolerance = this.paddle.height / 6;
    this.prevPoint = { x: ball.x, y: ball.y };
    this.currPoint = { x: ball.x, y: ball.y };

    this.predictPossition(canvas, side, ball);
    this.move(canvas);
  }

  private move(canvas: HTMLCanvasElement): void {
    setInterval(() => {
      if (this.paddle.y - this.paddle.height/2 > this.targetY && this.paddle.y >= 0) {
        this.paddle.y -= this.paddle.speed * 2;
      }
      if (this.paddle.y + this.paddle.height/2 < this.targetY && this.paddle.y + this.paddle.height <= canvas.height) {
        this.paddle.y += this.paddle.speed * 2;
      }
    }, 5)
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

      this.angularCoeficient = this.getAngularCoeficient();
      this.linearCoeficient = this.getLinearCoeficient({x: this.currPoint.x, y: this.currPoint.y});
      this.targetY = this.getTargetY(canvas, side);

      this.prevPoint = { ...this.currPoint };
    }, 10);
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

  private getTargetY(canvas: HTMLCanvasElement, side: PaddleSide): number {
    let y: number = -1;
    const maxBounces: number = 10;
    let nbrBounces: number = 0;
    const targetX = this.paddle.side === PaddleSide.Right ? canvas.width : 0;

    // Ball going opossite side, set tartget to center
    if (side !== this.paddle.side || this.ballIsMoving === false)
      return canvas.height / 2;

    y = this.angularCoeficient * targetX + this.linearCoeficient;
    if (y > 0 && y < canvas.height)
      return y;
    while ((y < 0 || y > canvas.height) && nbrBounces++ < maxBounces) {
      if (this.angularCoeficient > 0) {
        if (this.currPoint.x > this.prevPoint.x) { // Going bottom Right
          y = this.angularCoeficient * canvas.width + this.linearCoeficient; 
          if (y > canvas.height) { // Ball bouces bottom
            this.angularCoeficient *= -1;
            this.linearCoeficient = this.getLinearCoeficient({x: canvas.width , y: y});
          }
        }
        else { // Going Top left
          y = this.linearCoeficient;
          if (y < 0) { // Ball bouces top
            this.angularCoeficient *= -1;
            this.linearCoeficient = this.getLinearCoeficient({x: 0, y: y});
          }
        }
      }
      else if (this.angularCoeficient < 0) {
        if (this.currPoint.x > this.prevPoint.x) { // Going top Right
          y = this.angularCoeficient * canvas.width + this.linearCoeficient;
          if (y < 0) { // Ball bouces top
            this.angularCoeficient *= -1;
            this.linearCoeficient = this.getLinearCoeficient({x: canvas.width, y: y});
          }
        }
        else { // Going Bottom left
          y = this.linearCoeficient;
          if (y > canvas.height) { // Ball bouces bottom
            this.angularCoeficient *= -1;
            this.linearCoeficient = this.getLinearCoeficient({x: 0, y: y});
          }
        }
      }
      else
        y = this.linearCoeficient;
    }
    console.log(nbrBounces);
    return y;
  }
}
