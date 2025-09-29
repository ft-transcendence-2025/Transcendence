import WebSocket from "ws"
import { PayLoad } from "./../game/Game.js";
import {
  remoteTournaments, localTournaments, localGameRooms,
  remoteGameRooms
} from "./../server.js";
import { clearLocalGame, playerLeftGame } from "./../gameUtils.js"
import { LocalGameRoom } from "../game/LocalGameRoom.js";
import { RemoteGameRoom } from "./../game/RemoteGameRoom.js";
import { LocalTournament } from "./../tournament/LocalTournament.js";
import { RemoteTournament } from "./../tournament/RemoteTournament.js";
import { isTournamentFull } from "./../tournament/utils.js";

export interface Connection {
  [mode: string]: (ws: WebSocket, context: any) => void;
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

export function remoteConnection(ws: WebSocket, context: any) {
  const gameId: number = context.gameId;
  const playerName: string = context.playerName;

  let gameRoom: RemoteGameRoom | undefined = remoteGameRooms.get(gameId);
  if (gameRoom === undefined) {
    ws.close();
    return;
  }
  else {
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

export function remoteTournamentConnection(ws: WebSocket, context: any) {
  const tournamentId: number = context.gameId;
  const playerName: string = context.playerName;
  const tournament: RemoteTournament | undefined = remoteTournaments.get(tournamentId);

  console.log("Connecting in remote tournament")

  if (tournament === undefined) {
    ws.close();
    return ;
  }
  else {
    tournament.connectPlayer(playerName, ws);
    tournament.broadcast();
    if (tournament.state && isTournamentFull(tournament.state)) {
      if (tournament.gameRoom == null) {
        tournament.createGameRoom();
      }
      tournament.gameRoom?.addPlayer(ws, playerName);
      tournament.gameRoom?.startGameLoop();
    }
  }

  ws.on("message", (data) => {
    const msg: PayLoad = JSON.parse(data.toString());
    if (tournament.gameRoom !== null) {
      if (msg.type === "command" && msg.key === "leave") {
        playerLeftGame(ws, tournament.gameRoom);
      }
      else {
        tournament.gameRoom.handleEvents(msg);
      }
    }
  });
}
