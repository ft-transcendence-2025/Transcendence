import { GameState, Canvas, BallState, FetchData, PaddleState, PaddleSide, GameMode, SECOND, degreesToRadians, getRandomAngle } from "./utils.js";
import { Player } from "./Player.js";
import { AI } from "./AI.js";
import { navigateTo } from "../../router/router.js";
import { request, getHeaders } from "../../utils/api.js";

export class SinglePlayerGame {
  private canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
  private ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

  private player1: Player | null = null;
  private player2: Player | null = null;
  private AI: AI | null = null;
  private updateAIIntervalId: number | null = null;

  private ballMoving: boolean = false;
  private winningPoint: number = 3;
  private ws: WebSocket | null = null;

  private gameMode: string;
  private gameState: GameState | null = null;

  constructor(gameMode: string, data: FetchData) {
    this.canvas.tabIndex = 0;
    this.canvas.style.outline = "none";
    this.canvas.focus();
    this.canvas.width = 1000;
    this.canvas.height = 500;
    this.gameMode = gameMode;

    this.joinGame(`wss://${window.location.host}/ws/game/singleplayer/${data.id}`, this.gameMode);

    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
  }


  public joinGame(url: string, gameMode: string): void {
    if (!this.ws) {
      this.ws = new WebSocket(url)
      if (!this.ws)
        throw("Failed To Connect WebSocket");
      if (gameMode === "localtournament") {
        this.setUpAvatars();
      }
      this.openSocket(gameMode);
    }
  }

  private setUpAvatars() {
    const player1 = document.getElementById("player1-name");
    const player2 = document.getElementById("player2-name");
    const storeData = localStorage.getItem("LocalTournamentAvatarMap");
    if (storeData) {
      const players = JSON.parse(storeData);

      if (player1) {
        const player1Name = player1.innerHTML.trim();
        for (let i = 0; i < players.length; ++i) {
          if (players[i].username === player1Name) {
            const avatar = document.getElementById("player1-avatar");
            if (avatar) {
              avatar.setAttribute("src", `../assets/avatars/${players[i].avatar}`); 
            }
            break ;
          }
        }
      }
      if (player2) {
        const player2Name = player2.innerHTML.trim();
        for (let i = 0; i < players.length; ++i) {
          if (players[i].username === player2Name) {
            const avatar = document.getElementById("player2-avatar");
            if (avatar) {
              avatar.setAttribute("src", `../assets/avatars/${players[i].avatar}`); 
            }
            break ;
          }
        }
      }
    }

  }

  private openSocket(gameMode: string) {
    if (!this.ws)
      throw("ws is undefined");
    this.ws.addEventListener("open", () => {
      if (!this.ws)
        throw("ws is undefined");

      if (gameMode === "2player" || gameMode === "localtournament") {
        this.startSinglePvP();
      }
      else if (gameMode === "ai") {
        this.startSinglePvE(PaddleSide.Right);
      }

      this.ws.addEventListener("message", (event) => {
        this.gameState = JSON.parse(event.data) as GameState;
        if (!this.gameState)
          throw("gameState is undefined");
      });
    });
    this.gameLoop();
  };

  private startSinglePvP(): void {
    if (this.AI) {
      if (this.updateAIIntervalId)
        clearInterval(this.updateAIIntervalId);
      this.updateAIIntervalId = null;
      this.AI = null;
    }
    if (this.ws) {
      const cookies = document.cookie.split(";");
      cookies.forEach((cookie) => {
        const mode = cookie.split("=");
        if (mode[0].trim() === "GameMode") {
          if (mode[1].trim() === "SinglePvE") {
            const payLoad = {
              type: "command",
              key: "reset",
            };
            if (this.ws)
              this.ws.send(JSON.stringify(payLoad));
          }
        }
      });
      document.cookie = "GameMode=SinglePvP";
      this.player1 = new Player(this.ws, this.canvas, PaddleSide.Left);
      this.player2 = new Player(this.ws, this.canvas, PaddleSide.Right);
    }
  };

