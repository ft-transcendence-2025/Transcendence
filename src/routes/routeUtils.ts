import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  remoteTournaments, localTournaments, customGameRoom,
  remoteGameRooms, localGameRooms
} from "./../server.js";
import { RemoteGameRoom } from "./../game/RemoteGameRoom.js";
import { LocalGameRoom } from "./../game/LocalGameRoom.js";
import { LocalTournament } from "./../tournament/LocalTournament.js";
import { RemoteTournament } from "./../tournament/RemoteTournament.js";
import { Players } from "./../tournament/Tournament.js";
import { tournament } from "./routes.js";


export function joinGameRoom(reply: FastifyReply, playerName: string): number {
  for (const [id, gameRoom] of remoteGameRooms) {
    if (gameRoom.player2Name === null) {
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

export function reenterGameRoom(reply: FastifyReply, playerName: string): number {
  for (const [id, gameRoom] of remoteGameRooms) {
    if (gameRoom.player1Name === playerName) {
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

export function createRemoteGame(reply: FastifyReply, gameId: number, playerName: string) {
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

export function createLocalGame(reply: FastifyReply, gameId: number) {
  localGameRooms.set(gameId, new LocalGameRoom(gameId));

  reply.setCookie("localGameId", gameId.toString(), {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });

  reply.send({
    state: "Created",
    gameMode: "local",
    id: gameId,
  });
}

export function createLocalTournament(req: FastifyRequest ,reply: FastifyReply, tournamentId: number) {
  const data = req.body as Players;
  const tournament = new LocalTournament(data.player1, data.player2, data.player3, data.player4, tournamentId);

  localTournaments.set(tournamentId, tournament);

  reply.setCookie("localTournamentId", JSON.stringify(tournament.state.id), {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });

  reply.send(tournament.state);

}

export function createCustomGame(reply: FastifyReply, gameId: number, player1: string, player2: string) {
  const gameRoom = new RemoteGameRoom(gameId, player1);

  customGameRoom.set(gameId, gameRoom);

  reply.send({
    state: "Created",
    gameMode: "custom",
    id: gameId,
  });
}

export function joinRemoteTournamentRoom(req: FastifyRequest, reply: FastifyReply): number {
  const cookies = req.cookies;
  const tournamentId = cookies.remoteTournamentId;
  const body = req.body as { name: "string" };
  const playerName: string = body.name;

  for (const [id, tournament] of remoteTournaments) {
    for (let i = 0; i < 4; ++i) {
      if (!tournament.players[i].name) {
        tournament.addPlayer(playerName);
        reply.send({
          state: "joined",
          gameMode: "remoteTournament",
          name: playerName,
          playerNbr: i,
          id: id,
        });
        return id;
      }
    }
  }
  return -1;
}

export function reenterRemoteTournamentRoom(req: FastifyRequest, reply: FastifyReply): number {
  const cookies = req.cookies;
  if (!cookies.remoteTournamentId)
    return -1;
  const body = req.body as { name: "string" };
  const playerName: string = body.name;
  for (const [id, tournament] of remoteTournaments) {
    for (let i = 0; i < 4; ++i) {
      if (playerName == tournament.players[i].name) {
        if (checkIfPlayerIsEliminatedFromMatch(tournament, playerName) === -1) {
          return -1 ;
        }
        reply.send({
          state: "enter",
          gameMode: "remoteTournament",
          name: playerName,
          playerNbr: i,
          id: id,
        });
        return id ;
      }
    }
  }
  return -1;
}

function checkIfPlayerIsEliminatedFromMatch(tournament: RemoteTournament, playerName: string): number {
  if (checkIfPlayerIsEliminatedFromFirstMatch(tournament, playerName) === 0) {
    return 0;
  }
  if (checkIfPlayerIsEliminatedFromSecondMatch(tournament, playerName) === 0) {
    return 0;
  }
  return -1 ;
}

function checkIfPlayerIsEliminatedFromSecondMatch(tournament: RemoteTournament, playerName: string): number {
  const winner: string | null = tournament.gameRoom.tournamentState.match2.winner;
  const player1 = tournament.gameRoom.tournamentState.match2.player1;
  const player2 = tournament.gameRoom.tournamentState.match2.player2;

  if (winner && playerName === winner) {
    return 0;
  }
  if (!winner) {
    if (player2 === playerName || player1 === playerName) {
      return 0;
    }
  }
  return checkIfPlayerIsEliminatedFromThirdMatch(tournament, playerName);
}

function checkIfPlayerIsEliminatedFromFirstMatch(tournament: RemoteTournament, playerName: string): number {
  const winner: string | null = tournament.gameRoom.tournamentState.match1.winner;
  const player1 = tournament.gameRoom.tournamentState.match1.player1;
  const player2 = tournament.gameRoom.tournamentState.match1.player2;

  if (winner && playerName === winner) {
    return 0;
  }
  if (!winner) {
    if (player2 === playerName || player1 === playerName) {
      return 0;
    }
  }
  return checkIfPlayerIsEliminatedFromThirdMatch(tournament, playerName);
}

function checkIfPlayerIsEliminatedFromThirdMatch(tournament: RemoteTournament, playerName: string): number {
  const winner: string | null = tournament.gameRoom.tournamentState.match3.winner;
  const player1 = tournament.gameRoom.tournamentState.match3.player1;
  const player2 = tournament.gameRoom.tournamentState.match3.player2;

  if (!player1 && !player2) {
    return -1;
  }
  if (winner && playerName === winner) {
    return 0;
  }
  if (!winner) {
    if (player2 === playerName || player1 === playerName) {
      return 0;
    }
  }
  return -1
}

export function createRemoteTournament(req: FastifyRequest, reply: FastifyReply, tournamentId: number) {
  const player = req.body as { name: string, };

  const tournament = new RemoteTournament(tournamentId);
  tournament.addPlayer(player.name);

  remoteTournaments.set(tournamentId, tournament);
  reply.setCookie("remoteTournamentId", JSON.stringify(tournament.id), {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });

  reply.send({
    state: "created",
    gameMode: "remoteTournament",
    name: player.name,
    playerNbr: 0,
    id: tournament.id,
  });
}
