import { tournaments, customGameRoom, singlePlayerGameRooms, singlePlayerLastActivity } from "./server.js";

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
