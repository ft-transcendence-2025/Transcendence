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

  constructor(wss: WebSocketServer) {
    wss.on("connection", (ws: WebSocket) => {
      const currentId = this.gameId++;
      let game = new Game();
      let gameState = game.gameState;

      this.games.set(currentId, gameState);

      if (ws.readyState === WebSocket.OPEN) {
        this.gameLoop(game, ws, currentId);
      }

      ws.on("message", (data) => {
        const msg: PayLoad = JSON.parse(data.toString());
        this.handleEvents(msg, game);
      });

      ws.on("close", () => {
        console.log("Client Disconnected");
        this.games.delete(currentId);
      });

      ws.on("error", (e) => { console.log(e); });
    });

    wss.on("error", (e) => { console.log(e); });
  }

  private gameLoop(game: Game, ws: WebSocket, currentId: number) {
    setInterval(() => {
      if (game.ball.isRunning) {
        game.ball.checkCeilingFloorCollision(game.canvas);
        game.ball.checkPaddleCollision(game.paddleLeft);
        game.ball.checkPaddleCollision(game.paddleRight);
        game.ball.move();
      }
      if (game.ball.pointScored(game.canvas)) {
        game.ball.isRunning = false;
        game.ball.reset(game.canvas);
      }
      game.paddleLeft.update(game.canvas);
      game.paddleRight.update(game.canvas);

      ws.send(JSON.stringify(this.games.get(currentId)));
    }, this.FPS60);
  }

  private handleEvents(msg: PayLoad, game: Game) {
    if (msg.type === "keydown") {
      if (msg.key === "s" || msg.key === "S")
        game.paddleLeft.state.moving.down = true;
      else if (msg.key === "w" || msg.key === "W")
        game.paddleLeft.state.moving.up = true;
      if (msg.key === "ArrowDown")
        game.paddleRight.state.moving.down = true;
      else if (msg.key === "ArrowUp")
        game.paddleRight.state.moving.up = true;
    }
    else if (msg.type === "keyup") {
      if (msg.key === "s" || msg.key === "S")
        game.paddleLeft.state.moving.down = false;
      else if (msg.key === "w" || msg.key === "W")
        game.paddleLeft.state.moving.up = false;
      if (msg.key === "ArrowDown")
        game.paddleRight.state.moving.down = false;
      else if (msg.key === "ArrowUp")
        game.paddleRight.state.moving.up = false;
    }
    if (msg.key === " ")
      game.ball.isRunning = true;
  }
}
