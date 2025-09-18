import { remoteGameRooms, tournaments, customGameRoom, singlePlayerGameRooms, singlePlayerLastActivity } from "./server.js";

// Clear Game Over games
export function remoteGamesCleanup(): void {
  const timeOut: number = 500;

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

  }, timeOut);
}

export function setupRoomCleanup(): void {
  const timeOut: number = 1000 * 30; // 30 seconds

  setInterval(() => {
    const now = Date.now();
    for (const [id, gameRoom] of singlePlayerGameRooms.entries()) {
      if (gameRoom.client === null) {
        const last = singlePlayerLastActivity.get(id);
        if (!last)
          continue ;
        if (now - last > timeOut) {
          console.log(`Cleaning up empty single player room id:${id}`);
          gameRoom.cleanup();
          singlePlayerGameRooms.delete(id);
          singlePlayerLastActivity.delete(id);
        }
      }
      else {
        singlePlayerLastActivity.set(id, now);

        console.log(`Single player game ${id}, running`);
      }
    }
  }, timeOut);
}

export function setuptournamentCleanup(): void {
  const timeOut: number = 1000 * 60 * 30; // 30 minutes

  setInterval(() => {
    const now = Date.now();
    for  (const [id, tournament] of tournaments) {
      if (now - tournament.startTime > timeOut) {
        console.log("tournament Deleted id:", id);
        tournaments.delete(id);
      }
    }
  }, timeOut);
}
