import { GameState, PaddleSide, PaddleState, degreesToRadians, getRandomAngle } from "./utils.js";

interface Point {
	x: number;
	y: number;
}

export class AI {
	private currPoint: Point = { x: 0, y: 0 };
	private prevPoint: Point = { x: 0, y: 0 };
	private angularCoeficient: number = 0;
	private linearCoeficient: number = 0;
	private targetY: number = 0;
	private dir: number = 0;
  private gameState: GameState | null;
  private side: PaddleSide;
  private ws: WebSocket;
  private loopIntervalId: number;

	constructor(ws: WebSocket, canvas: HTMLCanvasElement, side: PaddleSide, gameState: GameState | null) {
    this.gameState = gameState;
    this.ws = ws;
    this.side = side;

    this.currPoint = { x: canvas.height/2, y: canvas.width/2};
    this.prevPoint = { x: canvas.height/2, y: canvas.width/2};

    this.loopIntervalId = setInterval(() => {
      this.predictPossition(canvas, side, gameState);
      this.move(canvas);
    }, 20);
	}

  public cleanup(): void {
    if (this.ws)
      this.ws.close();
    clearInterval(this.loopIntervalId);
  }

  public updateGameState(gameState: GameState | null): void {
    this.gameState = gameState;
  }

	public predictPossition(canvas: HTMLCanvasElement, side: PaddleSide, gameState: GameState | null): void {
    if (this.gameState) {
      this.currPoint.x = this.gameState.ball.x;
      this.currPoint.y = this.gameState.ball.y;

      this.dir = this.currPoint.x - this.prevPoint.x;

      if (!this.gameState.ball.isRunning || this.ballIsOpossite(side))
        this.targetY = canvas.height/2;
      else
        this.targetY = this.getTargetY(canvas, side);


      this.prevPoint = { ...this.currPoint };
    }
    else
        this.targetY = canvas.height/2;
	}

	private ballIsOpossite(side: PaddleSide): boolean {
		if (this.dir > 0 && side === PaddleSide.Left)
			return true;
		else if (this.dir < 0 && side === PaddleSide.Right)
			return true;

		return false;
	}

	private getTargetY(canvas: HTMLCanvasElement, side: PaddleSide): number {
		const maxBounces: number = 10;
		let nbrBounces: number = 0;
		const targetX = side === PaddleSide.Right ? canvas.width : 0;
    let x: number = 0;
		let y: number = this.getYatX(targetX);


    if (this.gameState) {
      this.angularCoeficient = Math.tan(this.gameState.ball.angle);
      this.linearCoeficient = this.getLinearCoeficient({x: this.currPoint.x, y: this.currPoint.y});

      while ((y < 0 || y > canvas.height) && nbrBounces < maxBounces) {
        if (this.angularCoeficient > 0) {
          if (this.currPoint.x > this.prevPoint.x) { // Going bottom Right
            y = this.getYatX(canvas.width);
            if (y > canvas.height) { // Ball bouces bottom
              x = this.getXatY(canvas.height);
              this.angularCoeficient *= -1;
              this.linearCoeficient = this.getLinearCoeficient({x: x , y: canvas.height});
            }
          }
          else { // Going Top left
            y = this.getYatX(0);
            if (y < 0) { // Ball bouces top
              x = this.getXatY(0);
              this.angularCoeficient *= -1;
              this.linearCoeficient = this.getLinearCoeficient({x: x, y: 0});
            }
          }
        }
        else if (this.angularCoeficient < 0) {
          if (this.currPoint.x > this.prevPoint.x) { // Going top Right
            y = this.getYatX(canvas.width);
            if (y < 0) { // Ball bouces top
              x = this.getXatY(0);
              this.angularCoeficient *= -1;
              this.linearCoeficient = this.getLinearCoeficient({x: x, y: 0});
            }
          }
          else { // Going Bottom left
            y = this.getYatX(0);
            if (y > canvas.height) { // Ball bouces bottom
              x = this.getXatY(canvas.height);
              this.angularCoeficient *= -1;
              this.linearCoeficient = this.getLinearCoeficient({x: x, y: canvas.height});
            }
          }
        }
        else // Horizontal
          y = this.linearCoeficient;
        nbrBounces++;
      }
    }
		return y;
	}

	// b = y - xa
	private getLinearCoeficient(point: Point): number {
		return point.y - (point.x * this.angularCoeficient);
	}

	// y = ax + b
	private getYatX(x: number): number {
		return x * this.angularCoeficient + this.linearCoeficient;
	}

	// x = (y - b) / a;
	private getXatY(y: number): number {
		if (this.angularCoeficient > -0.01 && this.angularCoeficient < 0.01)
			return y;
		return (y - this.linearCoeficient) / this.angularCoeficient;
	}

  public move(canvas: HTMLCanvasElement): void {
    if (this.gameState) {
      const tolerance = this.gameState.paddleLeft.attr.height / 2;
      let paddleCenter: number;

      if (this.side === PaddleSide.Left)
        paddleCenter = this.gameState.paddleLeft.position.y + this.gameState.paddleLeft.attr.height/2;
      else
        paddleCenter = this.gameState.paddleRight.position.y + this.gameState.paddleLeft.attr.height/2;

      if (paddleCenter > this.targetY - tolerance &&
        paddleCenter < this.targetY + tolerance) { // Stop
        if (this.side === PaddleSide.Left) {
          this.handleKeyUp("w");
          this.handleKeyUp("s");
        }
        else if  (this.side === PaddleSide.Right){
          this.handleKeyUp("ArrowUp");
          this.handleKeyUp("ArrowDown");
        }
      }
      else if (paddleCenter > this.targetY + tolerance) { // Move Up
        if (this.side === PaddleSide.Left) {
          this.handleKeyDown("w");
          this.handleKeyUp("s");
        }
        else if (this.side === PaddleSide.Right) {
          this.handleKeyDown("ArrowUp");
          this.handleKeyUp("ArrowDown");
        }
      }
      else if (paddleCenter < this.targetY - tolerance) { // Move Down
        if (this.side === PaddleSide.Left) {
          this.handleKeyDown("s");
          this.handleKeyUp("w");
        }
        else if (this.side === PaddleSide.Right) {
          this.handleKeyUp("ArrowUp");
          this.handleKeyDown("ArrowDown");
        }
      }
    }
  }

  private handleKeyDown(key: string): void {
    const payLoad = {
      type: "keydown",
      key: key,
    };
    this.ws.send(JSON.stringify(payLoad));
  }

  private handleKeyUp(key: string): void {
    const payLoad = {
      type: "keyup",
      key: key,
    };
    this.ws.send(JSON.stringify(payLoad));
  }
}
