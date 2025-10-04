import { 
  GameState, Canvas, BallState, FetchData, PaddleState, PaddleSide,
  GameMode, degreesToRadians, getRandomAngle 
} from "./utils.js";
import { Player } from "./Player.js";
import { Game } from "./Game.js";
import { getCurrentUsername, getUserDisplayName } from "../../utils/userUtils.js";
import { getUserAvatar } from "../../services/profileService.js";
import { navigateTo } from "../../router/router.js";
import { TournamentState, getRemoteTournamentState } from "../tournament/tournamentSetup.js";

export class RemoteGame extends Game {
  private updateAIIntervalId: number | null = null;
  private player: Player | null = null;
  private side: string | null = null;
  private player1NameSet: boolean = false;
  private player2NameSet: boolean = false;
  private gameMode: string;
  private tournamentState: TournamentState | null = null;

  constructor(gameMode: string, gameId: number, side: string) {
    super()

    this.gameMode = gameMode;
    const userName = getCurrentUsername();
    this.joinGame(`wss://${window.location.host}/ws/game/${gameMode}/${gameId}/${userName}/play`);
    this.side = side;
    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
    const button = document.querySelector("#leave-game-btn") as HTMLButtonElement;
    if (button)
      button.addEventListener("click", this.leaveGame)
  }

  public joinGame(url: string): void {
    if (!this.ws) {
      this.ws = new WebSocket(url)
      if (!this.ws)
        throw("Failed To Connect WebSocket");
      this.openSocket();
    }
  }

  private openSocket(): void {
    if (!this.ws)
      throw("ws is undefined");
    this.ws.addEventListener("open", () => {
      if (!this.ws) { 
        throw("ws is undefined");
      }

      if (this.side === "left") {
        this.player = new Player(this.ws, this.canvas, PaddleSide.Left);
      }
      else if (this.side === "right") {
        this.player = new Player(this.ws, this.canvas, PaddleSide.Right);
      }

      this.ws.addEventListener("message", (event) => {
        if (this.gameMode === "remotetournament") {
          const gameState = JSON.parse(event.data) as TournamentState;
          this.tournamentState = gameState;
          if (!gameState)
            throw("gameState is undefined");
          this.gameState = gameState.gameState;
        }
        else {
          this.gameState = JSON.parse(event.data) as GameState;
          if (!this.gameState)
            throw("gameState is undefined");
        }
        this.renderNames();
      });
    });

    this.gameLoop();
  }

  public gameLoop(): void {
    if (!this.gameState || !this.gameState.paddleLeft || !this.gameState.paddleRight) {
      requestAnimationFrame(this.gameLoop.bind(this));
      return ;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.renderBall();
    this.renderPaddle(this.gameState.paddleLeft);
    this.renderPaddle(this.gameState.paddleRight);
    this.checkPoints(this.ws);
    this.checkIsGamePaused();
    this.checkIsWaiting();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private async renderNames() {
    if (!this.gameState)
      return ;

    if (!this.player1NameSet && this.gameState.player1Name) {
      const player1Display = document.getElementById("player1-name");
      const player1Avatar = document.getElementById("player1-avatar") as HTMLImageElement;

      if (this.gameState.player1Name && player1Display) {
        player1Display.innerHTML = this.gameState.player1Name;
        const avatarUrl = await getUserAvatar(this.gameState.player1Name);
        if (player1Avatar && avatarUrl) {
          player1Avatar.src = avatarUrl;
        }
        this.player1NameSet = true;
      }
    }

    if (!this.player2NameSet && this.gameState.player2Name) {
      const player2Display = document.getElementById("player2-name");
      const player2Avatar = document.getElementById("player2-avatar") as HTMLImageElement;

      if (this.gameState.player2Name && player2Display) {
        player2Display.innerHTML = this.gameState.player2Name;
        const avatarUrl = await getUserAvatar(this.gameState.player2Name);
        if (player2Avatar && avatarUrl) {
          player2Avatar.src = avatarUrl;
        }
        this.player2NameSet = true;
      }
    }
  }

  private checkIsWaiting(): void {
    if (!this.gameState)
      return ;

    const display = document.getElementById("reconnect-overlay") as HTMLCanvasElement;
    const mode = window.location.search.split("=")[1];

    if (this.gameState.score && this.gameState.score.winner) {
      if (display) {
        display.classList.add("hidden");
      }
      return ;
    }

    if (this.gameState.status === "playing" || mode !== "remote" && mode !== "remotetournament") {
      if (display) {
        display.classList.add("hidden");
      }
    }
    else if (this.gameState.status === "waiting for players") {
      this.gameState.isPaused = true;
      if (display) {
        display.classList.remove("hidden");
        const connectionMsg = display.querySelector("#connection-msg")
        const counter = display.querySelector("#reconnect-counter")
        if (connectionMsg && counter) {
          if (this.gameState.player1Name && this.gameState.player2Name) {
            if (this.side === "left") {
              connectionMsg.textContent = ` Waiting for ${this.gameState.player2Name} to reconnect ... `
            }
            else if (this.side === "right") {
              connectionMsg.textContent = ` Waiting for ${this.gameState.player1Name} to reconnect ... `
            }
            counter.textContent = `( ${this.gameState.timeToWait} )`;
          }
          else {
            connectionMsg.textContent = " Waiting for players to connect ..."
            counter.textContent = "";
          }
        }
      }
    }
  }

  private async handleKeyDown(event: KeyboardEvent) {
    if (!this.gameState)
      return ;
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (["p", "P", " "].includes(event.key)) {
      event.preventDefault();
      if (this.gameState.status !== "waiting for players") {
        this.sendPayLoad(event);
      }
      if (this.gameState.score && this.gameState.score.winner && event.key === " ") {
        if (this.ws)
          this.ws.close();
        const container = document.getElementById("content");
        if (this.gameMode === "remotetournament") {
          this.remoteTournamentRedirect(event);
        }
        else {
          navigateTo("/dashboard", container);
        }
      }
    }
  }

  private async remoteTournamentRedirect(event: KeyboardEvent) {
    if (!this.gameState?.score)
      return ;
    const container = document.getElementById("content");

    const userName = await getUserDisplayName() as string;
    const player1 = document.querySelector("#player1-name")?.innerHTML.trim();
    const player2 = document.querySelector("#player2-name")?.innerHTML.trim();

    if ((player1 === userName && this.gameState.score.winner === 1) ||
      player2 === userName && this.gameState.score.winner === 2) {
      navigateTo("/tournament-tree?mode=remote", container);
      return ;
    }
    localStorage.removeItem("RemoteTournament");
    navigateTo("/dashboard", container);
  }
}
