import WebSocket from "ws"
import { RemoteGameRoom } from "./../game/RemoteGameRoom.js";
import { TournamentState } from "./Tournament.js";
import { GameRoom } from "../game/GameRoom.js";

interface Player {
  name: string | null,
  ws: WebSocket | null,
}

export class RemoteTournament {
  public id;
  public players: Player[] = [];

  private playerCapacity: number = 4;

  public gameRoom: RemoteGameRoom | null = null;
  public state: TournamentState | null = null;

  constructor(id: number, playerName: string) {
    this.id = id;

    for (let i = 0; i < 4; ++i) {
      this.players[i] = {
        name: null,
        ws: null,
      }
    }

    this.state = this.getState();
  }

  public getState(): TournamentState | null {
    return {
      id: this.id,
      match1: {
        player1: this.players[0].name,
        player2: this.players[1].name,
        winner: null,
      },
      match2: {
        player1: this.players[2].name,
        player2: this.players[3].name,
        winner: null,
      },
      match3: { 
        player1: null,
        player2: null,
        winner: null,
      },
      currentGameScore: {
        player1: 0,
        player2: 0,
      }
    }
  }

  public broadcast() {
    if (this.players[0] && this.players[0].ws) {
      this.players[0].ws.send(JSON.stringify(this.state));
    }
    if (this.players[1] && this.players[1].ws) {
      this.players[1].ws.send(JSON.stringify(this.state));
    }
    if (this.players[2] && this.players[2].ws) {
      this.players[2].ws.send(JSON.stringify(this.state));
    }
    if (this.players[3] && this.players[3].ws) {
      this.players[3].ws.send(JSON.stringify(this.state));
    }
  }

  public createGameRoom() {
    if (this.state?.match1.winner === null && this.players[0].name && this.players[1].name) {
      if (!this.gameRoom) {
        this.gameRoom = new RemoteGameRoom(0, this.players[0].name);
        this.gameRoom.player2Name = this.players[1].name;
      }
    }
    else if (this.state?.match2.winner === null && this.players[2].name && this.players[3].name) {
      if (!this.gameRoom) {
        this.gameRoom = new RemoteGameRoom(0, this.players[2].name);
        this.gameRoom.player2Name = this.players[3].name;
      }
    }
    else if (this.state?.match3.winner === null && this.state.match1.winner && this.state.match2.winner) {
      if (!this.gameRoom) {
        this.gameRoom = new RemoteGameRoom(0, this.state.match1.winner);
        this.gameRoom.player2Name = this.state.match2.winner;
      }
    }
    else {
      if (this.gameRoom) {
        this.gameRoom.cleanup();
        this.gameRoom = null;
      }
    }
  }

  public connectPlayer(playerName: string, ws: WebSocket) {
    for (let i = 0; i < this.playerCapacity; ++i) {
      if (this.players[i].name != playerName)
        continue;

      this.players[i].ws = ws;
      this.state = this.getState();
      break;
    }
  }

  public addPlayer(playerName: string): number {
    for (let i = 0; i < this.playerCapacity; ++i) {
      if (this.players[i].name === playerName)
        break ;
      if (this.players[i].name)
        continue;

      this.players[i].name = playerName;
      break;
    }
    this.state = this.getState();
    return 0;
  }
}
