export var PaddleSide;
(function (PaddleSide) {
    PaddleSide[PaddleSide["Left"] = 0] = "Left";
    PaddleSide[PaddleSide["Right"] = 1] = "Right";
})(PaddleSide || (PaddleSide = {}));
;
var PaddleMovingState;
(function (PaddleMovingState) {
    PaddleMovingState[PaddleMovingState["Up"] = 0] = "Up";
    PaddleMovingState[PaddleMovingState["Down"] = 1] = "Down";
})(PaddleMovingState || (PaddleMovingState = {}));
export class Paddle {
    constructor(canvas, side) {
        this.width = 15;
        this.height = 90;
        this.color = "#5FAD56";
        this.strokeColor = "#396733";
        this.strokeWidth = 0;
        this.speed = 8;
        this.side = side;
        this.state = {
            moving: {
                up: false,
                down: false,
            },
            position: {
                x: side === PaddleSide.Left ? 5 : canvas.width - this.width - 5,
                y: canvas.height / 2 - this.height / 2,
            },
            attr: {
                width: this.width,
                height: this.height,
            }
        };
    }
    update(canvas) {
        if (this.state.moving.up && this.state.position.y >= 0)
            this.state.position.y -= this.speed;
        if (this.state.moving.down && this.state.position.y + this.height <= canvas.height)
            this.state.position.y += this.speed;
    }
}
