import { GameState, Canvas, BallState, FetchData, PaddleState, PaddleSide, GameMode, degreesToRadians, getRandomAngle } from "./utils.js";
import { Player } from "./Player.js";
import { Game } from "./Game.js";

export class RemoteGame extends Game {
  private updateAIIntervalId: number | null = null;

  private player: Player | null = null;
  private side: string | null = null;


  constructor(data: FetchData) {
    super()

    this.joinGame(`wss://${window.location.host}/ws/game/remote/${data.id}`);
    this.side = data.side;
    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  public joinGame(url: string): void {
    if (!this.ws) {
      this.ws = new WebSocket(url)
      if (!this.ws)
        throw("Failed To Connect WebSocket");
      this.openSocket();
    }
  }

  private openSocket(): void {
    if (!this.ws)
      throw("ws is undefined");
    this.ws.addEventListener("open", () => {
      if (!this.ws)
        throw("ws is undefined");

      if (this.side === "left") {
        this.player = new Player(this.ws, this.canvas, PaddleSide.Left);
      }
      else if (this.side === "right") {
        this.player = new Player(this.ws, this.canvas, PaddleSide.Right);
      }
      this.ws.addEventListener("message", (event) => {
        this.gameState = JSON.parse(event.data) as GameState;
        if (!this.gameState)
          throw("gameState is undefined");
      });
    });
    this.gameLoop();
  }

  public gameLoop(): void {
    if (!this.gameState) {
      requestAnimationFrame(this.gameLoop.bind(this));
      return ;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.renderBall();
    this.renderPaddle(this.gameState.paddleLeft);
    this.renderPaddle(this.gameState.paddleRight);
    this.checkPoints();
    this.checkIsGamePaused();
    this.checkIsWaiting();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private checkIsWaiting(): void {
    const display = document.getElementById("reconnect-overlay") as HTMLCanvasElement;

    if (this.gameState && this.gameState.status === "playing") {
      if (display) {
        display.classList.add("hidden");
      }
    }
    else if (this.gameState && this.gameState.status === "waiting for players") {
      if (display) {
        display.classList.remove("hidden");
      }
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (this.gameState && this.gameState.status !== "waiting for players") {
      if (["p", "P", " "].includes(event.key)) {
        event.preventDefault();
        this.sendPayLoad(event);
      }
    }
  }
}
