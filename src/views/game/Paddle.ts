import { PaddleSide, PaddleState, degreesToRadians, getRandomAngle } from "./utils.js";

export class Paddle {
  public x: number = 0;
  public y: number;
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

  constructor(canvas: HTMLCanvasElement, side: PaddleSide) {
    this.y = canvas.height / 2 - this.height / 2;
    this.side = side;

    if (side === PaddleSide.Left) this.x = 5;
    else if (side === PaddleSide.Right) this.x = canvas.width - this.width - 5;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }

  public update(canvas: HTMLCanvasElement): void {
    if (this.state.up && this.y >= 0) this.y -= this.speed;
    if (this.state.down && this.y + this.height <= canvas.height)
      this.y += this.speed;
  }
}
