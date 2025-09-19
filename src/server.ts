import Fastify from "fastify";
import WebSocket, { WebSocketServer } from 'ws'
import path from "node:path";
import cookie from '@fastify/cookie'; 
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from "fs";

import { remoteGamesCleanup, singlePlayerRoomCleanup, setuptournamentCleanup } from "./cleanup.js";
import { tournament, getgame } from "./routes.js";
import { WebSocketConnection } from "./WebSocketConnection.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";
import { RemoteGameRoom } from "./game/RemoteGameRoom.js";
import { Tournament } from "./tournament.js";

export const tournaments = new Map<number, Tournament>();
export const singlePlayerGameRooms = new Map<number, SinglePlayerGameRoom>();
export const remoteGameRooms = new Map<number, RemoteGameRoom>();
export const customGameRoom = new Map<number, RemoteGameRoom>();
export const singlePlayerLastActivity = new Map<number, number>();

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

fastify.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
})

new WebSocketConnection(fastify.server);
setuptournamentCleanup();
singlePlayerRoomCleanup();
remoteGamesCleanup();
