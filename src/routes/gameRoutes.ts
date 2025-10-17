import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  createLocalGame, createRemoteGame,
  reenterGameRoom, joinGameRoom, createCustomGame,
  cancelCustomGameRoom,
  isPlayerInActiveGame
} from "./routeUtils.js";
import type { CancelReason } from "../game/RemoteGameRoom.js";
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

export const cancelCustomGameSchema = {
  schema: {
    params: {
      type: "object",
      required: ["gameId"],
      properties: {
        gameId: { type: "integer", minimum: 0 },
      },
    },
    body: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: ["invite_declined", "invite_expired", "player_left"],
        },
      },
    },
  },
};

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

  if (reenterGameRoom(reply, playerStoredName) !== -1) {
    return;
  }

  if (isPlayerInActiveGame(playerStoredName)) {
    reply.code(409).send({
      state: "busy",
      message: "Player is already participating in a game."
    });
    return;
  }

  if (joinGameRoom(reply, playerName, playerStoredName) !== -1 || reply.sent) {
    return;
  }

  createRemoteGame(reply, remoteGameId++, playerName, playerStoredName);
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

export function cancelCustomGame(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as { gameId: string };
  const body = (req.body ?? {}) as { reason?: CancelReason };

  const gameId = Number.parseInt(params.gameId, 10);
  if (Number.isNaN(gameId)) {
    reply.code(400).send({ message: "Invalid game id" });
    return;
  }

  const cancelReason = body.reason ?? "invite_declined";
  if (!cancelCustomGameRoom(gameId, cancelReason)) {
    reply.code(404).send({ message: "Game room not found" });
    return;
  }

  reply.send({ status: "cancelled" });
}
