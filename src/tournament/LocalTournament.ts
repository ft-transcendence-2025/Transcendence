import { PayLoad } from "../game/Game.js";
import { LocalGameRoom } from "../game/LocalGameRoom.js";
import { Players, TournamentState, Match } from "./Tournament.js";

export class LocalTournament {
  public id;
  public player1: string;
  public player2: string;
  public player3: string;
  public player4: string;

  public gameRoom: LocalGameRoom = new LocalGameRoom(null);

  public state: TournamentState;

  constructor(p1: string, p2: string, p3: string, p4: string, id: number) {
    this.id = id;
    this.player1 = p1;
    this.player2 = p2;
    this.player3 = p3;
    this.player4 = p4;

    this.state = {
      id : this.id,
      match1: {
        player1: this.player1,
        player2: this.player2,
        winner: null,
        loser: null,
      },
      match2: {
        player1: this.player3,
        player2: this.player4,
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
      gameState: null,
    }
  }

  public handleEvents(msg: PayLoad) {
    this.matchWinner();
    this.gameRoom.handleEvents(msg);
  }

  public matchWinner() {
    // If no winner in the match, Check the score to see if there is a game running
    // if the score is not 0-0, there is a game running
    const winner = this.gameRoom.game.gameState.score.winner;
    if (!winner) {
      this.state.currentGameScore.player1 = this.gameRoom.game.gameState.score.player1;
      this.state.currentGameScore.player2 = this.gameRoom.game.gameState.score.player2;
      return ;
    }
    else {
      this.state.currentGameScore.player1 = 0;
      this.state.currentGameScore.player2 = 0;
    }

    // Set the match winners
    if (!this.state.match1.winner) {
      this.state.match1.winner = winner === 1 ? this.player1 : this.player2;
      this.state.match1.loser = winner === 1 ? this.player2 : this.player1;
      this.state.match3.player1 = this.state.match1.winner;
      this.storeResolt(1);
    }
    else if (!this.state.match2.winner) {
      this.state.match2.winner = winner === 1 ? this.player3 : this.player4;
      this.state.match1.loser = winner === 1 ? this.player4 : this.player3;
      this.state.match3.player2 = this.state.match2.winner;
      this.storeResolt(2);
    }
    else if (!this.state.match3.winner) {
      this.state.match3.winner = winner === 1 ? this.state.match3.player1 : this.state.match3.player2;
      this.state.match3.loser = winner === 1 ? this.state.match3.player2 : this.state.match3.player1;
      this.storeResolt(3);
    }


    this.gameRoom.game.gameState.score.winner = null;
    this.gameRoom.game.gameState.score.player1 = 0;
    this.gameRoom.game.gameState.score.player2 = 0;
    this.gameRoom.game.gameState.ball.isRunning = false;
  }

  private async storeResolt(match: number) {
    let winner;
    let loser;
    let player1;
    let player2;
    let isFinal: boolean = false;

    switch (match) {
      case 1:
        winner = this.state.match1.winner;
        loser = this.state.match1.loser;
        player1 = this.state.match1.player1;
        player2 = this.state.match1.player2;
        break;

      case 2:
        winner = this.state.match2.winner;
        loser = this.state.match2.loser;
        player1 = this.state.match2.player1;
        player2 = this.state.match2.player2;
        break;

      case 3:
        winner = this.state.match3.winner;
        loser = this.state.match3.loser;
        player1 = this.state.match3.player1;
        player2 = this.state.match3.player2;
        isFinal = true;
        break ;

      default:
        break;
    }

    const requestBody = {
      tournamentId: this.id,
      player1: player1,
      player2: player2,
      score1: this.gameRoom.game.gameState.score.player1,
      score2: this.gameRoom.game.gameState.score.player2,
      winner: winner,
      startTime: Date.now(),
      endTime: Date.now(),
      finalMatch: isFinal,
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
      // throw new Error(`POST failed with status ${response.status}`);
    }
    const result = await response.json();
  }

}
