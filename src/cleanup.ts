import { remoteGameRooms, tournaments, customGameRoom, singlePlayerGameRooms, singlePlayerLastActivity } from "./server.js";

export function remoteGamesCleanup(): void {
  // Close game when there is a winner
  setInterval(() => {
    for (const [id, gameRoom] of remoteGameRooms.entries()) {
      if (gameRoom.game.gameState.score.winner) {
        if (gameRoom.player1) {
          gameRoom.player1.close()
        }
        if (gameRoom.player2) {
          gameRoom.player2.close()
        }
        remoteGameRooms.delete(id)
      }
    }
  }, 500);
}

export function singlePlayerRoomCleanup(): void {
  // Close game when there is a winner
  setInterval(() => {
    for (const [id, gameRoom] of singlePlayerGameRooms.entries()) {
      if (gameRoom.game.gameState.score.winner) {
        if (gameRoom.client) {
          gameRoom.client.close()
        }
        singlePlayerGameRooms.delete(id)
      }
    }
  }, 500);
}

export function setuptournamentCleanup(): void {
  const timeOut: number = 1000 * 60 * 30; // 30 minutes

  setInterval(() => {
    const now = Date.now();
    for  (const [id, tournament] of tournaments) {
      if (now - tournament.startTime > timeOut) {
        tournaments.delete(id);
      }
    }
  }, timeOut);
}
