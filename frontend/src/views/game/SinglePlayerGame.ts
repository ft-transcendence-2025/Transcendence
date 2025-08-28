import { GameState, Canvas, BallState, FetchData, PaddleState, PaddleSide, GameMode, SECOND, degreesToRadians, getRandomAngle } from "./utils.js";
import { Player } from "./Player.js";
import { AI } from "./AI.js";

export class SinglePlayerGame {
  private canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
  private ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

  private player1: Player | null = null;
  private player2: Player | null = null;
  private AI: AI | null = null;
  private updateAIIntervalId: number | null = null;

  private ballMoving: boolean = false;
  private winningPoint: number = 3;
  private ws: WebSocket | null = null;

  private gameState: GameState | null = null;

  constructor(gameMode: string, data: FetchData) {
    this.canvas.tabIndex = 0;
    this.canvas.style.outline = "none";
    this.canvas.focus();
    this.canvas.width = 1000;
    this.canvas.height = 500;

    this.joinGame(`ws://localhost:4000/game/singleplayer/${data.id}`, gameMode);

    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  public joinGame(url: string, gameMode: string): void {
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

      if (gameMode === "2player") {
        this.startSinglePvP();
      }
      else if (gameMode === "ai") {
        this.startSinglePvE(PaddleSide.Right);
      }

      this.ws.addEventListener("message", (event) => {
        this.gameState = JSON.parse(event.data) as GameState;
        if (!this.gameState)
          throw("gameState is undefined");
      });
    });
    this.gameLoop();
  };

  private startSinglePvP(): void {
    if (this.AI) {
      if (this.updateAIIntervalId)
        clearInterval(this.updateAIIntervalId);
      this.updateAIIntervalId = null;
      this.AI = null;
    }
    if (this.ws) {
      const cookies = document.cookie.split(";");
      cookies.forEach((cookie) => {
        const mode = cookie.split("=");
        if (mode[0].trim() === "GameMode") {
          if (mode[1].trim() === "SinglePvE") {
            const payLoad = {
              type: "command",
              key: "reset",
            };
            if (this.ws)
              this.ws.send(JSON.stringify(payLoad));
          }
        }
      });
      document.cookie = "GameMode=SinglePvP";
      this.player1 = new Player(this.ws, this.canvas, PaddleSide.Left);
      this.player2 = new Player(this.ws, this.canvas, PaddleSide.Right);
    }
  };

  private startSinglePvE(side: PaddleSide | undefined): void {
    if (this.player1) {
      this.player1 = null;
    }
    if (this.player2) {
      this.player2 = null;
    }
    if (this.ws) {
      const cookies = document.cookie.split(";");
      cookies.forEach((cookie) => {
        const mode = cookie.split("=");
        if (mode[0].trim() === "GameMode") {
          if (mode[1].trim() === "SinglePvP") {
            const payLoad = {
              type: "command",
              key: "reset",
            };
            if (this.ws)
              this.ws.send(JSON.stringify(payLoad));
          }
        }
      });
      document.cookie = "GameMode=SinglePvE";
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
    if (!this.gameState) {
      requestAnimationFrame(this.gameLoop.bind(this));
      return ;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.gameState.status === "playing") {
      this.renderBall();
      this.renderPaddle(this.gameState.paddleLeft);
      this.renderPaddle(this.gameState.paddleRight);
      this.checkPoints();
      this.checkIsGamePaused();
    }
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private checkIsGamePaused(): void {
    if (this.gameState) {
      if (this.gameState.isPaused) {
        const gamePausedOverlay = document.getElementById("game-paused") as HTMLCanvasElement;

        if (gamePausedOverlay)
          gamePausedOverlay.classList.remove("hidden");
      }
      else {
        const gamePausedOverlay = document.getElementById("game-paused") as HTMLCanvasElement;

        if (gamePausedOverlay)
          gamePausedOverlay.classList.add("hidden");
      }
    }
  }

  private renderBall(): void {
    if (this.gameState && this.gameState.ball) {
      this.ctx.beginPath();
      this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, this.gameState.ball.radius, 0, Math.PI * 2); // Full circle
      this.ctx.fillStyle = "#FE4E00";
      this.ctx.fill();
      this.ctx.strokeStyle = "#253031";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ballMoving = this.gameState.ball.isRunning;
    }
  }

  private renderPaddle(paddle: PaddleState): void {
    if (this.gameState) {
      this.ctx.fillStyle = "#5FAD56";
      this.ctx.fillRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
      this.ctx.strokeStyle =  "#396733";
      this.ctx.lineWidth = 0;
      this.ctx.strokeRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
    }
  }

  private checkPoints(): void {
    if (this.gameState) {
      const player1ScoreElement = document.getElementById(`player1-score`) as HTMLSpanElement;
      if (player1ScoreElement) {
        player1ScoreElement.innerHTML = this.gameState.score.player1.toString();
      }

      // Player 2
      const player2ScoreElement = document.getElementById(`player2-score`) as HTMLSpanElement;
      if (player2ScoreElement) {
        player2ScoreElement.innerHTML = this.gameState.score.player2.toString();
      }

      if (this.gameState.score.winner) {
        this.gameOver(this.gameState.score.winner)
      }
      else
        this.hiddeGameOver();
    }
  }

  // Display Game Over Div with the winner and final score
  private gameOver(player: 1 | 2): void {
    const gameOverText = document.getElementById("game-over") as HTMLDivElement;
    if (gameOverText) {
      const gameOverIsHidden = gameOverText.classList.contains("hidden");
      if (gameOverIsHidden)
        gameOverText.classList.remove('hidden');
    }
    const winnerText = document.getElementById("winner-text") as HTMLDivElement;
    if (winnerText)
      winnerText.innerHTML = `Player ${player} WINS!`;
  }

  private hiddeGameOver(): void {
    const gameOverText = document.getElementById("game-over") as HTMLDivElement;
    if (gameOverText)
      gameOverText.classList.add('hidden');
  }

  // Press Space to start the ball rolling
  // If the game is over Space will reset the game
  private handleKeyDown(event: KeyboardEvent): void {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (["p", "P", " "].includes(event.key)) {
      event.preventDefault();
      this.sendPayLoad(event);
    }
  }

  private sendPayLoad(event: KeyboardEvent): void {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (["p", "P", " "].includes(event.key)) {
      event.preventDefault();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const payLoad = {
          type: "keydown",
          key: event.key,
        };
        this.ws.send(JSON.stringify(payLoad));
        this.ballMoving = true;
      }
    }
  }
}
