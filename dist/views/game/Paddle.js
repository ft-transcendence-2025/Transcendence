import { PaddleSide } from "./utils.js";
export class Paddle {
    constructor(canvas, side) {
        this.x = 0;
        this.width = 15;
        this.height = 90;
        this.color = "#5FAD56";
        this.strokeColor = "#396733";
        this.strokeWidth = 0;
        this.speed = 4;
        this.state = {
            up: false,
            down: false,
        };
        this.y = canvas.height / 2 - this.height / 2;
        this.side = side;
        if (side === PaddleSide.Left)
            this.x = 5;
        else if (side === PaddleSide.Right)
            this.x = canvas.width - this.width - 5;
    }
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.strokeWidth;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    update(canvas) {
        if (this.state.up && this.y >= 0)
            this.y -= this.speed;
        if (this.state.down && this.y + this.height <= canvas.height)
            this.y += this.speed;
    }
}
