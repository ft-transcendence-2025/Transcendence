import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Game, GameState} from "./game/Game.js";
import { localTournaments, remoteGameRooms, singlePlayerGameRooms } from "./server.js";
import { LocalTournament, Players, TournamentState } from "./LocalTournament.js";
import { createLocalTournament, createCustomGame, createSinglePlayerGame, createRemoteGame, reenterGameRoom, joinGameRoom} from "./gameUtils.js";

let singlePlayerGameId: number = 0;
let remoteGameId: number = 0;
let localTournamentId: number = 0;
let customId: number = 0;

export async function tournament(fastify: FastifyInstance) {
  fastify.post("/local", {
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
  }, (req: FastifyRequest, reply: FastifyReply) => {
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
    });
}

export async function getgame(fastify: FastifyInstance) {
  fastify.get("/singleplayer", (req, reply) => {
    const cookies = req.cookies;

    // Create game if cookie.GameId is not found
    if (cookies.singlePlayerGameId === undefined) {
      createSinglePlayerGame(reply, singlePlayerGameId++);
    }
    else { // Joing game if cookie.GameId is found
      const cookieGameId: number = parseInt(cookies.singlePlayerGameId);
      if (singlePlayerGameRooms.has(cookieGameId)) {
        reply.send({
          state: "Joined",
          gameMode: "singleplayer",
          id: cookieGameId,
        });
      }
      else { // Has gameId cookie but game does not exist
        reply.clearCookie("singlePlayerGameId", {
          path: "/"
        });
        createSinglePlayerGame(reply, singlePlayerGameId++);
      }
    }
  });

  fastify.post("/remote", { 
    schema: {
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
        }
      }
    }
  }, (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as {name: string}
      const playerName = body.name

      console.log("Player looking for game:", playerName)
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
    });

  fastify.post("/custom", {
    schema: {
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
        }
      }
    }
  }, (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as {name: string}
      const playerName = body.name

      createCustomGame(reply, customId++, playerName);
    });
}
