import { canvas } from "./utils.js";
import { Paddle, PaddleSide } from "./Paddle.js";
import { Ball } from "./Ball.js";
;
export class Game {
    constructor() {
        this.canvas = canvas;
        this.startTime = performance.now();
        this.paddleLeft = new Paddle(canvas, PaddleSide.Left);
        this.paddleRight = new Paddle(canvas, PaddleSide.Right);
        this.ball = new Ball(canvas);
        this.gameState = {
            canvas: this.canvas,
            paddleLeft: this.paddleLeft.positionState,
            paddleRight: this.paddleRight.positionState,
            ballPosition: this.ball.positionState,
        };
    }
    ;
}
