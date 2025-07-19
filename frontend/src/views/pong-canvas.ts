interface PaddleState {
    leftUp: boolean;
    leftDown: boolean;
    rightUp: boolean;
    rightDown: boolean;
};

class Paddle {
    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;
    private _yD: number;
    private _lineThickness: number;
    private _color: string;
    private _strockColor: string;

    get x(): number {
        return this._x;
    };
    get y(): number {
        return this._y;
    };
    get width(): number {
        return this._width;
    };
    get height(): number {
        return this._height;
    };

    constructor(x: number, y: number, width: number, height: number, yD: number, lineThickness: number, color: string, strockColor: string) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this._yD = yD;
        this._lineThickness = lineThickness;
        this._color = color;
        this._strockColor = strockColor;
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this._color;
        ctx.fillRect(this._x, this._y, this._width, this._height);
        ctx.strokeStyle = this._strockColor;
        ctx.lineWidth = this._lineThickness;
        ctx.strokeRect(this._x, this._y, this._width, this._height);
    }

    move(direction: string, canvas: HTMLCanvasElement): void {
        if (direction === "Down" && this._y + this._height + this._lineThickness <= canvas.height)
            this._y += this._yD;
        else if (direction === "Up" && this.y - this._lineThickness >= 0)
            this._y -= this._yD;
    }
}

class Ball {
    private _x: number;
    private _y: number;
    private _radius: number;
    private _color: string;
    private _strockColor: string;
    private _yD: number;
    private _xD: number;
    private _lineThickness: number;
    private _gameState: boolean;

    constructor(x: number, y: number, radius: number, color: string, strockColor: string, xD: number, yD: number, lineThickness: number) {
        this._x = x;
        this._y = y;
        this._radius = radius;
        this._color = color;
        this._strockColor = strockColor;
        this._xD = xD;
        this._yD = yD;
        this._lineThickness = lineThickness;
        this._gameState = false;
    }

    set gameState(state: boolean) {
        this._gameState = state;
    }

    public update(leftPaddle: Paddle, rightPaddle: Paddle, canvas: HTMLCanvasElement): void {

        // Someone has scored
        if (this._x - this._radius < 0) 
        {
            document.getElementById("user-score").innerHTML++;
            this._gameState = false;
        }
        else if (this._x + this._radius > canvas.width)
        {
            document.getElementById("ai-score").innerHTML++;
            this._gameState = false;
        }

        if (this._gameState === true) // Game is running
        {
            this._x += this._xD;
            this._y += this._yD;

            // Change g_ball directions if hit celling, floor or paddles
            if (this.checkPaddleColition(leftPaddle) || this.checkPaddleColition(rightPaddle))
                this._xD *= -1;
            if (this.checkCellingFloorColition(canvas))
                this._yD *= -1;
        }
        else // Game is stoped
        {
            this._x = canvas.width / 2;
            this._y = canvas.height / 2;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.arc(this._x, this._y, this._radius, 0, Math.PI * 2); // Full circle
        ctx.fillStyle = this._color;
        ctx.fill();

        // line around the circle
        ctx.strokeStyle = this._strockColor;
        ctx.lineWidth = this._lineThickness;
        ctx.stroke();
    }

    checkPaddleColition(paddle: Paddle): boolean {
        if (this._x + this._radius >= paddle.x && this._x - this._radius <= paddle.x + paddle.width) // horizontal range
        {
            if (this._y + this._radius >= paddle.y && this._y - this._radius <= paddle.y + paddle.height) // vertical range
                return true;
        }
        return false;
    }

    checkCellingFloorColition(canvas: HTMLCanvasElement): boolean {
        if (this._y - this._radius <= 0 || this._y + this._radius >= canvas.height)
            return true;
        return false;
    }
}

export class Pong {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private paddleHeight: number;
    private paddleWidth: number;
    private paddleY: number;
    private paddleD: number;
    private lineThickness: number;
    private paddleColor: string;
    private paddleStrockColor: string;
    private leftPaddleX: number;
    private rightPaddleX: number;
    private ballX: number;
    private ballY: number;
    private ballRadius: number;
    private ballColor: string;
    private ballStrockColor: string;
    private ballXD: number;
    private ballYD: number;
    private ballLineThickness: number;
    private leftPaddle: Paddle;
    private rightPaddle: Paddle;
    private ball: Ball;
    private paddleState: PaddleState; // Check if paddles are moving or stationary
    private animationFrameId: number | null = null;
    
