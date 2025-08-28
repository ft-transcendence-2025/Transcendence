import { GameState, Canvas, BallState, FetchData, PaddleState, PaddleSide, GameMode, degreesToRadians, getRandomAngle } from "./utils.js";
import { Player } from "./Player.js";

export class RemoteGame {
  private canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
  private ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
  private updateAIIntervalId: number | null = null;

  private player: Player | null = null;
  private ws: WebSocket | null = null;
  private side: string | null = null;

  private gameState: GameState | null = null;
  private ballMoving: boolean = false;


  constructor(data: FetchData) {
    this.canvas.tabIndex = 0;
    this.canvas.style.outline = "none";
    this.canvas.focus();
    this.canvas.width = 1000;
    this.canvas.height = 500;

    this.side = data.side;
    this.joinGame(`ws://localhost:4000/game/remote/${data.id}`);

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
