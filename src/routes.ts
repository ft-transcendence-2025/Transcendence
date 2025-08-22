import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Game, GameState, GameRoom} from "./game/Game.js";
import WebSocket, { WebSocketServer } from 'ws'
import { wss } from "./server.js";
import { gameRooms, lastActivity } from "./server.js";

let gameId = 0;

export async function routes(fastify: FastifyInstance) {
  fastify.get("/getgame/singleplayer", (req, reply) => {
    const cookies = req.cookies;

    // Create game if cookie.GameId is not found
    if (cookies.GameId === undefined) {
      createGame(reply);
    }
    else { // Joing game if cookie.GameId is found
      const cookieGameId: number = parseInt(cookies.GameId);
      if (gameRooms.has(cookieGameId)) {
        lastActivity.set(cookieGameId, Date.now());
        reply.send({
          state: "Joined",
          gameMode: "singleplayer",
          id: cookieGameId,
        });
      }
      else // Has gameId cookie but game does not exist
        createGame(reply);
    }
  });

  fastify.get("/getgame/multiplayer", (req, reply) => {
    const gameRoom = new GameRoom(gameId, "multiplayer");
    gameRooms.set(gameId, gameRoom);

    reply.send({
      state: "Created",
      gameMode: "multiplayer",
      id: gameId++,
    });
  });
};

function createGame(reply: FastifyReply) {
  const gameRoom = new GameRoom(gameId, "singleplayer");
  gameRooms.set(gameId, gameRoom);
  lastActivity.set(gameId, Date.now());

  reply.setCookie("GameId", gameId.toString(), {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });
  reply.send({
    state: "Created",
    gameMode: "singleplayer",
    id: gameId++,
  });
}
