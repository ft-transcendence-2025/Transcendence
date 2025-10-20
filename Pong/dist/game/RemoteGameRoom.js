import WebSocket from "ws";
import { TimeToWait } from "./Game.js";
import { GameRoom } from "./GameRoom.js";
import { clearInterval } from "node:timers";
export class RemoteGameRoom extends GameRoom {
    constructor(id, player1) {
        super(id);
        this.player1 = null;
        this.player2 = null;
        this.gameInterval = null;
        this.player1Name = null;
        this.player2Name = null;
        this.timePlayerLeft = Date.now();
        this.isGameOverInProgress = false;
        this.player1StoredName = null;
        this.player2StoredName = null;
        this.player1Name = player1;
    }
    cleanup() {
        if (this.player1) {
            this.player1.close();
            this.player1 = null;
        }
        if (this.player2) {
            this.player2.close();
            this.player2 = null;
        }
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
    }
    addPlayer(ws, playerName) {
        if (ws == null)
            return -1;
        if (playerName !== this.player1Name && playerName !== this.player2Name) {
            return -1;
        }
        if (playerName === this.player1Name) {
            this.player1 = ws;
            this.game.gameState.player1Name = playerName;
        }
        else if (playerName === this.player2Name) {
            this.player2 = ws;
            this.game.gameState.player2Name = playerName;
        }
        return 0;
    }
    broadcast() {
        if (this.player1 && this.player1.readyState === WebSocket.OPEN) {
            this.player1.send(JSON.stringify(this.game.gameState));
        }
        if (this.player2 && this.player2.readyState === WebSocket.OPEN) {
            this.player2.send(JSON.stringify(this.game.gameState));
        }
    }
    startGameLoop() {
        if (this.gameInterval)
            return;
        this.gameInterval = setInterval(() => {
            let point;
            if (this.player1 && this.player2) {
                this.game.gameState.status = "playing";
                this.timePlayerLeft = Date.now();
                this.game.gameState.timeToWait = TimeToWait;
            }
            else {
                this.game.gameState.status = "waiting for players";
                this.waitingForPlayer();
            }
            if (this.game.gameState.status === "playing") {
                if (this.game.gameState.ball.isRunning && !this.game.gameState.isPaused) {
                    this.game.ball.checkCeilingFloorCollision(this.game.canvas);
                    this.game.ball.checkPaddleCollision(this.game.paddleLeft);
                    this.game.ball.checkPaddleCollision(this.game.paddleRight);
                    this.game.ball.move();
                }
                point = this.game.ball.pointScored(this.game.canvas);
                if (point !== 0) {
                    if (point === 1) {
                        this.game.gameState.score.player1++;
                    }
                    else {
                        this.game.gameState.score.player2++;
                    }
                    this.game.gameState.ball.isRunning = false;
                    this.game.ball.reset(this.game.canvas);
                    this.checkWinner();
                }
                this.game.paddleLeft.update(this.game.canvas);
                this.game.paddleRight.update(this.game.canvas);
            }
            this.broadcast();
            if (this.game.gameState.score.winner && !this.isGameOverInProgress) {
                this.gameOver();
                return;
            }
        }, this.FPS60);
    }
    waitingForPlayer() {
        if (!this.game.gameState || !this.player2Name || !this.player1Name)
            return;
        const timePassed = Date.now() - this.timePlayerLeft;
        if (timePassed >= 1000) {
            this.game.gameState.timeToWait -= 1;
            this.timePlayerLeft = Date.now();
        }
        // Set gameWinner when 45 seconds passed
        if (this.game.gameState.timeToWait <= 0) {
            if (!this.player1) {
                this.game.gameState.score.winner = 2;
            }
            else if (!this.player2) {
                this.game.gameState.score.winner = 1;
            }
        }
    }
    async gameOver() {
        if (this.isGameOverInProgress)
            return;
        this.isGameOverInProgress = true;
        if (!this.game.gameState.score.winner || !this.player1StoredName || !this.player2StoredName || !this.gameInterval)
            return;
        // Stop the game interval
        clearInterval(this.gameInterval);
        this.gameInterval = null;
        // Send final game state to both players before closing
        this.broadcast();
        const winner = this.game.gameState.score.winner === 1 ?
            this.player1StoredName : this.player2StoredName;
        const loser = this.game.gameState.score.winner === 2 ?
            this.player1StoredName : this.player2StoredName;
        if (this.onTournamentResult && winner && loser) {
            try {
                this.onTournamentResult({
                    winnerId: winner,
                    loserId: loser,
                    score: {
                        player1: this.game.gameState.score.player1,
                        player2: this.game.gameState.score.player2,
                    },
                });
            }
            catch (error) {
                console.error("[RemoteGameRoom] Tournament result callback failed:", error);
            }
        }
        const requestBody = {
            tournamentId: 0,
            player1: this.player1StoredName,
            player2: this.player2StoredName,
            score1: this.game.gameState.score.player1,
            score2: this.game.gameState.score.player2,
            winner: winner,
            startTime: Date.now(),
            endTime: Date.now(),
            finalMatch: false
        };
        try {
            const response = await fetch(`http://blockchain:3000/matches`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`POST failed with status ${response.status}: ${errorText}`);
            }
            else {
                const result = await response.json();
            }
        }
        catch (error) {
            console.error("Error saving match to blockchain:", error);
        }
        // Wait 6 seconds before closing connections to give clients time to receive final state and auto-navigate
        setTimeout(() => {
            if (this.player1) {
                this.player1.close();
                this.player1 = null;
            }
            if (this.player2) {
                this.player2.close();
                this.player2 = null;
            }
        }, 6000);
    }
}
