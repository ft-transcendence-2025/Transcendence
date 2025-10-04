import WebSocket from "ws"
import { TimeToWait } from "../game/Game.js";
import { GameRoom } from "../game/GameRoom.js";
import { Player } from "./RemoteTournament.js";
import { TournamentState } from "./Tournament.js";

export class GameRoomTournament extends GameRoom {
  private gameInterval: NodeJS.Timeout | null = null;
  public player1Name: string | null = null;
  public player2Name: string | null = null;
  private timePlayerLeft: number = Date.now();
  private isGameOverInProgress = false;
  public tournamentState: TournamentState;
  public players: Player[];
  public lastStateSent: boolean = false;


  constructor(id: number, players: Player[]) {
    super(id);

    this.players = players;
    this.tournamentState = {
      id: id,
      match1: {
        player1: players[0].name,
        player2: players[1].name,
        winner: null,
        loser: null,
      },
      match2: {
        player1: players[2].name,
        player2: players[3].name,
        winner: null,
        loser: null,
      },
      match3: { 
        player1: null,
        player2: null,
        winner: null,
        loser: null,
      },
      currentGameScore: {
        player1: 0,
        player2: 0,
      },
      gameState: this.game.gameState,
    }
  }

  public addPlayersToTournament() {
    this.tournamentState.match1.player1 = this.players[0].name;
    this.tournamentState.match1.player2 = this.players[1].name;
    this.tournamentState.match2.player1 = this.players[2].name;
    this.tournamentState.match2.player2 = this.players[3].name;
  }

  public cleanup() {
    if (this.players[0].ws) {
      this.players[0].ws.close();
      this.players[0].ws = null;
    }
    if (this.players[1].ws) {
      this.players[1].ws.close();
      this.players[1].ws = null;
    }
    if (this.players[2].ws) {
      this.players[2].ws.close();
      this.players[2].ws = null;
    }
    if (this.players[3].ws) {
      this.players[3].ws.close();
      this.players[3].ws = null;
    }
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }


  public broadcast() {
    if (this.players[0].ws) {
      this.players[0].ws.send(JSON.stringify(this.tournamentState));
    }
    if (this.players[1].ws) {
      this.players[1].ws.send(JSON.stringify(this.tournamentState));
    }
    if (this.players[2].ws) {
      this.players[2].ws.send(JSON.stringify(this.tournamentState));
    }
    if (this.players[3].ws) {
      this.players[3].ws.send(JSON.stringify(this.tournamentState));
    }
  }


  public startGameLoop(players: Player[]): void {
    if (this.gameInterval)
      return ;
    this.gameInterval = setInterval(() => {

      let point;
      if (this.game.gameState.player1Name && this.game.gameState.player2Name) {
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
      if (this.game.gameState.score.winner && !this.isGameOverInProgress) {
        this.gameOver();
      } 
      else {
        this.broadcast();
      }
    }, this.FPS60);
  }


  public waitingForPlayer() {
    if (!this.game.gameState || !this.game.gameState.player2Name || !this.game.gameState.player1Name)
      return ;

    const timePassed = Date.now() - this.timePlayerLeft

    if (timePassed >= 1000) {
      this.game.gameState.timeToWait -= 1;
      this.timePlayerLeft = Date.now();
    }

    // Set gameWinner when 45 seconds passed
    if (this.game.gameState.timeToWait <= 0) {
      if (!this.game.gameState.player1Name) {
        this.game.gameState.score.winner = 2;
      }
      else if (!this.game.gameState.player2Name) {
        this.game.gameState.score.winner = 1;
      }
    }
  }


  public async gameOver() {
    if (this.isGameOverInProgress) return;
    if(!this.game.gameState.score.winner || !this.game.gameState.player1Name ||
      !this.game.gameState.player2Name || !this.gameInterval)
      return ;
    clearInterval(this.gameInterval);
    this.gameInterval = null;
    const winner: string = this.game.gameState.score.winner === 1 ?
      this.game.gameState.player1Name : this.game.gameState.player2Name;
    const loser: string = this.game.gameState.score.winner === 2 ?
      this.game.gameState.player1Name : this.game.gameState.player2Name;

    this.game.gameState.player1Name = undefined;
    this.game.gameState.player2Name = undefined;

    // Set match winners
    if (!this.tournamentState.match1.winner) {
      this.tournamentState.match1.winner = winner;
      this.tournamentState.match1.loser = loser;
      this.tournamentState.match3.player1 = winner;
    }
    else if (!this.tournamentState.match2.winner) {
      this.tournamentState.match2.winner = winner;
      this.tournamentState.match2.loser = loser;
      this.tournamentState.match3.player2 = winner;
    }
    else if (!this.tournamentState.match3.winner) {
      this.tournamentState.match3.winner = winner;
      this.tournamentState.match3.loser = loser;
    }
    this.broadcast();
    this.game.gameState.score.winner = null;
    this.game.gameState.status = "waiting for players";
  }

  public setFinal(playerName: string) {
    if (playerName === this.tournamentState.match1.winner) {
      this.game.gameState.player1Name = playerName;
    }
    else if (playerName === this.tournamentState.match2.winner) {
      this.game.gameState.player2Name = playerName;
    }
  }

  public firstMatch(playerName: string) {
    if (playerName === this.players[0].name) {
      this.game.gameState.player1Name = playerName;
    }
    else if (playerName === this.players[1].name) {
      this.game.gameState.player2Name = playerName;
    }
  }

  public secondMatch(playerName: string) {
    if (playerName === this.players[2].name) {
      this.game.gameState.player1Name = playerName;
    }
    else if (playerName === this.players[3].name) {
      this.game.gameState.player2Name = playerName;
    }
  }

}
