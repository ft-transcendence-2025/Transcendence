import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Game } from "./game/Game.js";

export async function routes(fastify: FastifyInstance) {
  fastify.get('/', (req, reply) => {
    reply.sendFile('./html/index.html');
  });

  fastify.get<{
    Params: { id: number }
  }>("/:id", async (req, reply) => {
      const { id } = req.params
      reply.send(id);
  });

};

