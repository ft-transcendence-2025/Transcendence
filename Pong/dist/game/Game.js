import { Paddle, PaddleSide } from "./Paddle.js";
import { Ball } from "./Ball.js";
export const TimeToWait = 45;
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
            player1Name: undefined,
            player2Name: undefined,
            status: "waiting for players",
            canvas: this.canvas,
            paddleLeft: this.paddleLeft.state,
            paddleRight: this.paddleRight.state,
            ball: this.ball.state,
            score: {
                player1: 0,
                player2: 0,
                winner: null,
            },
            isPaused: false,
            timeToWait: TimeToWait,
        };
    }
    ;
}
