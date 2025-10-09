import WebSocket from "ws"
import { TournamentState } from "./Tournament.js";
import { GameRoom } from "../game/GameRoom.js";
import { GameRoomTournament } from "./GameRoomTournament.js";
import { PayLoad } from "./../game/Game.js";

export interface Player {
  name: string | null,
  ws: WebSocket | null,
}

export class RemoteTournament {
  public id;
  public players: Player[] = [];

  private playerCapacity: number = 4;
  public gameRoom: GameRoomTournament;

  constructor(id: number) {
    this.id = id;

    for (let i = 0; i < 4; ++i) {
      this.players[i] = {
        name: null,
        ws: null,
      }
    }
    this.gameRoom = new GameRoomTournament(id, this.players);
  }

  // Connect the socket from the player already in the tournament
  public connectPlayer(playerName: string, ws: WebSocket): number {
    for (let i = 0; i < 4; ++i) {
      if (this.players[i].name != playerName || !this.players[i].name)
        continue ;
      if (this.players[i].name === this.gameRoom.tournamentState.match1.loser)
        return -1 ;
      if (this.players[i].name === this.gameRoom.tournamentState.match2.loser)
        return -1 ;
      if (this.players[i].name === this.gameRoom.tournamentState.match3.loser)
        return -1 ;

      this.players[i].ws = ws;
      break ;
    }
    return 0;
  }

  // Add player to the tournament if there is a empty spot
  // break is player is already in the tournament
  public addPlayer(playerName: string): number {
    for (let i = 0; i < 4; ++i) {
      if (this.players[i].name === playerName)
        break ;
      if (this.players[i].name)
        continue ;

      this.players[i].name = playerName;
      break ;
    }
    this.gameRoom.addPlayersToTournament();
    return 0;
  }

  public enterGame(playerName: string) {
    // restart game points
    if (this.gameRoom.tournamentState.gameState) {
      if (this.gameRoom.tournamentState.gameState.score.player1 >= 3 ||
      this.gameRoom.tournamentState.gameState.score.player2 >= 3) {
        this.gameRoom.tournamentState.gameState.score = {
          player1: 0,
          player2: 0,
          winner: null,
        };
        this.gameRoom.game.gameState.ball.isRunning = false;
        this.gameRoom.tournamentState.gameState.status = "waiting for players";
      }
    }
    if (this.gameRoom.tournamentState.match1.winner === null) {
      this.gameRoom.firstMatch(playerName);
    }
    else if (this.gameRoom.tournamentState.match2.winner === null) {
      this.gameRoom.secondMatch(playerName);
    }
    else if (this.gameRoom.tournamentState.match3.winner === null) {
      this.gameRoom.setFinal(playerName);
    }
  }

  public isTournamentFull(): boolean {
    if (this.gameRoom.tournamentState.match1.player1 &&
      this.gameRoom.tournamentState.match1.player2 && 
      this.gameRoom.tournamentState.match2.player1 &&
      this.gameRoom.tournamentState.match2.player2) {
      return true ;
    }
    return false;
  }

  public handleEvents(msg: PayLoad) {
    this.gameRoom.handleEvents(msg);
  }

}
