import WebSocket, { WebSocketServer } from 'ws'
import { Game, GameState } from "./game/Game.js";

const FPS = 1000/60;

export async function socketConnetions(wss: WebSocketServer) {

  const games = new Map<number, GameState>();
  let gameId: number = 0;

  wss.on("connection", (ws: WebSocket) => {
    const currentId = gameId++;
    let game = new Game();
    let gameState = game.gameState;

    games.set(currentId, gameState);

    if (ws.readyState === WebSocket.OPEN) {
      setInterval(() => {
        ws.send(JSON.stringify(games.get(currentId)));
      }, FPS);
    }

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.key === " ") {
        console.log("Start");
      }
    });
    
    ws.on("close", () => {
      console.log("Client Disconnected");
      games.delete(currentId);
    });

    ws.on("error", (e) => {
      console.log(e);
    });
  });

  wss.on("error", (e) => {
    console.log(e);
  });

}

