import { Paddle } from  "./Paddle.js";
import { PaddleSide, PaddleState, degreesToRadians, getRandomAngle } from "./utils.js";
import { Ball } from "./Ball.js";
import { Player } from "./Player.js";
import { AI } from "./AI.js";

export class Game {
  private canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
  private ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

  // Render image in the buffer before drawing in the canvas for performance
  private buffer = document.createElement("canvas") as HTMLCanvasElement;
  private bufferCtx = this.buffer.getContext("2d") as CanvasRenderingContext2D;

  private ball: Ball;
  private player1: Player;
  private player2: Player;
  private AI: AI;

  private gameState: boolean = false;
  private winningPoint: number = 3;


  constructor() {
    this.canvas.tabIndex = 0; // Make canvas focusable
    this.canvas.focus();
    this.canvas.width = 1000;
    this.canvas.height = 500;

    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));

    this.buffer.width = this.canvas.width;
    this.buffer.height = this.canvas.height;

    this.ball = new Ball(this.canvas);
    this.player1 = new Player(this.canvas, PaddleSide.Left);
    this.player2 = new Player(this.canvas, PaddleSide.Right);
    this.AI = new AI(this.canvas, PaddleSide.Right, this.ball);
    
  }

  public gameLoop(): void {
    this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.player1.paddle.update(this.canvas);
    this.player2.paddle.update(this.canvas);
    this.ball.checkCeilingFloorCollision(this.canvas);
    this.ball.checkPaddleCollision(this.player1.paddle);
    this.ball.checkPaddleCollision(this.player2.paddle);
    if (this.ball.pointScored(this.canvas) === true) {
      this.gameState = false;
      this.checkPoints();
    }
    if (this.gameState === false)
      this.ball.reset(this.canvas);
    else
      this.ball.move(this.canvas);
    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private checkPoints(): void {
    // Player 1 Wins
    const player1ScoreElement = document.getElementById(`player1-score`) as HTMLSpanElement;
    if (player1ScoreElement) {
      const currentScore = parseInt(player1ScoreElement.innerHTML);
      if (currentScore === this.winningPoint) {
        this.gameOver(1);
      }
    }

    // Player 2 Wins
    const player2ScoreElement = document.getElementById(`player2-score`) as HTMLSpanElement;
    if (player2ScoreElement) {
      const currentScore = parseInt(player2ScoreElement.innerHTML);
      if (currentScore === this.winningPoint) {
        this.gameOver(2);
      }
    }
  }

  // Display Game Over Div with the winner and final score
  private gameOver(player: 1 | 2): void {
    const gameOverText = document.getElementById("game-over") as HTMLDivElement;
    if (gameOverText)
      gameOverText.classList.toggle('hidden');
    const winnerText = document.getElementById("winner-text") as HTMLDivElement;
    if (winnerText)
      winnerText.innerHTML = `Player ${player} WINS!`;
  }

  private render(): void {
    this.ball.render(this.ctx);
    this.player1.paddle.render(this.ctx);
    this.player2.paddle.render(this.ctx);
  }

  // Press Space to start the ball rolling
  // If the game is over Space will reset the game
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === " " && this.gameState === false) {
      const gameOverDiv = document.getElementById("game-over") as HTMLDivElement;
      const isGameOver = !gameOverDiv.classList.contains("hidden");
      if (isGameOver) {

        // Reset scores
        // Find all elements whose ID ends with '-score'
        //  - [id] = Targets elements with an ID attribute
        //  - $= = "Ends with" operator
        //  - '-score' = The suffix to match
        document.querySelectorAll("[id$='-score']").forEach(el => {
          (el as HTMLSpanElement).textContent = "0";
        });
        gameOverDiv.classList.toggle("hidden");
        return ;
      }
      this.ball.angle = getRandomAngle();
      this.gameState = true;
    }
  }
}
