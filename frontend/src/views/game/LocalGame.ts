import { GameState, Canvas, BallState, FetchData, PaddleState, PaddleSide, GameMode, SECOND, degreesToRadians, getRandomAngle } from "./utils.js";
import { Player } from "./Player.js";
import { AI } from "./AI.js";
import { navigateTo } from "../../router/router.js";
import { Game } from "./Game.js";

export class LocalGame extends Game {
  private player1: Player | null = null;
  private player2: Player | null = null;
  private AI: AI | null = null;
  private updateAIIntervalId: number | null = null;

  private winningPoint: number = 3;

  private gameMode: string;

  constructor(gameMode: string, id: number) {
    super()
    this.gameMode = gameMode;

    if (gameMode === "localtournament") {
      this.joinGame(`wss://${window.location.host}/ws/game/localtournament/${id}`, this.gameMode);
    }
    else {
      this.joinGame(`wss://${window.location.host}/ws/game/local/${id}`, this.gameMode);
    }

    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
    const button = document.querySelector("#leave-game-btn") as HTMLButtonElement;
    if (button)
      button.addEventListener("click", this.leaveGame.bind(this))
  }

  public joinGame(url: string, gameMode: string) {
    if (!this.ws) {
      this.ws = new WebSocket(url)
      if (!this.ws)
        throw("Failed To Connect WebSocket");
      this.openSocket(gameMode);
    }
  }

  private openSocket(gameMode: string) {
    if (!this.ws)
      throw("ws is undefined");
    this.ws.addEventListener("open", () => {
      if (!this.ws)
        throw("ws is undefined");

      if (gameMode === "2player" || gameMode === "localtournament") {
        this.startLocalPvP();
      }
      else if (gameMode === "ai") {
        this.startLocalPvE(PaddleSide.Right);
      }

      this.ws.addEventListener("message", (event) => {
        this.gameState = JSON.parse(event.data) as GameState;
        if (!this.gameState)
          throw("gameState is undefined");
      });
    });
    this.gameLoop();
  };

  private startLocalPvP(): void {
    if (this.AI) {
      if (this.updateAIIntervalId)
        clearInterval(this.updateAIIntervalId);
      this.updateAIIntervalId = null;
      this.AI = null;
    }
    if (this.ws) {
      const gameMode = localStorage.getItem("GameMode");
      if (gameMode === "PvE") {
        const payLoad = {
          type: "command",
          key: "reset",
        };
        if (this.ws)
          this.ws.send(JSON.stringify(payLoad));
      }
      localStorage.setItem("GameMode", "PvP");
      this.player1 = new Player(this.ws, this.canvas, PaddleSide.Left);
      this.player2 = new Player(this.ws, this.canvas, PaddleSide.Right);
    }
  };

  private startLocalPvE(side: PaddleSide | undefined): void {
    if (this.player1) {
      this.player1 = null;
    }
    if (this.player2) {
      this.player2 = null;
    }
    if (this.ws) {
      const gameMode = localStorage.getItem("GameMode");
      if (gameMode === "PvP") {
        const payLoad = {
          type: "command",
          key: "reset",
        };
        if (this.ws)
          this.ws.send(JSON.stringify(payLoad));
      }
      localStorage.setItem("GameMode", "PvE");
      if (side === PaddleSide.Left) {
        this.player1 = new Player(this.ws, this.canvas, PaddleSide.Left);
        this.AI = new AI(this.ws, this.canvas, PaddleSide.Right, this.gameState);
      }
      else {
        this.player1 = new Player(this.ws, this.canvas, PaddleSide.Right);
        this.AI = new AI(this.ws, this.canvas, PaddleSide.Left, this.gameState);
      }
      if (this.AI) {
        this.updateAIGameState();
      }
    }
  }

  private updateAIGameState(): void {
    this.updateAIIntervalId = setInterval(() => {
      if (this.AI) {
        this.AI.updateGameState(this.gameState);
      }
    }, SECOND);
  }

  public gameLoop(): void {
    if (!this.gameState || !this.gameState.paddleLeft || !this.gameState.paddleRight) {
      requestAnimationFrame(this.gameLoop.bind(this));
      return ;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.gameState.status === "playing") {
      this.renderBall();
      this.renderPaddle(this.gameState.paddleLeft);
      this.renderPaddle(this.gameState.paddleRight);
      this.checkPoints(this.ws);
      this.checkIsGamePaused();
    }
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private async handleKeyDown(event: KeyboardEvent) {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (["p", "P", " "].includes(event.key)) {
      event.preventDefault();
      this.sendPayLoad(event);
      if (event.key === " " && this.gameState && this.gameState.score && this.gameState.score.winner) {
        this.leaveGame();
      }
    }
  }
}
