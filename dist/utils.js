import {
  tournoments, singlePlayerGameRooms, 
  singlePlayerLastActivity 
} from "./server.js";

export function setupRoomCleanup() {
    const timeOut = 1000 * 30; // 30 seconds
    setInterval(() => {
        const now = Date.now();
        for (const [id, gameRoom] of singlePlayerGameRooms.entries()) {
            if (gameRoom.client === null) {
                const last = singlePlayerLastActivity.get(id);
                if (!last)
                    continue;
                if (now - last > timeOut) {
                    gameRoom.cleanup();
                    singlePlayerGameRooms.delete(id);
                    singlePlayerLastActivity.delete(id);
                }
            }
            else {
                singlePlayerLastActivity.set(id, now);
            }
        }
    }, timeOut);
}
export function setupTournomentCleanup() {
    const timeOut = 1000 * 60 * 30; // 30 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [id, tournoment] of tournoments) {
            if (now - tournoment.startTime > timeOut) {
                tournoments.delete(id);
            }
        }
    }, timeOut);
}
