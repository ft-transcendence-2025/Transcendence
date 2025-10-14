import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createCustomGame } from "./routeUtils.js";
import {
  localGameRequest, remoteGameSchema, remoteGame, customGameSchema,
  customGame
} from "./gameRoutes.js";
import {
  localTournamentSchema, localTournament, deleteLocalTournament
} from "./tournamentRoutes.js";

let customId: number = 0;

export async function tournament(fastify: FastifyInstance) {
  fastify.post("/local", localTournamentSchema, localTournament);
  fastify.delete("/local", deleteLocalTournament);
}

export function getgame(fastify: FastifyInstance) {
  fastify.get("/local", localGameRequest);
  fastify.post("/remote", remoteGameSchema, remoteGame);
  fastify.post("/custom", customGameSchema, customGame);
}
