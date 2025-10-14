import Fastify from "fastify";
import cookie from '@fastify/cookie';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup } from "./cleanup.js";
import { tournament, getgame } from "./routes/routes.js";
import { webSocketConnection } from "./sockets/websocketconnection.js";
import { TournamentManager } from "./tournament/TournamentManager.js";
import { registerRemoteTournamentRoutes } from "./routes/tournamentRoutes.js";
// Maps for game rooms and local tournaments
export const localTournaments = new Map();
export const localGameRooms = new Map();
export const remoteGameRooms = new Map();
export const customGameRoom = new Map();
const __dirname = dirname(fileURLToPath(import.meta.url));
export const fastify = Fastify({
    logger: {
        level: "info",
        file: "./log/server.log",
    },
});
fastify.register(cookie);
fastify.register(getgame, { prefix: "/getgame" });
fastify.register(tournament, { prefix: "/tournament" });
fastify.register(registerRemoteTournamentRoutes, { prefix: "/" });
fastify.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }
});
webSocketConnection(fastify.server);
cleanup();
// Cleanup abandoned games every 5 minutes
setInterval(() => {
    const now = Date.now();
    const GAME_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    // Clean up remote game rooms that have ended
    for (const [id, room] of remoteGameRooms) {
        if (room.game?.gameState?.score?.winner) {
            // Game has ended, check if enough time passed for cleanup
            remoteGameRooms.delete(id);
            room.cleanup();
        }
    }
    // Clean up custom game rooms that have ended
    for (const [id, room] of customGameRoom) {
        if (room.game?.gameState?.score?.winner) {
            customGameRoom.delete(id);
            room.cleanup();
        }
    }
}, 5 * 60 * 1000);
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    TournamentManager.getInstance().shutdown();
    fastify.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    TournamentManager.getInstance().shutdown();
    fastify.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
