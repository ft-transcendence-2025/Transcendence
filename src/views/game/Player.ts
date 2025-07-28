import { Paddle } from  "./Paddle.js";
import { PaddleSide, PaddleState, degreesToRadians, getRandomAngle } from "./utils.js";

export class Player {
  public paddle: Paddle;
  private side: PaddleSide;

  constructor(canvas: HTMLCanvasElement, side: PaddleSide) {
    this.paddle = new Paddle(canvas, side);
    this.side = side;

    canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
    canvas.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Prevent default for all game control keys
    if (["s", "S", "w", "W", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (this.side === PaddleSide.Left) {
      if (event.key === "s" || event.key === "S") this.paddle.state.down = true;
      if (event.key === "w" || event.key === "W") this.paddle.state.up = true;
    } else if (this.side === PaddleSide.Right) {
      if (event.key === "ArrowDown") this.paddle.state.down = true;
      if (event.key === "ArrowUp") this.paddle.state.up = true;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (this.side === PaddleSide.Left) {
      if (event.key === "s" || event.key === "S") this.paddle.state.down = false;
      if (event.key === "w" || event.key === "W") this.paddle.state.up = false;
    } else if (this.side === PaddleSide.Right) {
      if (event.key === "ArrowDown") this.paddle.state.down = false;
      if (event.key === "ArrowUp") this.paddle.state.up = false;
    }
  }
}
