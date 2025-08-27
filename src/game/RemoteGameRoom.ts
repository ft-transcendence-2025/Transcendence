import WebSocket from 'ws'
import { Game, PayLoad } from "./Game.js";
import { Canvas, getRandomAngle, degreesToRadians } from "./utils.js";

export class RemoteGameRoom {
  public FPS60 = 1000/60;
  public id: number;
  public game: Game;
  public player1: WebSocket | null = null;
  public player2: WebSocket | null = null;
  private gameInterval: NodeJS.Timeout | null = null;

  constructor(gameId: number) {
    this.id = gameId;
    this.game = new Game();
  }

  public cleanup() {
    if (this.player1) {
      this.player1.close();
      this.player1 = null;
    }
    if (this.player2) {
      this.player2.close();
      this.player2 = null;
    }
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }

  public addPlayer(ws: WebSocket) {
    if (!this.player1 || this.player1 === ws)
      this.player1 = ws;
    else if (!this.player2 || this.player2 === ws)
      this.player2 = ws;
  }

  public broadcast() {
    if (this.player1 && this.player1.readyState === WebSocket.OPEN) {
      this.player1.send(JSON.stringify(this.game.gameState));
    }
    if (this.player2 && this.player2.readyState === WebSocket.OPEN) {
      this.player2.send(JSON.stringify(this.game.gameState));
    }
  }

  public startGameLoop(): void {
    if (this.gameInterval)
      return;
    this.gameInterval = setInterval(() => {
      let point;
      if (this.player1 && this.player2) {
        this.game.gameState.status = "playing";
      }
      else {
        this.game.gameState.status = "waiting for players";
      }

      if (this.game.gameState.status === "playing") {
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
      }

      this.broadcast();
    }, this.FPS60);
  }

  private checkWinner(): void {
    if (this.game.gameState.score.player1 === 3) {
      this.game.gameState.score.winner = 1;
    }
    else if (this.game.gameState.score.player2 === 3) {
      this.game.gameState.score.winner = 2;
    }
  }

  public handleEvents(msg: PayLoad) {
    if (!this.game.gameState.isPaused) {
      if (msg.type === "keydown") {
        this.handdleKeyDown(msg.key);
      }
    }
    if (msg.type === "keyup") {
      this.handdleKeyUp(msg.key);
    }
    else if (msg.key === "p" || msg.key === "P") {
      this.game.gameState.isPaused = !this.game.gameState.isPaused;
    }
    if (msg.type === "command") {
      if (msg.key === "reset") {
        this.game.ball.reset(this.game.gameState.canvas);
        this.game.gameState.score.player1 = 0;
        this.game.gameState.score.player2 = 0;
        this.game.gameState.isPaused = false;
      }
    }
  }

  private handdleKeyDown(key: string) {
    if (key === "s" || key === "S") {
      this.game.paddleLeft.state.moving.down = true;
    }
    else if (key === "w" || key === "W") {
      this.game.paddleLeft.state.moving.up = true;
    }
    else if (key === "ArrowDown") {
      this.game.paddleRight.state.moving.down = true;
    }
    else if (key === "ArrowUp") {
      this.game.paddleRight.state.moving.up = true;
    }
    if (key === " ") {
      if (!this.game.ball.isRunning)
        this.game.ball.angle = getRandomAngle();
      if (this.game.gameState.score.winner) {
        this.game.gameState.score.player1 = 0;
        this.game.gameState.score.player2 = 0;
        this.game.gameState.score.winner = null;
      }
      else {
        this.game.gameState.ball.isRunning = true;
      }
    }
  }

  private handdleKeyUp(key: string) {
    if (key === "s" || key === "S") {
      this.game.paddleLeft.state.moving.down = false;
    }
    else if (key === "w" || key === "W") {
      this.game.paddleLeft.state.moving.up = false;
    }
    else if (key === "ArrowDown") {
      this.game.paddleRight.state.moving.down = false;
    }
    else if (key === "ArrowUp") {
      this.game.paddleRight.state.moving.up = false;
    }
  }
}
