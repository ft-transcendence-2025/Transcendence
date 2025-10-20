import WebSocket from "ws"
import { PayLoad } from "./../game/Game.js";
import {
  localTournaments, localGameRooms,
  remoteGameRooms, customGameRoom
} from "./../server.js";
import { clearLocalGame, playerLeftGame } from "./../gameUtils.js"
import { LocalGameRoom } from "../game/LocalGameRoom.js";
import { RemoteGameRoom } from "./../game/RemoteGameRoom.js";
import { LocalTournament } from "./../tournament/LocalTournament.js";
import { handleTournamentConnection } from "./tournamentConnection.js";

export interface Connection {
  [mode: string]: (ws: WebSocket, context: any) => void;
}

export function customGameConnection(ws: WebSocket, context: any) {
  const gameId: number = context.gameId;
  const playerName: string = context.playerName;

  let gameRoom: RemoteGameRoom | undefined = customGameRoom.get(gameId);
  if (gameRoom === undefined) {
    ws.close();
    return;
  }

  if (gameRoom.player1Name === playerName || gameRoom.player2Name === playerName) {
    if (gameRoom.addPlayer(ws, playerName) == -1) {
      ws.send(JSON.stringify({ 
        status: "Player not allowed in this room",
        canvas: null,
        paddleLeft: null,
        paddleRight: null,
        ball: null,
        score: null,
        isPaused: false,
      }))
      return ;
    };
    gameRoom.startGameLoop();
  }
  else {
    ws.send(JSON.stringify({ 
      status: "Player not allowed in this room",
      canvas: null,
      paddleLeft: null,
      paddleRight: null,
      ball: null,
      score: null,
      isPaused: false,
    }))
    return ;
  }


  ws.on("message", (data) => {
    const msg: PayLoad = JSON.parse(data.toString());
    if (gameRoom !== undefined) {
      if (msg.type === "command" && msg.key === "leave") {
        playerLeftGame(ws, gameRoom);
      }
      else {
        gameRoom.handleEvents(msg);
      }
    }
  });

  ws.on("close", () => {
    if (gameRoom !== undefined) {
      if (gameRoom.player1 === ws){
        gameRoom.player1 = null;
      }
      if (gameRoom.player2 === ws){
        gameRoom.player2 = null;
      }
      
      // If both players disconnected and game is over, cleanup the room
      if (!gameRoom.player1 && !gameRoom.player2 && gameRoom.game?.gameState?.score?.winner) {
        customGameRoom.delete(gameId);
        gameRoom.cleanup();
      }
    }
  });

  ws.on("error", (e) => {
    console.log(e);
    if (gameRoom !== undefined) {
      if (gameRoom.id)
        customGameRoom.delete(gameRoom.id);
      gameRoom.cleanup(); 
    }
  });
}

export function localGameConnection(ws: WebSocket, context: any) {
  const gameId: number = context.gameId;

  const gameRoom: LocalGameRoom | undefined = localGameRooms.get(gameId);
  if (gameRoom === undefined) {
    ws.close();
    return;
  }
  else {
    gameRoom.addClient(ws);
    gameRoom.startGameLoop();
  }

  ws.on("message", (data) => {
    const msg: PayLoad = JSON.parse(data.toString()); 
    if (gameRoom !== undefined) {
      if (msg.type === "command" && msg.key === "leave") {
        clearLocalGame(gameRoom);
      }
      else {
        gameRoom.handleEvents(msg);
      }
    }
  });

  ws.on("error", (e) => {
    console.log(e);
    if (gameRoom !== undefined) {
      if (gameRoom.id)
        localGameRooms.delete(gameRoom.id);
      gameRoom.cleanup(); 
    }
  });
}

export function localTournamentConnection(ws: WebSocket, context: any) {
  const tournamentId: number = context.gameId;

  const tournament: LocalTournament | undefined = localTournaments.get(tournamentId);
  if (tournament === undefined) {
    ws.close();
    return ;
  }
  else {
    tournament.gameRoom.addClient(ws);
    tournament.gameRoom.startGameLoop();
  }

  ws.on("message", (data) => {
    const msg: PayLoad = JSON.parse(data.toString()); 
    if (tournament.gameRoom !== undefined) {
      if (msg.type === "command" && msg.key === "leave") {
        clearLocalGame(tournament.gameRoom);
      }
      else {
        tournament.handleEvents(msg);
      }
    }
  });

  ws.on("error", (e) => {
    console.log(e);
    if (tournament.gameRoom !== undefined) {
      if (tournament.gameRoom.id)
        localGameRooms.delete(tournament.gameRoom.id);
      tournament.gameRoom.cleanup(); 
    }
  });
}

export function remoteConnection(ws: WebSocket, context: any) {
  const gameId: number = context.gameId;
  const playerName: string = context.playerName;

  let gameRoom: RemoteGameRoom | undefined = remoteGameRooms.get(gameId);
  if (gameRoom === undefined) {
    ws.close();
    return;
  }
  if (gameRoom.addPlayer(ws, playerName) == -1) {
    ws.send(JSON.stringify({ 
      status: "Player not allowed in this room",
      canvas: null,
      paddleLeft: null,
      paddleRight: null,
      ball: null,
      score: null,
      isPaused: false,
    }))
    return ;
  };
  gameRoom.startGameLoop();

  ws.on("message", (data) => {
    const msg: PayLoad = JSON.parse(data.toString());
    if (gameRoom !== undefined) {
      if (msg.type === "command" && msg.key === "leave") {
        playerLeftGame(ws, gameRoom);
      }
      else {
        gameRoom.handleEvents(msg);
      }
    }
  });

  ws.on("close", () => {
    if (gameRoom !== undefined) {
      if (gameRoom.player1 === ws){
        gameRoom.player1.close();
        gameRoom.player1 = null;
      }
      if (gameRoom.player2 === ws){
        gameRoom.player2.close();
        gameRoom.player2 = null;
      }
    }
  });

  ws.on("error", (e) => {
    console.log(e);
    if (gameRoom !== undefined) {
      if (gameRoom.id)
        remoteGameRooms.delete(gameRoom.id);
      gameRoom.cleanup(); 
    }
  });
}

/**
 * Remote Tournament Connection Handler
 * Uses the new industry-grade tournament system
 */
export function remoteTournamentConnection(ws: WebSocket, context: any) {
  // Create a fake FastifyRequest-like object with the params
  const fakeRequest = {
    params: {
      tournamentId: context.tournamentId,
      username: context.username,
      action: context.action,
    }
  } as any;

  // Call the new tournament connection handler
  handleTournamentConnection(ws, fakeRequest).catch(error => {
    console.error("[Remote Tournament Connection] Error:", error);
    ws.close();
  });
}
