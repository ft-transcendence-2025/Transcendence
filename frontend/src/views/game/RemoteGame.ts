import { 
  GameState, Canvas, BallState, FetchData, PaddleState, PaddleSide,
  GameMode, degreesToRadians, getRandomAngle 
} from "./utils.js";
import { Player } from "./Player.js";
import { Game } from "./Game.js";
import { getCurrentUsername, getUserDisplayName } from "../../utils/userUtils.js";
import { getUserAvatar } from "../../services/profileService.js";
import { navigateTo } from "../../router/router.js";
import { getChatManager } from "../../app.js";

export class RemoteGame extends Game {
  private updateAIIntervalId: number | null = null;
  private player: Player | null = null;
  private side: string | null = null;
  private player1NameSet: boolean = false;
  private player2NameSet: boolean = false;
  private gameMode: string;
  private redir: boolean = false;
  private gameLoopId: number | null = null;
  private isGameActive: boolean = true;
  private redirectPath: string = "/dashboard";

  constructor(gameMode: string, gameId: number, side: string) {
    super()

    this.gameMode = gameMode;
    const params = new URLSearchParams(window.location.search);
    const tournamentId = params.get("tournamentId");
    if (tournamentId) {
      this.redirectPath = `/remote-tournament-lobby?id=${tournamentId}`;
    }
    this.joinGame(gameMode, gameId);
    this.side = side;
    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this));
    this.canvas.focus();
    
    // Register this game's leave handler with the confirmation modal
    if ((window as any).setLeaveGameHandler) {
      (window as any).setLeaveGameHandler(this.leaveGame.bind(this));
    }
  }

  public stopGame(): void {
    this.isGameActive = false;
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  public async joinGame(gameMode: string, gameId: number) {
    const userName: string = getCurrentUsername() || "Guest";
    const url = `wss://${window.location.host}/ws/game/${gameMode}/${gameId}/${userName}/play`
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
        this.gameState = JSON.parse(event.data) as GameState;
        if (!this.gameState)
          throw("gameState is undefined");
        this.renderNames();
      });
    });

    this.gameLoop();
  }

  public gameLoop(): void {
    // Stop game loop if game is no longer active
    if (!this.isGameActive) {
      if (this.gameLoopId !== null) {
        cancelAnimationFrame(this.gameLoopId);
        this.gameLoopId = null;
      }
      return;
    }

    if (!this.gameState || !this.gameState.paddleLeft || !this.gameState.paddleRight) {
      this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
      return ;
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.renderBall();
    this.renderPaddle(this.gameState.paddleLeft);
    this.renderPaddle(this.gameState.paddleRight);
    this.checkPoints(this.ws);
    this.checkIsGamePaused();
    this.checkIsWaiting();
    
    // Check if game just ended and setup auto-redirect AFTER rendering victory screen
    if (this.gameState.score && this.gameState.score.winner && !this.redir) {
      this.redir = true;
      this.stopGame();
      
      // Show game over screen for 5 seconds then auto-navigate
      setTimeout(() => {
        const container = document.getElementById("content");
        navigateTo(this.redirectPath, container);
      }, 5000);
      return;
    }
    
    this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  private async renderNames() {
    if (!this.gameState)
      return ;

    if (!this.player1NameSet && this.gameState.player1Name) {
      const player1Display = document.getElementById("player1-name");
      const player1Avatar = document.getElementById("player1-avatar") as HTMLImageElement;

      if (this.gameState.player1Name && player1Display) {
        // Display the nickname if available, otherwise show username
        const displayName = await getUserDisplayName(this.gameState.player1Name);
        player1Display.innerHTML = displayName;
        
        // Fetch avatar using actual username
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
        // Display the nickname if available, otherwise show username
        const displayName = await getUserDisplayName(this.gameState.player2Name);
        player2Display.innerHTML = displayName;
        
        // Fetch avatar using actual username
        const avatarUrl = await getUserAvatar(this.gameState.player2Name);
        if (player2Avatar && avatarUrl) {
          player2Avatar.src = avatarUrl;
        }
        this.player2NameSet = true;
      }
    }
  }

  private async checkIsWaiting(): Promise<void> {
    if (!this.gameState || !this.ws)
      return ;

    const display = document.getElementById("reconnect-overlay") as HTMLCanvasElement;
    const mode = window.location.search.split("=")[1];

    if (this.gameState.score && this.gameState.score.winner) {
      if (display) {
        display.classList.add("hidden");
      }
      return ;
    }

    if (this.gameState.status === "playing" || mode !== "remote" && mode !== "custom&gameId") {
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
              const player2DisplayName = await getUserDisplayName(this.gameState.player2Name);
              connectionMsg.textContent = ` Waiting for ${player2DisplayName} to reconnect ... `
            }
            else if (this.side === "right") {
              const player1DisplayName = await getUserDisplayName(this.gameState.player1Name);
              connectionMsg.textContent = ` Waiting for ${player1DisplayName} to reconnect ... `
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
    
    // If game is over, only allow space key for navigation after a delay
    if (this.gameState.score && this.gameState.score.winner) {
      event.preventDefault();
      if (event.key === " " && !this.redir) {
        this.redir = true;
        
        // Stop the game loop before navigating
        this.stopGame();
        
        const container = document.getElementById("content");
        navigateTo(this.redirectPath, container);
      }
      return; // Don't process any other keys when game is over
    }
    
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
    }
    if (["p", "P", " "].includes(event.key)) {
      event.preventDefault();
      if (this.gameState.status !== "waiting for players") {
        this.sendPayLoad(event);
      }
    }
  }

  protected leaveGame(): void {
    // Stop the game loop first
    this.stopGame();
    
    // Then call parent's leaveGame to handle WebSocket cleanup and navigation
    super.leaveGame();
  }
}
