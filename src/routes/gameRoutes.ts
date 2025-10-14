import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  createLocalGame, createRemoteGame,
  reenterGameRoom, joinGameRoom, createCustomGame
} from "./routeUtils.js";
import { localGameRooms } from "../server.js";

let localGameId: number = 0;
let remoteGameId: number = 0;
let customId: number = 0;

export const remoteGameSchema = {
  schema: {
    body: {
      type: "object",
      required: ["name", "storedName"],
      properties: {
        name: { type: "string" },
        storedName: { type: "string" },
      }
    }
  }
}

export const customGameSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "player1", "player2",
        "player1Display"
      ],
      properties: {
        player1: { type: "string" },
        player2: { type: "string" },
        player1Display: { type: "string" },
      }
    }
  }
}

export function localGameRequest(req: FastifyRequest, reply: FastifyReply) {
    const cookies = req.cookies;

    // Create game if cookie.GameId is not found
    if (cookies.localGameId === undefined) {
      createLocalGame(reply, localGameId++);
    }
    else { // Joing game if cookie.GameId is found
      const cookieGameId: number = parseInt(cookies.localGameId);
      if (localGameRooms.has(cookieGameId)) {
        reply.send({
          state: "Joined",
          gameMode: "local",
          id: cookieGameId,
        });
      }
      else { // Has gameId cookie but game does not exist
        reply.clearCookie("localGameId", {
          path: "/"
        });
        createLocalGame(reply, localGameId++);
      }
    }
}

export function remoteGame(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as {name: string, storedName: string}
  const playerName = body.name;
  const playerStoredName = body.storedName;

  if (remoteGameId === 0) { // Create first game
    createRemoteGame(reply, remoteGameId++, playerName, playerStoredName);
  }
  else {
    // Use storedName (actual username) for reentry check
    if (reenterGameRoom(reply, playerStoredName) === -1) {
      if (joinGameRoom(reply, playerName, playerStoredName) === -1) {
        createRemoteGame(reply, remoteGameId++, playerName, playerStoredName);
      }
    }
  }
}

export function customGame(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { 
    player1: string,
    player2: string,
    player1Display: string,
  }
  const player1 = body.player1;
  const player2 = body.player2;
  const player1Display = body.player1Display;


  createCustomGame(
    reply, customId++,
    player1, player2,
    player1Display
  );
}
