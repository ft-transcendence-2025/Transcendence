export interface TournamentId {
  id: number
}

export interface Players {
  player1: string,
  player2: string,
  player3: string,
  player4: string,
}

export interface Winner {
  id: number,
  match: number,
  winner: string,
}

interface TournamentState {
  id: number,
  match1: Match,
  match2: Match,
  match3: Match,
}

interface Match {
  player1: string | null,
  player2: string | null,
  winner: string | null,
}

export class Tournament {
  public id;
  public player1: string;
  public player2: string;
  public player3: string;
  public player4: string;
  public startTime: number = Date.now();

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
    }
  }

  public match1Winner(player: string): Match | string {
    if (player !== this.state.match1.player1 && player !== this.state.match1.player2)
      return "Player not in match";
    if (this.state.match1.winner)
      return "Winner Already Set";
    this.state.match1.winner = player;
    this.state.match3.player1 = player;
    return this.state.match1;
  }

  public match2Winner(player: string): Match | string {
    if (player !== this.state.match2.player1 && player !== this.state.match2.player2)
      return "Player not in match";
    if (this.state.match2.winner)
      return "Winner Already Set";
    this.state.match2.winner = player;
    this.state.match3.player2 = player;
    return this.state.match2;
  }

  public match3Winner(player: string): Match | string {
    if (player !== this.state.match3.player1 && player !== this.state.match3.player2)
      return "Player not in match";
    if (this.state.match3.winner)
      return "Winner Already Set";
    this.state.match3.winner = player;
    return this.state.match3;
  }
}
