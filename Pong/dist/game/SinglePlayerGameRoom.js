import WebSocket from 'ws';
import { Game, } from "./Game.js";
import { getRandomAngle } from "./utils.js";
export class SinglePlayerGameRoom {
    constructor(id) {
        this.FPS60 = 1000 / 60;
        this.client = null;
        this.gameInterval = null;
        this.id = id;
        this.game = new Game();
    }
    cleanup() {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
    }
    addClient(ws) {
        if (!this.client) {
            this.client = ws;
        }
        else {
            this.client.close();
            this.client = ws;
        }
    }
    broadcast() {
        if (this.client && this.client.readyState === WebSocket.OPEN) {
            this.client.send(JSON.stringify(this.game.gameState));
        }
    }
    startGameLoop() {
        if (this.gameInterval)
            return;
        this.game.gameState.status = "playing";
        this.gameInterval = setInterval(() => {
            let point;
            if (this.game.gameState.ball.isRunning && !this.game.gameState.isPaused) {
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
                this.game.gameState.ball.isRunning = false;
                this.game.ball.reset(this.game.canvas);
                this.checkWinner();
            }
            this.game.paddleLeft.update(this.game.canvas);
            this.game.paddleRight.update(this.game.canvas);
            this.broadcast();
        }, this.FPS60);
    }
    checkWinner() {
        if (this.game.gameState.score.player1 === 3) {
            this.game.gameState.score.winner = 1;
        }
        else if (this.game.gameState.score.player2 === 3) {
            this.game.gameState.score.winner = 2;
        }
    }
    handleEvents(msg) {
        if (!this.game.gameState.isPaused) {
            if (msg.type === "keydown") {
                this.handdleKeyDown(msg.key);
            }
        }
        if (msg.type === "keyup") {
            this.handdleKeyUp(msg.key);
        }
        else if (msg.key === "p" || msg.key === "P") {
            this.game.gameState.isPaused = !this.game.gameState.isPaused;
        }
        if (msg.type === "command") {
            if (msg.key === "reset") {
                this.game.ball.reset(this.game.gameState.canvas);
                this.game.gameState.score.player1 = 0;
                this.game.gameState.score.player2 = 0;
                this.game.gameState.isPaused = false;
            }
        }
    }
    handdleKeyDown(key) {
        if (key === "s" || key === "S") {
            this.game.paddleLeft.state.moving.down = true;
        }
        else if (key === "w" || key === "W") {
            this.game.paddleLeft.state.moving.up = true;
        }
        else if (key === "ArrowDown") {
            this.game.paddleRight.state.moving.down = true;
        }
        else if (key === "ArrowUp") {
            this.game.paddleRight.state.moving.up = true;
        }
        if (key === " ") {
            if (!this.game.ball.isRunning)
                this.game.ball.angle = getRandomAngle();
            if (this.game.gameState.score.winner) {
                this.game.gameState.score.player1 = 0;
                this.game.gameState.score.player2 = 0;
                this.game.gameState.score.winner = null;
            }
            else {
                this.game.gameState.ball.isRunning = true;
            }
        }
    }
    handdleKeyUp(key) {
        if (key === "s" || key === "S") {
            this.game.paddleLeft.state.moving.down = false;
        }
        else if (key === "w" || key === "W") {
            this.game.paddleLeft.state.moving.up = false;
        }
        else if (key === "ArrowDown") {
            this.game.paddleRight.state.moving.down = false;
        }
        else if (key === "ArrowUp") {
            this.game.paddleRight.state.moving.up = false;
        }
    }
}
