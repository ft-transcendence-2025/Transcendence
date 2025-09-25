import { Game, PayLoad,  } from "./Game.js";
import { Canvas, getRandomAngle, degreesToRadians } from "./utils.js";

export class GameRoom {
  public FPS60 = 1000/60;
  public game: Game;
  public id: number | null;

  constructor(gameId: number | null) {
    this.id = gameId;
    this.game = new Game();
  }

  protected checkWinner(): void {
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
        this.game.gameState.isPaused = false;
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
