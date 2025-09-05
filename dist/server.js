import Fastify from "fastify";
import cookie from '@fastify/cookie';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupRoomCleanup, setupTournomentCleanup } from "./utils.js";
import { tournoment, getgame } from "./routes.js";
import { WebSocketConnection } from "./WebSocketConnection.js";
export const tournoments = new Map();
export const singlePlayerGameRooms = new Map();
export const remoteGameRooms = new Map();
export const singlePlayerLastActivity = new Map();
const __dirname = dirname(fileURLToPath(import.meta.url));
export const fastify = Fastify({
    logger: {
        level: "info",
        file: "./log/server.log",
    },
});
fastify.register(cookie);
fastify.register(getgame, { prefix: "/getgame" });
fastify.register(tournoment);
fastify.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }
});
new WebSocketConnection(fastify.server);
setupRoomCleanup();
setupTournomentCleanup();