    constructor() {
        this.canvas =  document.getElementById("pong-canvas") as HTMLCanvasElement;
        this.canvas.tabIndex = 0; // Make canvas focusable
        this.canvas.width = window.innerWidth / 1.2;
        this.canvas.height = window.innerHeight / 1.4;

        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        // Header
        // Change objects atributes
        this.paddleHeight = this.canvas.width / 12;
        this.paddleWidth = window.innerWidth / 100;
        this.paddleY = this.canvas.height / 2 - this.paddleHeight / 2;
        this.paddleD = 5; // travel velocity
        this.lineThickness = 2;
        this.paddleColor = "#333399";
        this.paddleStrockColor = "#000000";
        this.leftPaddleX = 5;
        this.rightPaddleX = this.canvas.width - this.paddleWidth - 5;

        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballRadius = 8;
        this.ballColor = "#AA0000";
        this.ballStrockColor = "#000000";
        this.ballXD = 5; // travel velocity on X axis
        this.ballYD = 2; // travel velocity on Y axis
        this.ballLineThickness = 2;

        this.paddleState = {
            leftUp: false,
            leftDown: false,
            rightUp: false,
            rightDown: false,
        };

        // Inicialize objects
        this.leftPaddle = new Paddle(this.leftPaddleX, this.paddleY, this.paddleWidth, this.paddleHeight, this.paddleD, this.lineThickness, this.paddleColor, this.paddleStrockColor);
        this.rightPaddle = new Paddle(this.rightPaddleX, this.paddleY, this.paddleWidth, this.paddleHeight, this.paddleD, this.lineThickness, this.paddleColor, this.paddleStrockColor);
        this.ball = new Ball(this.ballX, this.ballY, this.ballRadius, this.ballColor, this.ballStrockColor, this.ballXD, this.ballYD, this.ballLineThickness);

        this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
        this.canvas.addEventListener("keyup", this.handleKeyUp.bind(this));
    };

    public gameLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear full canvas

        // Check paddle state and ajust X and Y accordently
        if (this.paddleState.leftUp)
            this.leftPaddle.move("Up", this.canvas);
        if (this.paddleState.leftDown)
            this.leftPaddle.move("Down", this.canvas);
        if (this.paddleState.rightUp)
            this.rightPaddle.move("Up", this.canvas);
        if (this.paddleState.rightDown)
            this.rightPaddle.move("Down", this.canvas);

        this.ball.update(this.leftPaddle, this.rightPaddle, this.canvas);

        this.renderObjects();

        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    };

    private renderObjects(): void {
        this.leftPaddle.render(this.ctx);
        this.rightPaddle.render(this.ctx);
        this.ball.render(this.ctx);
    }

    private handleKeyDown(event: KeyboardEvent): void {
        // Prevent default for all game control keys
        if (["s", "S", "w", "W", "ArrowDown", "ArrowUp", " "].includes(event.key)) {
            event.preventDefault();
        }

        if (event.key === "s" || event.key === "S")
            this.paddleState.leftDown = true;
        if (event.key === "w" || event.key === "W")
            this.paddleState.leftUp = true;
        if (event.key === "ArrowDown")
            this.paddleState.rightDown = true;
        if (event.key === "ArrowUp")
            this.paddleState.rightUp = true;
        if (event.key == " ")
            this.ball.gameState = true;
    };

    private handleKeyUp(event: KeyboardEvent): void {
        if (event.key === "s" || event.key === "S")
            this.paddleState.leftDown = false;
        if (event.key === "w" || event.key === "W")
            this.paddleState.leftUp = false;
        if (event.key === "ArrowDown")
            this.paddleState.rightDown = false;
        if (event.key === "ArrowUp")
            this.paddleState.rightUp = false;
    }
}
