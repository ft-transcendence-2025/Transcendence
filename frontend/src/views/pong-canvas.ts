class Paddle {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;
  private _yD: number;
  private _lineThickness: number;
  private _color: string;
  private _strokeColor: string;

  get x(): number {
    return this._x;
  }
  get y(): number {
    return this._y;
  }
  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    yD: number,
    lineThickness: number,
    color: string,
    strokeColor: string,
  ) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._yD = yD;
    this._lineThickness = lineThickness;
    this._color = color;
    this._strokeColor = strokeColor;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this._color;
    ctx.fillRect(this._x, this._y, this._width, this._height);
    ctx.strokeStyle = this._strokeColor;
    ctx.lineWidth = this._lineThickness;
    ctx.strokeRect(this._x, this._y, this._width, this._height);
  }

  move(direction: string, canvas: HTMLCanvasElement): void {
    if (
      direction === "Down" &&
        this._y + this._height + (this._lineThickness / 2) <= canvas.height
    )
      this._y += this._yD;
      else if (direction === "Up" && this.y - (this._lineThickness / 2) >= 0)
        this._y -= this._yD;
  }
}

class Ball {
  private _x: number;
  private _y: number;
  private _radius: number;
  private _color: string;
  private _strokeColor: string;
  private _yD: number;
  private _xD: number;
  private _originalYD: number;
  private _originalXD: number;
  private _lineThickness: number;
  private _gameState: boolean;
  private _winningScore: number = 5;
  private _level: number = 1;

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    strokeColor: string,
    xD: number,
    yD: number,
    lineThickness: number,
  ) {
    this._x = x;
    this._y = y;
    this._radius = radius;
    this._color = color;
    this._strokeColor = strokeColor;
    this._xD = xD;
    this._yD = yD;
    this._originalXD = xD;
    this._originalYD = yD;
    this._lineThickness = lineThickness;
    this._gameState = false;
  }

  // Ball running or stoped
  set setGameState(state: boolean) {
    this._gameState = state;
  }
  get getGameState(): boolean {
    return this._gameState;
  }

  // Return true if game is over, false if is not
  public update(
    leftPaddle: Paddle,
    rightPaddle: Paddle,
    canvas: HTMLCanvasElement,
  ): void {

    // Someone has scored
    // Player 2 Scores
    if (this._x - this._radius < 0) {
      this._gameState = false;
      this.handleScore(2);
    } else if (this._x + this._radius > canvas.width) { // Player 1 Scored
      this._gameState = false;
      this.handleScore(1);
    }

    if (this._gameState === true) {
      if (Math.floor((performance.now() / 1000 / this._level)) % 5 === 0) {
        this._xD *= 1.10;
        this._yD *= 1.10;
        this._level++;
      }

      // Game is running
      this._x += this._xD;
      this._y += this._yD;

      // Change ball directions if hit ceiling, floor or paddles
      if (
        this.checkPaddleCollision(leftPaddle) ||
          this.checkPaddleCollision(rightPaddle)
      )
        this._xD *= -1;
      if (this.checkCeilingFloorCollision(canvas)) this._yD *= -1;
    } else { // Game is stopped
      // Randomize ball direction
      this._xD = Math.random() < 0.5 ? -this._xD : this._xD;
      this._yD = Math.random() < 0.5 ? -this._yD : this._yD;

      this._x = canvas.width / 2;
      this._y = canvas.height / 2;
      this._level = 1;
      this._xD = this._originalXD;
      this._yD = this._originalYD;
    }
  }

  private handleScore(player: 1 | 2): void {
    const playerScoreElement = document.getElementById(`player${player}-score`) as HTMLSpanElement;
    if (playerScoreElement) {
        const currentScore = parseInt(playerScoreElement.innerHTML);

      if (currentScore === this._winningScore - 1) {
        const gameOverText = document.getElementById("game-over") as HTMLDivElement;
        if (gameOverText)
          gameOverText.classList.toggle('hidden');

        // Reset scores
        // Find all elements whose ID ends with '-score'
        //  - [id] = Targets elements with an ID attribute
        //  - $= = "Ends with" operator
        //  - '-score' = The suffix to match
        document.querySelectorAll("[id$='-score']").forEach(el => {
          (el as HTMLSpanElement).textContent = "0";
        });

        const winnerText = document.getElementById("winner-text") as HTMLDivElement;
        if (winnerText)
          winnerText.innerHTML = `Player ${player} WINS!`;


      } else {
        playerScoreElement.innerHTML = (currentScore + 1).toString();
      }
    }
  }


  public render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this._x, this._y, this._radius, 0, Math.PI * 2); // Full circle
    ctx.fillStyle = this._color;
    ctx.fill();

    // line around the circle
    ctx.strokeStyle = this._strokeColor;
    ctx.lineWidth = this._lineThickness;
    ctx.stroke();
  }

  checkPaddleCollision(paddle: Paddle): boolean {
    if (
      this._x + this._radius >= paddle.x &&
        this._x - this._radius <= paddle.x + paddle.width
    ) {
      // horizontal range
      if (
        this._y + this._radius >= paddle.y &&
          this._y - this._radius <= paddle.y + paddle.height
      )
        // vertical range
        return true;
    }
    return false;
  }

  checkCeilingFloorCollision(canvas: HTMLCanvasElement): boolean {
    if (this._y - this._radius <= 0 || this._y + this._radius >= canvas.height)
      return true;
    return false;
  }
}