  private startSinglePvE(side: PaddleSide | undefined): void {
    if (this.player1) {
      this.player1 = null;
    }
    if (this.player2) {
      this.player2 = null;
    }
    if (this.ws) {
      const cookies = document.cookie.split(";");
      cookies.forEach((cookie) => {
        const mode = cookie.split("=");
        if (mode[0].trim() === "GameMode") {
          if (mode[1].trim() === "SinglePvP") {
            const payLoad = {
              type: "command",
              key: "reset",
            };
            if (this.ws)
              this.ws.send(JSON.stringify(payLoad));
          }
        }
      });
      document.cookie = "GameMode=SinglePvE";
      if (side === PaddleSide.Left) {
        this.player1 = new Player(this.ws, this.canvas, PaddleSide.Left);
        this.AI = new AI(this.ws, this.canvas, PaddleSide.Right, this.gameState);
      }
      else {
        this.player1 = new Player(this.ws, this.canvas, PaddleSide.Right);
        this.AI = new AI(this.ws, this.canvas, PaddleSide.Left, this.gameState);
      }
      if (this.AI) {
        this.updateAIGameState();
      }
    }
  }

  private updateAIGameState(): void {
    this.updateAIIntervalId = setInterval(() => {
      if (this.AI) {
        this.AI.updateGameState(this.gameState);
      }
    }, SECOND);
  }

  public gameLoop(): void {
    if (!this.gameState) {
      requestAnimationFrame(this.gameLoop.bind(this));
      return ;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.gameState.status === "playing") {
      this.renderBall();
      this.renderPaddle(this.gameState.paddleLeft);
      this.renderPaddle(this.gameState.paddleRight);
      this.checkPoints();
      this.checkIsGamePaused();
    }
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private checkIsGamePaused(): void {
    if (this.gameState) {
      if (this.gameState.isPaused) {
        const gamePausedOverlay = document.getElementById("game-paused") as HTMLCanvasElement;

        if (gamePausedOverlay)
          gamePausedOverlay.classList.remove("hidden");
      }
      else {
        const gamePausedOverlay = document.getElementById("game-paused") as HTMLCanvasElement;

        if (gamePausedOverlay)
          gamePausedOverlay.classList.add("hidden");
      }
    }
  }

  private renderBall(): void {
    if (this.gameState && this.gameState.ball) {
      this.ctx.beginPath();
      this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, this.gameState.ball.radius, 0, Math.PI * 2); // Full circle
      this.ctx.fillStyle = "#FE4E00";
      this.ctx.fill();
      this.ctx.strokeStyle = "#253031";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ballMoving = this.gameState.ball.isRunning;
    }
  }

  private renderPaddle(paddle: PaddleState): void {
    if (this.gameState) {
      this.ctx.fillStyle = "#5FAD56";
      this.ctx.fillRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
      this.ctx.strokeStyle =  "#396733";
      this.ctx.lineWidth = 0;
      this.ctx.strokeRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
    }
  }

  private checkPoints(): void {
    if (this.gameState) {
      const player1ScoreElement = document.getElementById(`player1-score`) as HTMLSpanElement;
      if (player1ScoreElement) {
        player1ScoreElement.innerHTML = this.gameState.score.player1.toString();
      }

      // Player 2
      const player2ScoreElement = document.getElementById(`player2-score`) as HTMLSpanElement;
      if (player2ScoreElement) {
        player2ScoreElement.innerHTML = this.gameState.score.player2.toString();
      }

      if (this.gameState.score.winner) {
        this.gameOver(this.gameState.score.winner)
      }
      else
        this.hiddeGameOver();
    }
  }

  // Display Game Over Div with the winner and final score
  private gameOver(player: 1 | 2): void {
    let winnerName: string;

    const gameOverText = document.getElementById("game-over") as HTMLDivElement;
    if (gameOverText) {
      const gameOverIsHidden = gameOverText.classList.contains("hidden");
      if (gameOverIsHidden)
        gameOverText.classList.remove('hidden');
    }
    const winnerText = document.getElementById("winner-text") as HTMLDivElement;
    if (winnerText) {
      if (player === 1) {
        const player1Name = document.getElementById("player1-name") as HTMLDivElement;
        if (player1Name) {
          winnerName = player1Name.innerHTML;
          winnerText.innerHTML = `${winnerName} WINS!`;
        }
      }
      else if (player === 2) {
        const player2Name = document.getElementById("player2-name") as HTMLDivElement;
        if (player2Name) {
          winnerName = player2Name.innerHTML;
          winnerText.innerHTML = `${winnerName} WINS!`;
        }
      }
    }
  }


