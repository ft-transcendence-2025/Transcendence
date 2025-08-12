import WebSocket from 'ws';
import { Game } from "./game/Game.js";
const FPS = 1000 / 60;
export async function socketConnetions(wss) {
    const games = new Map();
    let gameId = 0;
    wss.on("connection", (ws) => {
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
