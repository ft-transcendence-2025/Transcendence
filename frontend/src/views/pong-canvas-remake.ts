enum PaddleSide {
  Left = 0,
  Right = 1,
};

enum PaddleState {
  Up = 0,
  Down = 1,
}

export class Game {
  private canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
  private ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

  // Render image in the buffer before drawing in the canvas for performance
  private buffer = document.createElement("canvas") as HTMLCanvasElement;
  private bufferCtx = this.buffer.getContext("2d") as CanvasRenderingContext2D;

  private ball: Ball;
  private player1: Player;
  private player2: Player;

  constructor() {
    this.canvas.tabIndex = 0; // Make canvas focusable
    this.canvas.focus();
    this.canvas.width = 1000;
    this.canvas.height = 500;

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
    this.ball.move(this.canvas);
    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private render(): void {
    this.ball.render(this.ctx);
    this.player1.paddle.render(this.ctx);
    this.player2.paddle.render(this.ctx);
  }

}

class Ball {
  private color: string = "#fe019a";
  // line around the circle
  private strokeWidth: number = 2;
  private strokeColor: string = "#253031";

  public x: number;
  public y: number;
  public angle: number = degreeToRadians(45);
  public readonly radius: number = 8;
  public speed: number = 3;


  constructor(canvas: HTMLCanvasElement) {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
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
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
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

      const relativeY = this.y - paddle.y - paddle.height/2; // Calculate relative Y position on the paddle
      const normalized = relativeY / (paddle.height / 2);
      const clamped = Math.max(-1, Math.min(1, normalized)); // Make sure value is between [-1, 1];
      const maxBounceAngle = degreeToRadians(60); // 60 degrees in radians

      // Adjust ball position to avoid sticking
      if (paddle.side === PaddleSide.Left) {
        this.x = paddle.x + this.radius + paddle.width; // move ball to the right of the paddle
        this.angle = clamped * maxBounceAngle;
      } else if (paddle.side === PaddleSide.Right){
        this.angle = Math.PI - clamped * maxBounceAngle; // Set angle to π - bounceAngle (leftward)
        this.x = paddle.x - this.radius; // move ball to the left of the paddle
      }
    }
  }
}

class Paddle {
  public x: number = 0;
  public y: number;
  public readonly width: number = 15;
  public readonly height: number = 90;
  private color: string = "#49706c";
  private strokeColor: string = "#253031";
  private strokeWidth: number = 0;
  private speed: number = 4;
  public side: PaddleSide;

  public state = {
    up: false,
    down: false,
  };

  constructor(canvas: HTMLCanvasElement, side: PaddleSide) {
    this.y = canvas.height/2 - this.height/2;
    this.side = side;

    if (side === PaddleSide.Left)
      this.x = 5;
    else if (side === PaddleSide.Right)
      this.x = canvas.width - this.width - 5;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }

  public update(canvas: HTMLCanvasElement): void {
    if (this.state.up && this.y >= 0)
      this.y -= this.speed;
    if (this.state.down && this.y + this.height <= canvas.height)
      this.y += this.speed;
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

function degreeToRadians(degree: number): number {
  return degree * Math.PI/180;
}
