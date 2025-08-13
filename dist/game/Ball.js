import { degreesToRadians, getRandomAngle } from "./utils.js";
import { PaddleSide } from "./Paddle.js";
;
var Player;
(function (Player) {
    Player[Player["player1"] = 1] = "player1";
    Player[Player["player2"] = 2] = "player2";
})(Player || (Player = {}));
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
        this.defaultSpeed = 8;
        this.currentSpeed = this.defaultSpeed / 2;
        this.firstHit = false;
        this.startTime = performance.now();
        this.isRunning = false;
        this.state = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: this.radius,
        };
    }
    // Check if a player scored a point
    pointScored(canvas) {
        if (this.state.x + this.radius < 0)
            return Player.player2;
        else if (this.state.x - this.radius > canvas.width)
            return Player.player1;
        return 0;
    }
    move() {
        if (this.firstHit === false)
            this.currentSpeed = this.defaultSpeed / 2; // Ball start slow before hiting the first paddle
        else if (this.firstHit === true && this.currentSpeed < this.defaultSpeed)
            this.currentSpeed = this.defaultSpeed;
        this.state.x += Math.cos(this.angle) * this.currentSpeed;
        this.state.y += Math.sin(this.angle) * this.currentSpeed;
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
        this.currentSpeed = this.defaultSpeed;
        this.state.x = canvas.width / 2;
        this.state.y = canvas.height / 2;
    }
    checkCeilingFloorCollision(canvas) {
        if (this.state.y - this.radius <= 0) {
            this.state.y = this.radius;
            this.angle *= -1;
        }
        else if (this.state.y + this.radius >= canvas.height) {
            this.state.y = canvas.height - this.radius;
            this.angle *= -1;
        }
    }
    // The ball angle change arcordingly to where it hit the paddle
    checkPaddleCollision(paddle) {
        if (this.state.x + this.radius >= paddle.state.position.x &&
            this.state.x - this.radius <= paddle.state.position.x + paddle.width &&
            this.state.y + this.radius >= paddle.state.position.y &&
            this.state.y - this.radius <= paddle.state.position.y + paddle.height) {
            this.firstHit = true;
            const relativeY = this.state.y - paddle.state.position.y - paddle.height / 2; // Calculate relative Y position on the paddle
            const normalized = relativeY / (paddle.height / 2);
            const clamped = Math.max(-1, Math.min(1, normalized)); // Make sure value is between [-1, 1];
            const maxBounceAngle = degreesToRadians(60); // 60 degrees in radians
            // Adjust ball position to avoid sticking
            if (paddle.side === PaddleSide.Left) {
                this.state.x = paddle.state.position.x + paddle.width + this.radius;
                this.angle = clamped * maxBounceAngle;
            }
            else if (paddle.side === PaddleSide.Right) {
                this.state.x = paddle.state.position.x - this.radius;
                this.angle = Math.PI - clamped * maxBounceAngle; // Set angle to PI - bounceAngle (leftward)
            }
            this.increaseBallSpeed();
        }
    }
}
