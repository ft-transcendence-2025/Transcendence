import { Paddle } from "./Paddle.js";
import { PaddleSide } from "./utils.js";
export class Player {
    constructor(canvas, side) {
        this.paddle = new Paddle(canvas, side);
        this.side = side;
        canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
        canvas.addEventListener("keyup", this.handleKeyUp.bind(this));
    }
    handleKeyDown(event) {
        // Prevent default for all game control keys
        if (["s", "S", "w", "W", "ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
        }
        if (this.side === PaddleSide.Left) {
            if (event.key === "s" || event.key === "S")
                this.paddle.state.down = true;
            if (event.key === "w" || event.key === "W")
                this.paddle.state.up = true;
        }
        else if (this.side === PaddleSide.Right) {
            if (event.key === "ArrowDown")
                this.paddle.state.down = true;
            if (event.key === "ArrowUp")
                this.paddle.state.up = true;
        }
    }
    handleKeyUp(event) {
        if (this.side === PaddleSide.Left) {
            if (event.key === "s" || event.key === "S")
                this.paddle.state.down = false;
            if (event.key === "w" || event.key === "W")
                this.paddle.state.up = false;
        }
        else if (this.side === PaddleSide.Right) {
            if (event.key === "ArrowDown")
                this.paddle.state.down = false;
            if (event.key === "ArrowUp")
                this.paddle.state.up = false;
        }
    }
}
