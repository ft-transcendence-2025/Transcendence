import { gameRooms } from "./server.js";
export function socketConn(wss) {
    wss.on("connection", (ws, request, context) => {
        const gameId = context.gameId;
        const gameRoom = gameRooms.get(gameId);
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
