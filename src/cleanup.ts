import { 
  remoteGameRooms, localTournaments, localGameRooms 
} from "./server.js";

export function cleanup() {
  localRoomCleanup();
  remoteGamesCleanup();
  localTournamentCleanup();
}

function remoteGamesCleanup(): void {
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

function localRoomCleanup(): void {
  // Close game when there is a winner
  setInterval(() => {
    for (const [id, gameRoom] of localGameRooms.entries()) {
      if (gameRoom.game.gameState.score.winner) {
        if (gameRoom.client) {
          gameRoom.client.close()
        }
        localGameRooms.delete(id)
      }
    }
  }, 500);
}

function localTournamentCleanup(): void {
  setInterval(() => {
    for (const [id, tournament] of localTournaments.entries()) {
      if (tournament.state.match3.winner) {
        if (tournament.gameRoom.client) {
          tournament.gameRoom.cleanup();
        }
        localTournaments.delete(id)
      }
    }
  }, 500);
}
