import { Paddle } from  "./Paddle.js";
import { PaddleSide, GameMode, degreesToRadians, getRandomAngle } from "./utils.js";
import { Ball } from "./Ball.js";
import { Player } from "./Player.js";
import { AI } from "./AI.js";

interface Canvas {
  width: number,
  height: number,
};

interface BallState {
  x: number,
  y: number,
  radius: number,
};


interface PaddleState {
  moving: {
    up: boolean,
    down: boolean,
  },
  position: {
    x: number,
    y: number,
  },
  attr: {
    width: number,
    height: number,
  }
}

interface GameState {
  canvas: Canvas,
  paddleLeft: PaddleState,
  paddleRight: PaddleState,
  ball: BallState,
  score: {
    player1: number,
    player2: number,
  },
};

export class Game {
  private canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
  private ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

  // Render image in the buffer before drawing in the canvas for performance
  private buffer = document.createElement("canvas") as HTMLCanvasElement;
  private bufferCtx = this.buffer.getContext("2d") as CanvasRenderingContext2D;

  private player1: Player | null = null;
  private player2: Player | null = null;
  private AI: AI | null = null;

  private ballMoving: boolean = false;
  private winningPoint: number = 3;

  private ws = new WebSocket("ws://localhost:4000/ws/gameSate");

  private gameState: GameState | null = null;

  constructor(...args: [] | [GameMode, PaddleSide]) {
    this.canvas.tabIndex = 0; // Make canvas focusable
    this.canvas.style.outline = "none"; // Remove blue focus outline
    this.canvas.focus();
    this.canvas.width = 1000;
    this.canvas.height = 500;

    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
    this.ws.addEventListener('open', () => {
      this.ws.addEventListener("message", (event) => {
        this.gameState = JSON.parse(event.data);
        this.canvas.tabIndex = 0; // Make canvas focusable
        this.canvas.focus();
        if (this.gameState) {
          this.canvas.width = this.gameState.canvas.width;
          this.canvas.height = this.gameState.canvas.height;
        }

        this.gameLoop();
      });
    });
    this.ws.addEventListener('error', e => console.error('error', e));


    // this.canvas.tabIndex = 0; // Make canvas focusable
    // this.canvas.focus();
    // this.canvas.width = 1000;
    // this.canvas.height = 500;
    //
    // this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
    //
    // this.buffer.width = this.canvas.width;
    // this.buffer.height = this.canvas.height;

    // this.ball = new Ball(this.canvas);
    //
    // if (args.length === 0)
    //   this.gamePvP();
    // else
    //   this.gamePvE(args[1]);
  }

  // private gamePvE(side: PaddleSide): void {
  //   if (!this.AI) {
  //     this.AI = new AI(this.canvas, side, this.ball);
  //   }
  //   if (side === PaddleSide.Left)
  //     this.player1 = new Player(this.canvas, PaddleSide.Right);
  //   else
  //     this.player1 = new Player(this.canvas, PaddleSide.Left);
  // }
  //
  // private gamePvP(): void {
  //   if (!this.player1)
  //     this.player1 = new Player(this.canvas, PaddleSide.Left);
  //   if (!this.player2)
  //     this.player2 = new Player(this.canvas, PaddleSide.Right);
  // }

  public gameLoop(): void {
    // this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.gameState) {
      this.renderBall();
      this.renderPaddle(this.gameState.paddleLeft);
      this.renderPaddle(this.gameState.paddleRight);
    }

    // if (this.player1) {
    //   this.player1.paddle.update(this.canvas);
    //   this.ball.checkPaddleCollision(this.player1.paddle);
    // }
    // if (this.player2) {
    //   this.player2.paddle.update(this.canvas);
    //   this.ball.checkPaddleCollision(this.player2.paddle);
    // }
    // if (this.AI) {
    //   this.AI.paddle.update(this.canvas);
    //   this.ball.checkPaddleCollision(this.AI.paddle);
    // }
    // this.ball.checkCeilingFloorCollision(this.canvas);
    //
    // if (this.ball.pointScored(this.canvas) === true) {
    //   this.gameState = false;
    //   this.checkPoints();
    // }
    // if (this.gameState === false)
    //   this.ball.reset(this.canvas);
    // else
    //   this.ball.move(this.canvas);
    // this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private renderBall(): void {
    if (this.gameState) {
      this.ctx.beginPath();
      this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, this.gameState.ball.radius, 0, Math.PI * 2); // Full circle
      this.ctx.fillStyle = "#FE4E00";
      this.ctx.fill();

      this.ctx.strokeStyle = "#253031";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private renderPaddle(paddle: PaddleState): void {
    this.ctx.fillStyle = "#5FAD56";
    this.ctx.fillRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
    this.ctx.strokeStyle =  "#396733";
    this.ctx.lineWidth = 0;
    this.ctx.strokeRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
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

  // Press Space to start the ball rolling
  // If the game is over Space will reset the game
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === " " && this.ballMoving === false) {
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

      if (this.ws.readyState === WebSocket.OPEN) {
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
