import WebSocket, { WebSocketServer } from "ws"
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { RemoteGameRoom } from "./game/RemoteGameRoom.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";
import { tournaments, customGameRoom, remoteGameRooms, singlePlayerGameRooms, singlePlayerLastActivity } from "./server.js";


export function clearSinglePlayerGame(gameRoom: SinglePlayerGameRoom) {
  if (gameRoom.client) {
    gameRoom.client.close();
  }
  singlePlayerGameRooms.delete(gameRoom.id);
}

export function playerLeftGame(ws: WebSocket, gameRoom: RemoteGameRoom): void {
  gameRoom.game.gameState.status = "Player left the game"
  if (ws === gameRoom.player1) {
    console.log(`Player ${gameRoom.player1Name} Left the Game`)
    gameRoom.game.gameState.score.winner = 2;
  }
  else if (ws === gameRoom.player2) {
    console.log(`Player ${gameRoom.player2Name} Left the Game`)
    gameRoom.game.gameState.score.winner = 1;
  }
}

export function reenterGameRoom(reply: FastifyReply, playerName: string): number {
  console.log(playerName, "- Checking if is in some game")
  for (const [id, gameRoom] of remoteGameRooms) {
    console.log(`Looking int game: ${id}, With:, ${gameRoom.player1Name} and ${gameRoom.player2Name}`)
    if (gameRoom.player1Name === playerName) {
      console.log(`Entering Game: ${id}`)
      reply.send({
        state: "enter",
        side: "left",
        gameMode: "remote",
        name: playerName,
        id: id,
      });
      return id;
    }
    else if (gameRoom.player2Name === playerName) {
      console.log(`Entering Game: ${id}`)
      reply.send({
        state: "enter",
        side: "right",
        gameMode: "remote",
        name: playerName,
        id: id,
      });
      return id;
    }
  }
  return -1;
}

export function joinGameRoom(reply: FastifyReply, playerName: string): number {
  console.log(`${playerName} - Joining game for the first time`)
  for (const [id, gameRoom] of remoteGameRooms) {
    if (gameRoom.player2Name === null) {
      console.log(`${playerName} entering game Room with ${gameRoom.player1Name}`)
      gameRoom.player2Name = playerName;
      reply.send({
        state: "joined",
        side: "right",
        gameMode: "remote",
        name: playerName,
        id: id,
      });
      return id;
    }
  }
  return -1;
}

export function createRemoteGame(reply: FastifyReply, gameId: number, playerName: string) {
  console.log("Creating Game", gameId, " for:", playerName)
  const gameRoom = new RemoteGameRoom(gameId, playerName);
  gameRoom.player1Name = playerName;
  remoteGameRooms.set(gameId, gameRoom);

  reply.send({
    state: "Created",
    side: "left",
    gameMode: "remote",
    name: playerName,
    id: gameId,
  });
}

export function createCustomGame(reply: FastifyReply, gameId: number, player: string) {
  const gameRoom = new RemoteGameRoom(gameId, player);
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
