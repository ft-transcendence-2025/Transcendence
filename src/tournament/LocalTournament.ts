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
      },
      match2: {
        player1: this.player3,
        player2: this.player4,
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
      this.state.match3.player1 = this.state.match1.winner;
    }
    else if (!this.state.match2.winner) {
      this.state.match2.winner = winner === 1 ? this.player3 : this.player4;
      this.state.match3.player2 = this.state.match2.winner;
    }
    else if (!this.state.match3.winner) {
      this.state.match3.winner = winner === 1 ? this.state.match3.player1 : this.state.match3.player2;
    }
  }
}
