import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createCustomGame } from "./routeUtils.js";
import {
  localGameRequest, remoteGameSchema, remoteGame
} from "./gameRoutes.js";
import {
  localTournamentSchema, localTournament,
  remoteTournamentSchema, remoteTournament
} from "./tournamentRoutes.js";

let customId: number = 0;

export async function tournament(fastify: FastifyInstance) {
  fastify.post("/remote", remoteTournamentSchema, remoteTournament)
  fastify.post("/local", localTournamentSchema, localTournament);
}

export function getgame(fastify: FastifyInstance) {
  fastify.get("/local", localGameRequest);
  fastify.post("/remote", remoteGameSchema, remoteGame);

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
