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
  public paddle: Paddle;
  private side: PaddleSide;

  private currPoint: Point = { x: 0, y: 0 };
  private prevPoint: Point = { x: 0, y: 0 };
  public a: number = 0;
  public b: number = 0;

  constructor(canvas: HTMLCanvasElement, side: PaddleSide, ball: Ball) {
    this.paddle = new Paddle(canvas, side);
    this.side = side;
    
    this.prevPoint = { x: ball.x, y: ball.y };
    this.currPoint = { x: ball.x, y: ball.y };

    setInterval(() => {
      this.prevPoint = { ...this.currPoint }; // Save previous point first
      this.currPoint.x = ball.x;
      this.currPoint.y = ball.y;

      // Check if ball actually moved
      if (this.prevPoint.x === this.currPoint.x && this.prevPoint.y === this.currPoint.y) {
        return;
      }

      this.setStraight();
      const ballDir = this.getBallDir();
      
      const collisionPoint = this.predictCollision(ballDir, canvas);
      
      if (collisionPoint) {
        // console.log(`Will hit at: (${collisionPoint.x}, ${collisionPoint.y})`);
        
        // Move paddle to intercept the ball
        if (collisionPoint.y > this.paddle.y + this.paddle.height / 2) {
          // console.log("Move Down");
          // this.paddle.moveDown();
        } else if (collisionPoint.y < this.paddle.y + this.paddle.height / 2) {
          // console.log("Move UP");
          // this.paddle.moveUp();
        }
      }

    }, 100);
  }

  private setStraight(): void {
   // Avoid division by zero
    const deltaX = this.currPoint.x - this.prevPoint.x;
    if (Math.abs(deltaX) < 0.001) {
      this.a = 0;
      this.b = this.currPoint.y;
      return;
    }
    
    this.a = (this.currPoint.y - this.prevPoint.y) / deltaX;
    this.b = this.currPoint.y - (this.a * this.currPoint.x);
  }

  private getBallDir(): BallDir {
    const deltaX = this.currPoint.x - this.prevPoint.x;
    const deltaY = this.currPoint.y - this.prevPoint.y;

    if (Math.abs(deltaX) < 0.001) {
      // Vertical movement
      return deltaY > 0 ? BallDir.downRight : BallDir.upRight;
    }

    if (deltaX > 0) {
      if (deltaY > 0)
        return BallDir.downRight;
      else if (deltaY < 0)
          return BallDir.upRight;
      return BallDir.horRight;
    }
    else {
      if (deltaY > 0)
        return BallDir.downLeft;
      else if (deltaY < 0)
          return BallDir.upLeft;
      return BallDir.horLeft;
    }
  }

  private predictCollision(ballDir: BallDir, canvas: HTMLCanvasElement): Point | null {
    // Determine paddle x position based on side
    const paddleX = this.side === PaddleSide.Left ? 0 : canvas.width;

    // Calculate where the ball line intersects with the paddle's x position
    const collisionY = this.a * paddleX + this.b;

    // Check if this collision point is within canvas bounds (vertical walls)
    if (collisionY >= 0 && collisionY <= canvas.height) {
      return { x: paddleX, y: collisionY };
    }

    // If not hitting paddle, check wall collisions
    let wallCollisionY: number;
    let wallCollisionX: number;

    if (ballDir === BallDir.upLeft || ballDir === BallDir.upRight) {
      // Check top wall (y = 0)
      wallCollisionX = (0 - this.b) / this.a;
      if (wallCollisionX >= 0 && wallCollisionX <= canvas.width) {
        // Ball hits top, will bounce - recalculate
        return this.predictCollisionAfterBounce(ballDir, wallCollisionX, 0, canvas);
      }
    } else if (ballDir === BallDir.downLeft || ballDir === BallDir.downRight) {
      // Check bottom wall (y = canvas.height)
      wallCollisionX = (canvas.height - this.b) / this.a;
      if (wallCollisionX >= 0 && wallCollisionX <= canvas.width) {
        // Ball hits bottom, will bounce - recalculate
        return this.predictCollisionAfterBounce(ballDir, wallCollisionX, canvas.height, canvas);
      }
    }
    return null;
  }

  private predictCollisionAfterBounce(ballDir: BallDir, bounceX: number, bounceY: number, canvas: HTMLCanvasElement): Point | null {
    // This is a simplified version - you'd need to calculate the new trajectory after bounce
    // For now, let's just return the paddle collision point
    const paddleX = this.side === PaddleSide.Left ? 0 : canvas.width;
    const collisionY = this.a * paddleX + this.b;

    if (collisionY >= 0 && collisionY <= canvas.height) {
      return { x: paddleX, y: collisionY };
    }

    return null;
  }

}