  private hiddeGameOver(): void {
    const gameOverText = document.getElementById("game-over") as HTMLDivElement;
    if (gameOverText)
      gameOverText.classList.add('hidden');
  }

  // Press Space to start the ball rolling
  // If the game is over Space will reset the game
  private handleKeyDown(event: KeyboardEvent): void {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (["p", "P", " "].includes(event.key)) {
      event.preventDefault();
      this.sendPayLoad(event);
      if (this.gameMode === "localtournament" &&
        this.gameState && this.gameState.score.winner) {
        this.tournomentMatchWinner();
        const container = document.getElementById("content");
        navigateTo("/tournament-tree", container);
      }
      else if ((this.gameMode === "2player" || this.gameMode === "ai") &&
        this.gameState && this.gameState.score.winner) {
        this.registeringWinner();
      }
    }
  }

  private async registeringWinner() {
    let winnerName: string = "placeholder";
    if (this.gameState && this.gameState.score.winner === 1) {
      const player1Name = document.getElementById("player1-name") as HTMLDivElement;
      if (player1Name) {
        winnerName = player1Name.innerHTML;
      }
    }
    else {
      const player2Name = document.getElementById("player2-name") as HTMLDivElement;
      if (player2Name) {
        winnerName = player2Name.innerHTML;
      }
    }

    try {
      const baseUrl = window.location.origin;
      const player1Name = document.getElementById("player1-name") as HTMLDivElement;
      const player2Name = document.getElementById("player2-name") as HTMLDivElement;
      if (this.gameState && player1Name && player2Name) {
        const data = await request(`${baseUrl}/api/blockchain/matches`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            tournamentId: 0,
            player1: player1Name.innerHTML,
            player2: player2Name.innerHTML,
            score1: this.gameState.score.player1,
            score2: this.gameState.score.player2,
            winner: winnerName,
            startTime: 2021210205,
            endTime: 2021210210,
            finalMatch: true
          })
        });
      }
    } catch(err: any){
      console.log("DEU RUIM MEU CHAPA:", err);
    }
  }

  private async tournomentMatchWinner() {
    const baseUrl = window.location.origin;
    let winnerName: string = "placeholder";

    if (this.gameState && this.gameState.score.winner === 1) {
      const player1Name = document.getElementById("player1-name") as HTMLDivElement;
      if (player1Name) {
        winnerName = player1Name.innerHTML;
      }
    }
    else {
      const player2Name = document.getElementById("player2-name") as HTMLDivElement;
      if (player2Name) {
        winnerName = player2Name.innerHTML;
      }
    }

    const localTournamentState = localStorage.getItem("localTournamentState");
    if (localTournamentState) {
      let matchNumber: number = 1;
      const tournamentState = JSON.parse(localTournamentState);
      if (tournamentState.match1.winner === null) {
        matchNumber = 1;
        tournamentState.match1.winner = winnerName;
        tournamentState.match3.player1 = winnerName;
      }
      else if (tournamentState.match2.winner === null) {
        matchNumber = 2;
        tournamentState.match2.winner = winnerName;
        tournamentState.match3.player2 = winnerName;
      }
      else if (tournamentState.match3.winner === null) {
        matchNumber = 3;
        tournamentState.match3.winner = winnerName;
      }

      localStorage.setItem("localTournamentState", JSON.stringify(tournamentState))

      const response = await fetch(`${baseUrl}/api/tournoment/matchwinner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          id: tournamentState.id,
          match: matchNumber,
          winner: winnerName,
        })
      });
    }
  }

  private sendPayLoad(event: KeyboardEvent): void {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (["p", "P", " "].includes(event.key)) {
      event.preventDefault();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const payLoad = {
          type: "keydown",
          key: event.key,
        };
        this.ws.send(JSON.stringify(payLoad));
        this.ballMoving = true;
      }
    }
  }
}
