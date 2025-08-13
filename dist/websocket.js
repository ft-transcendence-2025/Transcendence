import WebSocket from 'ws';
import { Game } from "./game/Game.js";
export class SocketConn {
    constructor(wss) {
        this.FPS60 = 1000 / 60;
        this.games = new Map();
        this.gameId = 0;
        wss.on("connection", (ws) => {
            const currentId = this.gameId++;
            let game = new Game();
            let gameState = game.gameState;
            this.games.set(currentId, gameState);
            if (ws.readyState === WebSocket.OPEN) {
                this.gameLoop(game, ws, currentId);
            }
            ws.on("message", (data) => {
                const msg = JSON.parse(data.toString());
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
    gameLoop(game, ws, currentId) {
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
    handleEvents(msg, game) {
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
