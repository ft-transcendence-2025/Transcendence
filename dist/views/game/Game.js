import { PaddleSide, getRandomAngle } from "./utils.js";
import { Ball } from "./Ball.js";
import { Player } from "./Player.js";
import { AI } from "./AI.js";
export class Game {
    constructor(...args) {
        this.canvas = document.getElementById("pong-canvas");
        this.ctx = this.canvas.getContext("2d");
        // Render image in the buffer before drawing in the canvas for performance
        this.buffer = document.createElement("canvas");
        this.bufferCtx = this.buffer.getContext("2d");
        this.player1 = null;
        this.player2 = null;
        this.AI = null;
        this.gameState = false;
        this.winningPoint = 3;
        this.canvas.tabIndex = 0; // Make canvas focusable
        this.canvas.focus();
        this.canvas.width = 1000;
        this.canvas.height = 500;
        this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
        this.buffer.width = this.canvas.width;
        this.buffer.height = this.canvas.height;
        this.ball = new Ball(this.canvas);
        if (args.length === 0)
            this.gamePvP();
        else
            this.gamePvE(args[1]);
    }
    gamePvE(side) {
        if (!this.AI) {
            this.AI = new AI(this.canvas, side, this.ball);
        }
        if (side === PaddleSide.Left)
            this.player1 = new Player(this.canvas, PaddleSide.Right);
        else
            this.player1 = new Player(this.canvas, PaddleSide.Left);
    }
    gamePvP() {
        if (!this.player1)
            this.player1 = new Player(this.canvas, PaddleSide.Left);
        if (!this.player2)
            this.player2 = new Player(this.canvas, PaddleSide.Right);
    }
    gameLoop() {
        this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.player1) {
            this.player1.paddle.update(this.canvas);
            this.ball.checkPaddleCollision(this.player1.paddle);
        }
        if (this.player2) {
            this.player2.paddle.update(this.canvas);
            this.ball.checkPaddleCollision(this.player2.paddle);
        }
        if (this.AI) {
            this.AI.paddle.update(this.canvas);
            this.ball.checkPaddleCollision(this.AI.paddle);
        }
        this.ball.checkCeilingFloorCollision(this.canvas);
        if (this.ball.pointScored(this.canvas) === true) {
            this.gameState = false;
            this.checkPoints();
        }
        if (this.gameState === false)
            this.ball.reset(this.canvas);
        else
            this.ball.move(this.canvas);
        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    checkPoints() {
        // Player 1 Wins
        const player1ScoreElement = document.getElementById(`player1-score`);
        if (player1ScoreElement) {
            const currentScore = parseInt(player1ScoreElement.innerHTML);
            if (currentScore === this.winningPoint) {
                this.gameOver(1);
            }
        }
        // Player 2 Wins
        const player2ScoreElement = document.getElementById(`player2-score`);
        if (player2ScoreElement) {
            const currentScore = parseInt(player2ScoreElement.innerHTML);
            if (currentScore === this.winningPoint) {
                this.gameOver(2);
            }
        }
    }
    // Display Game Over Div with the winner and final score
    gameOver(player) {
        const gameOverText = document.getElementById("game-over");
        if (gameOverText)
            gameOverText.classList.toggle('hidden');
        const winnerText = document.getElementById("winner-text");
        if (winnerText)
            winnerText.innerHTML = `Player ${player} WINS!`;
    }
    render() {
        this.ball.render(this.ctx);
        if (this.player1)
            this.player1.paddle.render(this.ctx);
        if (this.player2)
            this.player2.paddle.render(this.ctx);
        if (this.AI)
            this.AI.paddle.render(this.ctx);
    }
    // Press Space to start the ball rolling
    // If the game is over Space will reset the game
    handleKeyDown(event) {
        if (event.key === " " && this.gameState === false) {
            const gameOverDiv = document.getElementById("game-over");
            const isGameOver = !gameOverDiv.classList.contains("hidden");
            if (isGameOver) {
                // Reset scores
                // Find all elements whose ID ends with '-score'
                //  - [id] = Targets elements with an ID attribute
                //  - $= = "Ends with" operator
                //  - '-score' = The suffix to match
                document.querySelectorAll("[id$='-score']").forEach(el => {
                    el.textContent = "0";
                });
                gameOverDiv.classList.toggle("hidden");
                return;
            }
            this.ball.angle = getRandomAngle();
            this.gameState = true;
        }
    }
}
