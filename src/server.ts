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
import { RemoteTournament } from "./tournament/RemoteTournament.js";

export const remoteTournaments = new Map<number, RemoteTournament>;
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

fastify.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
})

webSocketConnection(fastify.server);
cleanup();
