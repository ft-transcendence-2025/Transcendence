import Fastify from "fastify";
import WebSocket, { WebSocketServer } from 'ws'
import path from "node:path";
import cookie from '@fastify/cookie'; 
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { setupRoomCleanup } from "./utils.js";
import { gameRoute } from "./routes.js";
import { WebSocketConnection } from "./WebSocketConnection.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";
import { RemoteGameRoom } from "./game/RemoteGameRoom.js";

export const singlePlayerGameRooms = new Map<number, SinglePlayerGameRoom>();
export const remoteGameRooms = new Map<number, RemoteGameRoom>();
export const singlePlayerLastActivity = new Map<number, number>();

const __dirname = dirname(fileURLToPath(import.meta.url));


export const fastify = Fastify({
  logger: {
    level: "info",
    file: "./log/server.log",
  }
});

fastify.register(cookie);
fastify.register(gameRoute);

fastify.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
})

new WebSocketConnection(fastify.server);
setupRoomCleanup();

