import { singlePlayerGameRooms, lastActivity } from "./server.js";

export function setupRoomCleanup(): void {
  const timeOut: number = 3000;

  setInterval(() => {
    const now = Date.now();
    for (const [id, gameRoom] of singlePlayerGameRooms.entries()) {
      if (gameRoom.client === null) {
        const last = lastActivity.get(id);
        if (!last)
          continue ;
        if (now - last > timeOut) {
          console.log(`Cleaning up empty single player room id:${id}`);
          gameRoom.cleanup();
          singlePlayerGameRooms.delete(id);
          lastActivity.delete(id);
        }
      }
      else {
        lastActivity.set(id, now);

        console.log(`Single player game ${id}, running`);
      }
    }
  }, timeOut);
}
