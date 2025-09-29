import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  joinRemoteTournamentRoom, reenterRemoteTournamentRoom,
  createRemoteTournament, createLocalTournament,
} from "./routeUtils.js";
import { localTournaments } from "./../server.js";

let localTournamentId: number = 0;
let remoteTournamentId: number = 0;

export const localTournamentSchema = {
  schema: {
    body: {
      type: "object",
      required: ["player1", "player2", "player3", "player4" ],
      properties: {
        player1: { type: "string" },
        player2: { type: "string" },
        player3: { type: "string" },
        player4: { type: "string" }
      }
    }
  }
}

export const remoteTournamentSchema = {
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

export function localTournament(req: FastifyRequest, reply: FastifyReply) {
  const cookies = req.cookies;

  // Create Tournament if cookie.GameId is not found
  if (cookies.localTournamentId === undefined) {
    createLocalTournament(req, reply, localTournamentId++);
  }
  else { // Joing tournament if cookie.localTournamentState is found
    const tournamentId = parseInt(cookies.localTournamentId);
    if (localTournaments.has(tournamentId)) {
      const tournament = localTournaments.get(tournamentId);
      tournament?.matchWinner();
      reply.send(tournament?.state);
    }
    else { // Has cookie.localTournamentState cookie but game does not exist
      reply.clearCookie("localTournamentId", {
        path: "/"
      });
      createLocalTournament(req, reply, localTournamentId++);
    }
  }
}

export function remoteTournament(req: FastifyRequest, reply: FastifyReply) {
  if (remoteTournamentId === 0) { // Create The First Tournanemt
    createRemoteTournament(req, reply, remoteTournamentId++);
  }
  else {
    if (reenterRemoteTournamentRoom(req, reply) === -1) { // Trys to reenter game if playerName was previous on a gameRoom
      if (joinRemoteTournamentRoom(req, reply) === -1) {  // In case playerName was never in a room previous, in enter a new game
        createRemoteTournament(req, reply, remoteTournamentId++);
      }
    }
  }
}
