import { Canvas, canvas, getRandomAngle, degreesToRadians } from "./utils.js";
import { Paddle, PaddleSide, PaddlePositionState } from "./Paddle.js";
import { Ball, BallPositionState } from "./Ball.js";

export interface GameState {
  canvas: Canvas,
  paddleLeft: PaddlePositionState,
  paddleRight: PaddlePositionState,
  ballPosition: BallPositionState,
};

export class Game {
  public canvas: Canvas = canvas;
  private startTime: DOMHighResTimeStamp = performance.now();

  public paddleLeft: Paddle = new Paddle(canvas, PaddleSide.Left);
  public paddleRight: Paddle = new Paddle(canvas, PaddleSide.Right);
  public ball: Ball = new Ball(canvas);
  public gameState: GameState;

  constructor() {
    this.gameState = {
      canvas: this.canvas,
      paddleLeft: this.paddleLeft.positionState,
      paddleRight: this.paddleRight.positionState,
      ballPosition: this.ball.positionState,
    };
  };


}
