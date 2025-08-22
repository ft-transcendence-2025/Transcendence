import { Paddle, PaddleSide } from "./Paddle.js";
import { Ball } from "./Ball.js";
import WebSocket from 'ws';
;
export class Game {
    constructor() {
        this.canvas = {
            width: 1000,
            height: 500,
        };
        this.paddleLeft = new Paddle(this.canvas, PaddleSide.Left);
        this.paddleRight = new Paddle(this.canvas, PaddleSide.Right);
        this.ball = new Ball(this.canvas);
        this.gameState = {
            canvas: this.canvas,
            paddleLeft: this.paddleLeft.state,
            paddleRight: this.paddleRight.state,
            ball: this.ball.state,
            score: {
                player1: 0,
                player2: 0,
            }
        };
    }
    ;
}
export class GameRoom {
    constructor(id, gameMode) {
        this.FPS60 = 1000 / 60;
        this.player1 = null;
        this.player2 = null;
        this.gameInterval = null;
        this.id = id;
        this.game = new Game();
        this.clients = new Set();
        this.gameMode = gameMode;
    }
    broadcast() {
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(this.game.gameState));
            }
        });
    }
    startGameLoop() {
        if (this.gameInterval)
            return;
        this.gameInterval = setInterval(() => {
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
            this.broadcast();
        }, this.FPS60);
    }
    stopGameLoop() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
    }
    addClientSinglePlayer(ws) {
        let role;
        this.clients.add(ws);
        if (!this.player1 && !this.player2) {
            this.player1 = ws;
            this.player2 = ws;
            role = "Player";
        }
        else
            role = "spectator";
        if (this.clients.size >= 1)
            this.startGameLoop();
        else {
            this.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        status: "waiting for players"
                    }));
                }
            });
        }
        // ws.send(JSON.stringify({ type: 'role', role }));
        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            this.handleEvents(msg);
        });
        ws.on('close', () => this.removeClient(ws));
        ws.on('error', () => this.removeClient(ws));
    }
    addClientMultiPlayer(ws) {
        this.clients.add(ws);
        let role;
        if (!this.player1) {
            this.player1 = ws;
            role = "Player1";
        }
        else if (!this.player2) {
            this.player2 = ws;
            role = "Player1";
        }
        else
            role = "spectator";
        if (this.clients.size >= 2)
            this.startGameLoop();
        else {
            this.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        status: "waiting for players"
                    }));
                }
            });
        }
        // ws.send(JSON.stringify({ type: 'role', role }));
        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            this.handleEvents(msg);
        });
        ws.on('close', () => this.removeClient(ws));
        ws.on('error', () => this.removeClient(ws));
    }
    removeClient(ws) {
        this.clients.delete(ws);
        if (ws === this.player1)
            this.player1 = null;
        else if (ws === this.player2)
            this.player2 = null;
        else if (this.clients.size < 2) {
            this.stopGameLoop();
            this.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        state: "waiting for players!"
                    }));
                }
            });
        }
    }
    handleMessage(ws, msg) {
        if (ws === this.player1) {
            console.log(msg);
            // this.updatePaddle(msg, this.game.paddleLeft);
        }
        else if (ws === this.player2) {
            console.log(msg);
            // this.updatePaddle(msg, this.game.paddleRight);
        }
    }
    handleEvents(msg) {
        console.log(msg);
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
