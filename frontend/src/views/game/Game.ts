import { 
  GameState, Canvas, BallState, FetchData,
  PaddleState, PaddleSide, GameMode, SECOND, 
  degreesToRadians, getRandomAngle 
} from "./utils.js";
import { request, getHeaders } from "../../utils/api.js";
import { navigateTo } from "../../router/router.js";

export class Game {
  protected canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
  protected ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

  protected ws: WebSocket | null = null;

  protected gameState: GameState |  null = null;
  protected ballMoving: boolean = false;

  constructor() {
    this.canvas.tabIndex = 0;
    this.canvas.style.outline = "none";
    this.canvas.focus();
    this.canvas.width = 1000;
    this.canvas.height = 500;
  }

  protected checkIsGamePaused(): void {
    if (!this.gameState || !this.gameState.score)
      return ;
    if (this.gameState.score.winner)
      return ;
    if (this.gameState.status === "waiting for players" || !this.gameState.isPaused) {
      const gamePausedOverlay = document.getElementById("game-paused") as HTMLCanvasElement;

      if (gamePausedOverlay)
        gamePausedOverlay.classList.add("hidden");
    }
    else if (this.gameState.isPaused) {
      const gamePausedOverlay = document.getElementById("game-paused") as HTMLCanvasElement;

      if (gamePausedOverlay)
        gamePausedOverlay.classList.remove("hidden");
    }
  }

  protected renderBall(): void {
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

  protected renderPaddle(paddle: PaddleState): void {
    if (this.gameState) {
      this.ctx.fillStyle = "#43a17e";
      this.ctx.fillRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
      this.ctx.strokeStyle = "#21503f";
      this.ctx.lineWidth = 0;
      this.ctx.strokeRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
    }
  }

  protected checkPoints(ws: WebSocket | null): void {
    if (!this.gameState || !this.gameState.score) {
      return ;
    }

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
    else {
      this.hiddeGameOver();
    }
  }

  protected gameOver(player: 1 | 2): void {
    let winnerName: string;

    const gamePausedOverlay = document.getElementById("game-paused") as HTMLCanvasElement;
    if (gamePausedOverlay)
      gamePausedOverlay.classList.add("hidden");

    const gameOverText = document.getElementById("game-over") as HTMLDivElement;
    if (gameOverText) {
      const gameOverIsHidden = gameOverText.classList.contains("hidden");
      if (gameOverIsHidden)
        gameOverText.classList.remove('hidden');
    }
    const winnerText = document.getElementById("winner-text") as HTMLDivElement;
    if (winnerText) {
      if (player === 1) {
        const player1Name = document.getElementById("player1-name") as HTMLDivElement;
        if (player1Name) {
          winnerName = player1Name.innerHTML;
          winnerText.innerHTML = `${winnerName} WINS!`;
        }
      }
      else if (player === 2) {
        const player2Name = document.getElementById("player2-name") as HTMLDivElement;
        if (player2Name) {
          winnerName = player2Name.innerHTML;
          winnerText.innerHTML = `${winnerName} WINS!`;
        }
      }
    }
    if (this.ws)
      this.ws.close();
  }

  protected hiddeGameOver(): void {
    const gameOverText = document.getElementById("game-over") as HTMLDivElement;
    if (gameOverText)
      gameOverText.classList.add('hidden');
  }


  protected sendPayLoad(event: KeyboardEvent) {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payLoad = {
        type: "keydown",
        key: event.key,
      };
      this.ws.send(JSON.stringify(payLoad));
      this.ballMoving = true;
    }
  }

  protected leaveGame() {
    if (!this.ws) return ;

    this.ws.send(JSON.stringify({
      type: "command",
      key: "leave",
    }));
    this.ws.close();
    this.ws = null;
    const mode = window.location.search.split("=")[1];
    if (mode !== "remote") {
      localStorage.removeItem("GameMode");
    }
    const container = document.getElementById("content");

    if (mode === "localtournament") {
      navigateTo("/tournament-tree", container);
    }
    else {
      navigateTo("/dashboard", container);
    }
  }
}
