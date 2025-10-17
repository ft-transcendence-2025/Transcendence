import WebSocket from "ws"
import { TimeToWait } from "./Game.js";
import { GameRoom } from "./GameRoom.js";

export type CancelReason = "invite_declined" | "invite_expired" | "player_left";

export class RemoteGameRoom extends GameRoom {
  public player1: WebSocket | null = null;
  public player2: WebSocket | null = null;
  private gameInterval: ReturnType<typeof setInterval> | null = null;
  public player1Name: string | null = null;
  public player2Name: string | null = null;
  private timePlayerLeft: number = Date.now();
  private isGameOverInProgress = false;
  public onRoomClose?: (roomId: number) => void;
  private readonly gameType: "remote" | "custom" | "tournament";
  private hasMatchStarted = false;

  public player1StoredName: string | null = null;
  public player2StoredName: string | null = null;

  public onTournamentResult?: (result: {
    winnerId: string;
    loserId: string;
    score: { player1: number; player2: number };
  }) => void;



  constructor(id: number, player1: string, options?: {
    gameType?: "remote" | "custom" | "tournament",
    onRoomClose?: (roomId: number) => void,
  }) {
    super(id)
    this.player1Name = player1;
    this.gameType = options?.gameType ?? "remote";
    if (options?.onRoomClose) {
      this.onRoomClose = options.onRoomClose;
    }
  }

  public cleanup() {
    if (this.player1) {
      this.player1.close();
      this.player1 = null;
    }
    if (this.player2) {
      this.player2.close();
      this.player2 = null;
    }
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }

  public addPlayer(ws: WebSocket | null, playerName: string): number {
    if (ws == null)
      return -1;
    if (playerName !== this.player1Name && playerName !== this.player2Name) {
      return -1;
    }

    if (playerName === this.player1Name) {
      this.player1 = ws;
      this.game.gameState.player1Name = playerName;
    }
    else if (playerName === this.player2Name) {
      this.player2 = ws;
      this.game.gameState.player2Name = playerName;
    }
    return 0;
  }

  public broadcast() {
    if (this.player1 && this.player1.readyState === WebSocket.OPEN) {
      this.player1.send(JSON.stringify(this.game.gameState));
    }
    if (this.player2 && this.player2.readyState === WebSocket.OPEN) {
      this.player2.send(JSON.stringify(this.game.gameState));
    }
  }

  public startGameLoop(): void {
    if (this.gameInterval)
      return ;
    this.gameInterval = setInterval(() => {

      this.game.gameState.cancelReason = null;
      let point;
      if (this.player1 && this.player2) {
        this.game.gameState.status = "playing";
        this.timePlayerLeft = Date.now();
        this.game.gameState.timeToWait = TimeToWait;
        if (!this.hasMatchStarted) {
          this.hasMatchStarted = true;
        }
      }
      else {
        this.game.gameState.status = "waiting for players";
        this.waitingForPlayer();
      }

      if (this.game.gameState.status === "playing") {
        if (this.game.gameState.ball.isRunning && !this.game.gameState.isPaused) {
          this.game.ball.checkCeilingFloorCollision(this.game.canvas);
          this.game.ball.checkPaddleCollision(this.game.paddleLeft);
          this.game.ball.checkPaddleCollision(this.game.paddleRight);
          this.game.ball.move();
        }
        point = this.game.ball.pointScored(this.game.canvas);
        if (point !== 0) {
          if (point === 1) {
            this.game.gameState.score.player1++;
          }
          else  {
            this.game.gameState.score.player2++;
          }
          this.game.gameState.ball.isRunning = false;
          this.game.ball.reset(this.game.canvas);
          this.checkWinner();
        }
        this.game.paddleLeft.update(this.game.canvas);
        this.game.paddleRight.update(this.game.canvas);
      }

      this.broadcast();
      if (this.game.gameState.score.winner && !this.isGameOverInProgress){
        this.gameOver();
        return ;
      } 
    }, this.FPS60);
  }

  public cancelGame(reason: CancelReason): void {
    if (this.isGameOverInProgress)
      return;
    this.isGameOverInProgress = true;

    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    this.game.gameState.status = "cancelled";
    this.game.gameState.cancelReason = reason;
    this.game.gameState.isPaused = true;
    this.game.gameState.timeToWait = 0;
    this.game.gameState.ball.isRunning = false;
    this.game.gameState.score.winner = null;

    this.broadcast();

    setTimeout(() => {
      const roomId = this.id;
      if (roomId !== null)
        this.onRoomClose?.(roomId);
      this.cleanup();
    }, 2000);
  }

  public waitingForPlayer() {
    if (!this.game.gameState || !this.player2Name || !this.player1Name)
      return ;

    const timePassed = Date.now() - this.timePlayerLeft

    if (timePassed >= 1000) {
      this.game.gameState.timeToWait = Math.max(0, this.game.gameState.timeToWait - 1);
      this.timePlayerLeft = Date.now();
    }

    // Set gameWinner when 45 seconds passed
    if (this.game.gameState.timeToWait <= 0) {
      const player1Missing = !this.player1;
      const player2Missing = !this.player2;

      if (player1Missing || player2Missing) {
        if (this.gameType === "custom") {
          const reason: CancelReason = player2Missing ? "invite_expired" : "player_left";
          this.cancelGame(reason);
        }
        else {
          if (player1Missing) {
            this.game.gameState.score.winner = 2;
          }
          else if (player2Missing) {
            this.game.gameState.score.winner = 1;
          }
        }
      }
    }
  }

  public get type(): "remote" | "custom" | "tournament" {
    return this.gameType;
  }

  public hasStarted(): boolean {
    return this.hasMatchStarted;
  }

  public async gameOver() {
    if (this.isGameOverInProgress) return;
    this.isGameOverInProgress = true;
    if(!this.game.gameState.score.winner || !this.player1StoredName || !this.player2StoredName || !this.gameInterval)
      return ;
    
    // Stop the game interval
    clearInterval(this.gameInterval);
    this.gameInterval = null;
    
    // Send final game state to both players before closing
    this.broadcast();
    
    const winner: string = this.game.gameState.score.winner === 1 ?
      this.player1StoredName : this.player2StoredName;
    const loser: string = this.game.gameState.score.winner === 2 ?
      this.player1StoredName : this.player2StoredName;

    if (this.onTournamentResult && winner && loser) {
      try {
        this.onTournamentResult({
          winnerId: winner,
          loserId: loser,
          score: {
            player1: this.game.gameState.score.player1,
            player2: this.game.gameState.score.player2,
          },
        });
      } catch (error) {
        console.error("[RemoteGameRoom] Tournament result callback failed:", error);
      }
    }

    const requestBody = {
      tournamentId: 0,
      player1: this.player1StoredName,
      player2: this.player2StoredName,
      score1: this.game.gameState.score.player1,
      score2: this.game.gameState.score.player2,
      winner: winner,
      startTime: Date.now(),
      endTime: Date.now(),
      finalMatch: false
    };
   
    try {
      const response = await fetch(`http://blockchain:3000/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`POST failed with status ${response.status}: ${errorText}`);
      } else {
        const result = await response.json();
      }
    } catch (error) {
      console.error("Error saving match to blockchain:", error);
    }

    // Wait 6 seconds before closing connections to give clients time to receive final state and auto-navigate
    setTimeout(() => {
      if (this.player1) {
        this.player1.close();
        this.player1 = null;
      }
      if (this.player2) {
        this.player2.close();
        this.player2 = null;
      }
    }, 6000);
  }
}
