import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RemoteGameRoom } from "./game/RemoteGameRoom.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";
import { tournaments, customGameRoom, remoteGameRooms, singlePlayerGameRooms, singlePlayerLastActivity } from "./server.js";

export function enterGameRoom(reply: FastifyReply, gameId: number): void {
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
    gameMode: "remote",
    id: gameId,
  });
}

export function searchGameRoom(): number {
  for (const [id, gameRoom] of remoteGameRooms) {
    if (!gameRoom.player1 && !gameRoom.player2) {
      if (gameRoom.game.gameState.score.player1 === 0 && gameRoom.game.gameState.score.player2 === 0) {
        return id;
      }
      else {
        continue;
      }
    }
    if (!gameRoom.player1 || !gameRoom.player2) {
      return id;
    }
  }
  return -1;
}

export function createRemoteGame(reply: FastifyReply, gameId: number) {
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
    gameMode: "remote",
    id: gameId,
  });
}

export function createCustomGame(reply: FastifyReply, gameId: number) {
  const gameRoom = new RemoteGameRoom(gameId);
  customGameRoom.set(gameId, gameRoom);

  reply.send({
    state: "Created",
    gameMode: "custom",
    id: gameId,
  });
}

export function createSinglePlayerGame(reply: FastifyReply, gameId: number) {
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
