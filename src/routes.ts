import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Game, GameState} from "./game/Game.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";
import { RemoteGameRoom } from "./game/RemoteGameRoom.js";
import { remoteGameRooms, singlePlayerGameRooms, singlePlayerLastActivity } from "./server.js";

let singlePlayerGameId: number = 0;
let remoteGameId: number = 0;

export async function gameRoute(fastify: FastifyInstance) {
  fastify.get("/getgame/singleplayer", (req, reply) => {
    const cookies = req.cookies;

    // Create game if cookie.GameId is not found
    if (cookies.singlePlayerGameId === undefined) {
      createSinglePlayerGame(reply, singlePlayerGameId++);
    }
    else { // Joing game if cookie.GameId is found
      const cookieGameId: number = parseInt(cookies.singlePlayerGameId);
      if (singlePlayerGameRooms.has(cookieGameId)) {
        singlePlayerLastActivity.set(cookieGameId, Date.now());
        reply.send({
          state: "Joined",
          gameMode: "singleplayer",
          id: cookieGameId,
        });
      }
      else { // Has gameId cookie but game does not exist
        reply.clearCookie("singlePlayerGameId", {
          path: "/"
        });
        createSinglePlayerGame(reply, singlePlayerGameId++);
      }
    }
  });

  fastify.get("/getgame/remote", (req, reply) => {
    const cookies = req.cookies;
    if (cookies.remoteGameId === undefined) {
      const id = searchGameRoom();
      if (id === -1) {
        createRemoteGame(reply, remoteGameId++);
      }
      else {
        enterGameRoom(reply, id);
      }
    }
    else {
      const cookieGameId: number = parseInt(cookies.remoteGameId);
      if (remoteGameRooms.has(cookieGameId)) {
        enterGameRoom(reply, cookieGameId);
      }
      else {
        reply.clearCookie("remoteGameId", {
          path: "/"
        });
        createRemoteGame(reply, remoteGameId++);
      }
    }
  });
}

function enterGameRoom(reply: FastifyReply, gameId: number): void {
  const gameRoom = remoteGameRooms.get(gameId);
  let side: string = "full";

  if (gameRoom) {
    if (!gameRoom.player1) {
      side = "left";
    }
    else if (!gameRoom.player2) {
      side = "right";
    }
  }

  reply.send({
    state: "Joined",
    side: side,
    gameMode: "remotegame",
    id: gameId,
  });
}

function searchGameRoom(): number {
   for (const [id, gameRoom] of remoteGameRooms) {
    if (!gameRoom.player1 || !gameRoom.player2)
      return id;
   }
  return -1;
}

function createRemoteGame(reply: FastifyReply, gameId: number) {
  const gameRoom = new RemoteGameRoom(gameId);
  remoteGameRooms.set(gameId, gameRoom);

  reply.setCookie("remoteGameId", gameId.toString(), {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });

  reply.send({
    state: "Created",
    side: "left",
    gameMode: "remoteGame",
    id: gameId,
  });
}

function createSinglePlayerGame(reply: FastifyReply, gameId: number) {
  singlePlayerGameRooms.set(gameId, new SinglePlayerGameRoom(gameId));
  singlePlayerLastActivity.set(gameId, Date.now());

  reply.setCookie("singlePlayerGameId", gameId.toString(), {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });

  reply.send({
    state: "Created",
    gameMode: "singleplayer",
    id: gameId,
  });
}
