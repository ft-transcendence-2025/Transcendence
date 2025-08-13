import WebSocket, { WebSocketServer } from 'ws'
import { Game, GameState } from "./game/Game.js";

interface PayLoad {
  type: string,
  key: string,
}

export class SocketConn {
  private FPS60 = 1000/60;
  private games = new Map<number, GameState>();
  private gameId: number = 0;
  private game: Game = new Game();

  constructor(wss: WebSocketServer) {
    wss.on("connection", (ws: WebSocket) => {
      const currentId = this.gameId++;

      this.games.set(currentId, this.game.gameState);

      if (ws.readyState === WebSocket.OPEN) {
        this.gameLoop(ws, currentId);
      }

      ws.on("message", (data) => {
        const msg: PayLoad = JSON.parse(data.toString());
        this.handleEvents(msg);
      });

      ws.on("close", () => { this.games.delete(currentId); });
      ws.on("error", (e) => { console.log(e); });
    });

    wss.on("error", (e) => { console.log(e); });
  }

  private gameLoop(ws: WebSocket, currentId: number) {
    setInterval(() => {
      let point;
      if (this.game.ball.isRunning) {
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
        this.game.ball.isRunning = false;
        this.game.ball.reset(this.game.canvas);
      }
      this.game.paddleLeft.update(this.game.canvas);
      this.game.paddleRight.update(this.game.canvas);

      ws.send(JSON.stringify(this.games.get(currentId)));
    }, this.FPS60);
  }

  private handleEvents(msg: PayLoad) {
    if (msg.type === "keydown") {
      if (msg.key === "s" || msg.key === "S")
        this.game.paddleLeft.state.moving.down = true;
      else if (msg.key === "w" || msg.key === "W")
        this.game.paddleLeft.state.moving.up = true;
      if (msg.key === "ArrowDown")
        this.game.paddleRight.state.moving.down = true;
      else if (msg.key === "ArrowUp")
        this.game.paddleRight.state.moving.up = true;
    }
    else if (msg.type === "keyup") {
      if (msg.key === "s" || msg.key === "S")
        this.game.paddleLeft.state.moving.down = false;
      else if (msg.key === "w" || msg.key === "W")
        this.game.paddleLeft.state.moving.up = false;
      if (msg.key === "ArrowDown")
        this.game.paddleRight.state.moving.down = false;
      else if (msg.key === "ArrowUp")
        this.game.paddleRight.state.moving.up = false;
    }
    if (msg.key === " ")
      this.game.ball.isRunning = true;
  }
}
