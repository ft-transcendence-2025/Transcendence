import { Canvas } from "./utils.js";
import { Paddle, PaddleSide, PaddleState } from "./Paddle.js";
import { Ball, BallState } from "./Ball.js";

export const TimeToWait = 45

export interface PayLoad {
  type: string,
  key: string,
}

export interface GameState {
  player1Name?: string,
  player2Name?: string,
  status: string,
  canvas: Canvas,
  paddleLeft: PaddleState,
  paddleRight: PaddleState,
  ball: BallState,
  score: {
    player1: number,
    player2: number,
    winner: 1 | 2 | null,
  },
  isPaused: boolean,
  timeToWait: number,
};

export class Game {
  public canvas: Canvas = {
    width: 1000,
    height: 500,
  };
  public paddleLeft: Paddle = new Paddle(this.canvas, PaddleSide.Left);
  public paddleRight: Paddle = new Paddle(this.canvas, PaddleSide.Right);
  public ball: Ball = new Ball(this.canvas);
  public gameState: GameState;

  constructor() {
    this.gameState = {
      player1Name: undefined,
      player2Name: undefined,
      status: "waiting for players",
      canvas: this.canvas,
      paddleLeft: this.paddleLeft.state,
      paddleRight: this.paddleRight.state,
      ball: this.ball.state,
      score: {
        player1: 0,
        player2: 0,
        winner: null,
      },
      isPaused: false,
      timeToWait: TimeToWait,
    };
  };
}
