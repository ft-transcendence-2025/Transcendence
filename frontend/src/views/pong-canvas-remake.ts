import { Paddle, PaddleSide, PaddleState} from  "./game/Paddle.js";

export class Game {
  private canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
  private ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

  // Render image in the buffer before drawing in the canvas for performance
  private buffer = document.createElement("canvas") as HTMLCanvasElement;
  private bufferCtx = this.buffer.getContext("2d") as CanvasRenderingContext2D;

  private ball: Ball;
  private player1: Player;
  private player2: Player;

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
    if (this.gameState === false) this.ball.reset(this.canvas);
    else this.ball.move(this.canvas);
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
class Ball {
  private color: string = "#fe019a";

  // line around the circle
  private strokeWidth: number = 2;
  private strokeColor: string = "#253031";

  public x: number;
  public y: number;
  public angle: number = getRandomAngle();
  public readonly radius: number = 8;
  private defaultSpeed: number = 4;
  private currentSpeed: number;
  private speedUpTime: number = 5000; // 5 seconds in milliseconds

  private firstHit: boolean = true;
  private startTime: DOMHighResTimeStamp;

  constructor(canvas: HTMLCanvasElement) {
    this.startTime = performance.now();
    this.currentSpeed = this.defaultSpeed/2;
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
  }

  // Check if a player scored a point
  // call updateScore to update the score
  public pointScored(canvas: HTMLCanvasElement): boolean {
    if (this.x + this.radius < 0) { // Player 2 Scored
      this.updateScore(2);
      return true;
    }
    else if (this.x - this.radius > canvas.width) { // Player 1 Scored
      this.updateScore(1);
      return true;
    }
    return false;
  }

  private updateScore(player: 1 | 2): void {
    const playerScoreElement = document.getElementById(`player${player}-score`) as HTMLSpanElement;
    if (playerScoreElement) {
      const currentScore = parseInt(playerScoreElement.innerHTML);
        playerScoreElement.innerHTML = (currentScore + 1).toString();
    }
}

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Full circle
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.stroke();
  }

  public move(canvas: HTMLCanvasElement): void {
    if (this.firstHit === false)
      this.currentSpeed = this.defaultSpeed/2; // Ball start slow before hiting the first paddle
    else if (this.firstHit === true && this.currentSpeed < this.defaultSpeed)
      this.currentSpeed = this.defaultSpeed;

    // Every 5 seconds the ball increases speed 10%
    if (performance.now() - this.startTime >= this.speedUpTime) {
      this.currentSpeed += this.currentSpeed / 10;
      this.startTime = performance.now();
    }

    this.x += Math.cos(this.angle) * this.currentSpeed;
    this.y += Math.sin(this.angle) * this.currentSpeed;
  }

  public reset(canvas: HTMLCanvasElement): void {
    this.startTime = performance.now();
    this.firstHit = false;
    this.x = canvas.width/2;
    this.y = canvas.height/2;
  }

  public checkCeilingFloorCollision(canvas: HTMLCanvasElement): void {
    if (this.y - this.radius <= 0){
      this.y = this.radius;
      this.angle *= -1;
    } else if (this.y + this.radius >= canvas.height) {
      this.y = canvas.height - this.radius;
      this.angle *= -1;
    }
  }

  // The ball angle change arcordingly to where it hit the paddle
  public checkPaddleCollision(paddle: Paddle): void {
    if (this.x + this.radius >= paddle.x &&
      this.x - this.radius <= paddle.x + paddle.width &&
      this.y + this.radius >= paddle.y &&
      this.y - this.radius <= paddle.y + paddle.height) {

      this.firstHit = true;

      const relativeY = this.y - paddle.y - paddle.height/2; // Calculate relative Y position on the paddle
      const normalized = relativeY / (paddle.height / 2);
      const clamped = Math.max(-1, Math.min(1, normalized)); // Make sure value is between [-1, 1];
      const maxBounceAngle = degreesToRadians(60); // 60 degrees in radians

      // Adjust ball position to avoid sticking
      if (paddle.side === PaddleSide.Left) {
        if (this.x - this.radius < paddle.x) // When the ball passed the paddle or hit the top or bottom
          return ;
        this.angle = clamped * maxBounceAngle;
      } else if (paddle.side === PaddleSide.Right){
        if (this.x > paddle.x) // When the ball passed the paddle or hit the top or bottom
          return ;
        this.angle = Math.PI - clamped * maxBounceAngle; // Set angle to PI - bounceAngle (leftward)
      }
    }
  }
}


class Player {
  public paddle: Paddle;
  private side: PaddleSide;

  constructor(canvas: HTMLCanvasElement, side: PaddleSide) {
    this.paddle = new Paddle(canvas, side);
    this.side = side;

    canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
    canvas.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Prevent default for all game control keys
    if (["s", "S", "w", "W", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (this.side === PaddleSide.Left) {
      if (event.key === "s" || event.key === "S") this.paddle.state.down = true;
      if (event.key === "w" || event.key === "W") this.paddle.state.up = true;
    } else if (this.side === PaddleSide.Right) {
      if (event.key === "ArrowDown") this.paddle.state.down = true;
      if (event.key === "ArrowUp") this.paddle.state.up = true;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (this.side === PaddleSide.Left) {
      if (event.key === "s" || event.key === "S") this.paddle.state.down = false;
      if (event.key === "w" || event.key === "W") this.paddle.state.up = false;
    } else if (this.side === PaddleSide.Right) {
      if (event.key === "ArrowDown") this.paddle.state.down = false;
      if (event.key === "ArrowUp") this.paddle.state.up = false;
    }
  }
}

function degreesToRadians(degree: number): number {
  return degree * Math.PI/180;
}

function getRandomAngle(): number {
  const minDeg = -45;
  const maxDeg = 45;
  const randomDeg = Math.random() * (maxDeg - minDeg) + minDeg;
  const rng = Math.random();

  if (rng < 0.5)
    return degreesToRadians(randomDeg) + Math.PI;
  return degreesToRadians(randomDeg);
}
