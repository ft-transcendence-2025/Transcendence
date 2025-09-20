import WebSocket from "ws"
import { TimeToWait, Game, PayLoad } from "./Game.js";
import { Canvas, getRandomAngle, degreesToRadians } from "./utils.js";
import { GameRoom } from "./GameRoom.js";
import { clearInterval } from "node:timers";

// Time To Wait If Player Disconnect

export class RemoteGameRoom extends GameRoom {
  public player1: WebSocket | null = null;
  public player2: WebSocket | null = null;
  private gameInterval: NodeJS.Timeout | null = null;
  public player1Name: string | null = null;
  public player2Name: string | null = null;
  private timePlayerLeft: number = Date.now();
  private isGameOverInProgress = false;


  constructor(id: number, player1: string) {
    super(id)
    this.player1Name = player1;
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

  public addPlayer(ws: WebSocket, playerName: string): number {
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
      return;
    this.gameInterval = setInterval(() => {

      let point;
      if (this.player1 && this.player2) {
        this.game.gameState.status = "playing";
        this.timePlayerLeft = Date.now();
        this.game.gameState.timeToWait = TimeToWait;
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
          if (point === 1)
            this.game.gameState.score.player1++;
            else 
            this.game.gameState.score.player2++;
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
      } 
    }, this.FPS60);
  }

  public async waitingForPlayer() {
    if (!this.game.gameState || !this.player2Name || !this.player1Name)
      return ;

    const timePassed = Date.now() - this.timePlayerLeft

    if (timePassed >= 1000) {
      this.game.gameState.timeToWait -= 1;
      this.timePlayerLeft = Date.now();
    }

    // Set gameWinner when 45 seconds passed
    if (this.game.gameState.timeToWait <= 0) {
      if (!this.player1) {
        this.game.gameState.score.winner = 2;
      }
      else if (!this.player2) {
        this.game.gameState.score.winner = 1;
      }
    }
  }

  public async gameOver() {
    if (this.isGameOverInProgress) return;
    this.isGameOverInProgress = true;
    if(!this.game.gameState.score.winner || !this.player1Name || !this.player2Name || !this.gameInterval)
      return ;
    clearInterval(this.gameInterval);
    this.gameInterval = null;
    const winner: string = this.game.gameState.score.winner === 1 ? this.player1Name : this.player2Name;

    const requestBody = {
      tournamentId: 0,
      player1: this.player1Name,
      player2: this.player2Name,
      score1: this.game.gameState.score.player1,
      score2: this.game.gameState.score.player2,
      winner: winner,
      startTime: Date.now(),
      endTime: Date.now(),
      finalMatch: false
    };

   
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
      throw new Error(`POST failed with status ${response.status}`);
    }
    const result = await response.json();
    //console.log("Response data:", result);
    console.log("")
    console.log("")
    console.log("")
    console.log("================================================================================================================================================")
    console.log(`POST Done with success, check the data on the blockchain: https://testnet.snowscan.xyz/tx/${result.txHash}`);
    console.log("================================================================================================================================================")
    console.log("")
    console.log("")
    console.log("")
    

    if (this.player1) {
      this.player1.close()
    }
    if (this.player2) {
      this.player2.close()
    }
    
  }
}
