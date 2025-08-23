import { Canvas, getRandomAngle, degreesToRadians } from "./utils.js";
import { Paddle, PaddleSide, PaddleState } from "./Paddle.js";
import { Ball, BallState } from "./Ball.js";
import WebSocket from 'ws'

interface PayLoad {
  type: string,
  key: string,
}

export interface GameState {
  canvas: Canvas,
  paddleLeft: PaddleState,
  paddleRight: PaddleState,
  ball: BallState,
  score: {
    player1: number,
    player2: number,
    winner: 1 | 2 | null,
  },
  isPaused: boolean,
};

export class Game {
  public canvas: Canvas = {
    width: 1000,
    height: 500,
  };
  public paddleLeft: Paddle = new Paddle(this.canvas, PaddleSide.Left);
  public paddleRight: Paddle = new Paddle(this.canvas, PaddleSide.Right);
  public ball: Ball = new Ball(this.canvas);
  public gameState: GameState;

  constructor() {
    this.gameState = {
      canvas: this.canvas,
      paddleLeft: this.paddleLeft.state,
      paddleRight: this.paddleRight.state,
      ball: this.ball.state,
      score: {
        player1: 0,
        player2: 0,
        winner: null,
      },
      isPaused: false,
    };
  };

}

export class GameRoom {
  public FPS60 = 1000/60;
  public id: number;
  public game: Game;
  public clients: Set<WebSocket>;
  public player1: WebSocket | null = null;
  public player2: WebSocket | null = null;
  private gameInterval: NodeJS.Timeout | null = null;
  public gameMode: "singleplayer" | "multiplayer";

  constructor(id: number, gameMode: "singleplayer" | "multiplayer") {
    this.id = id;
    this.game = new Game();
    this.clients = new Set();
    this.gameMode = gameMode;
  }

  public broadcast() {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(this.game.gameState));
      }
    });
  }

  public startGameLoop() {
    if (this.gameInterval)
      return;
    this.gameInterval = setInterval(() => {
      let point;

      if (this.game.gameState.ball.isRunning && !this.game.gameState.isPaused) {
        this.game.ball.checkCeilingFloorCollision(this.game.canvas);
        this.game.ball.checkPaddleCollision(this.game.paddleLeft);
        this.game.ball.checkPaddleCollision(this.game.paddleRight);
        this.game.ball.move();
      }
      point = this.game.ball.pointScored(this.game.canvas);
      if (point !== 0) {
        if (point === 1)
          this.game.gameState.score.player1++;
        else 
          this.game.gameState.score.player2++;
        this.game.gameState.ball.isRunning = false;
        this.game.ball.reset(this.game.canvas);
        this.checkWinner();
      }
      this.game.paddleLeft.update(this.game.canvas);
      this.game.paddleRight.update(this.game.canvas);

      this.broadcast();
    }, this.FPS60);
  }

  private checkWinner(): void {
    if (this.game.gameState.score.player1 === 3) {
      this.game.gameState.score.winner = 1;
    }
    else if (this.game.gameState.score.player2 === 3) {
      this.game.gameState.score.winner = 2;
    }
  }

  public stopGameLoop() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }

  public addClientSinglePlayer(ws: WebSocket) {
    let role;
    this.clients.add(ws);

    if (!this.player1 && !this.player2) {
      this.player1 = ws;
      this.player2 = ws;
      role = "Player";
    }
    else
      role = "spectator";

    if (this.clients.size >= 1)
      this.startGameLoop();
    else {
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            status: "waiting for players"
          }));
        }
      });
    }

    // ws.send(JSON.stringify({ type: 'role', role }));
    ws.on('message', (data) => {
      const msg: PayLoad = JSON.parse(data.toString());
      this.handleEvents(msg);
    });
    ws.on('close', () => this.removeClient(ws));
    ws.on('error', () => this.removeClient(ws));
  }

  public addClientMultiPlayer(ws: WebSocket) {
    this.clients.add(ws);
    let role: string;

    if (!this.player1) {
      this.player1 = ws;
      role = "Player1";
    }
    else if (!this.player2) {
      this.player2 = ws;
      role = "Player1";
    }
    else
      role = "spectator";

    if (this.clients.size >= 2)
      this.startGameLoop();
    else {
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            status: "waiting for players"
          }));
        }
      });
    }

    // ws.send(JSON.stringify({ type: 'role', role }));
    ws.on('message', (data) => {
      const msg: PayLoad = JSON.parse(data.toString());
      this.handleEvents(msg);
    });
    ws.on('close', () => this.removeClient(ws));
    ws.on('error', () => this.removeClient(ws));
  }

  public removeClient(ws: WebSocket) {
    this.clients.delete(ws);
    if (ws === this.player1)
      this.player1 = null;
    else if (ws === this.player2) 
      this.player2 = null;
    else if (this.clients.size < 2) {
      this.stopGameLoop();
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            state: "waiting for players!"
          }));
        }
      });
    }
  }

  private handleEvents(msg: PayLoad) {
    if (!this.game.gameState.isPaused) {
      if (msg.type === "keydown") {
        if (msg.key === "s" || msg.key === "S")
          this.game.paddleLeft.state.moving.down = true;
        else if (msg.key === "w" || msg.key === "W")
            this.game.paddleLeft.state.moving.up = true;
        if (msg.key === "ArrowDown")
          this.game.paddleRight.state.moving.down = true;
        else if (msg.key === "ArrowUp")
            this.game.paddleRight.state.moving.up = true;
        if (msg.key === " ") {
          if (!this.game.ball.isRunning)
            this.game.ball.angle = getRandomAngle();
          if (this.game.gameState.score.winner) {
            this.game.gameState.score.player1 = 0;
            this.game.gameState.score.player2 = 0;
            this.game.gameState.score.winner = null;
          }
          else
            this.game.gameState.ball.isRunning = true;
        }
      }
    }
    if (msg.type === "keyup") {
      if (msg.key === "s" || msg.key === "S")
        this.game.paddleLeft.state.moving.down = false;
      else if (msg.key === "w" || msg.key === "W")
        this.game.paddleLeft.state.moving.up = false;
      if (msg.key === "ArrowDown")
        this.game.paddleRight.state.moving.down = false;
      else if (msg.key === "ArrowUp")
        this.game.paddleRight.state.moving.up = false;
    }
    else if (msg.key === "p" || msg.key === "P")
      this.game.gameState.isPaused = !this.game.gameState.isPaused;
  }
}
