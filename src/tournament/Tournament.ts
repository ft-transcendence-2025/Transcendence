import { GameState } from "../game/Game.js";

export interface Players {
  player1: string,
  player2: string,
  player3: string,
  player4: string,
}

export interface TournamentState {
  id: number,
  match1: Match,
  match2: Match,
  match3: Match,
  currentGameScore: {
    player1: number,
    player2: number,
  }
  gameState: GameState | null,
}

export interface Match {
  player1: string | null,
  player2: string | null,
  winner: string | null,
  loser: string | null,
}
