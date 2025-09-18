import { GameState, Canvas, BallState, FetchData, PaddleState, PaddleSide, GameMode, SECOND, degreesToRadians, getRandomAngle } from "./utils.js";
import { Player } from "./Player.js";
import { AI } from "./AI.js";
import { navigateTo } from "../../router/router.js";
import { request, getHeaders } from "../../utils/api.js";
import { Game } from "./Game.js";

export class SinglePlayerGame extends Game {
  private player1: Player | null = null;
  private player2: Player | null = null;
  private AI: AI | null = null;
  private updateAIIntervalId: number | null = null;

  private winningPoint: number = 3;

  private gameMode: string;

  constructor(gameMode: string, data: FetchData) {
    super()
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
    if (!this.gameState || !this.gameState.paddleLeft || !this.gameState.paddleRight) {
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
        this.gameState && this.gameState.score && this.gameState.score.winner) {
        this.tournamentMatchWinner();
        const container = document.getElementById("content");
        navigateTo("/tournament-tree", container);
      }
      else if ((this.gameMode === "2player" || this.gameMode === "ai") &&
        this.gameState && this.gameState.score && this.gameState.score.winner) {
        this.registeringWinner();
      }
    }
  }

  private async tournamentMatchWinner() {
    const baseUrl = window.location.origin;
    let winnerName: string = "placeholder";

    if (this.gameState && this.gameState.score && this.gameState.score.winner === 1) {
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

      const response = await fetch(`${baseUrl}/api/tournament/matchwinner`, {
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
}
