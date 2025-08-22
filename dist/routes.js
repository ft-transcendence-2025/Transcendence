import { GameRoom } from "./game/Game.js";
import { gameRooms, lastActivity } from "./server.js";
let gameId = 0;
export async function routes(fastify) {
    fastify.get("/creategame/singleplayer", (req, reply) => {
        const cookies = req.cookies;
        if (cookies.GameId === undefined) { // Create game if cookie.GameId is not found
            const gameRoom = new GameRoom(gameId, "singleplayer");
            gameRooms.set(gameId, gameRoom);
            lastActivity.set(gameId, Date.now());
            reply.setCookie("GameId", gameId.toString());
            reply.send({
                state: "Created",
                gameMode: "singleplayer",
                id: gameId++,
            });
        }
        else { // Joing game if cookie.GameId is found
            const cookieGameId = parseInt(cookies.GameId);
            lastActivity.set(cookieGameId, Date.now());
            reply.send({
                state: "Joined",
                gameMode: "singleplayer",
                id: cookieGameId,
            });
        }
    });
    fastify.get("/creategame/multiplayer", (req, reply) => {
        const gameRoom = new GameRoom(gameId, "multiplayer");
        gameRooms.set(gameId, gameRoom);
        reply.send({
            state: "Created",
            gameMode: "multiplayer",
            id: gameId++,
        });
    });
}
;
