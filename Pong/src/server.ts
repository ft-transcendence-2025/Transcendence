import Fastify from "fastify";
import WebSocket, { WebSocketServer } from 'ws'
import path from "node:path";
import cookie from '@fastify/cookie'; 
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from "fs";

import { cleanup } from "./cleanup.js";
import { tournament, getgame } from "./routes/routes.js";
import { webSocketConnection } from "./sockets/websocketconnection.js";
import { LocalGameRoom } from "./game/LocalGameRoom.js";
import { RemoteGameRoom } from "./game/RemoteGameRoom.js";
import { LocalTournament } from "./tournament/LocalTournament.js";
import { TournamentManager } from "./tournament/TournamentManager.js";
import { registerRemoteTournamentRoutes } from "./routes/tournamentRoutes.js";

// Maps for game rooms and local tournaments
export const localTournaments = new Map<number, LocalTournament>();
export const localGameRooms = new Map<number, LocalGameRoom>();
export const remoteGameRooms = new Map<number, RemoteGameRoom>();
export const customGameRoom = new Map<number, RemoteGameRoom>();

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
})

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
