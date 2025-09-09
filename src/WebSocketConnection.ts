import WebSocket, { WebSocketServer } from 'ws'
import { PayLoad } from "./game/Game.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";
import { RemoteGameRoom } from "./game/RemoteGameRoom.js";
import { fastify, singlePlayerGameRooms, remoteGameRooms, customGameRoom } from "./server.js";

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
      const gameId: number = context.gameId;
      const mode: string = context.mode;

      if (mode === "singleplayer") {
        this.singlePlayerConnection(ws, gameId);
      }
      else if (mode === "remote") {
        this.remoteConnection(ws, gameId);
      }
      else if (mode === "custom") {
        this.customConnection(ws, gameId);
      }
    });

    this.wss.on("error", (e) => {
      console.log(e);
    });
  }

  private customConnection(ws: WebSocket, gameId: number) {
    let gameRoom: RemoteGameRoom | undefined = customGameRoom.get(gameId);
    if (gameRoom === undefined) {
      ws.close();
      return;
    }
    else {
      gameRoom.addPlayer(ws);
      gameRoom.startGameLoop();
    }

    ws.on("message", (data) => {
      const msg: PayLoad = JSON.parse(data.toString());
      if (gameRoom !== undefined) {
        gameRoom.handleEvents(msg);
      }
    });

    ws.on("close", () => {
      if (gameRoom !== undefined) {
        if (gameRoom.player1 === ws){
          gameRoom.player1.close();
          gameRoom.player1 = null;
        }
        if (gameRoom.player2 === ws){
          gameRoom.player2.close();
          gameRoom.player2 = null;
        }
      }
    });

    ws.on("error", (e) => {
      console.log(e);
      if (gameRoom !== undefined) {
        remoteGameRooms.delete(gameRoom.id);
        gameRoom.cleanup(); 
      }
    });
  }

  private remoteConnection(ws: WebSocket, gameId: number) {
    let gameRoom: RemoteGameRoom | undefined = remoteGameRooms.get(gameId);
    if (gameRoom === undefined) {
      ws.close();
      return;
    }
    else {
      gameRoom.addPlayer(ws);
      gameRoom.startGameLoop();
    }

    ws.on("message", (data) => {
      const msg: PayLoad = JSON.parse(data.toString());
      if (gameRoom !== undefined) {
        gameRoom.handleEvents(msg);
      }
    });

    ws.on("close", () => {
      if (gameRoom !== undefined) {
        if (gameRoom.player1 === ws){
          gameRoom.player1.close();
          gameRoom.player1 = null;
        }
        if (gameRoom.player2 === ws){
          gameRoom.player2.close();
          gameRoom.player2 = null;
        }
      }
    });

    ws.on("error", (e) => {
      console.log(e);
      if (gameRoom !== undefined) {
        remoteGameRooms.delete(gameRoom.id);
        gameRoom.cleanup(); 
      }
    });
  }

  private singlePlayerConnection(ws: WebSocket, gameId: number) {
    let gameRoom: SinglePlayerGameRoom | undefined = singlePlayerGameRooms.get(gameId);
    if (gameRoom === undefined) {
      ws.close();
      return;
    }
    else {
      gameRoom.addClient(ws);
      gameRoom.startGameLoop();
    }

    ws.on('message', (data) => {
      const msg: PayLoad = JSON.parse(data.toString()); //POST MATCH
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
      else if (pathname.startsWith("/game/remote/")) {
        gameId = parseInt(pathname.split('/')[3]);
        mode = "remote";

        if (isNaN(gameId)) {
          socket.destroy();
          return;
        }
      }
      else if (pathname.startsWith("/game/custom/")) {
        gameId = parseInt(pathname.split('/')[3]);
        mode = "custom";

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
