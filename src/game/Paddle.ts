import { Canvas } from "./utils.js";

export enum PaddleSide {
  Left = 0,
  Right = 1,
};

enum PaddleMovingState {
  Up = 0,
  Down = 1,
}

interface PaddlePositionState {
  x: number,
  y: number,
}

export interface PaddleState {
  moving: {
    up: boolean,
    down: boolean,
  },
  position: PaddlePositionState,
  attr: {
    width: number,
    height: number,
  }
}

export class Paddle {
  public readonly width: number = 15;
  public readonly height: number = 90;
  private color: string = "#5FAD56";
  private strokeColor: string = "#396733";
  private strokeWidth: number = 0;
  public speed: number = 8;
  public side: PaddleSide;
  public state: PaddleState;

  constructor(canvas: Canvas, side: PaddleSide) {
    this.side = side;
    this.state = {
      moving: {
        up: false,
        down: false,
      },
      position: {
        x: side === PaddleSide.Left ? 5 : canvas.width - this.width - 5,
        y: canvas.height / 2 - this.height / 2,
      },
      attr: {
        width: this.width,
        height: this.height,
      }
    }
  }

  public update(canvas: Canvas): void {
    if (this.state.moving.up && this.state.position.y >= 0)
      this.state.position.y -= this.speed;
    if (this.state.moving.down && this.state.position.y + this.height <= canvas.height)
      this.state.position.y += this.speed;
  }
}
