import { WebSocketServer } from 'ws';
import { singlePlayerGameRooms, remoteGameRooms } from "./server.js";
export class WebSocketConnection {
    constructor(server) {
        this.server = server;
        this.wss = new WebSocketServer({ noServer: true });
        this.upgrade();
        this.connection();
    }
    connection() {
        this.wss.on("connection", (ws, request, context) => {
            const gameId = context.gameId;
            const mode = context.mode;
            if (mode === "singleplayer") {
                this.singlePlayerConnection(ws, gameId);
            }
            else if (mode === "remote") {
                this.remoteConnection(ws, gameId);
            }
        });
        this.wss.on("error", (e) => {
            console.log(e);
        });
    }
    remoteConnection(ws, gameId) {
        let gameRoom = remoteGameRooms.get(gameId);
        if (gameRoom === undefined) {
            ws.close();
            return;
        }
        else {
            gameRoom.addPlayer(ws);
            gameRoom.startGameLoop();
        }
        ws.on("message", (data) => {
            const msg = JSON.parse(data.toString());
            if (gameRoom !== undefined) {
                gameRoom.handleEvents(msg);
            }
        });
        ws.on("close", () => {
            if (gameRoom !== undefined) {
                if (gameRoom.player1 === ws) {
                    gameRoom.player1.close();
                    gameRoom.player1 = null;
                }
                if (gameRoom.player2 === ws) {
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
    singlePlayerConnection(ws, gameId) {
        let gameRoom = singlePlayerGameRooms.get(gameId);
        if (gameRoom === undefined) {
            ws.close();
            return;
        }
        else {
            gameRoom.addClient(ws);
            gameRoom.startGameLoop();
        }
        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
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
    upgrade() {
        this.server.on("upgrade", (request, socket, head) => {
            const pathname = request.url?.split("?")[0] || "";
            let gameId;
            let mode;
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
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request, { gameId, mode });
            });
        });
    }
}