export class Pong {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private paddleHeight: number;
  private paddleWidth: number;
  private paddleY: number;
  private paddleD: number;
  private lineThickness: number;
  private paddleColor: string;
  private paddleStrokeColor: string;
  private leftPaddleX: number;
  private rightPaddleX: number;
  private ballX: number;
  private ballY: number;
  private ballRadius: number;
  private ballColor: string;
  private ballStrokeColor: string;
  private ballXD: number;
  private ballYD: number;
  private ballLineThickness: number;
  private leftPaddle: Paddle;
  private rightPaddle: Paddle;
  private ball: Ball;
  private animationFrameId: number | null = null;

  // Check if paddles are moving or stationary
  private paddleState = {
    leftUp: false,
    leftDown: false,
    rightUp: false,
    rightDown: false,
  };


  constructor() {
    this.canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
    this.canvas.tabIndex = 0; // Make canvas focusable
    this.canvas.width = 1600;
    this.canvas.height = 700;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    // Change objects atributes
    this.paddleHeight = this.canvas.width / 12;
    this.paddleWidth = window.innerWidth / 100;
    this.paddleY = this.canvas.height / 2 - this.paddleHeight / 2;
    this.paddleD = 7; // travel velocity
    this.lineThickness = 2;
    this.paddleColor = "#49706c";
    this.paddleStrokeColor = "#253031";
    this.leftPaddleX = 5;
    this.rightPaddleX = this.canvas.width - this.paddleWidth - 5;

    this.ballX = this.canvas.width / 2;
    this.ballY = this.canvas.height / 2;
    this.ballRadius = 8;
    this.ballColor = "#fe019a";
    this.ballStrokeColor = "#253031";
    this.ballXD = 5; // travel velocity on X axis
    this.ballYD = 1.5; // travel velocity on Y axis
    this.ballLineThickness = 2;

    // Initialize objects
    this.leftPaddle = new Paddle(
      this.leftPaddleX,
      this.paddleY,
      this.paddleWidth,
      this.paddleHeight,
      this.paddleD,
      this.lineThickness,
      this.paddleColor,
      this.paddleStrokeColor,
    );
    this.rightPaddle = new Paddle(
      this.rightPaddleX,
      this.paddleY,
      this.paddleWidth,
      this.paddleHeight,
      this.paddleD,
      this.lineThickness,
      this.paddleColor,
      this.paddleStrokeColor,
    );
    this.ball = new Ball(
      this.ballX,
      this.ballY,
      this.ballRadius,
      this.ballColor,
      this.ballStrokeColor,
      this.ballXD,
      this.ballYD,
      this.ballLineThickness,
    );

    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
    this.canvas.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  public gameLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // clear buffer

    // Check paddle state and adjust X and Y accordingly
    if (this.paddleState.leftUp) this.leftPaddle.move("Up", this.canvas);
    if (this.paddleState.leftDown) this.leftPaddle.move("Down", this.canvas);
    if (this.paddleState.rightUp) this.rightPaddle.move("Up", this.canvas);
    if (this.paddleState.rightDown) this.rightPaddle.move("Down", this.canvas);

    this.ball.update(this.leftPaddle, this.rightPaddle, this.canvas);

    this.renderObjects();

    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  private renderObjects(): void {
    this.leftPaddle.render(this.ctx);
    this.rightPaddle.render(this.ctx);
    this.ball.render(this.ctx);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Prevent default for all game control keys
    if (["s", "S", "w", "W", "ArrowDown", "ArrowUp", " "].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === "s" || event.key === "S")
      this.paddleState.leftDown = true;
    if (event.key === "w" || event.key === "W") this.paddleState.leftUp = true;
    if (event.key === "ArrowDown") this.paddleState.rightDown = true;
    if (event.key === "ArrowUp") this.paddleState.rightUp = true;
    if (event.key === " ") {
      const gameOverDiv = document.getElementById("game-over") as HTMLDivElement;
      const isGameOver = !gameOverDiv.classList.contains("hidden");
      if (isGameOver) {
        gameOverDiv.classList.toggle("hidden");
        return ;
      }

      this.ball.setGameState = true;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (event.key === "s" || event.key === "S") this.paddleState.leftDown = false;
    if (event.key === "w" || event.key === "W") this.paddleState.leftUp = false;
    if (event.key === "ArrowDown") this.paddleState.rightDown = false;
    if (event.key === "ArrowUp") this.paddleState.rightUp = false;
  }
}
