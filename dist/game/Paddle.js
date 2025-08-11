export var PaddleSide;
(function (PaddleSide) {
    PaddleSide[PaddleSide["Left"] = 0] = "Left";
    PaddleSide[PaddleSide["Right"] = 1] = "Right";
})(PaddleSide || (PaddleSide = {}));
;
export var PaddleMovingState;
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
        this.state = {
            up: false,
            down: false,
        };
        this.positionState = {
            x: 0,
            y: canvas.height / 2 - this.height / 2,
        };
        this.side = side;
        if (side === PaddleSide.Left)
            this.positionState.x = 5;
        else if (side === PaddleSide.Right)
            this.positionState.x = canvas.width - this.width - 5;
    }
    update(canvas) {
        if (this.state.up && this.positionState.y >= 0)
            this.positionState.y -= this.speed;
        if (this.state.down && this.positionState.y + this.height <= canvas.height)
            this.positionState.y += this.speed;
    }
}
