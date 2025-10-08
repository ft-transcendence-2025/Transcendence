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
      required: ["name"],
      properties: {
        name: { type: "string" },
      }
    }
  }
}

export const customGameSchema = {
  schema: {
    body: {
      type: "object",
      required: ["name"],
      properties: {
        player1: { type: "string" },
        player2: { type: "string" },
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
  const body = req.body as {name: string}
  const playerName = body.name

  if (remoteGameId === 0) { // Create first game
    createRemoteGame(reply, remoteGameId++, playerName);
  }
  else {
    if (reenterGameRoom(reply, playerName) === -1) { // Trys to reenter game if playerName was previous on a gameRoom
      if (joinGameRoom(reply, playerName) === -1) {  // In case playerName was never in a room previous, in enter a new game
        createRemoteGame(reply, remoteGameId++, playerName); // If no gameRoom open waiting for player to foin, will create a new
      }
    }
  }
}

export function customGame(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { player1: string, player2: string}
  const player1 = body.player1;
  const player2 = body.player2;

  createCustomGame(reply, customId++, player1, player2);
}
