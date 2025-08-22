import Fastify from "fastify";
import { WebSocketServer } from 'ws';
import cookie from '@fastify/cookie';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { socketConn } from "./websocket.js";
import { routes } from "./routes.js";
export const gameRooms = new Map();
export const lastActivity = new Map();
const __dirname = dirname(fileURLToPath(import.meta.url));
const fastify = Fastify({
    logger: {
        level: "info",
        file: "./log/server.log",
    }
});
fastify.register(cookie);
fastify.register(routes, { prefix: "/pong" });
export const wss = new WebSocketServer({ noServer: true });
const server = fastify.server;
fastify.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }
});
server.on('upgrade', (request, socket, head) => {
    const pathname = request.url?.split('?')[0] || '';
    if (pathname.startsWith("/pong/game/")) {
        const gameId = parseInt(pathname.split('/')[3]);
        if (isNaN(gameId)) {
            socket.destroy();
            return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request, { gameId });
        });
    }
    else
        socket.destroy();
});
function setupRoomCleanup() {
    const timeOut = 30000;
    setInterval(() => {
        const now = Date.now();
        for (const [id, room] of gameRooms.entries()) {
            if (room.clients.size === 0) {
                const last = lastActivity.get(id);
                if (!last)
                    continue;
                if (now - last > timeOut) {
                    console.log(`Cleaning up empty room id:${id}`);
                    room.stopGameLoop();
                    gameRooms.delete(id);
                    lastActivity.delete(id);
                }
            }
            else {
                lastActivity.set(id, now);
                console.log(`Game ${id}, running for ${now}`);
            }
        }
    }, timeOut);
}
socketConn(wss);
setupRoomCleanup();
