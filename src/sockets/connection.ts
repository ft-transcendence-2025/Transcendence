import WebSocket from "ws"
import { PayLoad } from "./../game/Game.js";
import {
  remoteTournaments, localTournaments, localGameRooms,
  remoteGameRooms, customGameRoom
} from "./../server.js";
import { clearLocalGame, playerLeftGame } from "./../gameUtils.js"
import { LocalGameRoom } from "../game/LocalGameRoom.js";
import { RemoteGameRoom } from "./../game/RemoteGameRoom.js";
import { LocalTournament } from "./../tournament/LocalTournament.js";
import { RemoteTournament } from "./../tournament/RemoteTournament.js";

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

export function remoteTournamentConnection(ws: WebSocket, context: any) {
  const tournamentId: number = context.gameId;
  const playerName: string = context.playerName;
  const tournament: RemoteTournament | undefined = remoteTournaments.get(tournamentId);
  const remoteTournamentAction: string = context.remoteTournamentAction;

  if (tournament === undefined) {
    ws.close();
    return ;
  }

  if (remoteTournamentAction === "play") {
    tournament.enterGame(playerName);
  }
  if (tournament.connectPlayer(playerName, ws) === -1)
    return ;
  tournament.gameRoom.startGameLoop(tournament.players);

  ws.on("message", (data) => {
    const msg: PayLoad = JSON.parse(data.toString());
    if (msg.type === "command" && msg.key === "leave") {
      leaveTournament(playerName, tournament);
      ws.close();
    }
    else {
      tournament.handleEvents(msg);
    }
  });

  ws.on("close", () => {
    if (tournament.players[0].ws == ws) {
      tournament.players[0].ws.close();
      tournament.players[0].ws = null;
    }
    if (tournament.players[1].ws == ws) {
      tournament.players[1].ws.close();
      tournament.players[1].ws = null;
    }
    if (tournament.players[2].ws == ws) {
      tournament.players[2].ws.close();
      tournament.players[2].ws = null;
    }
    if (tournament.players[3].ws == ws) {
      tournament.players[3].ws.close();
      tournament.players[3].ws = null;
    }
  })

  ws.on("error", (e) => {
    console.log(e);
    if (tournament !== undefined) {
      remoteTournaments.delete(tournament.id);
    }
  });
}


function leaveTournament(playerName: string, tournament: RemoteTournament) {
  if (!tournament.gameRoom.tournamentState.match1.winner && isInFirstMatch(playerName, tournament)) {
    firstMatchLeft(playerName, tournament);
    return ;
  }
  if (!tournament.gameRoom.tournamentState.match2.winner && isInSecondMatch(playerName, tournament)) {
    secondMatchLeft(playerName, tournament);
    return ;
  }
  if (!tournament.gameRoom.tournamentState.match3.winner && isInThirdMatch(playerName, tournament)) {
    thirdMatchLeft(playerName, tournament);
    return ;
  }
  if (tournament.gameRoom.tournamentState.match3.winner) {
    remoteTournaments.delete(tournament.id);
  }
}


function firstMatchLeft(playerName: string, tournament: RemoteTournament) {
  tournament.gameRoom.tournamentState.match1.loser = playerName;

  const player1 = tournament.gameRoom.tournamentState.match1.player1;
  const player2 = tournament.gameRoom.tournamentState.match1.player2;

  if (player1 === playerName) {
    tournament.gameRoom.tournamentState.match1.winner = player2;
    tournament.gameRoom.tournamentState.match1.loser = player1;
  }
  else {
    tournament.gameRoom.tournamentState.match1.winner = player1;
    tournament.gameRoom.tournamentState.match1.loser = player2;
  }

  if (!tournament.gameRoom.tournamentState.match3.player1) {
    tournament.gameRoom.tournamentState.match3.player1 = tournament.gameRoom.tournamentState.match1.winner;
  }
  else {
    tournament.gameRoom.tournamentState.match3.player2 = tournament.gameRoom.tournamentState.match1.winner;
  }

  if (tournament.gameRoom.tournamentState.match3.loser) {
    thirdMatchLeft(tournament.gameRoom.tournamentState.match3.loser, tournament);
  }

}

function secondMatchLeft(playerName: string, tournament: RemoteTournament) {
  tournament.gameRoom.tournamentState.match2.loser = playerName;
  const player1 = tournament.gameRoom.tournamentState.match2.player1;
  const player2 = tournament.gameRoom.tournamentState.match2.player2;

  if (player1 === playerName) {
    tournament.gameRoom.tournamentState.match2.winner = player2;
    tournament.gameRoom.tournamentState.match2.loser = player1;
  }
  else {
    tournament.gameRoom.tournamentState.match2.winner = player1;
    tournament.gameRoom.tournamentState.match2.loser = player2;
  }
  
  if (!tournament.gameRoom.tournamentState.match3.player1) {
    tournament.gameRoom.tournamentState.match3.player1 = tournament.gameRoom.tournamentState.match2.winner;
  }
  else {
    tournament.gameRoom.tournamentState.match3.player2 = tournament.gameRoom.tournamentState.match2.winner;
  }

  if (tournament.gameRoom.tournamentState.match3.loser) {
    thirdMatchLeft(tournament.gameRoom.tournamentState.match3.loser, tournament);
  }
}

function thirdMatchLeft(playerName: string, tournament: RemoteTournament) {
  tournament.gameRoom.tournamentState.match3.loser = playerName;
  const player1 = tournament.gameRoom.tournamentState.match3.player1;
  const player2 = tournament.gameRoom.tournamentState.match3.player2;

  if (player1 === playerName) {
    tournament.gameRoom.tournamentState.match3.winner = player2;
    tournament.gameRoom.tournamentState.match3.loser = player1;
  }
  else {
    tournament.gameRoom.tournamentState.match3.winner = player1;
    tournament.gameRoom.tournamentState.match3.loser = player2;
  }
}

function isInFirstMatch(playerName: string, tournament: RemoteTournament): boolean {
  const player1 = tournament.gameRoom.tournamentState.match1.player1;
  const player2 = tournament.gameRoom.tournamentState.match1.player2;
  if (player1 === playerName || player2 === playerName)
    return true;
  return false;
}

function isInSecondMatch(playerName: string, tournament: RemoteTournament): boolean {
  const player1 = tournament.gameRoom.tournamentState.match2.player1;
  const player2 = tournament.gameRoom.tournamentState.match2.player2;
  if (player1 === playerName || player2 === playerName)
    return true;
  return false;
}

function isInThirdMatch(playerName: string, tournament: RemoteTournament): boolean {
  const player1 = tournament.gameRoom.tournamentState.match3.player1;
  const player2 = tournament.gameRoom.tournamentState.match3.player2;
  if (player1 === playerName || player2 === playerName)
    return true;
  return false;
}
