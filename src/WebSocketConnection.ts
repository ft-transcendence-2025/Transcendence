import WebSocket, { WebSocketServer } from 'ws'
import { PayLoad } from "./game/Game.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";
import { fastify, singlePlayerGameRooms } from "./server.js";

export class WebSocketConnection {
  private server: any;
  private wss: WebSocketServer;

  constructor(server: any) {
    this.server = server;
    this.wss = new WebSocketServer({ noServer: true });

    this.upgrade();
    this.connection();
  }

  public connection(): void {
    this.wss.on("connection", (ws: WebSocket, request: any, context: any) => {
      let gameRoom: SinglePlayerGameRoom | undefined;
      const gameId: number = context.gameId;
      const mode: string = context.mode;

      if (mode === "singleplayer") {
        gameRoom = singlePlayerGameRooms.get(gameId);
        if (gameRoom === undefined) {
          ws.close();
          return;
        }
        else {
          gameRoom.addClient(ws);
          gameRoom.startGameLoop();
        }
      }

      ws.on('message', (data) => {
        const msg: PayLoad = JSON.parse(data.toString());
        if (gameRoom !== undefined) {
          gameRoom.handleEvents(msg);
        }
      });


      ws.on("error", (e) => {
        console.log(e);
        if (gameRoom !== undefined) {
          singlePlayerGameRooms.delete(gameRoom.id);
          gameRoom.cleanup(); 
        }
      });
    });
    this.wss.on("error", (e) => { console.log(e); });
  }

  public upgrade(): void {
    this.server.on("upgrade", (request: any, socket: any, head: any) => {
      const pathname = request.url?.split("?")[0] || "";
      let gameId: number;
      let mode: string;

      if (pathname.startsWith("/game/singleplayer/")) {
        gameId = parseInt(pathname.split('/')[3]);
        mode = "singleplayer";

        if (isNaN(gameId)) {
          socket.destroy();
          return;
        }
      }

      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request, { gameId, mode });
      });
    });
  }
}
