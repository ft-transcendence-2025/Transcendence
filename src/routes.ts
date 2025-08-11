import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Game } from "./game/Game.js";

export async function routes(fastify: FastifyInstance) {
  fastify.get('/', (req, reply) => {
    let game = new Game();
    let gameState = game.gameState;

    return { gameState };
  })
};
