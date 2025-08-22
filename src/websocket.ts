import WebSocket, { WebSocketServer } from 'ws'
import { GameRoom } from "./game/Game.js";
import { gameRooms } from "./server.js";

export function socketConn(wss: WebSocketServer): void {
  wss.on("connection", (ws: WebSocket, request: any, context: any) => {
    const gameId: number = context.gameId;
    const gameRoom: GameRoom | undefined = gameRooms.get(gameId);
    if (!gameRoom) {
      ws.close(4000, 'Game room not found');
      return;
    }
    if (gameRoom.gameMode === "singleplayer")
      gameRoom.addClientSinglePlayer(ws);
    else
      gameRoom.addClientMultiPlayer(ws);

    ws.on('close', () => gameRoom.removeClient(ws));
    ws.on("error", (e) => {
      console.log(e);
      gameRoom.removeClient(ws);
    });
  });

  wss.on("error", (e) => { console.log(e); });
}
