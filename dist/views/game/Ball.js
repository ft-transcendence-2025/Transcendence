import { PaddleSide, degreesToRadians, getRandomAngle, } from "./utils.js";
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
        this.defaultSpeed = 6;
        this.currentSpeed = this.defaultSpeed / 2;
        this.firstHit = true;
        this.startTime = performance.now();
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
    }
    // Check if a player scored a point
    // call updateScore to update the score
    pointScored(canvas) {
        if (this.x + this.radius < 0) {
            // Player 2 Scored
            this.updateScore(2);
            return true;
        }
        else if (this.x - this.radius > canvas.width) {
            // Player 1 Scored
            this.updateScore(1);
            return true;
        }
        return false;
    }
    updateScore(player) {
        const playerScoreElement = document.getElementById(`player${player}-score`);
        if (playerScoreElement) {
            const currentScore = parseInt(playerScoreElement.innerHTML);
            playerScoreElement.innerHTML = (currentScore + 1).toString();
        }
    }
    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Full circle
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();
    }
    move(canvas) {
        if (this.firstHit === false)
            this.currentSpeed = this.defaultSpeed / 2; // Ball start slow before hiting the first paddle
        else if (this.firstHit === true && this.currentSpeed < this.defaultSpeed)
            this.currentSpeed = this.defaultSpeed;
        this.x += Math.cos(this.angle) * this.currentSpeed;
        this.y += Math.sin(this.angle) * this.currentSpeed;
    }
    increaseBallSpeed() {
        const maxSpeed = 10;
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
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
    }
    checkCeilingFloorCollision(canvas) {
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.angle *= -1;
        }
        else if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            this.angle *= -1;
        }
    }
    // The ball angle change arcordingly to where it hit the paddle
    checkPaddleCollision(paddle) {
        if (this.x + this.radius >= paddle.x &&
            this.x - this.radius <= paddle.x + paddle.width &&
            this.y + this.radius >= paddle.y &&
            this.y - this.radius <= paddle.y + paddle.height) {
            this.firstHit = true;
            const relativeY = this.y - paddle.y - paddle.height / 2; // Calculate relative Y position on the paddle
            const normalized = relativeY / (paddle.height / 2);
            const clamped = Math.max(-1, Math.min(1, normalized)); // Make sure value is between [-1, 1];
            const maxBounceAngle = degreesToRadians(60); // 60 degrees in radians
            // Adjust ball position to avoid sticking
            if (paddle.side === PaddleSide.Left) {
                if (this.x - this.radius < paddle.x) // When the ball passed the paddle or hit the top or bottom
                    return;
                this.angle = clamped * maxBounceAngle;
                this.increaseBallSpeed();
            }
            else if (paddle.side === PaddleSide.Right) {
                if (this.x > paddle.x) // When the ball passed the paddle or hit the top or bottom
                    return;
                this.angle = Math.PI - clamped * maxBounceAngle; // Set angle to PI - bounceAngle (leftward)
                this.increaseBallSpeed();
            }
        }
    }
}
