import { TournamentState } from "./Tournament";

export function isTournamentFull(tournamentState: TournamentState): boolean {
  if (tournamentState.match1.player1 &&
    tournamentState.match1.player2 && 
    tournamentState.match2.player1 &&
    tournamentState.match2.player2) {
    return true ;
  }
  return false;
}
