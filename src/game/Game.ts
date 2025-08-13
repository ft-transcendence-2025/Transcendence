import { Canvas, getRandomAngle, degreesToRadians } from "./utils.js";
import { Paddle, PaddleSide, PaddleState } from "./Paddle.js";
import { Ball, BallState } from "./Ball.js";


export interface GameState {
  canvas: Canvas,
  paddleLeft: PaddleState,
  paddleRight: PaddleState,
  ball: BallState,
};

export class Game {
  public canvas: Canvas = {
    width: 1000,
    height: 500,
  };
  private startTime: DOMHighResTimeStamp = performance.now();

  public paddleLeft: Paddle = new Paddle(this.canvas, PaddleSide.Left);
  public paddleRight: Paddle = new Paddle(this.canvas, PaddleSide.Right);
  public ball: Ball = new Ball(this.canvas);
  public gameState: GameState;

  constructor() {
    this.gameState = {
      canvas: this.canvas,
      paddleLeft: this.paddleLeft.state,
      paddleRight: this.paddleRight.state,
      ball: this.ball.state,
    };
  };
}
