import { Canvas } from "./utils.js";

export enum PaddleSide {
  Left = 0,
  Right = 1,
};

export enum PaddleMovingState {
  Up = 0,
  Down = 1,
}

export interface PaddlePositionState {
  x: number,
  y: number,
}

export class Paddle {
  public positionState: PaddlePositionState;
  public readonly width: number = 15;
  public readonly height: number = 90;
  private color: string = "#5FAD56";
  private strokeColor: string = "#396733";
  private strokeWidth: number = 0;
  public speed: number = 8;
  public side: PaddleSide;

  public state = {
    up: false,
    down: false,
  };

  constructor(canvas: Canvas, side: PaddleSide) {
    this.positionState = {
      x: 0,
      y: canvas.height / 2 - this.height / 2,
    }
    this.side = side;

    if (side === PaddleSide.Left)
      this.positionState.x = 5;
    else if (side === PaddleSide.Right)
      this.positionState.x = canvas.width - this.width - 5;
  }

  public update(canvas: Canvas): void {
    if (this.state.up && this.positionState.y >= 0)
      this.positionState.y -= this.speed;
    if (this.state.down && this.positionState.y + this.height <= canvas.height)
      this.positionState.y += this.speed;
  }
}
