import { Paddle } from "./Paddle.js";
import { PaddleSide } from "./utils.js";
var BallDir;
(function (BallDir) {
    BallDir[BallDir["upLeft"] = 0] = "upLeft";
    BallDir[BallDir["upRight"] = 1] = "upRight";
    BallDir[BallDir["downLeft"] = 2] = "downLeft";
    BallDir[BallDir["downRight"] = 3] = "downRight";
    BallDir[BallDir["horLeft"] = 4] = "horLeft";
    BallDir[BallDir["horRight"] = 5] = "horRight";
})(BallDir || (BallDir = {}));
;
export class AI {
    constructor(canvas, side, ball) {
        this.currPoint = { x: 0, y: 0 };
        this.prevPoint = { x: 0, y: 0 };
        this.angularCoeficient = 0;
        this.linearCoeficient = 0;
        this.targetY = 0;
        this.ballIsMoving = false;
        this.dir = 0;
        this.paddle = new Paddle(canvas, side);
        this.prevPoint = { x: ball.x, y: ball.y };
        this.currPoint = { x: ball.x, y: ball.y };
        this.predictPossition(canvas, side, ball);
        this.move(canvas);
    }
    predictPossition(canvas, side, ball) {
        setInterval(() => {
            this.currPoint.x = ball.x;
            this.currPoint.y = ball.y;
            this.dir = this.currPoint.x - this.prevPoint.x;
            // Check if ball is moving
            if (this.prevPoint.x === this.currPoint.x && this.prevPoint.y === this.currPoint.y ||
                this.ballIsOpossite(side)) {
                this.ballIsMoving = false;
                this.targetY = canvas.height / 2;
                this.prevPoint = { ...this.currPoint };
                return;
            }
            else
                this.ballIsMoving = true;
            this.targetY = this.getTargetY(canvas, side, ball);
            this.prevPoint = { ...this.currPoint };
        }, 100);
    }
    ballIsOpossite(side) {
        if (this.dir > 0 && side === PaddleSide.Left)
            return true;
        else if (this.dir < 0 && side === PaddleSide.Right)
            return true;
        return false;
    }
    getTargetY(canvas, side, ball) {
        let y = -1;
        let x = 0;
        const maxBounces = 10;
        let nbrBounces = 0;
        const targetX = this.paddle.side === PaddleSide.Right ? canvas.width : 0;
        this.angularCoeficient = Math.tan(ball.angle);
        this.linearCoeficient = this.getLinearCoeficient({ x: this.currPoint.x, y: this.currPoint.y });
        y = this.getYatX(targetX);
        while ((y < 0 || y > canvas.height) && nbrBounces < maxBounces) {
            if (this.angularCoeficient > 0) {
                if (this.currPoint.x > this.prevPoint.x) { // Going bottom Right
                    y = this.getYatX(canvas.width);
                    if (y > canvas.height) { // Ball bouces bottom
                        x = this.getXatY(canvas.height);
                        this.angularCoeficient *= -1;
                        this.linearCoeficient = this.getLinearCoeficient({ x: x, y: canvas.height });
                    }
                }
                else { // Going Top left
                    y = this.getYatX(0);
                    if (y < 0) { // Ball bouces top
                        x = this.getXatY(0);
                        this.angularCoeficient *= -1;
                        this.linearCoeficient = this.getLinearCoeficient({ x: x, y: 0 });
                    }
                }
            }
            else if (this.angularCoeficient < 0) {
                if (this.currPoint.x > this.prevPoint.x) { // Going top Right
                    y = this.getYatX(canvas.width);
                    if (y < 0) { // Ball bouces top
                        x = this.getXatY(0);
                        this.angularCoeficient *= -1;
                        this.linearCoeficient = this.getLinearCoeficient({ x: x, y: 0 });
                    }
                }
                else { // Going Bottom left
                    y = this.getYatX(0);
                    if (y > canvas.height) { // Ball bouces bottom
                        x = this.getXatY(canvas.height);
                        this.angularCoeficient *= -1;
                        this.linearCoeficient = this.getLinearCoeficient({ x: x, y: canvas.height });
                    }
                }
            }
            else // Horizontal
                y = this.linearCoeficient;
            nbrBounces++;
        }
        return y;
    }
    getLinearCoeficient(point) {
        return point.y - (point.x * this.angularCoeficient);
    }
    // y = ax + b
    getYatX(x) {
        return x * this.angularCoeficient + this.linearCoeficient;
    }
    // x = (y - b) / a;
    getXatY(y) {
        if (this.angularCoeficient > -0.01 && this.angularCoeficient < 0.01)
            return y;
        return (y - this.linearCoeficient) / this.angularCoeficient;
    }
    move(canvas) {
        const tolerance = this.paddle.height / 8;
        setInterval(() => {
            const paddleCenter = this.paddle.y + this.paddle.height / 2;
            if (paddleCenter > this.targetY - tolerance &&
                paddleCenter < this.targetY + tolerance) {
                this.paddle.state.down = false;
                this.paddle.state.up = false;
            }
            else if (paddleCenter > this.targetY + tolerance) {
                this.paddle.state.down = false;
                this.paddle.state.up = true;
            }
            else if (paddleCenter < this.targetY - tolerance) {
                this.paddle.state.up = false;
                this.paddle.state.down = true;
            }
        }, 25);
    }
}
