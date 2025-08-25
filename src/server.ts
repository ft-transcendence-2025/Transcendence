import Fastify from "fastify";
import WebSocket, { WebSocketServer } from 'ws'
import path from "node:path";
import cookie from '@fastify/cookie'; 
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { setupRoomCleanup } from "./utils.js";
import { singlePlayerRoute } from "./routes.js";
import { WebSocketConnection } from "./WebSocketConnection.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";

export const singlePlayerGameRooms = new Map<number, SinglePlayerGameRoom>();
// export const multiPlayerGameRooms = new Map<number, GameRoom>();
export const lastActivity = new Map<number, number>();

const __dirname = dirname(fileURLToPath(import.meta.url));


export const fastify = Fastify({
  logger: {
    level: "info",
    file: "./log/server.log",
  }
});

fastify.register(cookie);
fastify.register(singlePlayerRoute);
// fastify.register(multiPlayerRoute);

fastify.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
})

new WebSocketConnection(fastify.server);
setupRoomCleanup();

