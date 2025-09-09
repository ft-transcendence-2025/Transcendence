import WebSocket from "ws";
import { Game, PayLoad,  } from "./Game.js";
import { Canvas, getRandomAngle, degreesToRadians } from "./utils.js";
import { GameRoom } from "./GameRoom.js";

export class SinglePlayerGameRoom extends GameRoom {
  public FPS60 = 1000/60;
  public client: WebSocket | null = null;
  private gameInterval: NodeJS.Timeout | null = null;

  constructor(id: number) {
    super(id)
  }

  public cleanup() {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }

  public addClient(ws: WebSocket): void {
    if (!this.client) {
      this.client = ws;
    }
    else {
      this.client.close();
      this.client = ws;
    }
  }

  public broadcast() {
    if (this.client && this.client.readyState === WebSocket.OPEN) {
      this.client.send(JSON.stringify(this.game.gameState));
    }
  }

  public startGameLoop() {
    if (this.gameInterval)
      return;
    this.game.gameState.status = "playing";
    this.gameInterval = setInterval(() => {
      let point;

      if (this.game.gameState.ball.isRunning && !this.game.gameState.isPaused) {
        this.game.ball.checkCeilingFloorCollision(this.game.canvas);
        this.game.ball.checkPaddleCollision(this.game.paddleLeft);
        this.game.ball.checkPaddleCollision(this.game.paddleRight);
        this.game.ball.move();
      }
      point = this.game.ball.pointScored(this.game.canvas);
      if (point !== 0) {
        if (point === 1)
          this.game.gameState.score.player1++;
          else 
          this.game.gameState.score.player2++;
        this.game.gameState.ball.isRunning = false;
        this.game.ball.reset(this.game.canvas);
        this.checkWinner();
      }
      this.game.paddleLeft.update(this.game.canvas);
      this.game.paddleRight.update(this.game.canvas);
      this.broadcast();
    }, this.FPS60);
  }
}
