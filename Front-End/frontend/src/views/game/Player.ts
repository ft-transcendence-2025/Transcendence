import { PaddleSide, PaddleState, degreesToRadians, getRandomAngle } from "./utils.js";

export class Player {
  private side: PaddleSide;
  private ws: WebSocket;

  constructor(ws: WebSocket, canvas: HTMLCanvasElement, side: PaddleSide) {
    this.ws = ws;
    this.side = side;

    canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
    canvas.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.side === PaddleSide.Left) {
      if (["s", "S", "w", "W"].includes(event.key)) {
        event.preventDefault();
        const payLoad = {
          type: "keydown",
          key: event.key,
        };
        this.ws.send(JSON.stringify(payLoad));
      }
    }
    else if (this.side === PaddleSide.Right) {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        const payLoad = {
          type: "keydown",
          key: event.key,
        };
        this.ws.send(JSON.stringify(payLoad));
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (this.side === PaddleSide.Left) {
      if (["s", "S", "w", "W"].includes(event.key)) {
        const payLoad = {
          type: "keyup",
          key: event.key,
        };
        this.ws.send(JSON.stringify(payLoad));
      }
    }
    else if (this.side === PaddleSide.Right) {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        const payLoad = {
          type: "keyup",
          key: event.key,
        };
        this.ws.send(JSON.stringify(payLoad));
      }
    }
  }
}
