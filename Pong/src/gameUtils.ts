import WebSocket from "ws"
import { RemoteGameRoom } from "./game/RemoteGameRoom.js";
import { LocalGameRoom } from "./game/LocalGameRoom.js";
import { localGameRooms } from "./server.js";

export function clearLocalGame(gameRoom: LocalGameRoom) {
  if (gameRoom.client) {
    gameRoom.cleanup();
  }
  if (gameRoom.id !== null) {
    localGameRooms.delete(gameRoom.id);
  }
}

export function playerLeftGame(ws: WebSocket, gameRoom: RemoteGameRoom): void {
  const isCustomLobby = gameRoom.type === "custom" && !gameRoom.hasStarted();

  if (isCustomLobby) {
    gameRoom.cancelGame("player_left");
    return;
  }

  gameRoom.game.gameState.status = "Player left the game";
  if (ws === gameRoom.player1) {
    gameRoom.game.gameState.score.winner = 2;
  }
  else if (ws === gameRoom.player2) {
    gameRoom.game.gameState.score.winner = 1;
  }
}
