import { degreesToRadians, getRandomAngle } from "./utils.js";
import { PaddleSide } from "./Paddle.js";
;
export class Ball {
    ;
    ;
    constructor(canvas) {
        this.color = "#FE4E00";
        // line around the circle
        this.strokeWidth = 2;
        this.strokeColor = "#253031";
        this.angle = getRandomAngle();
        this.radius = 8;
        this.defaultSpeed = 10;
        this.currentSpeed = this.defaultSpeed / 2;
        this.firstHit = true;
        this.startTime = performance.now();
        this.positionState = {
            x: canvas.width / 2,
            y: canvas.height / 2,
        };
    }
    // Check if a player scored a point
    pointScored(canvas) {
        if (this.positionState.x + this.radius < 0) {
            // Player 2 Scored
            return true;
        }
        else if (this.positionState.x - this.radius > canvas.width) {
            // Player 1 Scored
            return true;
        }
        return false;
    }
    move(canvas) {
        if (this.firstHit === false)
            this.currentSpeed = this.defaultSpeed / 2; // Ball start slow before hiting the first paddle
        else if (this.firstHit === true && this.currentSpeed < this.defaultSpeed)
            this.currentSpeed = this.defaultSpeed;
        this.positionState.x += Math.cos(this.angle) * this.currentSpeed;
        this.positionState.y += Math.sin(this.angle) * this.currentSpeed;
    }
    increaseBallSpeed() {
        const maxSpeed = 100;
        const speedUpTime = 5000;
        // Every 5 seconds the ball increases speed 5%
        if (performance.now() - this.startTime >= speedUpTime &&
            this.currentSpeed < maxSpeed) {
            this.currentSpeed += this.currentSpeed / 5;
            this.startTime = performance.now();
        }
    }
    reset(canvas) {
        this.startTime = performance.now();
        this.firstHit = false;
        this.positionState.x = canvas.width / 2;
        this.positionState.y = canvas.height / 2;
    }
    checkCeilingFloorCollision(canvas) {
        if (this.positionState.y - this.radius <= 0) {
            this.positionState.y = this.radius;
            this.angle *= -1;
        }
        else if (this.positionState.y + this.radius >= canvas.height) {
            this.positionState.y = canvas.height - this.radius;
            this.angle *= -1;
        }
    }
    // The ball angle change arcordingly to where it hit the paddle
    checkPaddleCollision(paddle) {
        if (this.positionState.x + this.radius >= paddle.positionState.x &&
            this.positionState.x - this.radius <= paddle.positionState.x + paddle.width &&
            this.positionState.y + this.radius >= paddle.positionState.y &&
            this.positionState.y - this.radius <= paddle.positionState.y + paddle.height) {
            this.firstHit = true;
            const relativeY = this.positionState.y - paddle.positionState.y - paddle.height / 2; // Calculate relative Y position on the paddle
            const normalized = relativeY / (paddle.height / 2);
            const clamped = Math.max(-1, Math.min(1, normalized)); // Make sure value is between [-1, 1];
            const maxBounceAngle = degreesToRadians(60); // 60 degrees in radians
            // Adjust ball position to avoid sticking
            if (paddle.side === PaddleSide.Left) {
                this.positionState.x = paddle.positionState.x + paddle.width + this.radius;
                this.angle = clamped * maxBounceAngle;
                this.increaseBallSpeed();
            }
            else if (paddle.side === PaddleSide.Right) {
                this.positionState.x = paddle.positionState.x - this.radius;
                this.angle = Math.PI - clamped * maxBounceAngle; // Set angle to PI - bounceAngle (leftward)
                this.increaseBallSpeed();
            }
        }
    }
}
